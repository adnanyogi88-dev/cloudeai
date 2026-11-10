# CloudeAI

CloudeAI is a web-based AI workspace and a companion terminal chat client. The existing Claude Code source tree is retained alongside the new application.

## Web app

The Next.js application lives at the repository root and is designed for Vercel.

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Set `ANTHROPIC_API_KEY` in your local environment.
4. Run `npm run dev` and open http://localhost:3000.

For Vercel, import this repository and set the project Root Directory to `./`. Add `ANTHROPIC_API_KEY` under Project Settings → Environment Variables, then redeploy. The key is read only by the server API route and must never be prefixed with `NEXT_PUBLIC_`.

Optional model override: set `ANTHROPIC_MODEL` to a model available to your Anthropic account.

## Terminal chat client

The companion CLI runs in Node.js and uses the same Anthropic API key:

```powershell
$env:ANTHROPIC_API_KEY="your-api-key"
npm install
npm run cli
```

macOS/Linux:

```bash
export ANTHROPIC_API_KEY="your-api-key"
npm install
npm run cli
```

Commands inside the CLI: `/clear` resets conversation history and `/exit` quits.

## Important scope

The web and terminal clients currently provide AI chat, not remote shell execution, repository write access, user accounts, or persistent chat storage. Those capabilities require additional authentication, authorization, isolated execution, and storage services before they can safely be enabled.

## Security

- Keep API keys in server-side environment variables.
- Never commit `.env` files or secrets.
- Do not expose API keys in browser code.
