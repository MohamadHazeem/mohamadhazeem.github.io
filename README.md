# Mohamad Hazeem — Portfolio

A single-page, static portfolio site. Dark editorial design built around a
persistent Three.js particle world, GSAP scroll choreography and Lenis
smooth scrolling. No build step — plain HTML/CSS/JS with CDN libraries.

## The particle world

One ~19k-particle system (js/webgl.js) lives on a fixed full-page canvas
and morphs through three states as you scroll, with the camera flying
between them:

1. **Dunes** — procedural noise waves behind the hero
2. **Vortex** — a swirling golden galaxy through About → Clients
3. **Monogram** — particles converge into "MH" behind LET'S TALK

The cursor repels particles in screen space, and any click fires an
expanding shockwave ring through the field. Scene boundaries are measured
from the real section offsets (`measure()`), so layout edits just work.

## Interactions (js/app.js)

- Hero title: 3D mouse tilt; every letter of the big titles has hover
  physics (lift + elastic return)
- Expertise cards: 3D tilt with a glare that tracks the cursor
- Contact button + theme toggle: magnetic pull
- Work list: cursor spotlight on rows
- Marquees: speed up with scroll velocity

All of it is gated: touch devices skip hover-only effects,
`prefers-reduced-motion` gets a calm static page, and `file://` runs
without WebGL entirely.

## Blueprints section

Three fictional reference diagrams (section 04) built as inline SVG so
they inherit both themes automatically: a layered solution architecture,
a sequence flow and a multi-bank integration map. Lines draw themselves
on first view, and small gold "data packets" travel the flow paths
(`.flowpath`) while the section is on screen. Each panel is marked
"Fictional · illustrative" on purpose — keep that chip; it makes clear
no client data is shown. Diagrams pan horizontally on mobile.
To edit content, the SVG vocabulary is in style.css (`.bp-svg .node`,
`.flow`, `.retline`, `.band-cap`…) and icons live in the shared
`<defs>` block at the top of the section in index.html.

## Structure

```
index.html            The whole page (content lives here)
css/style.css         All styling, responsive + reduced-motion rules + light theme
js/app.js             Animations, interactions, theme toggle (classic script)
js/webgl.js           Three.js hero background (ES module, optional enhancement)
assets/favicon.svg    Browser tab icon
assets/og.png         LinkedIn / social share image (1200x630)
assets/logos/         Client logos used in the marquee
start-portfolio.bat   Double-click to run locally with the full experience
```

## Themes

Dark is the default. The sun/moon button in the nav switches to the light
("paper") theme; the choice is saved in `localStorage` and restored on the
next visit. Both themes are driven by the CSS variables at the top of
`style.css` (`:root` = dark, `:root[data-theme="light"]` = light) — tweak
colors there.

## Client logos

The marquee shows **logos only** (names live in each image's `alt`).
Marks are original vector SVGs from Wikimedia, except NUPCO (current
official PNG from nupco.com) and Qatar Foundation (official PNG — no
public SVG exists). They render pure white on dark / pure ink on light
via the `--logo-filter` CSS variable. Bupa Arabia, Al Nassr, STC Bank
and Effat University are intentionally text wordmarks — their only
available marks don't survive a monochrome silhouette. To add a logo
later, drop a transparent SVG/PNG into `assets/logos/` and replace the
`.mq-text` span with an `<img class="mq-item">`.

The logos are trademarks of their respective owners — used here to
factually reference engagement history (as on a CV). If any brand team
asks for removal, delete that `<img>`; the name text stays.

## Run locally

**Easiest:** double-click `start-portfolio.bat`. It starts a tiny local
server and opens the site at http://localhost:4173 with everything working,
including the WebGL hero background. Close the minimized "Portfolio Server"
window when done.

Any other static server also works:

```
python -m http.server 4173
# then open http://localhost:4173
```

Double-clicking `index.html` directly also works as a fallback — the full
site runs, minus the WebGL particle background (browsers block ES-module
loading from `file://`, so `js/webgl.js` skips itself gracefully).

## CV download

The nav "CV" button and menu serve `assets/Mohamad-Hazeem-CV.pdf` — a
3-page, portfolio-styled PDF. To regenerate it after edits, the source
lives in the session scratchpad as `cv.html` (rendered via headless
Chrome `page.pdf`); or simply replace the PDF file with any newer export
keeping the same filename.

## Mo — the AI pet

The little gold robot in the corner (js/pet.js) is the chat's mascot:
he bobs, blinks, watches the cursor and plays on his own; clicking him
makes him jump, say hi, and open the chat. Where WebGL or ES modules
aren't available (e.g. opening index.html via file://), the plain round
chat button appears instead.

## Ask Hazeem AI (chat widget)

The floating "Ask Hazeem AI" button opens a Gemini-powered assistant
grounded in Mohamad's profile (system prompt lives in `js/chat.js`).
Configuration is in `js/config.js` — the API key and model name.
Key setup instructions are written inside that file.

**Security note:** on a static site the key is visible to visitors.
Protect your quota once deployed: Google Cloud Console → APIs &
Services → Credentials → your key → Application restrictions →
Websites → add your domain. Free-tier rate limits cap worst-case abuse.
If the key is ever misused, delete it in AI Studio and paste a new one.

## Deploy (pick one)

- **Netlify** — drag the whole folder onto https://app.netlify.com/drop. Done.
- **Vercel** — `npx vercel` in this folder, or import via the dashboard.
- **GitHub Pages** — push to a repo, enable Pages on the main branch.

### After deploying — one important edit

LinkedIn needs an **absolute** URL for the share image. In `index.html`,
replace:

```html
<meta property="og:image" content="assets/og.png" />
```

with your real domain, e.g.:

```html
<meta property="og:image" content="https://your-domain.com/assets/og.png" />
```

Then paste your link into the [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
once to refresh its cache before sharing.

## QA helpers

- `?static` — disables all animation and shows every section instantly
  (useful for screenshots / debugging).
- `?static&goto=%23work` — same, jumped to a section (`%23` = `#`).

## Editing content

Everything editable is in `index.html`: hero titles, the About paragraphs,
stat numbers (`data-count` + the visible fallback text), the eight
work-accordion entries, marquee client names, expertise cards, certification
list and contact links.

## Libraries (CDN)

- GSAP 3.12 + ScrollTrigger — animations
- Lenis 1.1 — smooth scrolling
- Three.js 0.165 — hero particle field
- Fonts: Clash Display + Satoshi (Fontshare), Instrument Serif (Google)
