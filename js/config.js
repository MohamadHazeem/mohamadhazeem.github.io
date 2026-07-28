/* ============================================================
   Ask Hazeem AI — configuration

   The chat talks to a Cloudflare Worker that holds the Gemini
   API key SERVER-SIDE. Never put an API key in this file — this
   site is public, and Google auto-deletes any exposed key.

   Setup instructions live in cloudflare-worker.js (repo root).
   Once the Worker is deployed, paste its URL below.
   ============================================================ */

window.HAZEEM_AI = {
  workerUrl: 'PASTE_YOUR_WORKER_URL_HERE', /* e.g. https://hazeem-ai.yourname.workers.dev */

  /* Local testing ONLY (never commit a real key): direct mode
     is used if workerUrl is unset and apiKey is filled in. */
  apiKey: '',
  model: 'gemini-flash-latest',
};
