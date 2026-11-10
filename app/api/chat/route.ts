import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type IncomingMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server. Add it in Vercel → Project Settings → Environment Variables, then redeploy." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const messages = body.messages as IncomingMessage[];
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 30) {
      return NextResponse.json({ error: "Send between 1 and 30 messages." }, { status: 400 });
    }

    const safeMessages = messages.map((message) => {
      if (!["user", "assistant"].includes(message.role) || typeof message.content !== "string") {
        throw new Error("Invalid message format.");
      }
      return { role: message.role, content: message.content.slice(0, 12000) };
    });

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
      max_tokens: 2048,
      system: "You are CloudeAI, a careful AI software development assistant. Help users understand, plan, write, and debug software. Explain assumptions, prefer safe changes, and never claim to have run code or modified files unless a connected tool actually did so.",
      messages: safeMessages
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return NextResponse.json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The AI request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
