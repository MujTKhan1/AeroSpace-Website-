import * as THREE from './assets/three.module.js';
import { GLTFLoader } from './assets/GLTFLoader.js';
import { DRACOLoader } from './assets/DRACOLoader.js';

// Hero scene: starfield, dotted globe with atmosphere and a misty accretion ring, orbit rings and the
// illustrative NASA Satellite Kit assembly travelling along one orbit.
const canvas = document.getElementById('space-canvas');
const hero = document.querySelector('.hero');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const shared = (window.__beacon ||= { hero: 0 });

function createScene() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0x05070d, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 200);
  camera.position.set(0, 0, 10);
  const sunDir = new THREE.Vector3(-0.75, 0.55, 0.45).normalize();

  // Stars
  const starCount = 2600;
  const starPos = new Float32Array(starCount * 3), starSeed = new Float32Array(starCount), starSize = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    const u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2, r = 40 + Math.random() * 40, s = Math.sqrt(1 - u * u);
    starPos.set([Math.cos(t) * s * r, u * r, Math.sin(t) * s * r - 20], i * 3);
    starSeed[i] = Math.random() * 100;
    starSize[i] = Math.random() < .06 ? 2.6 : .7 + Math.random() * 1.3;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('seed', new THREE.BufferAttribute(starSeed, 1));
  starGeo.setAttribute('size', new THREE.BufferAttribute(starSize, 1));
  const starMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPixel: { value: renderer.getPixelRatio() } },
    vertexShader: `attribute float seed; attribute float size; uniform float uTime; uniform float uPixel; varying float vAlpha;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mv;
        vAlpha = .35 + .65 * (.5 + .5 * sin(uTime * (.4 + fract(seed) * 1.2) + seed));
        gl_PointSize = size * uPixel; }`,
    fragmentShader: `varying float vAlpha; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard;
        gl_FragColor = vec4(vec3(.86,.9,1.), vAlpha * smoothstep(.5, .0, d)); }`,
    transparent: true, depthWrite: false
  });
  scene.add(new THREE.Points(starGeo, starMat));

  // Globe
  const globe = new THREE.Group();
  scene.add(globe);
  const R = 2.2;
  const occluder = new THREE.Mesh(new THREE.SphereGeometry(R * .985, 64, 64), new THREE.ShaderMaterial({
    uniforms: { uSun: { value: sunDir } },
    vertexShader: `varying vec3 vN; void main(){ vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `uniform vec3 uSun; varying vec3 vN; void main(){ float l = max(dot(vN, uSun), 0.);
        gl_FragColor = vec4(mix(vec3(.012,.02,.05), vec3(.04,.09,.24), pow(l, 1.4)), 1.); }`
  }));
  globe.add(occluder);

  const dotCount = 16000;
  const dotPos = new Float32Array(dotCount * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < dotCount; i++) {
    const y = 1 - (i / (dotCount - 1)) * 2, rad = Math.sqrt(1 - y * y), th = golden * i;
    dotPos.set([Math.cos(th) * rad * R, y * R, Math.sin(th) * rad * R], i * 3);
  }
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPos, 3));
  const dotMat = new THREE.ShaderMaterial({
    uniforms: { uSun: { value: sunDir }, uPixel: { value: renderer.getPixelRatio() } },
    vertexShader: `uniform vec3 uSun; uniform float uPixel; varying float vLight; varying float vRim;
      void main(){ vec3 n = normalize(mat3(modelMatrix) * position); vec4 mv = modelViewMatrix * vec4(position,1.);
        vec3 viewN = normalize(normalMatrix * position); vRim = 1. - abs(viewN.z);
        vLight = max(dot(n, uSun), 0.); gl_Position = projectionMatrix * mv; gl_PointSize = (1.4 + vLight * 1.1) * uPixel * (10. / -mv.z); }`,
    fragmentShader: `varying float vLight; varying float vRim; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard;
        vec3 c = mix(vec3(.16,.3,.75), vec3(.62,.76,1.), pow(vLight, 1.6));
        float a = (.28 + .72 * vLight + vRim * .4) * smoothstep(.5, .15, d);
        gl_FragColor = vec4(c, a); }`,
    transparent: true, depthWrite: false
  });
  globe.add(new THREE.Points(dotGeo, dotMat));

  const atmosphere = (scale, side, power, strength) => new THREE.Mesh(new THREE.SphereGeometry(R * scale, 64, 64), new THREE.ShaderMaterial({
    uniforms: { uSun: { value: sunDir } },
    vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(normalMatrix * normal); vW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `uniform vec3 uSun; varying vec3 vN; varying vec3 vW; void main(){
        float f = pow(${side === THREE.BackSide ? '.72 - dot(vN, vec3(0,0,1.))' : '1. - abs(dot(vN, vec3(0,0,1.)))'}, ${power.toFixed(1)});
        float lit = .25 + .75 * smoothstep(-.4, .7, dot(vW, uSun));
        gl_FragColor = vec4(vec3(.35,.55,1.) * f * lit * ${strength.toFixed(2)}, 1.); }`,
    side, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
  }));
  globe.add(atmosphere(1.0, THREE.FrontSide, 4.5, .3));
  globe.add(atmosphere(1.1, THREE.BackSide, 4.0, .38));

  // Accretion ring: misty gas bands wrapping the globe nearly edge-on, plus a faint particle swirl.
  // Depth testing against the globe hides the far half, so the ring reads as passing behind it.
  const ringFx = new THREE.Group();
  ringFx.rotation.set(1.32, .12, .38);
  scene.add(ringFx);
  const fbm = `float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vnoise(vec2 p, float per){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      float x0 = mod(i.x, per), x1 = mod(i.x + 1., per);
      return mix(mix(hash(vec2(x0, i.y)), hash(vec2(x1, i.y)), f.x), mix(hash(vec2(x0, i.y + 1.)), hash(vec2(x1, i.y + 1.)), f.x), f.y); }
    float fbm(vec2 p, float per){ float v = 0., a = .5; for (int i = 0; i < 4; i++) { v += a * vnoise(p, per); p *= 2.; per *= 2.; a *= .5; } return v; }`;
  const gasLayer = (outer, gain, speed) => {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: `uniform float uTime; varying vec3 vP; ${fbm}
        void main(){ float r = length(vP.xy) / ${R.toFixed(2)}, a = atan(vP.y, vP.x);
          float band = smoothstep(1., 1.18, r) * (1. - smoothstep(1.45, ${outer.toFixed(2)}, r));
          // Angle is wrapped onto a periodic noise lattice so there is no seam; inner gas moves faster.
          float x = (a / 6.2831853 + .5) * 16. + uTime * ${speed.toFixed(2)} / (r * r) + r * 3.;
          float streaks = smoothstep(.2, .85, fbm(vec2(x, r * 5.), 16.));
          float lit = .35 + .65 * pow(.5 + .5 * cos(a - 2.6), 2.);
          vec3 c = mix(vec3(.45,.6,1.), vec3(.92,.95,1.), smoothstep(1.05, 1.35, r) * streaks);
          gl_FragColor = vec4(c * band * (.35 + .65 * streaks) * lit * ${gain.toFixed(2)}, 1.); }`,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
    });
    return new THREE.Mesh(new THREE.RingGeometry(R, R * 3, 256, 8), mat);
  };
  const gasMain = gasLayer(3., .55, 1.6);
  const gasThin = gasLayer(2.2, .3, 1.1);
  gasThin.rotation.set(.06, -.05, .4);
  ringFx.add(gasMain, gasThin);

  const swirlCount = 5000;
  const swirlRadius = new Float32Array(swirlCount), swirlAngle = new Float32Array(swirlCount), swirlSeed = new Float32Array(swirlCount);
  for (let i = 0; i < swirlCount; i++) {
    swirlRadius[i] = R * (1.15 + Math.pow(Math.random(), 1.6) * 1.45);
    swirlAngle[i] = Math.random() * Math.PI * 2;
    swirlSeed[i] = Math.random();
  }
  const swirlGeo = new THREE.BufferGeometry();
  swirlGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(swirlCount * 3), 3));
  swirlGeo.setAttribute('radius', new THREE.BufferAttribute(swirlRadius, 1));
  swirlGeo.setAttribute('angle', new THREE.BufferAttribute(swirlAngle, 1));
  swirlGeo.setAttribute('seed', new THREE.BufferAttribute(swirlSeed, 1));
  const swirlMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPixel: { value: renderer.getPixelRatio() } },
    vertexShader: `attribute float radius; attribute float angle; attribute float seed; uniform float uTime; uniform float uPixel; varying float vAlpha;
      void main(){ float k = radius / ${R.toFixed(2)}; float a = angle + uTime * .55 / pow(k, 1.5);
        vec3 p = vec3(cos(a) * radius, sin(a) * radius, (seed - .5) * .08 * k);
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        vAlpha = (.25 + .75 * pow(.5 + .5 * cos(a - 2.6), 2.)) * (1. - smoothstep(2.1, 2.6, k));
        gl_PointSize = (.6 + seed * .9) * uPixel * (10. / -mv.z); }`,
    fragmentShader: `varying float vAlpha; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard;
        gl_FragColor = vec4(vec3(.75,.84,1.), vAlpha * .55 * smoothstep(.5, .1, d)); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const swirl = new THREE.Points(swirlGeo, swirlMat);
  swirl.frustumCulled = false;
  ringFx.add(swirl);

  // Orbit rings
  const ringGroup = new THREE.Group();
  ringGroup.rotation.set(1.22, 0, -.32);
  globe.add(ringGroup);
  const ringMat = new THREE.LineBasicMaterial({ color: 0x8fb0ff, transparent: true, opacity: .2 });
  const orbit = new THREE.EllipseCurve(0, 0, 3.4, 3.4);
  for (const radius of [3.4, 4.3]) {
    const pts = new THREE.EllipseCurve(0, 0, radius, radius).getPoints(256).map(p => new THREE.Vector3(p.x, p.y, 0));
    ringGroup.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), ringMat));
  }

  scene.add(new THREE.AmbientLight(0x9fb4e0, .7));
  const sun = new THREE.DirectionalLight(0xfff4e6, 3.2);
  sun.position.copy(sunDir).multiplyScalar(10);
  scene.add(sun);

  const satellite = new THREE.Group();
  ringGroup.add(satellite);

  let width = 1, height = 1, mobile = false, time = 0, last = performance.now(), frameId, running = true, pointerX = 0, pointerY = 0;
  function layout() {
    const rect = hero.getBoundingClientRect();
    width = rect.width; height = rect.height; mobile = width <= 860;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  function place(progress) {
    // Keep the globe right of the copy on desktop and above it on phones.
    const halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;
    // The globe holds its place while the light page slides over it, so it never jumps out of view.
    if (mobile) { globe.position.set(halfW * .45, 2.1, -1); globe.scale.setScalar(.7); }
    else { globe.position.set(halfW * .56, -.1, 0); globe.scale.setScalar(.78 - progress * .04); }
    ringFx.position.copy(globe.position);
    ringFx.scale.setScalar(globe.scale.x);
  }
  function render() { renderer.render(scene, camera); }
  function frame(now) {
    const dt = Math.min((now - last) / 1000, .05); last = now;
    const visible = shared.hero < .999 && !document.hidden;
    if (visible) {
      time += dt;
      const p = shared.hero;
      starMat.uniforms.uTime.value = time;
      // Scrolling speeds the swirl up slightly.
      const swirlTime = time + p * 4;
      gasMain.material.uniforms.uTime.value = swirlTime;
      gasThin.material.uniforms.uTime.value = swirlTime * .7;
      swirlMat.uniforms.uTime.value = swirlTime;
      globe.rotation.y = time * .045 + p * 1.2;
      globe.rotation.x += ((pointerY * .08) - globe.rotation.x) * .04;
      scene.rotation.y += ((pointerX * .04) - scene.rotation.y) * .04;
      const a = time * .16 + 1.3;
      const pos = orbit.getPoint((a / (Math.PI * 2)) % 1);
      satellite.position.set(pos.x, pos.y, 0);
      satellite.rotation.set(time * .3, time * .2, a + Math.PI / 2);
      place(p);
      render();
    }
    frameId = running ? requestAnimationFrame(frame) : 0;
  }

  new ResizeObserver(() => { layout(); place(shared.hero); render(); }).observe(hero);
  layout(); place(0);
  addEventListener('pointermove', e => { pointerX = e.clientX / innerWidth - .5; pointerY = e.clientY / innerHeight - .5; }, { passive: true });

  function start() { if (!running) { running = true; last = performance.now(); frameId = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(frameId); }
  if (reduced.matches) { running = false; satellite.position.set(orbit.getPoint(.2).x, orbit.getPoint(.2).y, 0); render(); }
  else frameId = requestAnimationFrame(frame);
  reduced.addEventListener('change', e => { if (e.matches) { stop(); render(); } else start(); });
  addEventListener('beacon:scroll', () => { if (reduced.matches) { place(shared.hero); render(); } });

  document.documentElement.classList.add('scene-ready');
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); stop(); document.documentElement.classList.remove('scene-ready'); });

  loadSatellite(satellite).then(render).catch(error => console.warn('Satellite model unavailable:', error.message));
}

