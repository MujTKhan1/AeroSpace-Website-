import * as THREE from './assets/three.module.js';
import { GLTFLoader } from './assets/GLTFLoader.js';
import { DRACOLoader } from './assets/DRACOLoader.js';

const canvas = document.getElementById('space-canvas');
const stage = canvas.parentElement;
const motionButton = document.getElementById('motion-toggle');
const viewButton = document.getElementById('view-toggle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const configurationButtons = [...document.querySelectorAll('[data-configuration]')];
let paused = reduced.matches;
let renderer;

async function createScene() {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 60);
  camera.position.set(0, .15, 11);

  let seed = 25971;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  // Neutral studio reflections, built locally rather than fetching a large HDRI.
  const envCanvas = document.createElement('canvas'); envCanvas.width = 1024; envCanvas.height = 512;
  const ctx = envCanvas.getContext('2d');
  const envGradient = ctx.createLinearGradient(0, 0, 0, 512);
  envGradient.addColorStop(0, '#c1c4c6'); envGradient.addColorStop(.35, '#565b61'); envGradient.addColorStop(.6, '#171c22'); envGradient.addColorStop(1, '#393e45');
  ctx.fillStyle = envGradient; ctx.fillRect(0, 0, 1024, 512);
  ctx.fillStyle = '#f7f6f1'; ctx.fillRect(170, 60, 230, 190);
  ctx.fillStyle = '#c5cbd0'; ctx.fillRect(740, 100, 110, 235);
  ctx.fillStyle = '#f0f0eb'; ctx.fillRect(470, 90, 16, 180);
  const env = new THREE.CanvasTexture(envCanvas); env.mapping = THREE.EquirectangularReflectionMapping; env.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer); const envTarget = pmrem.fromEquirectangular(env); scene.environment = envTarget.texture; env.dispose(); pmrem.dispose();
  scene.add(new THREE.AmbientLight(0xdde2e8, 1.05));
  const key = new THREE.DirectionalLight(0xfff8ea, 3.6); key.position.set(-4, 6, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0xe1e8ef, 2.5); rim.position.set(4, 2, -2); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xe5e8ea, 1.4); fill.position.set(-3, -2, 4); scene.add(fill);

  const foilCanvas = document.createElement('canvas'); foilCanvas.width = foilCanvas.height = 512;
  const fc = foilCanvas.getContext('2d'); fc.fillStyle = '#a58c59'; fc.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3400; i++) {
    const x = random() * 512, y = random() * 512, size = 3 + random() * 32, light = Math.floor(50 + random() * 90);
    fc.fillStyle = `rgba(${light + 70},${light + 45},${light},${.2 + random() * .45})`;
    fc.beginPath(); fc.moveTo(x, y); fc.lineTo(x + size, y + random() * size); fc.lineTo(x + random() * size, y + size); fc.closePath(); fc.fill();
    fc.strokeStyle = '#f0e6c523'; fc.lineWidth = .6; fc.stroke();
  }
  const foilMap = new THREE.CanvasTexture(foilCanvas); foilMap.colorSpace = THREE.SRGBColorSpace;
  const foil = new THREE.MeshStandardMaterial({ color: 0xbfa773, map: foilMap, bumpMap: foilMap, bumpScale: .018, metalness: .88, roughness: .36 });
  const aluminium = new THREE.MeshStandardMaterial({ color: 0xbac1c7, metalness: .92, roughness: .29 });
  const graphite = new THREE.MeshStandardMaterial({ color: 0x2b343c, metalness: .72, roughness: .4 });
  const ceramic = new THREE.MeshStandardMaterial({ color: 0xd4d7d6, metalness: .42, roughness: .3, side: THREE.DoubleSide });
  const solarCanvas = document.createElement('canvas'); solarCanvas.width = 1024; solarCanvas.height = 512;
  const sc = solarCanvas.getContext('2d'); sc.fillStyle = '#243951'; sc.fillRect(0, 0, 1024, 512);
  for (let col = 0; col < 12; col++) for (let row = 0; row < 6; row++) {
    const x = col * 85.333, y = row * 85.333;
    const gradient = sc.createLinearGradient(x, y, x + 82, y + 82); gradient.addColorStop(0, '#405d79'); gradient.addColorStop(.55, '#1f3752'); gradient.addColorStop(1, '#142c46');
    sc.fillStyle = gradient; sc.fillRect(x + 3, y + 3, 79, 79);
    sc.strokeStyle = '#9aadb788'; sc.lineWidth = .7;
    for (let k = 1; k < 9; k++) { sc.beginPath(); sc.moveTo(x + 4, y + k * 9); sc.lineTo(x + 80, y + k * 9); sc.stroke(); }
    sc.strokeStyle = '#c5c9c966'; sc.lineWidth = 1.5; sc.beginPath(); sc.moveTo(x + 28, y + 4); sc.lineTo(x + 28, y + 80); sc.moveTo(x + 57, y + 4); sc.lineTo(x + 57, y + 80); sc.stroke();
  }
  const solarMap = new THREE.CanvasTexture(solarCanvas); solarMap.colorSpace = THREE.SRGBColorSpace; solarMap.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  const solar = new THREE.MeshStandardMaterial({ color: 0x456b90, map: solarMap, metalness: .24, roughness: .53, envMapIntensity: .1 });
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath(new URL('./assets/draco/', import.meta.url).href);
  loader.setDRACOLoader(draco);
  const models = await Promise.all(['body-3', 'wings-2', 'radio-2', 'radio-3'].map(name => loader.loadAsync(`./assets/satellite-kit/${name}.glb`)));
  draco.dispose();
  const satellite = new THREE.Group(); scene.add(satellite);
  function prepare(model, dimension, target) {
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model); const size = box.getSize(new THREE.Vector3()); const center = box.getCenter(new THREE.Vector3());
    const k = target / size[dimension];
    const centered = new THREE.Group(); centered.add(model); model.position.sub(center); centered.scale.setScalar(k);
    const container = new THREE.Group(); container.add(centered); return container;
  }
  const body = prepare(models[0].scene, 'y', 1.65); body.position.y = .07;
  body.scale.set(1.6, 1, 1.6);
  body.traverse(m => { if (m.isMesh) { m.material = foil; m.geometry.computeVertexNormals(); } }); satellite.add(body);
  const wings = prepare(models[1].scene, 'x', 6.35);
  wings.rotation.x = .95;
  wings.traverse(m => { if (m.isMesh) {
    const panel = /SolarPanels|lambert/.test(m.material.name); m.material = panel ? solar : aluminium;
    if (panel) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 25), new THREE.LineBasicMaterial({ color: 0x8598a7, transparent: true, opacity: .65 })));
  } }); satellite.add(wings);
  // The kit's radio alternatives change the communications assembly only.
  const baselineRadio = prepare(models[2].scene, 'x', 1.55);
  const proposedRadio = prepare(models[3].scene, 'x', 1.85);
  for (const radio of [baselineRadio, proposedRadio]) {
    radio.position.set(0, .58, .45);
    radio.traverse(m => { if (m.isMesh) { const name = m.material.name; m.material = /Dish/.test(name) ? ceramic : /CommBox/.test(name) ? graphite : aluminium; } }); satellite.add(radio);
  }
  // Refined reflector geometry makes the communication assembly legible at hero scale.
  for (const [radio, radius] of [[baselineRadio, .46], [proposedRadio, .57]]) {
    const reflector = new THREE.Group(); reflector.position.set(.04, -.43, .29); reflector.rotation.set(-.12, .16, 0); radio.add(reflector);
    const profile = [];
    for (let i = 0; i <= 32; i++) { const r = i / 32 * radius; profile.push(new THREE.Vector2(r, r * r * .85)); }
    const dish = new THREE.Mesh(new THREE.LatheGeometry(profile, 80), ceramic); dish.rotation.x = Math.PI / 2; reflector.add(dish);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, .012, 8, 80), aluminium); rim.position.z = radius * radius * .85; reflector.add(rim);
    for (let i = 0; i < 3; i++) {
      const angle = i / 3 * Math.PI * 2; const start = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, radius * radius * .85), end = new THREE.Vector3(0, 0, .53), delta = end.clone().sub(start);
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, delta.length(), 8), aluminium); strut.position.copy(start.add(end).multiplyScalar(.5)); strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); reflector.add(strut);
    }
    const feed = new THREE.Mesh(new THREE.SphereGeometry(.037, 16, 12), graphite); feed.position.z = .54; reflector.add(feed);
  }
  proposedRadio.visible = false;
  proposedRadio.updateMatrixWorld(true);
  proposedRadio.traverse(m => { if (m.isMesh) { const line = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 24), new THREE.LineBasicMaterial({ color: 0xce995b, transparent: true, opacity: .55 })); m.add(line); } });
  function addMesh(geo, mat, parent, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; }
  function rod(a, b, radius, mat, parent) { const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), delta = bv.clone().sub(av); const m = addMesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 8), mat, parent); m.position.copy(av.add(bv).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return m; }
  // Added fittings and thermal details remain an illustrative visual assembly.
  addMesh(new THREE.CylinderGeometry(.51, .51, .055, 48), aluminium, satellite, 0, .88, 0);
  addMesh(new THREE.CylinderGeometry(.51, .51, .055, 48), aluminium, satellite, 0, -.77, 0);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; rod([Math.cos(a) * .51, -.73, Math.sin(a) * .51], [Math.cos(a) * .51, .83, Math.sin(a) * .51], .009, aluminium, satellite); }
  const radiator = addMesh(new THREE.BoxGeometry(.05, .83, .46), graphite, satellite, -.54, -.03, .03);
  for (let i = 0; i < 13; i++) addMesh(new THREE.BoxGeometry(.011, .017, .45), aluminium, radiator, -.028, (i - 6) * .057, 0);
  for (const sign of [-1, 1]) {
    rod([sign * .3, -.05, 0], [sign * .72, -.05, 0], .04, aluminium, satellite);
    addMesh(new THREE.CylinderGeometry(.065, .05, .18, 12), graphite, satellite, sign * .21, -.9, 0);
  }
  rod([.12, .91, -.1], [.12, 1.52, -.1], .009, aluminium, satellite);
  rod([.12, 1.52, -.1], [.3, 1.65, -.1], .006, aluminium, satellite);
  addMesh(new THREE.CylinderGeometry(.12, .12, .07, 32), graphite, satellite, .12, .94, -.1);
  satellite.rotation.set(.22, -.57, -.34);
  satellite.position.set(.1, .35, 0);

  let userY = 0, userZ = 0, parallaxX = 0, parallaxY = 0, dragging = false, previousX = 0, previousY = 0;
  let time = 0, previousTime = performance.now(), frameId, disposed = false, mode = 'baseline';
  function render() { renderer.render(scene, camera); }
  function resize() {
    const rect = stage.getBoundingClientRect(); renderer.setSize(rect.width, rect.height, false); camera.aspect = rect.width / rect.height;
    const mobile = innerWidth <= 760;
    camera.position.z = mobile ? 12.3 : innerWidth <= 1100 ? 11.5 : 11.05;
    satellite.scale.setScalar(mobile ? .87 : .96);
    satellite.position.y = mobile ? .25 : .35;
    satellite.position.x = mobile ? -.16 : .15;
    camera.updateProjectionMatrix(); render();
  }
  new ResizeObserver(resize).observe(stage); resize();
  function setConfiguration(next) {
    mode = next;
    const isProposed = next === 'proposed'; baselineRadio.visible = !isProposed; proposedRadio.visible = isProposed;
    configurationButtons.forEach(button => { const active = button.dataset.configuration === next; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
    stage.classList.toggle('showing-change', isProposed);
    document.querySelector('.scene-fallback img').src = isProposed ? './assets/satellite-proposed.svg' : './assets/satellite-fallback.svg';
    document.getElementById('component-status').textContent = isProposed ? 'Proposed module change' : 'Baseline configuration';
    document.getElementById('configuration-description').textContent = isProposed ? 'Communications assembly changed · illustrative only' : 'Baseline configuration · illustrative only';
    // A brief physical settle makes the selected component legible without an exploded view.
    if (window.gsap && !reduced.matches && !paused) gsap.fromTo((isProposed ? proposedRadio : baselineRadio).position, { y: .66 }, { y: .58, duration: .65, ease: 'power3.out' });
    render();
  }
  configurationButtons.forEach(button => button.addEventListener('click', () => setConfiguration(button.dataset.configuration)));
  setConfiguration(mode);
  function updateMotion() { motionButton.setAttribute('aria-pressed', String(paused)); motionButton.setAttribute('aria-label', paused ? 'Play model motion' : 'Pause model motion'); }
  updateMotion(); motionButton.addEventListener('click', () => { paused = !paused; updateMotion(); });
  viewButton.addEventListener('click', () => { userY += .5; if (paused || reduced.matches) { satellite.rotation.y = -.57 + userY; render(); } });
  canvas.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; dragging = true; previousX = e.clientX; previousY = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (dragging) { userY += (e.clientX - previousX) * .007; userZ = THREE.MathUtils.clamp(userZ + (e.clientY - previousY) * .004, -.45, .45); previousX = e.clientX; previousY = e.clientY; if (paused || reduced.matches) { satellite.rotation.y = -.57 + userY; satellite.rotation.z = -.34 + userZ; render(); } }
    else if (!reduced.matches) { const r = canvas.getBoundingClientRect(); parallaxX = ((e.clientX - r.left) / r.width - .5) * .08; parallaxY = ((e.clientY - r.top) / r.height - .5) * .05; }
  });
  canvas.addEventListener('pointerup', () => { dragging = false; }); canvas.addEventListener('pointercancel', () => { dragging = false; }); canvas.addEventListener('pointerleave', () => { parallaxX = parallaxY = 0; });
  reduced.addEventListener('change', e => { if (e.matches) { paused = true; parallaxX = parallaxY = 0; updateMotion(); render(); } });
  function frame(now) {
    if (disposed) return;
    const dt = Math.min((now - previousTime) / 1000, .05); previousTime = now;
    if (!paused && !document.hidden && !document.querySelector('dialog[open]')) {
      time += dt;
      satellite.position.y = (innerWidth <= 760 ? .25 : .35) + Math.sin(time * .45) * .035;
      satellite.rotation.x += (.22 + parallaxY + Math.sin(time * .22) * .018 - satellite.rotation.x) * .035;
      satellite.rotation.y += (-.57 + userY + parallaxX + Math.sin(time * .17) * .035 - satellite.rotation.y) * .035;
      satellite.rotation.z += (-.34 + userZ - satellite.rotation.z) * .035;
      render();
    }
    frameId = requestAnimationFrame(frame);
  }
  render(); stage.classList.add('scene-ready'); frameId = requestAnimationFrame(frame);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); disposed = true; cancelAnimationFrame(frameId); stage.classList.remove('scene-ready'); });
  canvas.addEventListener('webglcontextrestored', () => location.reload());
}

createScene().catch(error => {
  console.warn('Using the static satellite illustration:', error.message);
  renderer?.dispose(); motionButton.hidden = true; viewButton.hidden = true;
  document.querySelector('.drag-hint').hidden = true;
  configurationButtons.forEach(button => button.addEventListener('click', () => {
    const isProposed = button.dataset.configuration === 'proposed';
    configurationButtons.forEach(b => { const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
    stage.classList.toggle('showing-change', isProposed);
    document.querySelector('.scene-fallback img').src = isProposed ? './assets/satellite-proposed.svg' : './assets/satellite-fallback.svg';
    document.getElementById('component-status').textContent = isProposed ? 'Proposed module change' : 'Baseline configuration';
    document.getElementById('configuration-description').textContent = isProposed ? 'Proposed communications change · static illustration' : 'Baseline configuration · static illustration';
  }));
});
