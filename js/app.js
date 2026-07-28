/* ============================================================
   Mohamad Hazeem — Portfolio
   UI, GSAP, ScrollTrigger, Lenis (classic script — no modules,
   so it also runs when index.html is opened directly via file://)
   ============================================================ */

const STATIC_MODE = new URLSearchParams(location.search).has('static');
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || STATIC_MODE;
const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined' && !STATIC_MODE;

/* Graceful degradation: if GSAP failed to load (or ?static QA mode), un-hide everything. */
if (!hasGsap) {
  document.documentElement.classList.remove('js');
}

/* QA helper: ?static&goto=<selector> jumps straight to a section. */
if (STATIC_MODE) {
  const sel = new URLSearchParams(location.search).get('goto');
  if (sel) {
    window.addEventListener('load', () => {
      document.querySelector(sel)?.scrollIntoView();
    });
  }
}

/* ------------------------------------------------------------
   Riyadh clock
   ------------------------------------------------------------ */
const clockEl = document.getElementById('clock');
function tickClock() {
  if (!clockEl) return;
  clockEl.textContent = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit',
  }).format(new Date());
}
tickClock();
setInterval(tickClock, 30_000);

/* ------------------------------------------------------------
   Smooth scroll (Lenis)
   ------------------------------------------------------------ */
let lenis = null;
if (hasGsap && typeof window.Lenis !== 'undefined' && !prefersReduced) {
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function scrollToTarget(target) {
  if (lenis) {
    lenis.scrollTo(target, { offset: 0, duration: 1.4 });
  } else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (el === 0 || target === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
}

/* ------------------------------------------------------------
   Navigation & menu overlay
   ------------------------------------------------------------ */
const nav = document.querySelector('.nav');
const burger = document.querySelector('.nav-burger');
const menu = document.querySelector('.menu');

window.addEventListener('scroll', () => {
  nav.classList.toggle('is-scrolled', window.scrollY > 40);
}, { passive: true });

/* Theme toggle */
const themeBtn = document.querySelector('.theme-toggle');
function currentTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}
function applyTheme(theme) {
  if (theme === 'light') document.documentElement.dataset.theme = 'light';
  else delete document.documentElement.dataset.theme;
  try { localStorage.setItem('theme', theme); } catch (e) {}
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'light' ? '#f5f2eb' : '#0b0b0d');
  themeBtn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
  window.dispatchEvent(new CustomEvent('themechange'));
}
themeBtn.addEventListener('click', () => applyTheme(currentTheme() === 'light' ? 'dark' : 'light'));
if (currentTheme() === 'light') {
  themeBtn.setAttribute('aria-label', 'Switch to dark theme');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f5f2eb');
}

let menuOpen = false;
function setMenu(open) {
  menuOpen = open;
  menu.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (lenis) open ? lenis.stop() : lenis.start();
  document.body.style.overflow = open && !lenis ? 'hidden' : '';
}
burger.addEventListener('click', () => setMenu(!menuOpen));

/* Anchor links (nav, menu, logo) */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : document.querySelector(id);
    if (target === null) return;
    e.preventDefault();
    if (menuOpen) {
      setMenu(false);
      setTimeout(() => scrollToTarget(target), 450);
    } else {
      scrollToTarget(target);
    }
  });
});

document.querySelector('.footer-top')?.addEventListener('click', () => scrollToTarget(0));

/* ------------------------------------------------------------
   Custom cursor (fine pointers only)
   ------------------------------------------------------------ */
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && hasGsap && !prefersReduced) {
  const dot = document.querySelector('.cursor');
  const ring = document.querySelector('.cursor-ring');
  const setDotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' });
  const setDotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' });
  const setRingX = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power2.out' });
  const setRingY = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power2.out' });
  let cursorShown = false;
  window.addEventListener('pointermove', (e) => {
    if (!cursorShown) {
      cursorShown = true;
      gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
    }
    setDotX(e.clientX); setDotY(e.clientY);
    setRingX(e.clientX); setRingY(e.clientY);
  });
  document.querySelectorAll('[data-hover], a, button').forEach((el) => {
    el.addEventListener('pointerenter', () => ring.classList.add('is-hover'));
    el.addEventListener('pointerleave', () => ring.classList.remove('is-hover'));
  });
}

/* ------------------------------------------------------------
   Work accordion
   ------------------------------------------------------------ */
