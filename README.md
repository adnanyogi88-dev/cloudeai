# CloudeAI — Local Edition

CloudeAI is a local-first AI workspace and terminal assistant powered by [Ollama](https://ollama.com). No Anthropic API key or paid cloud inference is required when running on your own computer.

## Requirements

- Windows 10/11, macOS, or Linux
- Node.js 20+
- Ollama installed and running
- A model downloaded locally (default: `qwen2.5-coder:1.5b`)

## Quick start — Windows PowerShell

```powershell
ollama pull qwen2.5-coder:1.5b
ollama list
git clone https://github.com/adnanyogi88-dev/cloudeai.git
cd cloudeai
npm install
npm run dev
```

Open http://localhost:3000. The Next.js server calls Ollama at `http://127.0.0.1:11434`; the browser never calls Ollama directly.

## Optional local configuration

Copy `.env.example` to `.env.local` if you need to change the defaults:

```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5-coder:1.5b
```

These are server-side variables. Do not prefix them with `NEXT_PUBLIC_`.

## Terminal assistant

Open another PowerShell window in the repository folder:

```powershell
npm run cli
```

Commands: `/clear` resets chat history and `/exit` quits.

## API endpoints

- `GET /api/models` — checks Ollama and lists installed models.
- `POST /api/chat` — sends chat messages to the selected local model.

## Important: local runtime vs Vercel

Ollama runs on your Surface, not inside Vercel. The local AI chat works when Next.js is also running on that Surface with `npm run dev`. A Vercel deployment cannot access `127.0.0.1` on your Surface; its local-model API will report that Ollama is unavailable. Keep Vercel for source previews/static UI, or later connect it to a separately secured machine/server that hosts Ollama. Do not expose Ollama's port publicly without authentication and network protections.

## Current scope

This integration provides local chat and a terminal chat client. It does not yet grant the model filesystem access, arbitrary shell execution, or autonomous repository modifications. Those agent tools will be added separately with workspace restrictions, explicit approvals, and command allowlists.

## Security

- Never commit `.env.local` or API keys.
- Keep Ollama bound to localhost for local-only use.
- Review generated code before using it.
