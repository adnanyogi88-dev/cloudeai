import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };
const OLLAMA_URL = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "qwen2.5-coder:1.5b";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = body?.messages as ChatMessage[];
    const model = typeof body?.model === "string" && body.model.trim() ? body.model.trim() : DEFAULT_MODEL;

    if (!Array.isArray(messages) || messages.length < 1 || messages.length > 30) {
      return NextResponse.json({ error: "Kirim antara 1 sampai 30 pesan." }, { status: 400 });
    }

    const safeMessages = messages.map((message) => {
      if (!message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string") {
        throw new Error("Format pesan tidak valid.");
      }
      return { role: message.role, content: message.content.slice(0, 12000) };
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    let response: Response;
    try {
      response = await fetch(OLLAMA_URL + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "You are CloudeAI, a helpful local-first software development assistant. Help users plan, understand, write and debug code. Be accurate, explain assumptions, and never claim to have run commands or modified files unless a connected tool actually did so. Prefer concise, practical answers."
            },
            ...safeMessages
          ],
          stream: false,
          options: { temperature: 0.2 }
        }),
        signal: controller.signal,
        cache: "no-store"
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return NextResponse.json({ error: "Ollama menolak permintaan (" + response.status + "). " + detail.slice(0, 500) }, { status: 502 });
    }

    const data = await response.json();
    const text = data?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Ollama mengembalikan jawaban kosong." }, { status: 502 });
    }
    return NextResponse.json({ text, model: data.model || model, provider: "ollama" });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Ollama membutuhkan waktu terlalu lama. Coba prompt yang lebih singkat." }, { status: 504 });
    }
    const message = error instanceof Error ? error.message : "Permintaan AI gagal.";
    const unavailable = message.includes("fetch failed") || message.includes("ECONNREFUSED");
    return NextResponse.json({
      error: unavailable
        ? "Tidak dapat terhubung ke Ollama. Pastikan Ollama berjalan di Surface dan model qwen2.5-coder:1.5b sudah tersedia. Jalankan: ollama serve"
        : message
    }, { status: unavailable ? 503 : 500 });
  }
}
