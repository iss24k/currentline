import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { generationModels } from './generation-models.js';
import { infrastructureModels } from './infrastructure-models.js';
import { createOnsiteAssembly } from './onsite-assembly.js';
import { assemblyPart, setInspection } from './model-assembly.js';
import { createEquipmentFlow } from './equipment-flow.js';

const factories = { ...generationModels, ...infrastructureModels };
const tones = {
  slate: new THREE.MeshStandardMaterial({ color: 0x303b3d, metalness: .68, roughness: .32 }),
  rail: new THREE.MeshStandardMaterial({ color: 0xaab3af, metalness: .85, roughness: .31 }),
  thinFilm: new THREE.MeshPhysicalMaterial({
    color: 0x202425, metalness: .12, roughness: .30, clearcoat: .82, clearcoatRoughness: .22,
  }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0x9fb0b4, metalness: .05, roughness: .21, transparent: true, opacity: .18,
    depthWrite: false, clearcoat: 1, clearcoatRoughness: .12,
  }),
  stripe: new THREE.MeshStandardMaterial({ color: 0x696367, metalness: .58, roughness: .52 }),
};

function cube(group, dimensions, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), material);
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}

function thinFilmArray() {
  const stand = new THREE.Group();
  const frame = new THREE.Group();
  const glass = new THREE.Group();
  const film = new THREE.Group();
  const contacts = new THREE.Group();
  const junctions = new THREE.Group();
  frame.position.y = 1.08;
  frame.rotation.x = -.29;
  stand.add(frame);
  frame.add(glass, film, contacts, junctions);

  for (let panel = 0; panel < 5; panel += 1) {
    const x = (panel - 2) * .84;
    cube(glass, [.814, .014, 1.736], [x, .061, 0], tones.glass);
    for (const offset of [-.409, .409]) cube(frame, [.015, .062, 1.76], [x + offset, .025, 0], tones.rail);
    for (const z of [-.873, .873]) cube(frame, [.815, .062, .012], [x, .025, z], tones.rail);
    cube(frame, [.806, .033, 1.727], [x, .011, 0], tones.slate);
    cube(film, [.808, .012, 1.728], [x, .036, 0], tones.thinFilm);
    for (let strip = 0; strip < 36; strip += 1) {
      cube(film, [.0028, .0008, 1.704], [x - .385 + strip * .022, .043, 0], tones.stripe);
    }
    cube(contacts, [.807, .006, 1.728], [x, .045, 0], tones.glass);
    cube(junctions, [.21, .07, .17], [x, -.066, .58], tones.slate);
  }
  for (const x of [-1.48, .14, 1.68]) {
    cube(stand, [.13, .96, .13], [x, .49, 0], tones.rail);
    cube(stand, [.28, .045, .28], [x, .04, 0], tones.slate);
  }
  cube(frame, [4.43, .124, .124], [0, -.123, 0], tones.rail);
  for (const z of [-.61, .61]) cube(frame, [4.22, .056, .074], [0, -.068, z], tones.rail);
  return setInspection(stand, [
    assemblyPart('Front glass', glass, [0, .8, -.23], 1.23),
    assemblyPart('CdTe film', film, [0, .65, .13], .76),
    assemblyPart('Conductive cell strips', contacts, [0, .75, .4], 1.02),
    assemblyPart('DC junction box', junctions, [0, -.08, 1], .85),
  ]);
}

function shadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const falloff = ctx.createRadialGradient(128, 128, 8, 128, 128, 125);
  falloff.addColorStop(0, 'rgba(0,0,0,.78)');
  falloff.addColorStop(.46, 'rgba(0,0,0,.40)');
  falloff.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = falloff;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

function tree(name, object) {
  return {
    name,
    children: object?.userData.inspection?.map((entry) =>
      tree(entry.name, entry.nodes.find((node) => node?.userData.inspection?.length))) ?? [],
  };
}

function branchFor(root, name) {
  if (!name) return null;
  const selection = root.children.findIndex((child) => child.name === name);
  if (selection >= 0) return { path: [root], selection };
  for (const child of root.children) {
    const next = branchFor(child, name);
    if (next) return { path: [root, ...next.path], selection: next.selection };
  }
  return null;
}

