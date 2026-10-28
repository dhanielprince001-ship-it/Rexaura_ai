const SYSTEM = `You are RexAura AI, a friendly, concise personal assistant. You help people chat, create, summarize, draft, brainstorm and automate everyday work. Answer clearly in plain text (no markdown headings). Be honest when you are unsure. Keep answers short unless asked for detail.`;

// Questions that likely need fresh information from the web.
const NEEDS_WEB = /\b(today|yesterday|tonight|tomorrow|latest|current(ly)?|now|recent(ly)?|news|this (week|month|year)|right now|score|won|winner|price|weather|stock|who is|who's|president|ceo|released?|trending|updates?|search|google|look up|20(2[3-9]|3\d))\b/i;

// Optional: set REQUIRE_LOGIN=true in Vercel to only allow signed-in users to chat.
async function authed(req) {
  if (process.env.REQUIRE_LOGIN !== 'true') return true;
  const t = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!t || !process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return false;
  try {
    const r = await fetch(process.env.SUPABASE_URL.replace(/\/$/, '') + '/auth/v1/user', {
      headers: { apikey: process.env.SUPABASE_ANON_KEY, authorization: 'Bearer ' + t },
    });
    return r.ok;
  } catch (e) { return false; }
}

// Optional: set TAVILY_API_KEY in Vercel to let RexAura search the web for current questions.
async function webSearch(messages) {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return null;
  const users = messages.filter(m => m.role === 'user');
  const last = users[users.length - 1].content;
  if (last.includes('[Attached file:') || !NEEDS_WEB.test(last)) return null;
  let q = last.slice(0, 300);
  if (q.length < 40 && users.length > 1) q = users[users.length - 2].content.slice(0, 200) + ' ' + q;
  try {
    const r = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
      body: JSON.stringify({ query: q, search_depth: 'basic', max_results: 5 }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return (d.results || []).slice(0, 5);
  } catch (e) { return null; }
}

const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await authed(req))) return res.status(401).json({ error: 'Please log in to use the chat.' });
  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(500).json({ error: 'Server is missing GROQ_API_KEY.' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string' && m.content.trim())
    .slice(-20)
    .map(m => ({
      role: m.role,
      content: m.content.slice(0, 24000),
      images: Array.isArray(m.images) ? m.images.filter(u => typeof u === 'string' && u.startsWith('data:image/')).slice(0, 3) : [],
    }));
  if (!messages.length || messages[messages.length - 1].role !== 'user')
    return res.status(400).json({ error: 'Send a message first.' });

  // Keep at most 3 photos in total (newest first).
  let left = 3;
  for (let i = messages.length - 1; i >= 0; i--) { messages[i].images = messages[i].images.slice(0, left); left -= messages[i].images.length; }
  const hasImg = messages.some(m => m.images.length);
  const apiMessages = messages.map(m => m.images.length
    ? { role: m.role, content: [{ type: 'text', text: m.content }, ...m.images.map(u => ({ type: 'image_url', image_url: { url: u } }))] }
    : { role: m.role, content: m.content });

  const today = new Date().toUTCString().slice(0, 16);
  let system = SYSTEM + `\nToday's date is ${today}.`;
  const results = await webSearch(messages);
  if (results && results.length) {
    system += '\n\nLive web search results are below. Use them for anything current, prefer them over your training data, and say so if they are unclear or conflicting.\n' +
      results.map((x, i) => `[${i + 1}] ${x.title} (${host(x.url)}): ${String(x.content || '').slice(0, 500)}`).join('\n');
  }

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model: hasImg ? (process.env.GROQ_VISION_MODEL || 'qwen/qwen3.8-27b') : (process.env.GROQ_MODEL || 'openai/gpt-oss-120b'),
        max_tokens: hasImg ? 3000 : 800,
        messages: [{ role: 'system', content: system }, ...apiMessages],
      }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: (data.error && data.error.message) || 'The AI service returned an error.' });
    let reply = ((data.choices && data.choices[0] && data.choices[0].message.content) || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim() || 'I had nothing to say. Try rephrasing.';
    if (results && results.length) {
      const hosts = [...new Set(results.slice(0, 3).map(x => host(x.url)))];
      reply += '\n\nSources: ' + hosts.join(', ');
    }
    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(502).json({ error: 'Could not reach the AI service.' });
  }
};
