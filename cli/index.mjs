#!/usr/bin/env node
import Anthropic from "@anthropic-ai/sdk";
import readline from "node:readline";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("Missing ANTHROPIC_API_KEY. Set it in your environment before running CloudeAI CLI.");
  console.error('PowerShell: $env:ANTHROPIC_API_KEY="your-api-key"');
  console.error("macOS/Linux: export ANTHROPIC_API_KEY='your-api-key'");
  process.exit(1);
}

const client = new Anthropic({ apiKey });
const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
const history = [];
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "\ncloudeai › " });

console.log("\nCloudeAI Terminal · type /exit to quit, /clear to reset the conversation.");
console.log(`Model: ${model}\n`);

rl.prompt();
rl.on("line", async (line) => {
  const input = line.trim();
  if (!input) return rl.prompt();
  if (input === "/exit") return rl.close();
  if (input === "/clear") {
    history.length = 0;
    console.log("Conversation cleared.");
    return rl.prompt();
  }

  history.push({ role: "user", content: input });
  try {
    const response = await client.messages.create({
      model,
      max_tokens: 2048,
      system: "You are CloudeAI, a careful AI software development assistant. Help with planning, explaining, writing and debugging code. Do not claim to execute commands or edit files.",
      messages: history
    });
    const answer = response.content.filter((part) => part.type === "text").map((part) => part.text).join("\n");
    history.push({ role: "assistant", content: answer });
    console.log(`\n${answer}\n`);
  } catch (error) {
    history.pop();
    console.error(`\nRequest failed: ${error.message}\n`);
  }
  rl.prompt();
});