const workItems = document.querySelectorAll('.work-item');
workItems.forEach((item) => {
  const head = item.querySelector('.work-head');
  const body = item.querySelector('.work-body');
  head.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    workItems.forEach((other) => {
      other.classList.remove('open');
      other.querySelector('.work-head').setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      item.classList.add('open');
      head.setAttribute('aria-expanded', 'true');
    }
  });
  body.addEventListener('transitionend', () => {
    if (hasGsap) ScrollTrigger.refresh();
  });
});

/* ------------------------------------------------------------
   GSAP animations
   ------------------------------------------------------------ */
if (hasGsap) {
  gsap.registerPlugin(ScrollTrigger);

  const heroLines = document.querySelectorAll('.hero-title .line');
  const heroReveals = document.querySelectorAll('.hero [data-reveal]');

  /* --- Preloader + hero intro --- */
  const preloader = document.querySelector('.preloader');
  const countEl = document.querySelector('.preloader-count');

  const heroIntro = gsap.timeline({ paused: true });
  heroIntro
    .to(heroLines, {
      yPercent: 0, duration: 1.15, stagger: 0.09, ease: 'power4.out',
    })
    .to(heroReveals, {
      opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out',
    }, '-=0.7');

  /* Sync CSS-hidden lines into GSAP space.
     y:0 clears the px offset GSAP parses out of the CSS translateY(110%) guard. */
  gsap.set(heroLines, { y: 0, yPercent: 110 });
  gsap.set('.contact-title .line', { y: 0, yPercent: 110 });

  if (prefersReduced) {
    preloader.style.display = 'none';
    gsap.set([heroLines, heroReveals, '.contact-title .line'], { clearProps: 'all', opacity: 1, yPercent: 0 });
  } else {
    if (lenis) lenis.stop();
    const counter = { v: 0 };
    const loadTl = gsap.timeline({
      onComplete: () => {
        preloader.style.display = 'none';
        if (lenis) lenis.start();
      },
    });
    loadTl
      .from('.preloader-name', { yPercent: 60, opacity: 0, duration: 0.6, ease: 'power3.out' })
      .from('.preloader-role', { opacity: 0, duration: 0.5 }, '-=0.3')
      .to(counter, {
        v: 100, duration: 1.4, ease: 'power2.inOut',
        onUpdate: () => (countEl.textContent = String(Math.round(counter.v)).padStart(2, '0')),
      }, 0)
      .to(preloader, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '+=0.15')
      .add(() => heroIntro.play(), '-=0.55');
  }

  /* --- Scroll progress bar --- */
  gsap.to('.progress', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
  });

  if (!prefersReduced) {

  /* --- Generic reveals (outside hero) --- */
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  /* --- About statement: line-by-line focus --- */
  gsap.to('.st-line', {
    opacity: 1, stagger: 0.35, ease: 'none',
    scrollTrigger: {
      trigger: '.about-statement', start: 'top 78%', end: 'bottom 45%', scrub: true,
    },
  });

  /* --- Stats counters --- */
  gsap.utils.toArray('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const obj = { v: 0 };
    el.textContent = '0';
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => gsap.to(obj, {
        v: target, duration: 1.8, ease: 'power3.out',
        onUpdate: () => (el.textContent = String(Math.round(obj.v))),
      }),
    });
  });

  /* --- Work rows cascade --- */
  gsap.from('.work-item', {
    opacity: 0, y: 40, duration: 0.8, stagger: 0.08, ease: 'power3.out',
    scrollTrigger: { trigger: '.work-list', start: 'top 82%' },
  });

  /* --- Contact big title --- */
  gsap.to('.contact-title .line', {
    yPercent: 0, duration: 1.1, stagger: 0.1, ease: 'power4.out',
    scrollTrigger: { trigger: '.contact', start: 'top 65%' },
  });

  /* --- Marquees: seamless infinite loop (velocity-reactive) --- */
  const marqueeTweens = [];
  document.querySelectorAll('.marquee').forEach((marquee) => {
    const track = marquee.querySelector('.marquee-track');
    const clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    marquee.appendChild(clone);
    const dir = marquee.dataset.dir === 'right' ? 1 : -1;
    const tracks = marquee.querySelectorAll('.marquee-track');
    const speed = () => Math.max(18, track.scrollWidth / 55);
    marqueeTweens.push(gsap.fromTo(tracks,
      { xPercent: dir === 1 ? -100 : 0 },
      { xPercent: dir === 1 ? 0 : -100, duration: speed(), ease: 'none', repeat: -1 }));
  });

  /* Marquees speed up with scroll velocity */
  if (lenis && marqueeTweens.length) {
    let vel = 0;
    lenis.on('scroll', (e) => { vel = e.velocity || 0; });
    gsap.ticker.add(() => {
      const target = Math.min(3.5, 1 + Math.abs(vel) * 0.045);
      marqueeTweens.forEach((tw) => {
        tw.timeScale(tw.timeScale() + (target - tw.timeScale()) * 0.08);
      });
    });
  }

  } /* end !prefersReduced */
}

