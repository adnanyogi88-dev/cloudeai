#!/usr/bin/env node
import readline from "node:readline";

const baseUrl = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
const model = process.env.OLLAMA_MODEL || "qwen2.5-coder:1.5b";
const history = [];

async function checkOllama() {
  try {
    const response = await fetch(baseUrl + "/api/tags", { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const data = await response.json();
    const available = (data.models || []).some((item) => item.name === model || item.name.startsWith(model + ":"));
    if (!available) {
      console.error("Model " + model + " belum terpasang. Jalankan: ollama pull " + model);
      process.exit(1);
    }
  } catch (error) {
    console.error("Tidak dapat terhubung ke Ollama di " + baseUrl);
    console.error("Pastikan Ollama berjalan. Jika perlu, jalankan: ollama serve");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

await checkOllama();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "\ncloudeai › " });
console.log("\nCloudeAI Local Terminal — powered by Ollama");
console.log("Model: " + model + " · /clear untuk reset · /exit untuk keluar\n");
rl.prompt();

rl.on("line", async (line) => {
  const input = line.trim();
  if (!input) return rl.prompt();
  if (input === "/exit") return rl.close();
  if (input === "/clear") {
    history.length = 0;
    console.log("Riwayat percakapan dibersihkan.");
    return rl.prompt();
  }
  history.push({ role: "user", content: input });
  try {
    const response = await fetch(baseUrl + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: "system", content: "You are CloudeAI, a practical local software development assistant. Help explain, plan, write and debug code. Do not claim to execute commands or edit files." },
          ...history
        ],
        options: { temperature: 0.2 }
      }),
      signal: AbortSignal.timeout(120000)
    });
    if (!response.ok) throw new Error("Ollama returned HTTP " + response.status + ": " + await response.text());
    const data = await response.json();
    const answer = data.message?.content;
    if (typeof answer !== "string") throw new Error("Ollama returned an empty response.");
    history.push({ role: "assistant", content: answer });
    console.log("\n" + answer + "\n");
  } catch (error) {
    history.pop();
    console.error("\nRequest failed: " + (error instanceof Error ? error.message : String(error)) + "\n");
  }
  rl.prompt();
});
rl.on("close", () => {
  console.log("\nCloudeAI Local Terminal closed.");
  process.exit(0);
});
