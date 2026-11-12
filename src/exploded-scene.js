import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { partModel } from './part-models.js';

export function createExplodedScene(host, labels, onSelect) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.20;
  host.append(renderer.domElement);
  const canvas = renderer.domElement;
  const scene = new THREE.Scene();
  const studio = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, .07);
  studio.dispose();
  pmrem.dispose();
  scene.environment = environment.texture;
  scene.environmentIntensity = .88;

  const softbox = new THREE.DirectionalLight(0xe5f0ff, 2.5);
  softbox.position.set(-4, 7, 6);
  const rim = new THREE.DirectionalLight(0xffc999, 2.35);
  rim.position.set(6, 2, -5);
  scene.add(softbox, rim, new THREE.HemisphereLight(0xf3f6ff, 0x3a3229, 1.1));

  const camera = new THREE.PerspectiveCamera(36, 1, .06, 110);
  const group = new THREE.Group();
  scene.add(group);
  const projection = new THREE.Vector3();
  const picker = new THREE.Raycaster();
  const coords = new THREE.Vector2();
  let entries = [];
  let selected = -1;
  let width = 0;
  let height = 0;
  let distance = 8;
  let zoom = 1;
  let heading = -.13;
  let angle = .39;
  let motion = false;
  let started = 0;
  let frame = 0;
  let press;

  function requestFrame() {
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function disposeGroup() {
    const paints = new Set();
    group.traverse((part) => {
      part.geometry?.dispose();
      if (part.material) paints.add(part.material);
    });
    for (const paint of paints) paint.dispose();
    group.clear();
  }

  function layout() {
    if (!entries.length || !width) return;
    const columns = Math.min(entries.length, width < 550 ? 3 : 5);
    const rows = Math.ceil(entries.length / columns);
    for (const [index, entry] of entries.entries()) {
      const row = Math.floor(index / columns);
      const rowCount = Math.min(columns, entries.length - row * columns);
      const column = index % columns;
      entry.destination.set((column - (rowCount - 1) / 2) * 2.0, 0, (row - (rows - 1) / 2) * 2.12);
    }
    const verticalFit = 4.8 + (rows - 1) * 2.65;
    const horizontalFit = (columns * 2.05 + .4) / (Math.max(.6, camera.aspect) * .63);
    distance = Math.max(verticalFit, horizontalFit, 4.7);
  }

  function resize() {
    width = host.clientWidth;
    height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    layout();
    requestFrame();
  }

  function draw(now) {
    frame = 0;
    if (!width || !height || !entries.length) return;
    const progress = motion ? Math.min(1, (now - started) / 790) : 1;
    const ease = 1 - Math.pow(1 - progress, 3);
    const depth = distance * zoom;
    camera.position.set(Math.sin(heading) * Math.cos(angle) * depth, Math.sin(angle) * depth, Math.cos(heading) * Math.cos(angle) * depth);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    for (const { model, destination, label } of entries) {
      model.position.copy(destination).multiplyScalar(.2 + .8 * ease);
      if (!label) continue;
      projection.copy(model.position);
      projection.y += .70;
      projection.project(camera);
      const left = (projection.x + 1) * width * .5;
      const top = (1 - projection.y) * height * .5;
      label.style.left = `${left}px`;
      label.style.top = `${top}px`;
      label.hidden = projection.z < -1 || projection.z > 1 || left < 10 || left > width - 10 || top < 20 || top > height - 12;
    }
    renderer.render(scene, camera);
    if (progress < 1) requestFrame();
  }

  function highlight(index) {
    selected = index;
    for (const [number, { model, label }] of entries.entries()) {
      if (label) label.setAttribute('aria-pressed', String(number === index));
      model.traverse((part) => {
        const paint = part.material;
        if (!paint?.emissive) return;
        paint.emissive.setHex(number === index ? 0x7d491a : 0x000000);
        paint.emissiveIntensity = number === index ? .47 : 0;
      });
    }
    requestFrame();
  }

  function show(node, reduced) {
    disposeGroup();
    labels.replaceChildren();
    const siblings = node.children?.length ? node.children : [node];
    entries = siblings.map((child, index) => {
      const model = partModel(child);
      model.userData.partIndex = index;
      group.add(model);
      let label;
      if (node.children?.length) {
        label = document.createElement('button');
        label.type = 'button';
        label.className = 'part-marker';
        label.textContent = String(index + 1).padStart(2, '0');
        label.title = child.name;
        label.dataset.marker = String(index);
        label.setAttribute('aria-label', `${label.textContent} Select ${child.name} on the model`);
        labels.append(label);
      }
      return { model, label, destination: new THREE.Vector3() };
    });
    zoom = 1;
    heading = -.13;
    angle = .39;
    motion = !reduced;
    started = performance.now();
    layout();
    highlight(selected);
  }

  function zoomBy(factor) {
    zoom = THREE.MathUtils.clamp(zoom * factor, .53, 1.85);
    requestFrame();
  }

  const size = new ResizeObserver(resize);
  size.observe(host);
  labels.addEventListener('click', (event) => {
    const button = event.target.closest('[data-marker]');
    if (button) onSelect(Number(button.dataset.marker));
  });
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || press) return;
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!press || press.id !== event.pointerId) return;
    const dx = event.clientX - press.x;
    const dy = event.clientY - press.y;
    if (!press.moved && Math.hypot(dx, dy) < 4) return;
    press.moved = true;
    heading -= dx * .006;
    angle = THREE.MathUtils.clamp(angle + dy * .006, .11, 1.26);
    press.x = event.clientX;
    press.y = event.clientY;
    requestFrame();
  });
  canvas.addEventListener('pointerup', (event) => {
    if (!press || press.id !== event.pointerId) return;
    const clicked = !press.moved;
    press = undefined;
    if (!clicked || !entries.length || !entries[0].label) return;
    const bounds = canvas.getBoundingClientRect();
    coords.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    picker.setFromCamera(coords, camera);
    const hit = picker.intersectObjects(entries.map(({ model }) => model), true)[0];
    let object = hit?.object;
    while (object && object.userData.partIndex === undefined) object = object.parent;
    if (object) onSelect(object.userData.partIndex);
  });
  canvas.addEventListener('lostpointercapture', () => { press = undefined; });
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? .88 : 1.13);
  }, { passive: false });

  return { show, highlight, zoomBy, resize };
}
