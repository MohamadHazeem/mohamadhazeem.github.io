/* ============================================================
   "Mo" — Mohamad's AI pet (Three.js, ES module)
   A cute hovering robot that lives on the chat corner:
   bobs, blinks, watches the cursor, plays little animations,
   greets on click and opens the Ask Hazeem AI chat.
   Progressive enhancement — if WebGL/modules are unavailable,
   the plain chat button remains.
   ============================================================ */

const STATIC_MODE = new URLSearchParams(location.search).has('static');
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || STATIC_MODE;

(async () => {
  const widget = document.querySelector('.chat-widget');
  const holder = document.querySelector('.pet');
  const canvas = document.querySelector('.pet-canvas');
  const bubbleEl = document.querySelector('.pet-bubble');
  const fab = document.querySelector('.chat-fab');
  if (!widget || !holder || !canvas || !fab) return;

  let THREE;
  try { THREE = await import('three'); } catch { return; }
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch { return; }

  const W = 170, H = 195;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 50);
  camera.position.set(0, 1.05, 6.4);
  camera.lookAt(0, 0.72, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(2, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd9a44a, 0.9);
  rim.position.set(-3, 2, -4);
  scene.add(rim);

  /* ---------------- build Mo ---------------- */
  const g = window.gsap; /* optional — everything degrades without it */
  const pet = new THREE.Group();
  pet.position.y = 0.72;
  scene.add(pet);

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd9a44a, roughness: 0.35, metalness: 0.25 });
  const faceMat = new THREE.MeshStandardMaterial({ color: 0x15130d, roughness: 0.55, metalness: 0.1 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfff3d6 });
  const tipMat = new THREE.MeshBasicMaterial({ color: 0xffd98a });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 36), bodyMat);
  body.scale.set(1, 0.92, 0.88);
  pet.add(body);

  const face = new THREE.Mesh(new THREE.SphereGeometry(0.78, 36, 28), faceMat);
  face.scale.set(1, 0.82, 0.5);
  face.position.set(0, 0.08, 0.52);
  pet.add(face);

  const eyes = new THREE.Group();
  const eyeGeo = new THREE.SphereGeometry(0.14, 20, 16);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.scale.set(1, 1.4, 0.6);
  eyeL.position.set(-0.28, 0.18, 0.94);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.28;
  eyes.add(eyeL, eyeR);
  pet.add(eyes);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 12), bodyMat);
  stem.position.set(0, 1.05, 0);
  pet.add(stem);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), tipMat);
  tip.position.set(0, 1.32, 0);
  pet.add(tip);

  function makeArm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(0.92 * side, 0.02, 0);
    const arm = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16), bodyMat);
    arm.scale.set(1, 1.55, 1);
    arm.position.set(0.1 * side, -0.18, 0);
    shoulder.add(arm);
    shoulder.rotation.z = -0.25 * side;
    pet.add(shoulder);
    return shoulder;
  }
  const armL = makeArm(-1);
  const armR = makeArm(1);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.62, 32),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.62;
  scene.add(shadow);

  /* theme awareness */
  function syncTheme() {
    const light = document.documentElement.dataset.theme === 'light';
    bodyMat.color.set(light ? 0xb8902e : 0xd9a44a);
    shadow.material.opacity = light ? 0.14 : 0.22;
  }
  syncTheme();
  window.addEventListener('themechange', () => { syncTheme(); renderer.render(scene, camera); });

  /* ---------------- behaviours ---------------- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!prefersReduced) {
    window.addEventListener('pointermove', (e) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  function blink(double) {
    if (!g) return;
    const tl = g.timeline();
    tl.to([eyeL.scale, eyeR.scale], { y: 0.12, duration: 0.07, ease: 'power2.in' })
      .to([eyeL.scale, eyeR.scale], { y: 1.4, duration: 0.12, ease: 'power2.out' });
    if (double) {
      tl.to([eyeL.scale, eyeR.scale], { y: 0.12, duration: 0.07 }, '+=0.08')
        .to([eyeL.scale, eyeR.scale], { y: 1.4, duration: 0.12 });
    }
  }

  function wave() {
    if (!g) return;
    g.timeline()
      .to(armR.rotation, { z: 2.2, duration: 0.25, ease: 'power2.out' })
      .to(armR.rotation, { z: 1.6, duration: 0.16, yoyo: true, repeat: 3, ease: 'sine.inOut' })
      .to(armR.rotation, { z: -0.25, duration: 0.3, ease: 'power2.inOut' });
  }

  function spin() {
    if (!g) return;
    g.to(pet.rotation, { y: pet.rotation.y + Math.PI * 2, duration: 0.9, ease: 'back.out(1.4)' });
  }

  function jump() {
    if (!g) return;
    g.timeline()
      .to(pet.scale, { y: 0.82, x: 1.1, z: 1.1, duration: 0.12, ease: 'power2.in' })
      .to(pet.position, { y: 1.25, duration: 0.28, ease: 'power2.out' }, '<0.08')
      .to(pet.scale, { y: 1.08, x: 0.95, z: 0.95, duration: 0.2 }, '<')
      .to(pet.position, { y: 0.72, duration: 0.3, ease: 'bounce.out' })
      .to(pet.scale, { y: 1, x: 1, z: 1, duration: 0.25, ease: 'elastic.out(1, 0.5)' }, '<');
  }

  /* random idle play */
  if (!prefersReduced) {
    setInterval(() => {
      if (document.hidden || widget.classList.contains('open')) return;
      const acts = [() => blink(true), wave, spin, () => blink(false)];
      acts[Math.floor(Math.random() * acts.length)]();
    }, 7000);
    setInterval(() => {
      if (!document.hidden && !widget.classList.contains('open')) blink(false);
    }, 3400);
  }

  /* greet + open chat */
  const GREETS = ['Hi! I’m Mo \u{1F44B}', 'Salam! ✨', 'Let’s talk!'];
  let greetIdx = 0;
  let greeting = false;
  function greet() {
    if (greeting) return;
    greeting = true;
    jump();
    wave();
    bubbleEl.textContent = GREETS[greetIdx++ % GREETS.length];
    bubbleEl.hidden = false;
    bubbleEl.classList.add('pop');
    setTimeout(() => {
      bubbleEl.classList.remove('pop');
      bubbleEl.hidden = true;
      fab.click(); /* opens Ask Hazeem AI */
      greeting = false;
    }, 1300);
  }
  holder.addEventListener('click', greet);
  holder.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); greet(); }
  });
  holder.addEventListener('pointerenter', () => {
    if (g && !prefersReduced) g.to(pet.scale, { x: 1.06, y: 1.06, z: 1.06, duration: 0.3, ease: 'back.out(2)' });
  });
  holder.addEventListener('pointerleave', () => {
    if (g && !prefersReduced) g.to(pet.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'power2.out' });
  });

  /* ---------------- render loop ---------------- */
  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (document.hidden || widget.classList.contains('open')) return;
    const t = clock.getElapsedTime();
    if (!prefersReduced) {
      /* idle bob + sway (additive around the tweened base) */
      body.position.y = Math.sin(t * 2.1) * 0.05;
      face.position.y = 0.08 + Math.sin(t * 2.1) * 0.05;
      eyes.position.y = Math.sin(t * 2.1) * 0.05;
      stem.position.y = 1.05 + Math.sin(t * 2.1) * 0.055;
      tip.position.y = 1.32 + Math.sin(t * 2.1 + 0.4) * 0.07;
      shadow.scale.setScalar(1 - Math.sin(t * 2.1) * 0.06);
      /* look at cursor */
      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;
      pet.rotation.y += ((mouse.x * 0.55) - pet.rotation.y) * 0.1;
      pet.rotation.x += ((mouse.y * 0.25) - pet.rotation.x) * 0.1;
      eyes.position.x = mouse.x * 0.06;
      /* antenna glow pulse */
      tip.scale.setScalar(1 + Math.sin(t * 3.2) * 0.12);
    }
    renderer.render(scene, camera);
  }
  frame();

  /* activate: hide the plain FAB, show Mo */
  holder.hidden = false;
  widget.classList.add('has-pet');
})();
