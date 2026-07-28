/* ============================================================
   Ask Hazeem AI — Cloudflare Worker proxy
   Keeps the Gemini API key SERVER-SIDE (never in the public site).

   SETUP (once, ~5 minutes, free):
   1. Create a free account at https://dash.cloudflare.com
   2. Workers & Pages → Create → Create Worker → name it
      e.g. "hazeem-ai" → Deploy.
   3. Click "Edit code", replace everything with THIS file → Deploy.
   4. Back on the Worker page: Settings → Variables & Secrets →
      Add → Type: Secret → Name: GEMINI_KEY → Value: your NEW
      Gemini API key (create one at https://aistudio.google.com).
      NEVER put the key anywhere else — not in the repo, not in
      the site, not in chats.
   5. Copy the Worker URL (https://hazeem-ai.<your-subdomain>.workers.dev)
      and paste it into js/config.js as workerUrl.
   ============================================================ */

const ALLOWED_ORIGINS = [
  'https://mohamadhazeem.github.io',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = ALLOWED_ORIGINS.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST only' }), { status: 405, headers: cors });
    }
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Origin not allowed' }), { status: 403, headers: cors });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: cors });
    }

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${env.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  },
};
