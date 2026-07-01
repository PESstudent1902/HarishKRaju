/*!
 * HARISH K RAJU — main.js
 * Services-focused personal branding site
 * GSAP ScrollTrigger + Three.js 3D assets
 */
(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  // Prevent dynamic mobile address bars from constantly triggering resize/refresh, which stutters layout
  ScrollTrigger.config({
    ignoreMobileResize: true
  });

  /* ── DOM refs ─────────────────────────────────────────── */
  const loader     = document.getElementById('loader');
  const navbar     = document.getElementById('navbar');
  const vcards     = document.querySelectorAll('.vcard');
  const vdots      = document.querySelectorAll('.vdot');
  const pfill      = document.getElementById('vprogress-fill');
  const vtopStep   = document.getElementById('vtop-step');
  const vtopName   = document.getElementById('vtop-name');
  const heroCanvas = document.getElementById('hero-canvas');
  const threeCanvas = document.getElementById('three-canvas');
  const vbgs       = document.querySelectorAll('.vbg');

  const VERTICAL_NAMES = ['Sound Healing', 'MIDNA Career Counselling', 'Balavihar & Sanskrit'];

  // Global variables for 3D assets (declared at top to avoid ReferenceErrors during early video metadata load events)
  let activeLotus = null;
  let activeBrain = null;
  let activeSanskrit = null;
  let verticalsRenderer = null;
  let verticalsScene = null;
  let verticalsCamera = null;

  /* ── Loader ───────────────────────────────────────────── */
  // Show loader until page ready, then fade out and start animations
  let animsStarted = false;

  function startPage() {
    if (animsStarted) return;
    animsStarted = true;

    gsap.to(loader, {
      opacity: 0, duration: 0.7, ease: 'power2.inOut',
      onComplete: () => {
        loader.style.display = 'none';
        initHeroAnim();
        initScrollAnims();
        initHero3D();
        initVerticals3D();
        initScrollScrub();
      }
    });
  }

  // Fire as soon as fonts + DOM are ready, don't wait for video
  if (document.readyState === 'complete') {
    startPage();
  } else {
    window.addEventListener('DOMContentLoaded', startPage);
    // Hard fallback: if load event fires, also trigger
    window.addEventListener('load', startPage);
  }

  /* ── Navbar ───────────────────────────────────────────── */
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  /* ── Hero animation ───────────────────────────────────── */
  function initHeroAnim() {
    // Set initial invisible state via GSAP (not CSS, to avoid flash)
    gsap.set('.hero-eyebrow', { opacity: 0, y: -20 });
    gsap.set('.hl',           { opacity: 0, y: 50 });
    gsap.set('.hero-sub',     { opacity: 0 });
    gsap.set('.hero-loc',     { opacity: 0, y: 10 });
    gsap.set('.hero-btns',    { opacity: 0, y: 20 });
    gsap.set('.orb',          { opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl
      // Orbs
      .to('.orb', { opacity: 1, duration: 1.5 }, 0)
      // Badge
      .to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.8 }, 0.2)
      // Title lines stagger
      .to('.hl', { opacity: 1, y: 0, duration: 0.9, stagger: 0.15 }, 0.5)
      // Subtitle
      .to('.hero-sub',  { opacity: 1, duration: 0.7 }, 1.1)
      .to('.hero-loc',  { opacity: 1, y: 0, duration: 0.6 }, 1.3)
      .to('.hero-btns', { opacity: 1, y: 0, duration: 0.6 }, 1.4);
  }

  /* ── VIDEO SCRUBBING ──────────────────────────────────── */
  /*
   * #verticals is 400vh tall.
   * #video-pin is sticky (100vh).
   * ScrollTrigger watches #verticals from top→bottom,
   * mapping scroll progress (0→1) to video.currentTime.
   *
   * Three equal segments:
   *   0.00 – 0.33 → overlay 0 (Sound Healing)
   *   0.33 – 0.66 → overlay 1 (MIDNA)
   *   0.66 – 1.00 → overlay 2 (Balavihar)
   */

  let currentCard = -1;

  function showCard(index) {
    if (index === currentCard) return;
    currentCard = index;

    vcards.forEach((c, i) => c.classList.toggle('show', i === index));
    vdots.forEach((d, i) => d.classList.toggle('active', i === index));
    vbgs.forEach((bg, i) => bg.classList.toggle('show', i === index));

    if (vtopStep) vtopStep.textContent = `0${index + 1} / 03`;
    if (vtopName) vtopName.textContent = VERTICAL_NAMES[index];
  }

  function initScrollScrub() {
    // Show first card immediately
    showCard(0);
    update3DVerticals(0);

    const mm = gsap.matchMedia();

    // Desktop: pin section and scrub transitions
    mm.add("(min-width: 769px)", () => {
      ScrollTrigger.create({
        trigger: '#services',
        start: 'top top',
        end: 'bottom bottom',
        pin: '#video-pin',
        pinSpacing: false, // Must be false because #services height (400vh) creates the scroll distance
        anticipatePin: 1,
        scrub: 1.5,
        onUpdate: (self) => {
          const p = self.progress;
          pfill.style.width = (p * 100) + '%';
          showCard(Math.min(2, Math.floor(p * 3)));
          update3DVerticals(p);
        }
      });
    });

    // Mobile/Tablet: natural scroll stack with ScrollTriggers to switch active assets
    mm.add("(max-width: 768px)", () => {
      vcards.forEach((card, index) => {
        ScrollTrigger.create({
          trigger: card,
          start: 'top 55%',
          end: 'bottom 45%',
          onToggle: (self) => {
            if (self.isActive) {
              showCard(index);
              update3DVerticalsMobile(index);
            }
          }
        });
      });

      // Add class to body to manage fixed bg and canvas visibility when services section is active
      ScrollTrigger.create({
        trigger: '#services',
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => {
          document.body.classList.toggle('services-active', self.isActive);
        }
      });
    });
  }

  /* ── Dot navigation ───────────────────────────────────── */
  vdots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      const sec    = document.getElementById('services');
      const top    = sec.getBoundingClientRect().top + window.scrollY;
      const height = sec.offsetHeight;
      // Jump to the start of each third (+2% to not sit on boundary)
      const target = top + height * (i / 3 + 0.01);
      window.scrollTo({ top: target, behavior: 'smooth' });
    });
  });

  /* ── Scroll reveal animations ─────────────────────────── */
  function initScrollAnims() {

    // -- About cards --
    document.querySelectorAll('.anim-card').forEach((el, i) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        onEnter: () => {
          gsap.to(el, {
            opacity: 1, y: 0, duration: 0.8,
            delay: i * 0.14, ease: 'power3.out'
          });
        }
      });
    });

    // -- Photo frame --
    document.querySelectorAll('.anim-photo').forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        onEnter: () => {
          gsap.to(el, {
            opacity: 1, x: 0, duration: 1.0, ease: 'power3.out'
          });
        }
      });
    });

    // -- Contact cards --
    document.querySelectorAll('.anim-ccard').forEach((el, i) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        onEnter: () => {
          gsap.to(el, {
            opacity: 1, y: 0, duration: 0.7,
            delay: i * 0.12, ease: 'power3.out'
          });
        }
      });
    });

    // -- Section headings --
    document.querySelectorAll('.eyebrow, .sec-title').forEach(el => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
        opacity: 0, y: 28, duration: 0.85, ease: 'power3.out'
      });
    });

    // -- Service pills --
    gsap.from('.spill', {
      scrollTrigger: { trigger: '.services-row', start: 'top 88%', toggleActions: 'play none none none' },
      opacity: 0, scale: 0.82, duration: 0.5, ease: 'back.out(1.6)', stagger: 0.07
    });

    // -- Footer --
    gsap.from('.footer-logo, .footer-tag, .footer-copy', {
      scrollTrigger: { trigger: '#footer', start: 'top 92%', toggleActions: 'play none none none' },
      opacity: 0, y: 18, duration: 0.7, stagger: 0.13, ease: 'power2.out'
    });

    ScrollTrigger.refresh();
  }

  /* ── Smooth nav links ─────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });

  /* ── THREE.JS 3D ASSETS ───────────────────────────────── */
  // (Note: variables are declared at the top of the script scope to prevent early event handler ReferenceErrors)

  function createPetalGeometry(width, length, curvature) {
    const geom = new THREE.PlaneGeometry(width, length, 15, 15);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const v = (y + length / 2) / length;
      const taper = Math.sin(v * Math.PI);
      pos.setX(i, x * taper);
      pos.setZ(i, Math.sin(v * Math.PI) * curvature);
    }
    geom.computeVertexNormals();
    return geom;
  }

  function createLotus() {
    const lotusGroup = new THREE.Group();
    const petalGeo = createPetalGeometry(1.2, 3.2, 0.8);
    const petalMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.05,
      clearcoat: 1.0,
      transmission: 0.65,
      thickness: 1.2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      emissive: 0x4f128f,
      emissiveIntensity: 0.25
    });

    const layers = [
      { count: 6,  radius: 0.5, pitch: 0.3, scale: 0.6 },
      { count: 10, radius: 0.9, pitch: 0.8, scale: 0.85 },
      { count: 14, radius: 1.3, pitch: 1.3, scale: 1.1 }
    ];

    layers.forEach((layer) => {
      for (let i = 0; i < layer.count; i++) {
        const mesh = new THREE.Mesh(petalGeo, petalMat);
        mesh.scale.setScalar(layer.scale);
        const angle = (i / layer.count) * Math.PI * 2;
        
        const pivot = new THREE.Group();
        pivot.rotation.y = angle;
        
        mesh.position.set(0, 0, layer.radius);
        mesh.rotation.x = layer.pitch;
        
        pivot.add(mesh);
        lotusGroup.add(pivot);
      }
    });

    const centerGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const centerMat = new THREE.MeshBasicMaterial({ color: 0xc9a84c });
    const center = new THREE.Mesh(centerGeo, centerMat);
    center.position.y = 0.15;
    lotusGroup.add(center);

    return lotusGroup;
  }

  function createBrainNetwork() {
    const brainGroup = new THREE.Group();
    const nodeCount = 85;
    const positions = [];
    const sphereGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

    for (let i = 0; i < nodeCount; i++) {
      const isLeft = Math.random() > 0.5;
      const centerX = isLeft ? -0.8 : 0.8;
      
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI;
      const r = Math.pow(Math.random(), 1/3) * 1.5;

      const x = centerX + r * Math.sin(v) * Math.cos(u) * 0.75;
      const y = r * Math.sin(v) * Math.sin(u) * 0.95;
      const z = r * Math.cos(v) * 0.8;

      positions.push(new THREE.Vector3(x, y, z));

      const nodeMesh = new THREE.Mesh(sphereGeo, nodeMat);
      nodeMesh.position.set(x, y, z);
      brainGroup.add(nodeMesh);
    }

    const lineMat = new THREE.LineBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.18  // Reduced from 0.35 — subtler neural web
    });

    const connectionsGeo = new THREE.BufferGeometry();
    const lineCoords = [];

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dist = positions[i].distanceTo(positions[j]);
        if (dist < 1.25) {
          lineCoords.push(positions[i].x, positions[i].y, positions[i].z);
          lineCoords.push(positions[j].x, positions[j].y, positions[j].z);
        }
      }
    }

    connectionsGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineCoords, 3));
    const lines = new THREE.LineSegments(connectionsGeo, lineMat);
    brainGroup.add(lines);

    return brainGroup;
  }

  function createSanskritParticles() {
    const sanskritGroup = new THREE.Group();
    const words = ['ॐ', 'शान्तिः', 'शान्तिः', 'सत्यम्', 'ज्ञानम्', 'धर्म', 'सेवा', 'संस्कृतम्'];
    const textures = [];

    words.forEach((word) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 256, 128);

      ctx.font = 'bold 52px "Cinzel", "Outfit", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const grad = ctx.createLinearGradient(0, 0, 256, 0);
      grad.addColorStop(0, '#e8c97a');
      grad.addColorStop(0.5, '#c9a84c');
      grad.addColorStop(1, '#9e7320');

      ctx.shadowColor = 'rgba(201, 168, 76, 0.5)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = grad;
      ctx.fillText(word, 128, 64);

      const texture = new THREE.CanvasTexture(canvas);
      textures.push(texture);
    });

    const spriteCount = 28;
    const sprites = [];

    for (let i = 0; i < spriteCount; i++) {
      const tex = textures[i % textures.length];
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });

      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(2.8, 1.4, 1);

      sprite.position.set(
        (Math.random() - 0.5) * 11,
        (Math.random() - 0.5) * 7,
        (Math.random() - 0.5) * 5
      );

      // Slowed from 0.004/0.002/0.002 — calmer, meditative float
      sprite.userData = {
        vx: (Math.random() - 0.5) * 0.0025,
        vy: (Math.random() - 0.5) * 0.0012,
        vz: (Math.random() - 0.5) * 0.0012
      };

      sanskritGroup.add(sprite);
      sprites.push(sprite);
    }

    sanskritGroup.userData = { sprites: sprites };
    return sanskritGroup;
  }

  function initHero3D() {
    if (!window.THREE || !heroCanvas) return;

    const scene = new THREE.Scene();
    const w = heroCanvas.clientWidth || heroCanvas.parentElement.clientWidth || window.innerWidth;
    const h = heroCanvas.clientHeight || heroCanvas.parentElement.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ canvas: heroCanvas, alpha: true, antialias: true });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Reduced from 160 — subtler, less distracting particle field
    const count = 80;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorViolet = new THREE.Color('#7c3aed');
    const colorGold = new THREE.Color('#c9a84c');
    const colorCyan = new THREE.Color('#06b6d4');

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 32;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      const rand = Math.random();
      let chosenColor = colorGold;
      if (rand < 0.35) chosenColor = colorViolet;
      else if (rand < 0.7) chosenColor = colorCyan;

      colors[i * 3]     = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(8, 8, 8, 0, Math.PI * 2);
    ctx.fill();
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX - window.innerWidth / 2) / 120;
      mouseY = (e.clientY - window.innerHeight / 2) / 120;
    }, { passive: true });

    function animate() {
      requestAnimationFrame(animate);
      // Slowed from 0.0008 / 0.0004 — gentler ambient movement
      points.rotation.y += 0.0004;
      points.rotation.x += 0.0002;

      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      points.position.x = targetX * 0.5;
      points.position.y = -targetY * 0.5;

      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      const w = heroCanvas.clientWidth || heroCanvas.parentElement.clientWidth || window.innerWidth;
      const h = heroCanvas.clientHeight || heroCanvas.parentElement.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    });
  }

  function initVerticals3D() {
    if (!window.THREE || !threeCanvas) return;

    verticalsScene = new THREE.Scene();
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    verticalsScene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 10, 7);
    verticalsScene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x7c3aed, 0.4);
    dirLight2.position.set(-5, -5, 5);
    verticalsScene.add(dirLight2);

    const w = threeCanvas.clientWidth || threeCanvas.parentElement.clientWidth || window.innerWidth;
    const h = threeCanvas.clientHeight || threeCanvas.parentElement.clientHeight || window.innerHeight;
    const aspect = w / h;

    verticalsCamera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    // Push camera back on portrait viewports to prevent 3D items from being clipped
    const camZ = aspect < 1 ? 13 : 10;
    verticalsCamera.position.set(0, 0, camZ);

    const isMobile = window.innerWidth <= 768 || window.innerHeight <= 600;
    const shiftX = isMobile ? 0 : 2.2;
    const shiftY = isMobile ? 2.2 : 0; // Shift up on mobile to float model above cards in top 30% of viewport
    const shiftGroup = new THREE.Group();
    shiftGroup.position.x = shiftX;
    shiftGroup.position.y = shiftY;
    verticalsScene.add(shiftGroup);

    verticalsRenderer = new THREE.WebGLRenderer({ canvas: threeCanvas, alpha: true, antialias: true });
    verticalsRenderer.setSize(w, h, false);
    verticalsRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    activeLotus = createLotus();
    activeBrain = createBrainNetwork();
    activeSanskrit = createSanskritParticles();

    activeLotus.scale.setScalar(isMobile ? 0.75 : 1.2);
    activeBrain.scale.setScalar(isMobile ? 0.65 : 1.0);
    activeSanskrit.scale.setScalar(isMobile ? 0.65 : 1.0);

    shiftGroup.add(activeLotus);
    shiftGroup.add(activeBrain);
    shiftGroup.add(activeSanskrit);

    activeLotus.visible = true;
    activeBrain.visible = false;
    activeSanskrit.visible = false;

    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX - window.innerWidth / 2) / 350;
      mouseY = (e.clientY - window.innerHeight / 2) / 350;
    }, { passive: true });

    function animate() {
      requestAnimationFrame(animate);

      // All speeds reduced ~40-50% for a softer, meditative feel
      if (activeLotus && activeLotus.visible) {
        activeLotus.rotation.y += 0.002;   // was 0.0035
        activeLotus.rotation.x = Math.sin(Date.now() * 0.0003) * 0.05;
      }
      if (activeBrain && activeBrain.visible) {
        activeBrain.rotation.y += 0.0015;  // was 0.0025
        activeBrain.rotation.x += 0.0004;  // was 0.0008
      }
      if (activeSanskrit && activeSanskrit.visible) {
        activeSanskrit.rotation.y += 0.0004; // was 0.0008
        const sprites = activeSanskrit.userData.sprites;
        sprites.forEach((sprite) => {
          sprite.position.x += sprite.userData.vx;
          sprite.position.y += sprite.userData.vy;
          sprite.position.z += sprite.userData.vz;

          if (Math.abs(sprite.position.x) > 5.5) sprite.userData.vx *= -1;
          if (Math.abs(sprite.position.y) > 3.5) sprite.userData.vy *= -1;
          if (Math.abs(sprite.position.z) > 2.5) sprite.userData.vz *= -1;
        });
      }

      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      shiftGroup.rotation.y = targetX;
      shiftGroup.rotation.x = targetY;

      verticalsRenderer.render(verticalsScene, verticalsCamera);
    }
    animate();

    window.addEventListener('resize', () => {
      const w = threeCanvas.clientWidth || threeCanvas.parentElement.clientWidth || window.innerWidth;
      const h = threeCanvas.clientHeight || threeCanvas.parentElement.clientHeight || window.innerHeight;
      const aspect = w / h;

      verticalsCamera.aspect = aspect;
      verticalsCamera.position.z = aspect < 1 ? 13 : 10;
      verticalsCamera.updateProjectionMatrix();
      verticalsRenderer.setSize(w, h, false);
      
      const isMobile = window.innerWidth <= 768 || window.innerHeight <= 600;
      shiftGroup.position.x = isMobile ? 0 : 2.2;
      shiftGroup.position.y = isMobile ? 2.2 : 0; // Shift up on resize if mobile

      // Update scales on resize
      if (activeLotus && activeLotus.visible) activeLotus.scale.setScalar(isMobile ? 0.75 : 1.2);
      if (activeBrain && activeBrain.visible) activeBrain.scale.setScalar(isMobile ? 0.65 : 1.0);
      if (activeSanskrit && activeSanskrit.visible) activeSanskrit.scale.setScalar(isMobile ? 0.65 : 1.0);
    });
  }

  function update3DVerticals(p) {
    if (!activeLotus || !activeBrain || !activeSanskrit) return;

    let lotusScale = 0;
    let brainScale = 0;
    let sanskritScale = 0;

    const isMobile = window.innerWidth <= 768 || window.innerHeight <= 600;
    const lotusMax = isMobile ? 0.75 : 1.2;
    const brainMax = isMobile ? 0.65 : 1.0;
    const sanskritMax = isMobile ? 0.65 : 1.0;

    if (p < 0.30) {
      lotusScale = lotusMax;
      brainScale = 0;
      sanskritScale = 0;
    } else if (p >= 0.30 && p < 0.38) {
      const t = (p - 0.30) / 0.08;
      lotusScale = (lotusMax * (1 - t));
      brainScale = (brainMax * t);
      sanskritScale = 0;
    } else if (p >= 0.38 && p < 0.63) {
      lotusScale = 0;
      brainScale = brainMax;
      sanskritScale = 0;
    } else if (p >= 0.63 && p < 0.71) {
      const t = (p - 0.63) / 0.08;
      lotusScale = 0;
      brainScale = (brainMax * (1 - t));
      sanskritScale = (sanskritMax * t);
    } else {
      lotusScale = 0;
      brainScale = 0;
      sanskritScale = sanskritMax;
    }

    if (lotusScale > 0.01) {
      activeLotus.visible = true;
      activeLotus.scale.setScalar(lotusScale);
    } else {
      activeLotus.visible = false;
    }

    if (brainScale > 0.01) {
      activeBrain.visible = true;
      activeBrain.scale.setScalar(brainScale);
    } else {
      activeBrain.visible = false;
    }

    if (sanskritScale > 0.01) {
      activeSanskrit.visible = true;
      activeSanskrit.scale.setScalar(sanskritScale);
    } else {
      activeSanskrit.visible = false;
    }
  }

  // Mobile transitions: Animate scale dynamically with GSAP to avoid jumps
  function update3DVerticalsMobile(index) {
    if (!activeLotus || !activeBrain || !activeSanskrit) return;

    const lotusMax = 0.75;
    const brainMax = 0.65;
    const sanskritMax = 0.65;

    gsap.to(activeLotus.scale, {
      x: index === 0 ? lotusMax : 0,
      y: index === 0 ? lotusMax : 0,
      z: index === 0 ? lotusMax : 0,
      duration: 0.5,
      overwrite: 'auto',
      onStart: () => { if (index === 0) activeLotus.visible = true; },
      onComplete: () => { if (index !== 0) activeLotus.visible = false; }
    });

    gsap.to(activeBrain.scale, {
      x: index === 1 ? brainMax : 0,
      y: index === 1 ? brainMax : 0,
      z: index === 1 ? brainMax : 0,
      duration: 0.5,
      overwrite: 'auto',
      onStart: () => { if (index === 1) activeBrain.visible = true; },
      onComplete: () => { if (index !== 1) activeBrain.visible = false; }
    });

    gsap.to(activeSanskrit.scale, {
      x: index === 2 ? sanskritMax : 0,
      y: index === 2 ? sanskritMax : 0,
      z: index === 2 ? sanskritMax : 0,
      duration: 0.5,
      overwrite: 'auto',
      onStart: () => { if (index === 2) activeSanskrit.visible = true; },
      onComplete: () => { if (index !== 2) activeSanskrit.visible = false; }
    });
  }

  /* ── Mobile menu toggle ───────────────────────────────── */
  const hamburger = document.getElementById('nav-hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    // Close menu when any link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }

  /* ── QR Code Generation ─────────────────────────────────── */
  function initQRCodes() {
    if (typeof QRCode === 'undefined') return;

    const qrOptions = {
      width: 120,
      height: 120,
      colorDark: '#c9a84c',
      colorLight: '#0d1117',
      correctLevel: QRCode.CorrectLevel.M
    };

    const qrSoundEl = document.getElementById('qr-sound-healing');
    if (qrSoundEl) {
      new QRCode(qrSoundEl, Object.assign({}, qrOptions, {
        text: 'https://photos.app.goo.gl/CCCtXs22mWpUTJJh6'
      }));
      // Redirect to link on click/tap (helps mobile users who can't scan their own screen)
      qrSoundEl.parentElement.addEventListener('click', () => {
        window.open('https://photos.app.goo.gl/CCCtXs22mWpUTJJh6', '_blank');
      });
    }

    const qrMidnaEl = document.getElementById('qr-midna-gbp');
    if (qrMidnaEl) {
      new QRCode(qrMidnaEl, Object.assign({}, qrOptions, {
        text: 'https://photos.app.goo.gl/Uh9x4esgtTVh8sh37'
      }));
      // Redirect to link on click/tap
      qrMidnaEl.parentElement.addEventListener('click', () => {
        window.open('https://photos.app.goo.gl/Uh9x4esgtTVh8sh37', '_blank');
      });
    }
  }
  initQRCodes();

  /* ── Lightbox Overlay Feature ───────────────────────────── */
  function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.lightbox-close');

    if (!lightbox || !lightboxImg) return;

    // Target both gallery images and the main profile image
    document.querySelectorAll('.vgallery-img, .profile-img').forEach(img => {
      img.addEventListener('click', () => {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || 'Extended gallery view';
        lightboxCaption.textContent = img.alt || '';
        lightbox.style.display = 'flex';
        // Force a reflow for transition
        lightbox.offsetHeight; 
        lightbox.classList.add('show');
      });
    });

    const closeLightbox = () => {
      lightbox.classList.remove('show');
      setTimeout(() => {
        lightbox.style.display = 'none';
        lightboxImg.src = ''; // Clear source
        lightboxImg.alt = 'Extended view of gallery photo';
      }, 300);
    };

    // Close on click outside the image container
    lightbox.addEventListener('click', (e) => {
      if (e.target !== lightboxImg && e.target !== lightboxCaption) {
        closeLightbox();
      }
    });

    closeBtn.addEventListener('click', closeLightbox);

    // Escape key support
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('show')) {
        closeLightbox();
      }
    });
  }
  initLightbox();

  /* ── YouTube Video Facade/Lazy Loading ─────────────────── */
  function initVideoFacades() {
    document.querySelectorAll('.video-facade').forEach(facade => {
      facade.addEventListener('click', () => {
        const videoId = facade.getAttribute('data-video-id');
        const videoTitle = facade.getAttribute('data-video-title');
        if (!videoId) return;

        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', `https://www.youtube.com/embed/${videoId}?autoplay=1`);
        iframe.setAttribute('title', videoTitle || 'YouTube Video');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('allowfullscreen', 'true');

        // Clear contents (poster and button) and mount iframe
        facade.innerHTML = '';
        facade.appendChild(iframe);
        // Remove class to disable hover scale zoom
        facade.classList.remove('video-facade');
      });
    });
  }
  initVideoFacades();

})();
