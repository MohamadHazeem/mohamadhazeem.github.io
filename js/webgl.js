/* ============================================================
   Mohamad Hazeem — Portfolio
   Persistent WebGL particle world (Three.js, ES module).

   One particle system, two scroll-choreographed states:
     1. Dunes        — procedural waves (hero)
     2. Vortex       — swirling golden galaxy (about → contact)
   Plus: cursor repulsion field and click shockwaves, both applied
   in screen space inside the vertex shader.

   If modules or WebGL are unavailable (e.g. file://), the site
   simply runs without the background — everything else is app.js.
   ============================================================ */

const STATIC_MODE = new URLSearchParams(location.search).has('static');
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || STATIC_MODE;

(async () => {
  const canvas = document.getElementById('webgl');
  if (!canvas) return;
  let THREE;
  try {
    THREE = await import('three');
  } catch {
    canvas.remove();
    return;
  }

  const isMobile = window.matchMedia('(max-width: 640px)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  } catch {
    canvas.remove();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.75 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 60);

  /* ---------------- Particle grid + morph targets ---------------- */
  const W = 30, D = 20;
  const COLS = isMobile ? 100 : 170;
  const ROWS = isMobile ? 66 : 110;
  const count = COLS * ROWS;

  const positions = new Float32Array(count * 3); // dune grid (XZ plane)
  const scatter = new Float32Array(count * 3);   // vortex galaxy target
  const rand = new Float32Array(count);          // per-particle random

  let i3 = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      positions[i3] = (c / (COLS - 1) - 0.5) * W;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = (r / (ROWS - 1) - 0.5) * D;
      i3 += 3;
    }
  }
  for (let i = 0; i < count; i++) {
    rand[i] = Math.random();
    /* Galaxy disc: radius band + vertical falloff toward the rim */
    const a = Math.random() * Math.PI * 2;
    const rr = 2.2 + Math.pow(Math.random(), 0.65) * 5.2;
    const y = (Math.random() - 0.5) * 2.4 * (1.15 - rr / 8);
    scatter[i * 3] = Math.cos(a) * rr;
    scatter[i * 3 + 1] = 1.1 + y;
    scatter[i * 3 + 2] = Math.sin(a) * rr;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3));
  geometry.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));

  const uniforms = {
    uTime: { value: 0 },
    uSize: { value: isMobile ? 26.0 : 30.0 },
    uColorA: { value: new THREE.Color('#3a372f') },
    uColorB: { value: new THREE.Color('#d9a44a') },
    uMorphScatter: { value: 0 },
    uMouse: { value: new THREE.Vector2(-10, -10) },
    uAspect: { value: 1 },
    uBurst: { value: new THREE.Vector2(0, 0) },
    uBurstAge: { value: 10 },
    uGlobalAlpha: { value: 1 },
  };

  /* Particle colors follow the CSS theme variables */
  function syncThemeColors() {
    const cs = getComputedStyle(document.documentElement);
    const a = cs.getPropertyValue('--particle-a').trim();
    const b = cs.getPropertyValue('--particle-b').trim();
    if (a) uniforms.uColorA.value.set(a);
    if (b) uniforms.uColorB.value.set(b);
    const light = document.documentElement.dataset.theme === 'light';
    material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    uniforms.uGlobalAlpha.value = light ? 0.78 : 1;
    material.needsUpdate = true;
  }

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uSize;
      uniform float uMorphScatter;
      uniform vec2 uMouse;
      uniform float uAspect;
      uniform vec2 uBurst;
      uniform float uBurstAge;
      attribute vec3 aScatter;
      attribute float aRand;
      varying float vElev;
      varying float vDepth;
      varying float vGold;

      /* Simplex 2D noise — Ian McEwan / Ashima Arts (MIT) */
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
        m = m * m; m = m * m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      float easeMorph(float m, float r) {
        float x = clamp(m * 1.6 - r * 0.6, 0.0, 1.0);
        return x * x * (3.0 - 2.0 * x);
      }

      void main() {
        /* --- state 1: dunes --- */
        float t = uTime * 0.28;
        vec3 dune = position;
        float swell = snoise(dune.xz * 0.11 + vec2(t * 0.6, t * 0.25)) * 1.35;
        float ripple = snoise(dune.xz * 0.42 + vec2(-t * 0.4, t * 0.8)) * 0.28;
        dune.y = swell + ripple;

        /* --- state 2: swirling vortex --- */
        float ang = uTime * (0.06 + aRand * 0.08);
        float ca = cos(ang), sa = sin(ang);
        vec3 vx = aScatter;
        vx = vec3(vx.x * ca - vx.z * sa, vx.y + sin(uTime * 0.7 + aRand * 6.283) * 0.14, vx.x * sa + vx.z * ca);

        float m1 = easeMorph(uMorphScatter, aRand);
        vec3 pos = mix(dune, vx, m1);

        vElev = dune.y;
        vGold = m1 * 0.4;

        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        vDepth = -mv.z;
        vec4 clip = projectionMatrix * mv;

        /* --- screen-space cursor repulsion --- */
        vec2 ndc = clip.xy / max(clip.w, 0.0001);
        vec2 d = (ndc - uMouse) * vec2(uAspect, 1.0);
        float L = max(length(d), 0.0001);
        float force = 0.16 * exp(-L * L * 9.0);
        vec2 push = (d / L) * force;

        /* --- click shockwave: expanding ring --- */
        vec2 db = (ndc - uBurst) * vec2(uAspect, 1.0);
        float Lb = max(length(db), 0.0001);
        float ringR = uBurstAge * 2.2;
        float ring = exp(-pow((Lb - ringR) / 0.22, 2.0)) * max(0.0, 1.0 - uBurstAge * 0.9) * 0.3;
        push += (db / Lb) * ring;

        clip.xy += push * vec2(1.0 / uAspect, 1.0) * clip.w;
        gl_Position = clip;

        float size = uSize * (1.0 + vElev * 0.35 * (1.0 - m1));
        gl_PointSize = size / vDepth;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uGlobalAlpha;
      varying float vElev;
      varying float vDepth;
      varying float vGold;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float disc = smoothstep(0.5, 0.18, d);
        if (disc < 0.01) discard;

        float crest = smoothstep(-0.9, 1.6, vElev);
        vec3 color = mix(uColorA, uColorB, max(crest, vGold));
        float fade = smoothstep(26.0, 6.0, vDepth);
        float alpha = disc * fade * (0.28 + max(crest * 0.6, vGold * 0.42)) * uGlobalAlpha;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });

  const points = new THREE.Points(geometry, material);
  points.position.y = -0.4;
  const group = new THREE.Group();
  group.add(points);
  scene.add(group);

  syncThemeColors();
  window.addEventListener('themechange', () => {
    syncThemeColors();
    renderer.render(scene, camera);
  });

  /* ---------------- Scroll choreography ---------------- */
  const smooth = (a, b, x) => {
    const v = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return v * v * (3 - 2 * v);
  };
  const lerp3 = (out, a, b, m) => {
    out[0] = a[0] + (b[0] - a[0]) * m;
    out[1] = a[1] + (b[1] - a[1]) * m;
    out[2] = a[2] + (b[2] - a[2]) * m;
  };

  const CAM = {
    dune: { pos: [0, 2.35, 5.6], look: [0, 0.4, 0] },
    vortex: { pos: [0, 3.4, 8.6], look: [0, 0.9, 0] },
  };

  let marks = { scatterA: 600, scatterB: 1800 };
  function measure() {
    const vh = window.innerHeight;
    const about = document.getElementById('about');
    const work = document.getElementById('work');
    if (!about || !work) return;
    marks = {
      scatterA: about.offsetTop - vh * 0.45,
      scatterB: work.offsetTop - vh * 0.35,
    };
  }
  measure();
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { measure(); }).observe(document.body);
  }

  /* ---------------- Sizing ---------------- */
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    uniforms.uAspect.value = w / h;
    camera.updateProjectionMatrix();
    measure();
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---------------- Pointer: parallax + repulsion + shockwave ---------------- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!prefersReduced) {
    window.addEventListener('pointermove', (e) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      uniforms.uMouse.value.set(mouse.tx, -mouse.ty);
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => {
      uniforms.uMouse.value.set(-10, -10);
    });
    window.addEventListener('mh:burst', (e) => {
      uniforms.uBurst.value.set(e.detail.x, e.detail.y);
      uniforms.uBurstAge.value = 0;
    });
  }

  /* ---------------- Render loop ---------------- */
  let visible = true;
  let rafId = null;
  const clock = new THREE.Clock();
  let sy = window.scrollY;
  const camPos = [0, 2.35, 5.6], camLook = [0, 0.4, 0], tmpA = [0, 0, 0], tmpB = [0, 0, 0];

  function frame() {
    rafId = null;
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!prefersReduced) {
      uniforms.uTime.value += dt;
      if (uniforms.uBurstAge.value < 10) uniforms.uBurstAge.value += dt * 1.6;
    }

    /* damped scroll progress → morph + camera */
    sy += (window.scrollY - sy) * 0.075;
    const m1 = smooth(marks.scatterA, marks.scatterB, sy);
    uniforms.uMorphScatter.value = m1;

    lerp3(camPos, CAM.dune.pos, CAM.vortex.pos, m1);
    lerp3(camLook, CAM.dune.look, CAM.vortex.look, m1);

    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    group.rotation.y = mouse.x * 0.07;
    group.rotation.x = mouse.y * 0.04;

    camera.position.set(camPos[0], camPos[1], camPos[2]);
    camera.lookAt(camLook[0], camLook[1], camLook[2]);

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  }

  function setRunning(run) {
    visible = run;
    if (run && rafId === null) {
      clock.getDelta();
      rafId = requestAnimationFrame(frame);
    }
  }

  document.addEventListener('visibilitychange', () => {
    setRunning(!document.hidden);
  });
  setRunning(true);

  if (prefersReduced) {
    uniforms.uTime.value = 14;
    camera.position.set(...CAM.dune.pos);
    camera.lookAt(...CAM.dune.look);
    renderer.render(scene, camera);
    setRunning(false);
  }
})();