async function loadSatellite(group) {
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath(new URL('./assets/draco/', import.meta.url).href);
  loader.setDRACOLoader(draco);
  const [body, wings, radio] = await Promise.all(['body-3', 'wings-2', 'radio-2'].map(name => loader.loadAsync(`./assets/satellite-kit/${name}.glb`)));
  draco.dispose();
  const foil = new THREE.MeshStandardMaterial({ color: 0xc9a86a, metalness: .85, roughness: .35 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xc4cad0, metalness: .9, roughness: .3 });
  const panel = new THREE.MeshStandardMaterial({ color: 0x2d4f86, metalness: .4, roughness: .45, emissive: 0x0b1d3d, emissiveIntensity: .5 });
  const dish = new THREE.MeshStandardMaterial({ color: 0xe4e7ea, metalness: .3, roughness: .35, side: THREE.DoubleSide });
  function prepare(model, axis, target) {
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    const inner = new THREE.Group(); inner.add(model); model.position.sub(center); inner.scale.setScalar(target / size[axis]);
    const outer = new THREE.Group(); outer.add(inner); return outer;
  }
  const b = prepare(body.scene, 'y', 1.65); b.scale.set(1.6, 1, 1.6);
  b.traverse(m => { if (m.isMesh) m.material = foil; });
  const w = prepare(wings.scene, 'x', 6.35); w.rotation.x = .95;
  w.traverse(m => { if (m.isMesh) m.material = /SolarPanels|lambert/.test(m.material.name) ? panel : metal; });
  const r = prepare(radio.scene, 'x', 1.55); r.position.set(0, .58, .45);
  r.traverse(m => { if (m.isMesh) m.material = /Dish/.test(m.material.name) ? dish : metal; });
  const assembly = new THREE.Group();
  assembly.add(b, w, r);
  assembly.scale.setScalar(.22);
  group.add(assembly);
}

try { createScene(); }
catch (error) { console.warn('Using the static hero illustration:', error.message); }
