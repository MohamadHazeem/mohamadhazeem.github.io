/* ============================================================
   Ask Hazeem AI — portfolio chat concierge (Google Gemini)
   Classic script, theme-aware, no dependencies.
   ============================================================ */
(() => {
  const cfg = () => window.HAZEEM_AI || {};
  const keyMissing = () => !cfg().apiKey || /PASTE_YOUR/.test(cfg().apiKey);
  const ENDPOINT = () =>
    `https://generativelanguage.googleapis.com/v1beta/models/${cfg().model || 'gemini-flash-latest'}:generateContent?key=${encodeURIComponent(cfg().apiKey)}`;

  const SYSTEM_PROMPT = `You are "Hazeem AI" — Mohamad Hazeem's digital twin on his portfolio site.
You speak AS Mohamad, in the FIRST PERSON: always "I", "my", "me" — never "Mohamad", "he" or "his".
Visitors talk to you as if talking directly to Mohamad ("How do you...?", "What have you delivered...?").
If someone asks whether they're talking to the real Mohamad, be honest: you're his AI twin, and for the real one they should email or WhatsApp him.
Speak warmly and professionally, in short plain-text answers (under 110 words, no markdown symbols, no bullet lists unless asked).
You ONLY answer questions about my work, skills, experience and how to engage me. For anything unrelated, politely steer back.

FACTS ABOUT ME (Mohamad — answer in first person):
- Pre-Sales & Engagement Consultant at Netways, based in Riyadh, Saudi Arabia. In enterprise pre-sales since Nov 2022.
- Owns the pre-sales lifecycle end to end: discovery, qualification, solution architecture, effort estimation, licensing studies, and the final proposal.
- Influenced 150M+ SAR in new annual recurring revenue; 70+ enterprise engagements closed end-to-end; serves 12+ industries.
- Platforms: Microsoft Dynamics 365 (F&O, BC, CRM), Power Platform, Microsoft Fabric, Power BI, Azure data & integration, Azure OpenAI, Liferay DXP, IBM webMethods, SharePoint.
- AI-first working style: LLM-powered RFP analysis, RAG proposal libraries, generative UI mock-ups, AI-assisted estimation, Copilot Studio, agents & orchestration. Every artifact is AI-accelerated and human-refined.
- 13 certifications across Microsoft (Dynamics 365 functional consultant x5, fundamentals x4, Catalyst Pre-Sales), Liferay DXP (Pre-Sales Accreditation, Solution Consultant Enablement) and IBM webMethods (Integration Foundations).
- Signature engagements: Ministry of Culture (16 cultural associations on Liferay DXP + D365 CRM), Public Investment Fund (80+ workflows automated), NUPCO (national healthcare procurement platform on Kafka/Kubernetes), Council of Representatives (AI document management with Azure OpenAI RAG), Saudi Central Bank SAMA (platform modernization, FintechSaudi), AFC Asian Cup 2027 (tournament ERP), Al Rajhi Bank (transformation PMO resourcing), Bank Albilad (D365 CRM program with SAMA integration and chatbot), SNB Capital (secure investor portal with Nafath and 2FA), National Water Company (AI-powered DXP), Jeddah Airports KAIA (CRM, portal, AI chatbot), Saudi Football Federation (full-suite ERP). Also: QNB, Qatar Foundation, Bupa Arabia, Saudia, MODON, Saudi Arabia Railways, Ministry of Finance, STC Bank, Effat University, Al Nassr Club and more.
- Education: B.Sc. Computer Science, Lebanese International University.
- Languages: Arabic (native), English (fluent).
- Contact: mhamadhazeem2001@gmail.com · +966 50 031 7907 (also WhatsApp) · linkedin.com/in/mohamad-hazeem-27a08228a · CV downloadable from this site's header.

If someone asks about hiring or a project, invite them to email me at mhamadhazeem2001@gmail.com or WhatsApp me directly. Never invent engagements, numbers or credentials beyond the facts above. If you don't know something, say so honestly and suggest reaching me directly.`;

  const widget = document.querySelector('.chat-widget');
  if (!widget) return;
  const fab = widget.querySelector('.chat-fab');
  const panel = widget.querySelector('.chat-panel');
  const log = widget.querySelector('.chat-log');
  const form = widget.querySelector('.chat-form');
  const input = widget.querySelector('.chat-input');
  const closeBtn = widget.querySelector('.chat-close');
  const suggestWrap = widget.querySelector('.chat-suggest');

  const history = [];
  let busy = false;
  let opened = false;

  function bubble(role, text) {
    const b = document.createElement('div');
    b.className = `chat-msg ${role}`;
    b.textContent = text;
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
    return b;
  }

  function typing() {
    const b = document.createElement('div');
    b.className = 'chat-msg ai chat-typing';
    b.innerHTML = '<span></span><span></span><span></span>';
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
    return b;
  }

  let closeTimer = null;
  function setOpen(open) {
    fab.setAttribute('aria-expanded', String(open));
    if (open) {
      clearTimeout(closeTimer);
      panel.classList.remove('closing');
      panel.hidden = false;
      widget.classList.add('open');
      if (!opened) {
        opened = true;
        bubble('ai', keyMissing()
          ? "Hi! I'm Hazeem AI — but I'm not connected yet. Site owner: paste your free Gemini API key into js/config.js (instructions inside) and I'll come alive."
          : "Hi, Mohamad here — well, my AI twin. Ask me anything about my work, how I use AI, or how we could work together.");
      }
      setTimeout(() => input.focus(), 80);
    } else {
      panel.classList.add('closing');
      closeTimer = setTimeout(() => {
        panel.hidden = true;
        panel.classList.remove('closing');
        widget.classList.remove('open');
      }, 330);
    }
  }

  let lastToggle = 0;
  fab.addEventListener('click', () => {
    const now = performance.now();
    if (now - lastToggle < 300) return;
    lastToggle = now;
    setOpen(panel.hidden);
  });
  closeBtn.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) setOpen(false);
  });

  async function send(text) {
    const msg = text.trim();
    if (!msg || busy) return;
    if (suggestWrap) suggestWrap.remove();
    bubble('user', msg);
    input.value = '';

    if (keyMissing()) {
      bubble('ai', "I'd love to answer, but my API key isn't set up yet. Meanwhile — everything about me is on this page, and you can reach me at mhamadhazeem2001@gmail.com.");
      return;
    }

    busy = true;
    widget.classList.add('busy');
    history.push({ role: 'user', parts: [{ text: msg }] });
    const t = typing();
    try {
      const res = await fetch(ENDPOINT(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: history.slice(-12),
          generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      let reply = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
      if (!reply) throw new Error('empty');
      reply = reply.replace(/\*\*/g, '').replace(/^[*-]\s/gm, '· ');
      history.push({ role: 'model', parts: [{ text: reply }] });
      t.remove();
      bubble('ai', reply);
    } catch (err) {
      t.remove();
      const friendly = /429/.test(err.message)
        ? "I'm getting a lot of questions right now — give me a minute and try again."
        : /40[013]/.test(err.message)
          ? 'My connection to Gemini was refused — the API key may be invalid or restricted for this domain.'
          : "Something went sideways on my end. Try again — or just email me at mhamadhazeem2001@gmail.com.";
      bubble('ai', friendly);
      history.pop();
    } finally {
      busy = false;
      widget.classList.remove('busy');
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    send(input.value);
  });
  widget.querySelectorAll('.chat-chip').forEach((chip) => {
    chip.addEventListener('click', () => send(chip.textContent));
  });
})();
