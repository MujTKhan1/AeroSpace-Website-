import * as THREE from './assets/three.module.js';
import { GLTFLoader } from './assets/GLTFLoader.js';
import { DRACOLoader } from './assets/DRACOLoader.js';
import { RoomEnvironment } from './assets/RoomEnvironment.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const shared = (window.__beacon ||= { hero: 0 });
const state = { paused: reduced.matches, discipline: 0, explosion: 0, revision: 1, signal: 1, antennaVisible: true };
const scenes = [];
const SATELLITE_DISPLAY_SCALE = .9;
// Widest the normalised satellite gets at any rotation; narrow stages keep this 5% side margin however it is turned.
const SATELLITE_ROTATED_SPAN = 1.05, SATELLITE_SIDE_MARGIN = .05;
// NASA's SSL-1300 file is one mesh in local units (solar arrays along x, reflectors beyond the bus on ±y).
const BUS_HALF_WIDTH = 19, REFLECTOR_MIN_Y = 15.5;
// Gap build-up: the scroll range (of the trace's progress) over which each part turns from drawing to hardware.
// Reflectors with the controlled drawing, the bus with the bill of materials, its fittings with the software
// and interface steps, and the solar arrays last, as the record reaches Rev B.
const GAP_BUILD = { dish: [.04, .3], bus: [.26, .52], fitting: [.5, .8], array: [.72, .98] };
let modelPromise, recordsTimeline;
function loadSpacecraft() {
  if (!modelPromise) {
    const draco = new DRACOLoader().setDecoderPath(new URL('./assets/draco/', import.meta.url).href);
    modelPromise = new GLTFLoader().setDRACOLoader(draco).loadAsync('./assets/ssl-1300/SSL-1300.glb').then(gltf => { draco.dispose(); return gltf.scene; });
  }
  return modelPromise;
}

// Rebuild the supplied geometry with only the triangles that pass `keep`, splitting the side reflectors
// into their own `dish_` meshes so the exhibits can move or outline them separately from the bus.
function partition(source, keep) {
  const group = new THREE.Group();
  source.updateMatrixWorld(true);
  source.traverse(mesh => {
    if (!mesh.isMesh) return;
    const position = mesh.geometry.attributes.position, index = mesh.geometry.index;
    const parts = { bus: [], 1: [], '-1': [] }, count = index ? index.count : position.count;
    for (let i = 0; i < count; i += 3) {
      const triangle = [0, 1, 2].map(j => index ? index.getX(i + j) : i + j);
      if (!triangle.every(j => keep(position, j))) continue;
      const side = triangle.every(j => position.getY(j) > REFLECTOR_MIN_Y) ? 1 : triangle.every(j => position.getY(j) < -REFLECTOR_MIN_Y) ? -1 : 'bus';
      parts[side].push(...triangle);
    }
    for (const [part, kept] of Object.entries(parts)) {
      if (!kept.length) continue;
      const indexed = mesh.geometry.clone(); indexed.setIndex(kept); indexed.clearGroups();
      const geometry = indexed.toNonIndexed(); indexed.dispose();
      geometry.computeBoundingBox(); geometry.computeBoundingSphere();
      const clone = new THREE.Mesh(geometry, mesh.material);
      clone.name = part === 'bus' ? mesh.name : `dish_${mesh.name}`;
      clone.applyMatrix4(mesh.matrixWorld);
      // Reflectors on either side separate outwards, away from the bus.
      if (part !== 'bus') clone.userData.outward = new THREE.Vector3(0, Number(part), 0).applyQuaternion(clone.quaternion);
      group.add(clone);
    }
  });
  return group;
}

function normalise(object) {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const dimension = Math.max(...box.getSize(new THREE.Vector3()).toArray());
  object.position.sub(box.getCenter(new THREE.Vector3()));
  const group = new THREE.Group(); group.add(object); group.scale.setScalar(1 / dimension);
  const wrapper = new THREE.Group(); wrapper.add(group);
  return wrapper;
}
function antennaFrom(source) {
  // Isolate the communications bus and its reflectors from NASA's supplied geometry, removing only
  // the long solar-array and yoke triangles beyond the bus.
  return normalise(partition(source, (position, j) => Math.abs(position.getX(j)) < BUS_HALF_WIDTH));
}

