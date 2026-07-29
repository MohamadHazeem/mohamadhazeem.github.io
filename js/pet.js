/* ============================================================
   "Mo" — Mohamad's AI pet (Three.js, ES module)
   A cute hovering robot on the chat corner: big glossy eyes that
   genuinely look at your cursor (true angle from his head to the
   pointer, with moving pupils), blush cheeks, a little smile,
   floppy antenna, idle play, and a happy greeting that opens
   the Ask Hazeem AI chat.
   Progressive enhancement — without WebGL/modules the plain
   chat button remains.
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

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd9a44a, roughness: 0.32, metalness: 0.22 });
  const faceMat = new THREE.MeshStandardMaterial({ color: 0x17140d, roughness: 0.5, metalness: 0.1 });
  const scleraMat = new THREE.MeshBasicMaterial({ color: 0xfff6e0 });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x241d10 });
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xe8875f, transparent: true, opacity: 0.55 });
  const tipMat = new THREE.MeshBasicMaterial({ color: 0xffd98a });

  /* body — soft egg blob */
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 36), bodyMat);
  body.scale.set(1, 0.94, 0.9);
  pet.add(body);

  /* ear nubs */
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16), bodyMat);
    ear.position.set(0.82 * s, 0.6, 0);
    pet.add(ear);
  }

  /* face visor */
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.8, 36, 28), faceMat);
  face.scale.set(1, 0.85, 0.5);
  face.position.set(0, 0.08, 0.52);
  pet.add(face);

  /* eyes: big glossy sclera + moving pupil + sparkle highlights */
  const eyesG = new THREE.Group();
  pet.add(eyesG);
  function makeEye(side) {
    const eye = new THREE.Group();
    eye.position.set(0.3 * side, 0.18, 0.9);
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 18), scleraMat);
    sclera.scale.set(1, 1.25, 0.55);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 16), pupilMat);
    pupil.scale.set(1, 1.3, 0.5);
    pupil.position.z = 0.07;
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), sparkMat);
    spark.position.set(-0.035, 0.06, 0.12);
    const spark2 = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), sparkMat);
    spark2.position.set(0.045, -0.03, 0.12);
    eye.add(sclera, pupil, spark, spark2);
    eyesG.add(eye);
    return { eye, sclera, pupil };
  }
  const eyeL = makeEye(-1);
  const eyeR = makeEye(1);

  /* little smile — cream arc on the visor */
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.028, 10, 24, Math.PI * 0.75), scleraMat);
  mouth.position.set(0, -0.1, 0.9);
  mouth.rotation.z = Math.PI + (Math.PI * 0.75) / 2 - Math.PI / 2; /* arc curves like a smile */
  pet.add(mouth);

  /* blush cheeks */
  for (const s of [-1, 1]) {
    const blush = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), blushMat);
    blush.position.set(0.56 * s, -0.1, 0.74);
    blush.lookAt(blush.position.clone().multiplyScalar(2.5).add(new THREE.Vector3(0, 0, 1)));
    pet.add(blush);
  }

  /* floppy antenna */
  const antenna = new THREE.Group();
  antenna.position.set(0, 0.88, 0);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 12), bodyMat);
  stem.position.y = 0.21;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), tipMat);
  tip.position.y = 0.47;
  antenna.add(stem, tip);
  pet.add(antenna);

  /* stubby arms */
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

  function syncTheme() {
    const light = document.documentElement.dataset.theme === 'light';
    bodyMat.color.set(light ? 0xb8902e : 0xd9a44a);
    shadow.material.opacity = light ? 0.14 : 0.22;
  }
  syncTheme();
  window.addEventListener('themechange', () => { syncTheme(); renderer.render(scene, camera); });

  /* ---------------- true cursor gaze ----------------
     The cursor's screen position is unprojected through the render
     camera into Mo's 3D world; the exact look direction is computed
     from his head to that point. The head turns within natural
     limits, and the pupils cover the REMAINING angle precisely —
     so the combined gaze always lands on the cursor. */
  pet.rotation.order = 'YXZ'; /* yaw first, then pitch — screen-natural */
  let rect = canvas.getBoundingClientRect();
  window.addEventListener('resize', () => { rect = canvas.getBoundingClientRect(); });

  const clampV = (v, a, b) => Math.min(b, Math.max(a, v));
  const HEAD_WORLD = new THREE.Vector3(0, 0.9, 0); /* Mo's eye level */
  const unproj = new THREE.Vector3();
  const gaze = { yaw: 0, pitch: 0, tYaw: 0, tPitch: 0 };

  if (!prefersReduced) {
    window.addEventListener('pointermove', (e) => {
      /* the canvas is display:none until Mo activates — re-measure once visible */
      if (!rect.width) rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      /* cursor → NDC relative to Mo's canvas (values beyond ±1 are fine) */
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      unproj.set(ndcX, ndcY, 0.5).unproject(camera).sub(HEAD_WORLD).normalize();
      gaze.tYaw = Math.atan2(unproj.x, unproj.z);
      gaze.tPitch = Math.atan2(unproj.y, Math.hypot(unproj.x, unproj.z));
    }, { passive: true });
  }

  /* ---------------- expressions ---------------- */
  const eyeParts = [eyeL, eyeR];
  function blink(double) {
    if (!g) return;
    const scales = eyeParts.map((e) => e.sclera.scale);
    const tl = g.timeline();
    tl.to(scales, { y: 0.12, duration: 0.07, ease: 'power2.in' })
      .to(scales, { y: 1.25, duration: 0.12, ease: 'power2.out' });
    if (double) {
      tl.to(scales, { y: 0.12, duration: 0.07 }, '+=0.08')
        .to(scales, { y: 1.25, duration: 0.12 });
    }
  }

  /* happy squint: eyes become smiling arcs for a moment */
  function happyEyes() {
    if (!g) return;
    eyeParts.forEach((e) => {
      g.timeline()
        .to(e.sclera.scale, { y: 0.5, duration: 0.18, ease: 'power2.out' })
        .to(e.eye.position, { y: 0.24, duration: 0.18, ease: 'power2.out' }, '<')
        .to(e.sclera.scale, { y: 1.25, duration: 0.3, ease: 'power2.inOut' }, '+=1.0')
        .to(e.eye.position, { y: 0.18, duration: 0.3, ease: 'power2.inOut' }, '<');
    });
    g.timeline()
      .to(mouth.scale, { x: 1.45, y: 1.45, duration: 0.2, ease: 'back.out(2)' })
      .to(mouth.scale, { x: 1, y: 1, duration: 0.35, ease: 'power2.inOut' }, '+=1.0');
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

  function wiggle() {
    if (!g) return;
    g.timeline()
      .to(pet.rotation, { z: 0.14, duration: 0.14, ease: 'sine.inOut' })
      .to(pet.rotation, { z: -0.14, duration: 0.24, yoyo: true, repeat: 2, ease: 'sine.inOut' })
      .to(pet.rotation, { z: 0, duration: 0.16, ease: 'sine.out' });
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

  if (!prefersReduced) {
    setInterval(() => {
      if (document.hidden || widget.classList.contains('open')) return;
      const acts = [() => blink(true), wave, spin, wiggle];
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
    happyEyes();
    bubbleEl.textContent = GREETS[greetIdx++ % GREETS.length];
    bubbleEl.hidden = false;
    bubbleEl.classList.add('pop');
    setTimeout(() => {
      bubbleEl.classList.remove('pop');
      bubbleEl.hidden = true;
      fab.click();
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
  let prevYaw = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (document.hidden || widget.classList.contains('open')) return;
    const t = clock.getElapsedTime();
    if (!prefersReduced) {
      /* idle bob */
      const bob = Math.sin(t * 2.1) * 0.05;
      body.position.y = bob;
      face.position.y = 0.08 + bob;
      eyesG.position.y = bob;
      mouth.position.y = -0.1 + bob;
      antenna.position.y = 0.88 + bob;
      shadow.scale.setScalar(1 - Math.sin(t * 2.1) * 0.06);

      /* true gaze: the head turns toward the cursor within natural
         limits (eyes dart faster than the head)… */
      gaze.yaw += (gaze.tYaw - gaze.yaw) * 0.14;
      gaze.pitch += (gaze.tPitch - gaze.pitch) * 0.14;
      const headYaw = clampV(gaze.yaw, -1.0, 1.0);
      const headPitch = clampV(gaze.pitch, -0.55, 0.7);
      pet.rotation.y = headYaw;
      pet.rotation.x = -headPitch;
      /* …and the pupils cover EXACTLY the residual angle, so the
         combined head+eye direction lands on the cursor. */
      const resYaw = clampV(gaze.tYaw - headYaw, -0.9, 0.9);
      const resPitch = clampV(gaze.tPitch - headPitch, -0.9, 0.9);
      for (const e of eyeParts) {
        e.pupil.position.x += (clampV(Math.sin(resYaw) * 0.16, -0.1, 0.1) - e.pupil.position.x) * 0.35;
        e.pupil.position.y += (clampV(Math.sin(resPitch) * 0.16, -0.12, 0.12) - e.pupil.position.y) * 0.35;
      }

      /* floppy antenna: springs against head motion */
      const yawVel = gaze.yaw - prevYaw;
      prevYaw = gaze.yaw;
      antenna.rotation.z += ((-yawVel * 14 + Math.sin(t * 3) * 0.05) - antenna.rotation.z) * 0.12;
      tip.scale.setScalar(1 + Math.sin(t * 3.2) * 0.12);
    }
    renderer.render(scene, camera);
  }
  frame();

  holder.hidden = false;
  widget.classList.add('has-pet');
  rect = canvas.getBoundingClientRect();
})();
