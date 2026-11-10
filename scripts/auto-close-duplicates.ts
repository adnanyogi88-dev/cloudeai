#!/usr/bin/env bun

interface GitHubIssue {
  number: number;
  title: string;
  user: { id: number };
  created_at: string;
}
interface GitHubComment {
  id: number;
  body: string;
  created_at: string;
  user: { type: string; id: number };
}
interface GitHubReaction {
  user: { id: number };
  content: string;
}

async function githubRequest<T>(
  endpoint: string,
  token: string,
  method = "GET",
  body?: unknown
) {
  const response = await fetch("https://api.github.com" + endpoint, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "auto-close-duplicates-script",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    throw new Error("GitHub API request failed: " + response.status + " " + response.statusText);
  }

  return (await response.json()) as T;
}

function extractDuplicateIssueNumber(commentBody: string): number | null {
  const issueMatch = /#([0-9]+)/.exec(commentBody);
  if (issueMatch) return Number.parseInt(issueMatch[1], 10);

  const urlMatch = /github\.com\/[^/]+\/[^/]+\/issues\/([0-9]+)/.exec(commentBody);
  if (urlMatch) return Number.parseInt(urlMatch[1], 10);
  return null;
}

async function closeIssueAsDuplicate(
  owner: string,
  repo: string,
  issueNumber: number,
  duplicateOfNumber: number,
  token: string
): Promise<void> {
  await githubRequest(
    "/repos/" + owner + "/" + repo + "/issues/" + issueNumber,
    token,
    "PATCH",
    { state: "closed", state_reason: "duplicate", labels: ["duplicate"] }
  );
  await githubRequest(
    "/repos/" + owner + "/" + repo + "/issues/" + issueNumber + "/comments",
    token,
    "POST",
    {
      body: "This issue has been automatically closed as a duplicate of #" +
        duplicateOfNumber +
        ".\n\nIf this is incorrect, please re-open this issue or create a new one.\n\n🤖 Generated with [Claude Code](https://claude.ai/code)",
    }
  );
}

async function autoCloseDuplicates(): Promise<void> {
  console.log("[DEBUG] Starting auto-close duplicates script");
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN environment variable is required");

  const owner = process.env.GITHUB_REPOSITORY_OWNER || "anthropics";
  const repo = process.env.GITHUB_REPOSITORY_NAME || "claude-code";
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const allIssues: GitHubIssue[] = [];
  for (let page = 1; page <= 20; page++) {
    const pageIssues = await githubRequest<GitHubIssue[]>(
      "/repos/" + owner + "/" + repo + "/issues?state=open&per_page=100&page=" + page,
      token
    );
    if (pageIssues.length === 0) break;
    allIssues.push(...pageIssues.filter(issue => new Date(issue.created_at) <= threeDaysAgo));
  }

  let candidateCount = 0;
  for (const issue of allIssues) {
    const comments = await githubRequest<GitHubComment[]>(
      "/repos/" + owner + "/" + repo + "/issues/" + issue.number + "/comments",
      token
    );
    const dupeComments = comments.filter(comment =>
      comment.body.includes("Found") &&
      comment.body.includes("possible duplicate") &&
      comment.user.type === "Bot"
    );
    if (dupeComments.length === 0) continue;

    const lastDupeComment = dupeComments[dupeComments.length - 1];
    const dupeCommentDate = new Date(lastDupeComment.created_at);
    if (dupeCommentDate > threeDaysAgo) continue;
    if (comments.some(comment => new Date(comment.created_at) > dupeCommentDate)) continue;

    const reactions = await githubRequest<GitHubReaction[]>(
      "/repos/" + owner + "/" + repo + "/issues/comments/" + lastDupeComment.id + "/reactions",
      token
    );
    if (reactions.some(reaction => reaction.user.id === issue.user.id && reaction.content === "-1")) continue;

    const duplicateIssueNumber = extractDuplicateIssueNumber(lastDupeComment.body);
    if (duplicateIssueNumber === null) continue;

    candidateCount++;
    try {
      await closeIssueAsDuplicate(owner, repo, issue.number, duplicateIssueNumber, token);
      console.log("[SUCCESS] Closed issue #" + issue.number + " as duplicate of #" + duplicateIssueNumber);
    } catch (error) {
      console.error("[ERROR] Failed to close issue #" + issue.number + ": " + error);
    }
  }
  console.log("[DEBUG] Processed " + allIssues.length + " issues; " + candidateCount + " duplicate candidates");
}

autoCloseDuplicates().catch(console.error);
export {};
