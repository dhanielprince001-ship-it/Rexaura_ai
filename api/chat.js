const SYSTEM = `You are Aura AI, a friendly, concise personal assistant. You help people chat, create, summarize, draft, brainstorm and automate everyday work. Answer clearly in plain text (no markdown headings). Be honest when you are unsure. Keep answers short unless asked for detail.`;

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

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await authed(req))) return res.status(401).json({ error: 'Please log in to use the chat.' });
  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(500).json({ error: 'Server is missing GROQ_API_KEY.' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string' && m.content.trim())
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content.slice(0, 24000) }));
  if (!messages.length || messages[messages.length - 1].role !== 'user')
    return res.status(400).json({ error: 'Send a message first.' });

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        max_tokens: 800,
        messages: [{ role: 'system', content: SYSTEM }, ...messages],
      }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: (data.error && data.error.message) || 'The AI service returned an error.' });
    const reply = ((data.choices && data.choices[0] && data.choices[0].message.content) || '').trim();
    return res.status(200).json({ reply: reply || 'I had nothing to say. Try rephrasing.' });
  } catch (e) {
    return res.status(502).json({ error: 'Could not reach the AI service.' });
  }
};
