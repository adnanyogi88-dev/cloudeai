import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const OLLAMA_URL = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");

export async function GET() {
  try {
    const response = await fetch(OLLAMA_URL + "/api/tags", { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) return NextResponse.json({ connected: false, models: [], error: "Ollama returned " + response.status }, { status: 502 });
    const data = await response.json();
    const models = Array.isArray(data.models)
      ? data.models.map((item: { name?: string; size?: number }) => ({ name: item.name || "unknown", size: item.size || 0 }))
      : [];
    return NextResponse.json({ connected: true, provider: "ollama", models });
  } catch {
    return NextResponse.json({ connected: false, models: [], error: "Ollama tidak terjangkau. Jalankan Ollama di komputer yang sama dengan CloudeAI." }, { status: 503 });
  }
}
