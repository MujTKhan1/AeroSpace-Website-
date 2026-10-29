import * as THREE from './assets/three.module.js';
import { GLTFLoader } from './assets/GLTFLoader.js';
import { DRACOLoader } from './assets/DRACOLoader.js';
import { OrbitControls } from './assets/OrbitControls.js';
import { RoomEnvironment } from './assets/RoomEnvironment.js';

// Capabilities panel: NASA's Juno model as a drag-to-rotate engineering reference.
// It loads only when the panel nears the viewport; the flat satellite SVG stays as the fallback.
const stage = document.querySelector('.cap-stage');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

function init() {
  const canvas = document.createElement('canvas');
  canvas.className = 'juno-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  // Neutral studio light: a soft room for reflections plus key, fill and rim.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .7;
  pmrem.dispose();
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 4, 5);
  const fill = new THREE.DirectionalLight(0xe6ebf2, .6); fill.position.set(-4, 1, 2);
  const rim = new THREE.DirectionalLight(0xffffff, 1); rim.position.set(0, 2, -5);
  scene.add(key, fill, rim);

  const camera = new THREE.PerspectiveCamera(28, 1, .01, 1000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = .08;
  controls.rotateSpeed = .7;
  controls.minPolarAngle = Math.PI * .3;
  controls.maxPolarAngle = Math.PI * .68;
  controls.autoRotate = !reduced.matches;
  controls.autoRotateSpeed = .6;
  // Let vertical touch drags scroll the page; horizontal drags rotate the model.
  canvas.style.touchAction = 'pan-y';

  let resume;
  controls.addEventListener('start', () => { clearTimeout(resume); controls.autoRotate = false; });
  controls.addEventListener('end', () => { resume = setTimeout(() => { controls.autoRotate = !reduced.matches; }, 1800); });
  controls.addEventListener('change', () => { if (!running) render(); });

  function size() {
    const { width, height } = stage.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  function render() { renderer.render(scene, camera); }

  let running = false, visible = false, frameId = 0;
  function frame() {
    controls.update();
    render();
    frameId = running ? requestAnimationFrame(frame) : 0;
  }
  function setRunning(on) {
    if (on === running) return;
    running = on;
    if (on) frameId = requestAnimationFrame(frame); else cancelAnimationFrame(frameId);
  }
  const animate = () => visible && !document.hidden && !reduced.matches;

  const draco = new DRACOLoader();
  draco.setDecoderPath(new URL('./assets/draco/', import.meta.url).href);
  const loader = new GLTFLoader().setDRACOLoader(draco);
  loader.loadAsync('./assets/juno/Juno.glb').then(gltf => {
    draco.dispose();
    const model = gltf.scene;
    // Centre the spacecraft and frame its bounding sphere so the long solar arrays never clip while rotating.
    const box = new THREE.Box3().setFromObject(model);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    model.position.sub(sphere.center);
    scene.add(model);
    const dist = sphere.radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 1;
    camera.position.set(dist * .62, dist * .32, dist * .72);
    camera.near = dist / 100; camera.far = dist * 4;
    controls.target.set(0, 0, 0);
    controls.update();

    stage.prepend(canvas);
    size();
    render();
    stage.classList.add('has-model');
    new ResizeObserver(() => { size(); render(); }).observe(stage);
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; setRunning(animate()); }).observe(stage);
    document.addEventListener('visibilitychange', () => setRunning(animate()));
    reduced.addEventListener('change', () => { controls.autoRotate = !reduced.matches; setRunning(animate()); render(); });
  }).catch(error => {
    console.warn('Juno model unavailable, keeping the illustration:', error.message);
    renderer.dispose();
  });
}

if (stage) {
  const near = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    near.disconnect();
    try { init(); } catch (error) { console.warn('Juno model unavailable, keeping the illustration:', error.message); }
  }, { rootMargin: '600px 0px' });
  near.observe(stage);
}