function createRecord(id, root) {
  const model = id === 'solar' ? thinFilmArray() : factories[id]?.();
  if (!model) return null;
  root.add(model);
  model.updateWorldMatrix(true, true);
  const bounds = new THREE.Box3().setFromObject(model, true);
  const size = bounds.getSize(new THREE.Vector3());
  return {
    model, size, center: bounds.getCenter(new THREE.Vector3()),
    assembly: createOnsiteAssembly(model),
    assemblyRoot: tree(id, model),
    flow: createEquipmentFlow(id, model, size),
    open: false,
  };
}

const frames = {
  solar: [.31, .47], 'solar-inverter': [-.31, .24], 'step-up': [.27, .28],
  intake: [-.28, .21], ups: [.38, .19], psu: [-.37, .36], vrm: [.42, .61], chip: [.22, .60],
  'floor-pdu': [.23, .27], 'rack-pdu': [-.29, .25], busway: [.45, .24],
  'site-transformer': [.25, .27], transfer: [-.27, .23], battery: [.29, .28], generator: [.32, .29],
};

export function createEquipmentCamera(host) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .90;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-label', 'Drag or use the arrow keys to look around the equipment');
  canvas.tabIndex = 0;
  host.append(canvas);

  const scene = new THREE.Scene();
  const room = new RoomEnvironment();
  const generator = new THREE.PMREMGenerator(renderer);
  const environment = generator.fromScene(room, .035);
  room.dispose();
  generator.dispose();
  scene.environment = environment.texture;
  scene.environmentIntensity = .93;

  const key = new THREE.DirectionalLight(0xfff4df, 2.65);
  key.position.set(-4, 7, 4);
  const fill = new THREE.DirectionalLight(0xa3c7e2, 1.38);
  fill.position.set(7, 3, 1);
  const rim = new THREE.DirectionalLight(0xffd9b4, 2.17);
  rim.position.set(3, 5, -7);
  const root = new THREE.Group();
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: .69, map: shadowTexture(), depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -.035;
  scene.add(root, shadow, key, fill, rim);

  const camera = new THREE.PerspectiveCamera(36, 1, .06, 110);
  const marker = document.createElement('span');
  marker.className = 'equipment-marker';
  marker.hidden = true;
  host.append(marker);
  const markerPosition = new THREE.Vector3();
  const lookCenter = new THREE.Vector3();
  let lookRange = 0;
  let previousFrame = 0;
  const records = new Map();
  let current;
  let active;
  let width = 0;
  let height = 0;
  let frame;
  let fade = 0;
  let orbitX = 0;
  let orbitY = 0;
  let yaw = 0;
  let altitude = 0;
  let beat = .5;
  let reduced = false;
  let drag;
  let selected = -1;
  let selectionPath = [];
  let selectedPart;
  let disposed = false;

  function schedule() {
    if (frame === undefined && !disposed) frame = requestAnimationFrame(render);
  }

  function resize() {
    width = host.clientWidth;
    height = host.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2, 3840 / width, 2160 / height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const shift = width < 760 ? 0 : -width * .17;
    camera.setViewOffset(width, height, shift, 0, width, height);
    camera.updateProjectionMatrix();
    schedule();
  }

  function render(now) {
    frame = undefined;
    if (!current || !width || !height || !host.getClientRects().length) return;
    const elapsed = previousFrame ? Math.min(40, now - previousFrame) : 16;
    previousFrame = now;
    const ease = reduced ? 1 : 1 - Math.exp(-elapsed / 82);
    current.assembly.animate(now);
    const [heading, angle] = frames[active] ?? [.31, .32];
    const goalX = heading + orbitX + (reduced ? 0 : (beat - .5) * .13);
    const goalY = angle + orbitY;
    yaw += (goalX - yaw) * ease;
    altitude += (goalY - altitude) * ease;
    fade = reduced ? 1 : Math.min(1, fade + .06);
    const layout = current.assembly.active;
    const nested = layout?.depth > 0;
    const extent = nested ? layout.extent : layout ? current.size.clone().max(layout.extent) : current.size;
    const depth = Math.max(extent.y * 2.17, extent.x * (width < 760 ? 1.95 : 1.82), extent.z * 1.76, nested ? 2.2 : 5.4);
    const range = depth * (1.04 - fade * .04);
    const center = nested ? layout.focus : layout ? current.center.clone().lerp(layout.focus, .45) : current.center;
    lookCenter.lerp(center, lookRange ? ease : 1);
    lookRange = lookRange ? THREE.MathUtils.lerp(lookRange, range, ease) : range;
    camera.position.copy(lookCenter).add(new THREE.Vector3(
      Math.sin(yaw) * Math.cos(altitude) * lookRange,
      Math.sin(altitude) * lookRange,
      Math.cos(yaw) * Math.cos(altitude) * lookRange,
    ));
    camera.lookAt(lookCenter);
    camera.updateMatrixWorld();
    const item = layout?.items[selected];
    if (item && selectedPart) {
      markerPosition.copy(item.anchor).project(camera);
      marker.style.transform = `translate(${Math.round((markerPosition.x + 1) * width / 2)}px, ${Math.round((1 - markerPosition.y) * height / 2)}px)`;
      marker.hidden = Math.abs(markerPosition.x) > .97 || Math.abs(markerPosition.y) > .97;
    } else {
      marker.hidden = true;
    }
    const tracing = current.flow.update(now, { visible: !current.open, quiet: reduced });
    const framing = Math.abs(range - lookRange) > .015 || center.distanceToSquared(lookCenter) > .0002;
    host.toggleAttribute('data-assembly-moving', current.assembly.animating || framing);
    renderer.render(scene, camera);
    if (tracing || current.assembly.animating || framing || fade < 1 || Math.abs(goalX - yaw) > .001 || Math.abs(goalY - altitude) > .001) schedule();
  }

  function show(id, { progress = .5, quiet = false, reveal = false } = {}) {
    reduced = quiet;
    beat = progress;
    if (active !== id) {
      if (current) current.model.visible = false;
      active = id;
      if (!records.has(id)) records.set(id, createRecord(id, root));
      current = records.get(id);
      if (!current) return;
      current.model.visible = true;
      lookRange = 0;
      fade = reduced ? 1 : 0;
      [yaw, altitude] = frames[id] ?? [.31, .32];
      orbitX = 0;
      orbitY = 0;
      shadow.scale.set(Math.max(4, current.size.x * 1.68), Math.max(3, current.size.z * 1.87), 1);
      shadow.position.x = current.center.x;
      shadow.position.z = current.center.z;
      marker.hidden = true;
      selected = -1;
      selectionPath = [current.assemblyRoot];
      selectedPart = undefined;
    }
    const open = Boolean(reveal && current?.assemblyRoot.children.length);
    if (open) current.assembly.configure(selectionPath, selected, reduced, true);
    else if (current?.open) current.assembly.close(reduced);
    if (current) {
      current.open = open;
      if (current.assembly.animating) host.setAttribute('data-assembly-moving', '');
    }
    schedule();
  }

  function highlight(part) {
    if (!current || part === selectedPart) return;
    selectedPart = part;
    const branch = branchFor(current.assemblyRoot, part?.target ?? part?.name);
    selected = branch?.selection ?? -1;
    selectionPath = branch?.path ?? [current.assemblyRoot];
    if (part) marker.textContent = part.name;
    if (current.open) {
      current.assembly.configure(selectionPath, selected, reduced, true);
      if (current.assembly.animating) host.setAttribute('data-assembly-moving', '');
    }
    schedule();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || drag) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.abs(dx) > 2 && !canvas.hasPointerCapture(event.pointerId)) canvas.setPointerCapture(event.pointerId);
    orbitX = THREE.MathUtils.clamp(orbitX - dx * .006, -.65, .65);
    orbitY = THREE.MathUtils.clamp(orbitY + dy * .004, -.18, .27);
    drag.x = event.clientX;
    drag.y = event.clientY;
    schedule();
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture', 'pointerleave']) {
    canvas.addEventListener(event, () => { drag = undefined; });
  }
  canvas.addEventListener('keydown', (event) => {
    const adjustments = { ArrowLeft: -.13, ArrowRight: .13, Home: -orbitX };
    if (adjustments[event.key] === undefined) return;
    event.preventDefault();
    orbitX = THREE.MathUtils.clamp(orbitX + adjustments[event.key], -.65, .65);
    schedule();
  });

  return {
    show, highlight,
    destroy() {
      disposed = true;
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
      environment.dispose();
      shadow.material.map.dispose();
      renderer.dispose();
      canvas.remove();
      marker.remove();
    },
  };
}