/* ------------------------------------------------------------
   Level-2 interactivity: shockwaves, split chars, 3D tilt,
   magnetic buttons, work-list spotlight
   ------------------------------------------------------------ */

/* Click shockwave → forwarded to the WebGL particle field */
if (!prefersReduced) {
  window.addEventListener('pointerdown', (e) => {
    window.dispatchEvent(new CustomEvent('mh:burst', {
      detail: {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -((e.clientY / window.innerHeight) * 2 - 1),
      },
    }));
  });
}

if (hasGsap && !prefersReduced) {
  /* Split title text into hoverable chars (visual only — titles keep
     an aria-label so screen readers hear whole words) */
  function splitChars(line) {
    [...line.childNodes].forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (!node.classList.contains('char') && !node.classList.contains('tm')) splitChars(node);
        return;
      }
      if (node.nodeType !== Node.TEXT_NODE) return;
      const frag = document.createDocumentFragment();
      for (const ch of node.textContent) {
        if (ch.trim() === '') { frag.append(ch); continue; }
        const s = document.createElement('span');
        s.className = 'char';
        s.textContent = ch;
        frag.append(s);
      }
      node.replaceWith(frag);
    });
  }
  const heroTitle = document.querySelector('.hero-title');
  const contactTitle = document.querySelector('.contact-title');
  heroTitle?.setAttribute('aria-label', 'Mohamad Hazeem');
  contactTitle?.setAttribute('aria-label', "Let's talk");
  document.querySelectorAll('.hero-title .line-mask, .contact-title .line-mask')
    .forEach((m) => m.setAttribute('aria-hidden', 'true'));
  document.querySelectorAll('.hero-title .line, .contact-title .line').forEach(splitChars);

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer) {
    /* Per-letter hover physics on the big titles */
    document.querySelectorAll('.hero-title .char, .contact-title .char').forEach((ch) => {
      ch.addEventListener('pointerenter', () => {
        gsap.to(ch, { yPercent: -14, rotation: gsap.utils.random(-6, 6), scale: 1.04, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
      });
      ch.addEventListener('pointerleave', () => {
        gsap.to(ch, { yPercent: 0, rotation: 0, scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
      });
    });

    /* Hero title: 3D mouse tilt */
    const hero = document.querySelector('.hero');
    if (hero && heroTitle) {
      const rotX = gsap.quickTo(heroTitle, 'rotationX', { duration: 0.6, ease: 'power3.out' });
      const rotY = gsap.quickTo(heroTitle, 'rotationY', { duration: 0.6, ease: 'power3.out' });
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        rotX(-((e.clientY - r.top) / r.height - 0.5) * 6);
        rotY(((e.clientX - r.left) / r.width - 0.5) * 8);
      });
      hero.addEventListener('pointerleave', () => { rotX(0); rotY(0); });
    }

    /* Expertise cards: 3D tilt + glare tracking */
    document.querySelectorAll('.exp-card').forEach((card) => {
      const rX = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
      const rY = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        rX(-(py - 0.5) * 8);
        rY((px - 0.5) * 8);
        card.style.setProperty('--gx', `${px * 100}%`);
        card.style.setProperty('--gy', `${py * 100}%`);
      });
      card.addEventListener('pointerleave', () => { rX(0); rY(0); });
    });

    /* Magnetic pull on the contact button + theme toggle */
    document.querySelectorAll('.contact-btn, .theme-toggle').forEach((el) => {
      const mX = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
      const mY = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        mX((e.clientX - (r.left + r.width / 2)) * 0.35);
        mY((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener('pointerleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      });
    });

    /* Work list: cursor spotlight */
    document.querySelectorAll('.work-head').forEach((head) => {
      head.addEventListener('pointermove', (e) => {
        const r = head.getBoundingClientRect();
        head.style.setProperty('--mx', `${e.clientX - r.left}px`);
        head.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }
}

/* ------------------------------------------------------------
   Blueprints: tabs, line-draw entrances, traveling packets
   ------------------------------------------------------------ */
const bpSection = document.querySelector('.blueprints');
if (bpSection) {
  const tabs = [...bpSection.querySelectorAll('.bp-tab')];
  const panels = [...bpSection.querySelectorAll('.bp-panel')];
  const played = new WeakSet();

  function playDiagram(panel) {
    if (!hasGsap || prefersReduced) return;
    const svg = panel.querySelector('svg.bp-svg');
    if (!svg) return;
    const draws = svg.querySelectorAll('.draw');
    draws.forEach((p) => {
      const L = p.getTotalLength();
      p.style.strokeDasharray = `${L}`;
      p.style.strokeDashoffset = `${L}`;
    });
    gsap.to(draws, {
      strokeDashoffset: 0, duration: 1.1, stagger: 0.06, ease: 'power2.inOut', delay: 0.2,
      onComplete: () => draws.forEach((p) => {
        p.style.strokeDasharray = '';
        p.style.strokeDashoffset = '';
      }),
    });
    gsap.from(svg.querySelectorAll('.node'), {
      opacity: 0, y: 14, duration: 0.7, stagger: 0.045, ease: 'power3.out',
    });
    gsap.from(panel.querySelectorAll('.bp-stat'), {
      opacity: 0, y: 14, duration: 0.5, stagger: 0.08, delay: 0.5, ease: 'power3.out',
    });
  }

  /* Data packets travel along every .flowpath of the visible panel */
  if (hasGsap && !prefersReduced) {
    const SVGNS = 'http://www.w3.org/2000/svg';
    const packets = [];
    panels.forEach((panel) => {
      const svg = panel.querySelector('svg.bp-svg');
      if (!svg) return;
      svg.querySelectorAll('.flowpath').forEach((path) => {
        const glow = document.createElementNS(SVGNS, 'circle');
        glow.setAttribute('r', '7');
        glow.setAttribute('class', 'packet-glow');
        glow.setAttribute('opacity', '0');
        const dot = document.createElementNS(SVGNS, 'circle');
        dot.setAttribute('r', '3');
        dot.setAttribute('class', 'packet');
        dot.setAttribute('opacity', '0');
        svg.append(glow, dot);
        packets.push({
          panel, path, dot, glow,
          L: path.getTotalLength(),
          t: Math.random(),
          speed: 0.13 + Math.random() * 0.1,
        });
      });
    });

    let inView = false;
    ScrollTrigger.create({
      trigger: bpSection, start: 'top bottom', end: 'bottom top',
      onToggle: (self) => { inView = self.isActive; },
    });
    gsap.ticker.add((time, dtMs) => {
      if (!inView) return;
      const dt = Math.min(dtMs / 1000, 0.05);
      for (const s of packets) {
        if (s.panel.hidden) {
          s.dot.setAttribute('opacity', '0');
          s.glow.setAttribute('opacity', '0');
          continue;
        }
        s.t = (s.t + dt * s.speed) % 1;
        const pt = s.path.getPointAtLength(s.L * s.t);
        s.dot.setAttribute('cx', pt.x); s.dot.setAttribute('cy', pt.y);
        s.glow.setAttribute('cx', pt.x); s.glow.setAttribute('cy', pt.y);
        s.dot.setAttribute('opacity', '1');
        s.glow.setAttribute('opacity', '0.25');
      }
    });

    ScrollTrigger.create({
      trigger: bpSection, start: 'top 70%', once: true,
      onEnter: () => {
        if (!played.has(panels[0])) { playDiagram(panels[0]); played.add(panels[0]); }
      },
    });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t, j) => {
        t.classList.toggle('active', i === j);
        t.setAttribute('aria-selected', String(i === j));
      });
      panels.forEach((p, j) => { p.hidden = j !== i; });
      if (!played.has(panels[i])) { playDiagram(panels[i]); played.add(panels[i]); }
      if (hasGsap) ScrollTrigger.refresh();
    });
  });
}
