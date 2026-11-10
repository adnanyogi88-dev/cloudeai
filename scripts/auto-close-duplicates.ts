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

async function githubRequest<T>(endpoint: string, token: string, method: string = 'GET', body?: any): Promise<T> {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "auto-close-duplicates-script",
      ...(body && { "Content-Type": "application/json" }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

function extractDuplicateIssueNumber(commentBody: string): number | null {
  let match = commentBody.match(/#(\\d+)/);
  if (match) return parseInt(match[1], 10);
  match = commentBody.match(/github\\.com\\/[^\\/]+\\/[^\\/]+\\/issues\\/(\\d+)/);
  if (match) return parseInt(match[1], 10);
  return null;
}

async function closeIssueAsDuplicate(owner: string, repo: string, issueNumber: number, duplicateOfNumber: number, token: string): Promise<void> {
  await githubRequest(`/repos/${owner}/${repo}/issues/${issueNumber}`, token, 'PATCH', {
    state: 'closed',
    state_reason: 'duplicate',
    labels: ['duplicate']
  });
  await githubRequest(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`, token, 'POST', {
    body: `This issue has been automatically closed as a duplicate of #${duplicateOfNumber}.\n\nIf this is incorrect, please re-open this issue or create a new one.\n\n🤖 Generated with [Claude Code](https://claude.ai/code)`
  });
}

async function autoCloseDuplicates(): Promise<void> {
  console.log("[DEBUG] Starting auto-close duplicates script");
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN environment variable is required");
  console.log("[DEBUG] GitHub token found");

  const owner = process.env.GITHUB_REPOSITORY_OWNER || "anthropics";
  const repo = process.env.GITHUB_REPOSITORY_NAME || "claude-code";
  console.log(`[DEBUG] Repository: ${owner}/${repo}`);

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  console.log(`[DEBUG] Checking for duplicate comments older than: ${threeDaysAgo.toISOString()}`);

  const allIssues: GitHubIssue[] = [];
  let page = 1;
  const perPage = 100;
  while (true) {
    const pageIssues: GitHubIssue[] = await githubRequest(
      `/repos/${owner}/${repo}/issues?state=open&per_page=${perPage}&page=${page}`, token
    );
    if (pageIssues.length === 0) break;
    allIssues.push(...pageIssues.filter(issue => new Date(issue.created_at) <= threeDaysAgo));
    page++;
    if (page > 20) break;
  }

  const issues = allIssues;
  console.log(`[DEBUG] Found ${issues.length} open issues`);
  let processedCount = 0;
  let candidateCount = 0;

  for (const issue of issues) {
    processedCount++;
    console.log(`[DEBUG] Processing issue #${issue.number} (${processedCount}/${issues.length}): ${issue.title}`);
    const comments: GitHubComment[] = await githubRequest(
      `/repos/${owner}/${repo}/issues/${issue.number}/comments`, token
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

    const commentsAfterDupe = comments.filter(comment => new Date(comment.created_at) > dupeCommentDate);
    if (commentsAfterDupe.length > 0) continue;

    const reactions: GitHubReaction[] = await githubRequest(
      `/repos/${owner}/${repo}/issues/comments/${lastDupeComment.id}/reactions`, token
    );
    const authorThumbsDown = reactions.some(reaction =>
      reaction.user.id === issue.user.id && reaction.content === "-1"
    );
    if (authorThumbsDown) continue;

    const duplicateIssueNumber = extractDuplicateIssueNumber(lastDupeComment.body);
    if (!duplicateIssueNumber) continue;

    candidateCount++;
    const issueUrl = `https://github.com/${owner}/${repo}/issues/${issue.number}`;
    try {
      console.log(`[INFO] Auto-closing issue #${issue.number} as duplicate of #${duplicateIssueNumber}: ${issueUrl}`);
      await closeIssueAsDuplicate(owner, repo, issue.number, duplicateIssueNumber, token);
      console.log(`[SUCCESS] Successfully closed issue #${issue.number} as duplicate of #${duplicateIssueNumber}`);
    } catch (error) {
      console.error(`[ERROR] Failed to close issue #${issue.number} as duplicate: ${error}`);
    }
  }
  console.log(`[DEBUG] Script completed. Processed ${processedCount} issues, found ${candidateCount} candidates for auto-close`);
}

autoCloseDuplicates().catch(console.error);
export {};