async function createExhibit(stage) {
  let renderer;
  try {
    const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true');
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture; scene.environmentIntensity = .8;
    pmrem.dispose(); room.dispose();
    scene.add(new THREE.AmbientLight(0xffffff, .5));
    const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(4, 8, 5); scene.add(key);
    const fill = new THREE.DirectionalLight(0xd8e7f2, 1.3); fill.position.set(-6, 1, 4); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 2); rim.position.set(0, 5, -5); scene.add(rim);
    const camera = new THREE.OrthographicCamera(-6, 6, 3, -3, .1, 100);
    camera.position.set(0, 4, 12); camera.lookAt(0, 0, 0);
    const source = await loadSpacecraft();
    let subject, ghost, rings, paths = [], pulses = [], dishes = [], fades = [], highlights = [];
    const type = stage.dataset.model;
    if (type === 'gap') {
      // The satellite starts as a line drawing and becomes hardware part by part as the engineering record
      // fills. Solid parts sit on their own material copies so the other exhibits are untouched.
      subject = normalise(partition(source, () => true)); scene.add(subject);
      const lines = new THREE.LineBasicMaterial({ color: 0x1f7ea1, transparent: true, opacity: .5 });
      subject.traverse(mesh => {
        if (!mesh.isMesh) return;
        const name = mesh.material.name;
        const part = /^dish_/.test(mesh.name) ? 'dish' : /SolarPanel(?!-Bracket)/.test(name) ? 'array' : /Bracket|SensorNips|MainBoxDetail|Stereo|Gold/.test(name) ? 'fitting' : 'bus';
        mesh.material = mesh.material.clone();
        const edge = lines.clone();
        mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 40), edge));
        // The arrays' many cell edges would read as a solid block, so their lines are lighter.
        highlights.push({ range: GAP_BUILD[part], material: mesh.material, edge, ink: part === 'array' ? .16 : .55 });
      });
    } else if (type === 'spacecraft') {
      const model = partition(source, () => true);
      subject = normalise(model); scene.add(subject);
      model.traverse(mesh => { if (mesh.isMesh && /^dish_/.test(mesh.name)) dishes.push({ mesh, base: mesh.position.clone() }); });
      rings = new THREE.Group();
      for (let i = 0; i < 2; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(2.5 + i * .4, .006, 5, 180), new THREE.MeshBasicMaterial({ color: 0x6493a3, transparent: true, opacity: .22 }));
        ring.rotation.set(.8 + i * .5, .5 + i, .2); rings.add(ring);
      }
      scene.add(rings);
    } else if (type === 'antenna') {
      subject = antennaFrom(source); subject.scale.setScalar(3.8); scene.add(subject);
      ghost = antennaFrom(source); ghost.scale.setScalar(3.1); scene.add(ghost);
      ghost.traverse(mesh => {
        if (!mesh.isMesh) return;
        mesh.material = new THREE.MeshStandardMaterial({ color: 0x9ba6ad, transparent: true, opacity: .14, roughness: .8, depthWrite: false });
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 32), new THREE.LineBasicMaterial({ color: 0x80929d, transparent: true, opacity: .24 })); mesh.add(edges);
      });
      subject.traverse(mesh => {
        if (!mesh.isMesh) return;
        // Rev B fades in on its own material copies, so the other exhibits sharing NASA's materials are untouched.
        mesh.material = mesh.material.clone();
        fades.push({ material: mesh.material, opacity: mesh.material.opacity, transparent: mesh.material.transparent });
        if (!/^dish_/.test(mesh.name)) return;
        const edge = new THREE.LineBasicMaterial({ color: 0xc48b3f, transparent: true, opacity: .5 });
        fades.push({ material: edge, opacity: .5, transparent: true });
        mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 45), edge));
      });
    } else {
      subject = antennaFrom(source); scene.add(subject);
    }
    let width = 1, height = 1, viewWidth = 12, visible = false, frameId = 0, time = 0, last = performance.now(), pointerX = 0, drag = 0, dragStart;
    function clearPaths() {
      for (const line of paths) { scene.remove(line); line.geometry.dispose(); line.material.dispose(); }
      for (const pulse of pulses) { scene.remove(pulse); pulse.geometry.dispose(); pulse.material.dispose(); }
      paths = []; pulses = [];
    }
    function layout() {
      const rect = stage.getBoundingClientRect(); width = rect.width; height = rect.height;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      const aspect = width / height; viewWidth = aspect * 6;
      camera.left = -viewWidth / 2; camera.right = viewWidth / 2; camera.updateProjectionMatrix();
      if (type === 'spacecraft') subject.scale.setScalar(Math.min(Math.min(viewWidth * (innerWidth < 581 ? .82 : 1.02), 10.8) * SATELLITE_DISPLAY_SCALE, viewWidth * (1 - SATELLITE_SIDE_MARGIN * 2) / SATELLITE_ROTATED_SPAN));
      if (type === 'antenna') { subject.scale.setScalar(Math.min(viewWidth * .57, 3.8)); ghost.scale.setScalar(Math.min(viewWidth * .47, 3.1)); }
      // The arrays may run past the stage edges so the bus and its reflectors read at a useful size.
      if (type === 'gap') subject.scale.setScalar(Math.min(viewWidth * 1.35, 11));
      if (type === 'signal') {
        const phone = innerWidth < 581;
        subject.position.set(phone ? 0 : -viewWidth * .34, .1, 0); subject.scale.setScalar(phone ? 3.2 : 3.4);
        clearPaths();
        if (!phone) {
          const start = new THREE.Vector3(-viewWidth * .27, .3, .4);
          // The connectors end at the assembled records, so measure them there and put the scroll state back.
          const progress = recordsTimeline?.progress();
          recordsTimeline?.progress(1, true);
          document.querySelectorAll('.record-sheet').forEach((sheet, i) => {
            const r = sheet.getBoundingClientRect();
            const x = ((r.left + r.width * .12 - rect.left) / width - .5) * viewWidth;
            const y = (.5 - (r.top + r.height * .45 - rect.top) / height) * 6;
            const end = new THREE.Vector3(x, y, .4);
            const curve = new THREE.CubicBezierCurve3(start, start.clone().add(new THREE.Vector3(1.2, .7 - i * .55, 0)), end.clone().add(new THREE.Vector3(-1, .4, 0)), end);
            const mat = new THREE.ShaderMaterial({
              uniforms: { uReveal: { value: 1 }, uColor: { value: new THREE.Color(i === 0 ? 0xe4b071 : 0x78bdd3) } },
              vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
              fragmentShader: 'varying vec2 vUv; uniform float uReveal; uniform vec3 uColor; void main(){if(vUv.x>uReveal)discard;gl_FragColor=vec4(uColor,.75);}', transparent: true, depthWrite: false
            });
            const line = new THREE.Mesh(new THREE.TubeGeometry(curve, 70, .008, 5, false), mat); line.userData.curve = curve; paths.push(line); scene.add(line);
            const pulse = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 10), new THREE.MeshBasicMaterial({ color: i === 0 ? 0xffc586 : 0x9edcf0 })); pulses.push(pulse); scene.add(pulse);
          });
          recordsTimeline?.progress(progress, true);
        }
      }
      draw();
    }
    function draw() {
      if (type === 'gap') {
        // Without the scroll timeline (reduced motion, no GSAP) the exhibit shows the finished satellite.
        const progress = shared.gap ?? 1;
        highlights.forEach(({ range, material, edge, ink }) => {
          const built = THREE.MathUtils.smoothstep(progress, range[0], range[1]);
          const solid = built > .99;
          if (material.transparent === solid) { material.transparent = !solid; material.needsUpdate = true; }
          material.opacity = built; material.depthWrite = solid; material.visible = built > .01;
          edge.opacity = ink * (1 - built) + .03;
        });
        subject.rotation.set(.3, -.62 + Math.sin(time * .2) * .04 + progress * .12, -.1);
      } else if (type === 'spacecraft') {
        subject.rotation.set(.04, -.35 + Math.sin(time * .14) * .08 + state.discipline * .4 + pointerX * .07 + drag, -.10);
        subject.position.y = Math.sin(time * .45) * .035;
        dishes.forEach(({ mesh, base }) => { mesh.position.copy(base).addScaledVector(mesh.userData.outward, state.explosion * 14); });
        rings.rotation.y = time * .03; rings.rotation.z = state.discipline * .25;
      } else if (type === 'antenna') {
        subject.position.set(.65 + state.revision * .2, -.12, .25);
        subject.rotation.y = -.48 + Math.sin(time * .15) * .025;
        subject.visible = state.revision > .02;
        const reveal = THREE.MathUtils.smoothstep(state.revision, .02, .55);
        fades.forEach(fade => {
          const transparent = fade.transparent || reveal < 1;
          if (fade.material.transparent !== transparent) { fade.material.transparent = transparent; fade.material.needsUpdate = true; }
          fade.material.opacity = fade.opacity * reveal;
        });
        ghost.position.set(-1.4 * state.revision, .4 * state.revision, -.7);
        ghost.rotation.y = -.48;
        ghost.traverse(mesh => { if (mesh.isMesh) mesh.material.opacity = 1 - state.revision * .88; });
      } else {
        subject.rotation.set(0, -.7 + Math.sin(time * .12) * .08, .04);
        paths.forEach((path, i) => {
          path.material.uniforms.uReveal.value = Math.max(0, Math.min(1, state.signal * 1.4 - i * .15));
          const p = (time * .15 + i * .27) % 1;
          pulses[i].position.copy(path.userData.curve.getPoint(p)); pulses[i].visible = p < path.material.uniforms.uReveal.value;
        });
      }
      renderer.render(scene, camera);
    }
    function frame(now) {
      frameId = 0;
      if (!visible || document.hidden || state.paused || (type === 'antenna' && !state.antennaVisible)) return;
      time += Math.min((now - last) / 1000, .05); last = now;
      draw(); frameId = requestAnimationFrame(frame);
    }
    function update() {
      const showing = visible && (type !== 'antenna' || state.antennaVisible);
      if (showing && !document.hidden && !state.paused && !frameId) { last = performance.now(); frameId = requestAnimationFrame(frame); }
      if ((!showing || document.hidden || state.paused) && frameId) { cancelAnimationFrame(frameId); frameId = 0; }
      if (showing && !document.hidden) draw();
    }
    stage.prepend(canvas); stage.classList.add('model-ready');
    new ResizeObserver(layout).observe(stage);
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { rootMargin: '80px' }).observe(stage);
    document.addEventListener('visibilitychange', update);
    if (type === 'gap') addEventListener('beacon:gap', update);
    if (type === 'spacecraft') {
      canvas.style.touchAction = 'pan-y';
      canvas.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); pointerX = (e.clientX - r.left) / r.width - .5; if (dragStart !== undefined) { drag += (e.clientX - dragStart) * .006; dragStart = e.clientX; } if (state.paused) draw(); });
      canvas.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') { dragStart = e.clientX; canvas.setPointerCapture(e.pointerId); } });
      canvas.addEventListener('pointerup', () => { dragStart = undefined; });
      canvas.addEventListener('pointercancel', () => { dragStart = undefined; });
    }
    scenes.push({ update, layout }); layout();
  } catch (error) {
    renderer?.dispose();
    console.warn('Engineering exhibit keeps its static reference:', error.message);
    stage.classList.add('model-unavailable');
  }
}

