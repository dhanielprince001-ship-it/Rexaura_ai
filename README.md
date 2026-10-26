# Aura AI

Static landing page (`index.html`) + serverless chat endpoint (`api/chat.js`).

## Deploy on Vercel
1. Push this folder to a GitHub repo (or run `npx vercel` inside it).
2. In Vercel: Project > Settings > Environment Variables, add `ANTHROPIC_API_KEY` (get one at console.anthropic.com).
3. Redeploy. Optional: set `ANTHROPIC_MODEL` to change the model.

The API key stays on the server; the browser only calls `/api/chat`.
Pricing / About / Changelog nav links are placeholders (`href="#"`).
