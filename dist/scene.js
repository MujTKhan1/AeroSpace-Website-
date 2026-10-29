import * as THREE from './assets/three.module.js';

const canvas = document.getElementById('space-canvas');
const stage = canvas.parentElement;
const motionButton = document.getElementById('motion-toggle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reduced.matches;
let dragging = false;
let renderer;

try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 90);
  camera.position.set(0, .1, 10.5);

  let seed = 1579;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const envCanvas = document.createElement('canvas'); envCanvas.width = 1024; envCanvas.height = 512;
  const ec = envCanvas.getContext('2d');
  const eg = ec.createLinearGradient(0, 0, 0, 512); eg.addColorStop(0, '#8c9f91'); eg.addColorStop(.4, '#344139'); eg.addColorStop(.52, '#101712'); eg.addColorStop(1, '#25362b'); ec.fillStyle = eg; ec.fillRect(0, 0, 1024, 512);
  const glow = ec.createRadialGradient(270, 110, 5, 270, 110, 240); glow.addColorStop(0, '#ffffff'); glow.addColorStop(.15, '#e9f3e5'); glow.addColorStop(.4, '#91a797'); glow.addColorStop(1, '#91a79700'); ec.fillStyle = glow; ec.fillRect(0, 0, 700, 420);
  ec.fillStyle = '#e1e9d7'; ec.fillRect(740, 110, 85, 230); ec.fillStyle = '#9faf8b'; ec.fillRect(900, 140, 12, 210);
  const envMap = new THREE.CanvasTexture(envCanvas); envMap.mapping = THREE.EquirectangularReflectionMapping; envMap.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer); const envTarget = pmrem.fromEquirectangular(envMap); scene.environment = envTarget.texture; envMap.dispose(); pmrem.dispose();

  scene.add(new THREE.AmbientLight(0x9cbaa3, 1.35));
  const key = new THREE.DirectionalLight(0xf4f0d9, 4.5); key.position.set(-4, 6, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0xd3edb0, 3); rim.position.set(5, 1, -2); scene.add(rim);
  const fill = new THREE.DirectionalLight(0x90afb3, 1.5); fill.position.set(-6, -2, 4); scene.add(fill);

  const silver = new THREE.MeshStandardMaterial({ color: 0xb8c4bd, metalness: .91, roughness: .26 });
  const graphite = new THREE.MeshStandardMaterial({ color: 0x1a2523, metalness: .8, roughness: .36 });
  const ceramic = new THREE.MeshStandardMaterial({ color: 0xd6dfce, metalness: .48, roughness: .29, side: THREE.DoubleSide });
  const goldCanvas = document.createElement('canvas'); goldCanvas.width = goldCanvas.height = 512;
  const gc = goldCanvas.getContext('2d'); gc.fillStyle = '#9d8753'; gc.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2900; i++) {
    const x = random() * 512, y = random() * 512, size = 4 + random() * 42;
    const shade = Math.floor(35 + random() * 95);
    gc.fillStyle = `rgba(${shade + 80},${shade + 55},${shade},${.15 + random() * .5})`;
    gc.beginPath(); gc.moveTo(x, y); gc.lineTo(x + size, y + random() * size); gc.lineTo(x + random() * size, y + size); gc.closePath(); gc.fill();
    gc.strokeStyle = 'rgba(240,220,144,.17)'; gc.lineWidth = .5; gc.stroke();
  }
  const foilTexture = new THREE.CanvasTexture(goldCanvas); foilTexture.colorSpace = THREE.SRGBColorSpace;
  const gold = new THREE.MeshStandardMaterial({ color: 0xd3bc7e, map: foilTexture, bumpMap: foilTexture, bumpScale: .045, metalness: .85, roughness: .36 });
  const solar = new THREE.MeshPhysicalMaterial({ color: 0x183943, metalness: .82, roughness: .25, clearcoat: .8, clearcoatRoughness: .22 });
  const solarLight = solar.clone(); solarLight.color.set(0x254955);
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x8fa5a0, transparent: true, opacity: .75 });
  function mesh(geometry, material, parent, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geometry, material); m.position.set(x, y, z); parent.add(m); return m; }
  function rod(a, b, radius, mat, parent) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
    const m = mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 8), mat, parent); m.position.copy(start.add(end).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return m;
  }

  const satellite = new THREE.Group(); scene.add(satellite);
  const body = new THREE.Group(); satellite.add(body);
  mesh(new THREE.BoxGeometry(1.1, 1.23, 1.04, 4, 4, 4), gold, body);
  mesh(new THREE.BoxGeometry(1.14, .07, 1.08), silver, body, 0, .64, 0);
  mesh(new THREE.BoxGeometry(1.14, .07, 1.08), silver, body, 0, -.64, 0);
  mesh(new THREE.BoxGeometry(.72, .76, .055), graphite, body, 0, -.02, .54);
  for (const x of [-.49, .49]) mesh(new THREE.BoxGeometry(.055, 1.18, .055), silver, body, x, 0, .54);
  for (let i = 0; i < 8; i++) mesh(new THREE.BoxGeometry(.6, .016, .025), silver, body, .565, -.4 + i * .1, 0).rotation.y = Math.PI / 2;
  const labelCanvas = document.createElement('canvas'); labelCanvas.width = 256; labelCanvas.height = 128;
  const lc = labelCanvas.getContext('2d'); lc.fillStyle = '#c8cdb9'; lc.fillRect(0, 0, 256, 128); lc.fillStyle = '#26372c'; lc.font = 'bold 32px monospace'; lc.fillText('MB / 01', 15, 55); lc.font = '12px monospace'; lc.fillText('MISSION BEACON', 17, 86);
  const labelTex = new THREE.CanvasTexture(labelCanvas); labelTex.colorSpace = THREE.SRGBColorSpace;
  mesh(new THREE.PlaneGeometry(.57, .285), new THREE.MeshStandardMaterial({ map: labelTex, roughness: .6 }), body, -.01, .37, .57);
  for (const x of [-.38, .38]) {
    mesh(new THREE.CylinderGeometry(.13, .18, .24, 16), graphite, body, x, -.79, .12);
    mesh(new THREE.CylinderGeometry(.16, .13, .07, 16), silver, body, x, -.67, .12);
  }
  mesh(new THREE.SphereGeometry(.23, 24, 16), silver, body, -.62, -.17, 0);

  // Parabolic reflector with a separate rim, three feed struts and central receiver.
  const dish = new THREE.Group(); dish.position.set(.07, -.06, .68); dish.rotation.set(-.18, .1, 0); body.add(dish);
  const profile = []; for (let i = 0; i <= 28; i++) { const r = i / 28 * .48; profile.push(new THREE.Vector2(r, r * r * .82)); }
  const reflector = mesh(new THREE.LatheGeometry(profile, 72), ceramic, dish); reflector.rotation.x = Math.PI / 2;
  mesh(new THREE.TorusGeometry(.48, .014, 8, 72), silver, dish, 0, 0, .189);
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; rod([Math.cos(a) * .46, Math.sin(a) * .46, .185], [0, 0, .53], .011, silver, dish); }
  mesh(new THREE.CylinderGeometry(.046, .046, .12, 16), graphite, dish, 0, 0, .54).rotation.x = Math.PI / 2;
  mesh(new THREE.SphereGeometry(.047, 16, 12), gold, dish, 0, 0, .62);
  rod([-.27, .67, .1], [-.27, 1.37, .1], .012, silver, body);
  rod([-.27, 1.37, .1], [-.55, 1.6, .1], .008, silver, body);
  mesh(new THREE.SphereGeometry(.026, 12, 12), new THREE.MeshBasicMaterial({ color: 0xd5ee9e }), body, -.55, 1.6, .1);
  rod([.32, .68, 0], [.32, .97, 0], .055, graphite, body);
  mesh(new THREE.CylinderGeometry(.24, .2, .035, 32), silver, body, .32, 1, 0);

  const wings = [];
  for (const sign of [-1, 1]) {
    rod([sign * .55, 0, 0], [sign * 1.03, 0, 0], .045, silver, satellite);
    const wing = new THREE.Group(); wing.position.x = sign * 2.16; wing.rotation.y = sign * .1; wing.rotation.x = .08; satellite.add(wing); wings.push(wing);
    mesh(new THREE.BoxGeometry(2.33, 1.5, .055), silver, wing);
    mesh(new THREE.BoxGeometry(2.26, 1.43, .06), graphite, wing, 0, 0, .01);
    for (let col = 0; col < 6; col++) for (let row = 0; row < 4; row++) {
      const x = (col - 2.5) * .372, y = (row - 1.5) * .35;
      mesh(new THREE.BoxGeometry(.351, .328, .018), (col + row) % 3 === 0 ? solarLight : solar, wing, x, y, .055);
      const lines = [];
      for (let k = 0; k < 5; k++) { const yy = y + (k - 2) * .054; lines.push(x - .163, yy, .066, x + .163, yy, .066); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3)); wing.add(new THREE.LineSegments(geo, edgeMaterial));
    }
    mesh(new THREE.BoxGeometry(.032, 1.51, .09), silver, wing, 0, 0, .055);
    rod([-1.14, -.74, -.04], [1.14, .74, -.04], .012, silver, wing);
  }
  satellite.rotation.set(.28, -.47, -.31);
  satellite.position.set(-.12, .48, 0);

  // A procedural planet adds depth without a network image or oversized texture.
  const planetMaterial = new THREE.ShaderMaterial({
    vertexShader: `varying vec3 vN; varying vec3 vP; varying vec3 vW; void main(){vN=normalize(normalMatrix*normal);vP=position;vec4 mv=modelViewMatrix*vec4(position,1.);vW=-mv.xyz;gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `precision highp float; varying vec3 vN; varying vec3 vP; varying vec3 vW;
    float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
    float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
    float fbm(vec3 p){float n=0.,a=.5;for(int i=0;i<5;i++){n+=a*noise(p);p=p*2.03+2.4;a*=.5;}return n;}
    void main(){vec3 n=normalize(vN);float land=fbm(vP*1.35);float cloud=fbm(vP*3.4+vec3(9.));float lit=max(0.,dot(n,normalize(vec3(-.65,.85,.6))));vec3 col=mix(vec3(.022,.05,.042),vec3(.17,.22,.155),smoothstep(.43,.66,land));col=mix(col,vec3(.31,.36,.29),smoothstep(.55,.8,cloud)*.6);col*=pow(lit,1.5)*.85+.05;float rim=pow(1.-max(0.,dot(n,normalize(vW))),4.);col+=vec3(.27,.36,.24)*rim*pow(lit,.6)*.85;gl_FragColor=vec4(col,1.);}`
  });
  const planet = mesh(new THREE.SphereGeometry(4.65, 96, 72), planetMaterial, scene, 2.5, -6.15, -4.5); planet.rotation.z = -.25;
  // Fine orbital trajectories and a moving signal point are illustrative.
  const orbitalGroup = new THREE.Group(); orbitalGroup.position.set(.5, -.4, -2); orbitalGroup.rotation.set(.55, -.2, -.22); scene.add(orbitalGroup);
  const orbitRadius = 4.3;
  const orbitPoints = [];
  for (let i = 0; i <= 180; i++) { const a = i / 180 * Math.PI * 2; orbitPoints.push(new THREE.Vector3(Math.cos(a) * orbitRadius, Math.sin(a) * 2.05, 0)); }
  const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  orbitalGroup.add(new THREE.Line(orbitGeo, new THREE.LineBasicMaterial({ color: 0x92b38a, opacity: .23, transparent: true })));
  const signal = mesh(new THREE.SphereGeometry(.027, 12, 10), new THREE.MeshBasicMaterial({ color: 0xd5ee9e }), orbitalGroup);

  const starPositions = [];
  for (let i = 0; i < 110; i++) starPositions.push((random() - .5) * 25, (random() - .5) * 20, -7 - random() * 6);
  const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xc4d7c5, size: .013, transparent: true, opacity: .5, sizeAttenuation: true })));

  let width = 0, height = 0;
  function resize() {
    const r = stage.getBoundingClientRect(); width = r.width; height = r.height;
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
    const mobile = innerWidth <= 760;
    camera.position.z = mobile ? 11.5 : (innerWidth < 1100 ? 11.5 : 10.5);
    satellite.scale.setScalar(mobile ? .87 : .96);
    satellite.position.x = mobile ? -.2 : -.12;
    satellite.position.y = mobile ? .25 : .48;
    planet.position.set(mobile ? 2 : 2.5, mobile ? -6.6 : -6.15, -4.5);
    renderer.render(scene, camera);
  }
  new ResizeObserver(resize).observe(stage); resize();
  let targetX = 0, targetY = 0, userY = 0, userZ = 0, lastX = 0, lastY = 0;
  canvas.addEventListener('pointermove', e => {
    if (reduced.matches) return;
    const rect = canvas.getBoundingClientRect();
    targetX = ((e.clientX - rect.left) / rect.width - .5) * .13;
    targetY = ((e.clientY - rect.top) / rect.height - .5) * .09;
    if (dragging) { userY += (e.clientX - lastX) * .006; userZ = Math.max(-.5, Math.min(.5, userZ + (e.clientY - lastY) * .003)); lastX = e.clientX; lastY = e.clientY; }
  });
  canvas.addEventListener('pointerleave', () => { targetX = targetY = 0; });
  canvas.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' || reduced.matches) return; dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  function updateButton() { motionButton.setAttribute('aria-pressed', String(paused)); motionButton.setAttribute('aria-label', paused ? 'Play orbital animation' : 'Pause orbital animation'); }
  updateButton();
  motionButton.addEventListener('click', () => { paused = !paused; updateButton(); });
  reduced.addEventListener('change', e => { if (e.matches) { paused = true; targetX = targetY = 0; updateButton(); } });
  let time = 0, previous = performance.now();
  function frame(now) {
    const dt = Math.min((now - previous) / 1000, .05); previous = now;
    if (!paused && !document.hidden && !document.querySelector('dialog[open]')) {
      time += dt;
      const mobile = innerWidth <= 760;
      satellite.position.y = (mobile ? .25 : .48) + Math.sin(time * .5) * .085;
      satellite.rotation.x += (.28 + targetY + Math.sin(time * .23) * .025 - satellite.rotation.x) * .03;
      satellite.rotation.y += (-.47 + userY + targetX + Math.sin(time * .18) * .07 - satellite.rotation.y) * .03;
      satellite.rotation.z += (-.31 + userZ + Math.sin(time * .3) * .025 - satellite.rotation.z) * .03;
      planet.rotation.y = time * .008;
      signal.position.set(Math.cos(time * .08 + 1.6) * orbitRadius, Math.sin(time * .08 + 1.6) * 2.05, 0);
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  }
  renderer.render(scene, camera); stage.classList.add('scene-ready');
  requestAnimationFrame(frame);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); stage.classList.remove('scene-ready'); });
  canvas.addEventListener('webglcontextrestored', () => location.reload());
} catch (error) {
  console.warn('Orbital illustration is using its static fallback.', error.message);
  motionButton.hidden = true;
  document.querySelector('.drag-hint').hidden = true;
}