const nearby = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  nearby.unobserve(entry.target); createExhibit(entry.target);
}), { rootMargin: '700px' });
document.querySelectorAll('[data-model]').forEach(stage => nearby.observe(stage));

function refreshScenes() { scenes.forEach(scene => scene.update()); }
const motionButton = document.querySelector('.motion-control');
function updateMotion() {
  motionButton.setAttribute('aria-pressed', String(state.paused));
  motionButton.textContent = state.paused ? 'Play 3D motion' : 'Pause 3D motion';
  refreshScenes();
}
motionButton.addEventListener('click', () => { state.paused = !state.paused; updateMotion(); });
reduced.addEventListener('change', () => { state.paused = reduced.matches; updateMotion(); });
updateMotion();
const disciplines = [...document.querySelectorAll('.discipline')];
disciplines.forEach((button, i) => button.addEventListener('click', () => {
  state.discipline = i;
  disciplines.forEach((item, j) => { item.classList.toggle('is-active', j === i); item.setAttribute('aria-pressed', String(j === i)); });
  document.getElementById('discipline-status').textContent = `${String(i + 1).padStart(2, '0')} / ${button.querySelector('h3').innerText.replace(/\s+/g, ' ')}`;
  if (window.gsap && !reduced.matches) gsap.fromTo(state, { explosion: 0 }, { explosion: .55, duration: .7, repeat: 1, yoyo: true, ease: 'power2.inOut', onUpdate: refreshScenes });
  refreshScenes();
}));
// Scroll owns the revision: the Rev A / Rev B indicator only reports where the animation has reached.
const revisionSteps = [...document.querySelectorAll('[data-revision]')];
function syncRevision() {
  const proposed = state.revision >= .5;
  revisionSteps.forEach(step => {
    const active = (step.dataset.revision === 'proposed') === proposed;
    step.classList.toggle('is-active', active);
    if (active) step.setAttribute('aria-current', 'step'); else step.removeAttribute('aria-current');
  });
  refreshScenes();
}

function scrollToPosition(top) {
  if (shared.lenis) shared.lenis.scrollTo(top, { duration: 1.5, offset: 0 });
  else window.scrollTo({ top, behavior: reduced.matches ? 'auto' : 'smooth' });
}
let changeTrigger;
document.querySelector('.scene-next').addEventListener('click', () => {
  if (changeTrigger) scrollToPosition(changeTrigger.start + (changeTrigger.end - changeTrigger.start) * .97);
  else document.getElementById('evidence').scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
});
document.querySelector('.scene-back').addEventListener('click', () => changeTrigger && scrollToPosition(changeTrigger.start + 12));
function setupMotion() {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  // A refresh restores saved progress silently at its end, so bring the indicator back in line afterwards.
  ScrollTrigger.addEventListener('refresh', () => setTimeout(syncRevision, 0));
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.fromTo(state, { explosion: 0 }, { explosion: .85, ease: 'none', onUpdate: refreshScenes, scrollTrigger: { trigger: '.spacecraft-exhibit', start: 'top 78%', end: 'bottom 30%', scrub: .8 } });
    gsap.from('.specimen-label', { opacity: 0, duration: 1.1, stagger: .15, scrollTrigger: { trigger: '.spacecraft-exhibit', start: 'top 65%' } });
    gsap.from('.discipline', { opacity: 0, duration: .9, stagger: .1, scrollTrigger: { trigger: '.discipline-grid', start: 'top 88%' } });
    // One scrubbed timeline for the records and connectors: it finishes with the diagram on screen, leaves
    // them assembled while the section is read, and runs backwards and forwards on every pass.
    recordsTimeline = gsap.timeline({ onUpdate: refreshScenes, scrollTrigger: { trigger: '.signal-diagram', start: 'top 85%', end: 'center 52%', scrub: .7, onRefresh: () => scenes.forEach(scene => scene.layout()) } })
      .from('.record-sheet', { opacity: 0, rotationY: -65, x: 45, duration: .62, stagger: .19, ease: 'power3.out' }, 0)
      .fromTo(state, { signal: 0 }, { signal: 1, duration: 1, ease: 'none' }, 0);
    return () => { recordsTimeline = undefined; state.signal = 1; refreshScenes(); };
  });
  // Phones and tablets have no pin, so the revision change plays as the illustration crosses the screen.
  media.add('(max-width: 899px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.fromTo(state, { revision: 0 }, { revision: 1, ease: 'none', onUpdate: syncRevision, scrollTrigger: { trigger: '.antenna-exhibit', start: 'top 72%', end: 'bottom 48%', scrub: .6 } });
    syncRevision();
    return () => { state.revision = 1; syncRevision(); };
  });
  media.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
    const stage = document.querySelector('.chapter-stage'); stage.classList.add('is-cinematic');
    const evidence = document.querySelector('.evidence-panel');
    gsap.set(evidence, { autoAlpha: 0 }); evidence.inert = true;
    gsap.set('.scene-back', { autoAlpha: 0 });
    // Phases, in timeline time: read Rev A, scrub to Rev B, hold the comparison, then the evidence transition.
    // That transition keeps its own timings and scroll length, shifted to start after the hold.
    const revisionStart = .05, revisionEnd = .29, evidenceStart = .37;
    const at = time => time - .19 + evidenceStart;
    const total = at(1);
    const sequence = gsap.timeline({
      // Timeline time, not scroll progress: scrub trails the scroll, and these states must follow what is on screen.
      onUpdate: () => {
        syncRevision();
        const showEvidence = sequence.time() >= at(.47);
        evidence.inert = !showEvidence; document.querySelector('.change-panel').inert = showEvidence;
        document.querySelector('.chapter-current').textContent = showEvidence ? '04' : '03';
        if (state.antennaVisible === showEvidence) { state.antennaVisible = !showEvidence; refreshScenes(); }
      },
      scrollTrigger: { trigger: '.change-story', start: 'top 64px', end: () => `+=${innerHeight * 2.55 * total}`, pin: stage, scrub: .9, invalidateOnRefresh: true, refreshPriority: 2 }
    });
    changeTrigger = sequence.scrollTrigger;
    sequence.fromTo(state, { revision: 0 }, { revision: 1, duration: revisionEnd - revisionStart, ease: 'power1.inOut' }, revisionStart)
      .to('.change-panel .chapter-copy', { autoAlpha: 0, filter: 'blur(6px)', duration: .19, ease: 'power2.in' }, at(.19))
      .to('.change-visual', { autoAlpha: 0, scale: .87, filter: 'blur(8px)', duration: .24, ease: 'power2.inOut' }, at(.25))
      .to(evidence, { autoAlpha: 1, duration: .03 }, at(.46))
      .fromTo('.sheet-source', { x: 120, y: 130, rotation: 16, rotationX: 45, autoAlpha: 0 }, { x: -80, y: 10, rotation: -15, rotationX: 12, autoAlpha: 1, duration: .28, ease: 'power3.out' }, at(.46))
      .fromTo('.sheet-compare', { x: 150, y: 110, rotation: 22, rotationX: 50, autoAlpha: 0 }, { x: -30, y: -20, rotation: -5, rotationX: 12, autoAlpha: 1, duration: .29, ease: 'power3.out' }, at(.50))
      .fromTo('.sheet-digest', { x: 200, y: 100, rotation: 28, rotationX: 55, autoAlpha: 0 }, { x: 32, y: 16, rotation: 8, rotationX: 12, autoAlpha: 1, duration: .30, ease: 'power3.out' }, at(.54))
      .fromTo('.evidence-heading', { autoAlpha: 0, clipPath: 'inset(0 0 100% 0)' }, { autoAlpha: 1, clipPath: 'inset(0 0 0% 0)', duration: .22, ease: 'power2.out' }, at(.57))
      .fromTo('.evidence-panel .eyebrow', { autoAlpha: 0 }, { autoAlpha: 1, duration: .15 }, at(.58))
      .fromTo('.evidence-lede, .evidence-cta, .evidence-note', { autoAlpha: 0 }, { autoAlpha: 1, duration: .18, stagger: .035 }, at(.66))
      .fromTo('.sheet-kicker, .paper-title, .sheet-text > *, .sheet-foot', { autoAlpha: 0, y: 9 }, { autoAlpha: 1, y: 0, duration: .15, stagger: .004, ease: 'power2.out' }, at(.69))
      .to('.scene-back', { autoAlpha: 1, duration: .1 }, at(.81))
      .to({}, { duration: .12 }, at(.88))
      .to('.chapter-progress i', { scaleX: 1, duration: total, ease: 'none' }, 0);
    syncRevision();

    return () => { stage.classList.remove('is-cinematic'); evidence.inert = false; document.querySelector('.change-panel').inert = false; state.antennaVisible = true; state.revision = 1; syncRevision(); changeTrigger = undefined; };
  });
  // Refresh the change pin before the preserved footer's contact pin.
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}
if (document.readyState === 'complete') setupMotion();
else addEventListener('load', setupMotion, { once: true });
