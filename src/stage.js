import * as THREE from 'three';
import { generationModels, generationCutaways } from './generation-models.js';
import { infrastructureModels, infrastructureCutaways } from './infrastructure-models.js';
import {
  generation, grid, modelLabels, modelPhase, positionFor, routeFor, server, siteEntry,
  siteOutput, visibleStops,
} from './route.js';
import { icon } from './icons.js';

const factories = { ...generationModels, ...infrastructureModels };
const cutaways = new Set([...generationCutaways, ...infrastructureCutaways]);
const phasePads = {
  generation: { start: -10.2, end: 15.6, depth: 9.6, z: -0.35 },
  grid: { start: 19.3, end: 44.5, depth: 10, z: -0.6 },
  facility: { start: 51.6, end: 102, depth: 17, z: -3.2 },
  server: { start: 109.5, end: 151.1, depth: 9.6, z: -0.25 },
};

const platformPaint = new THREE.MeshStandardMaterial({ color: 0x253747, metalness: .38, roughness: .66 });
const plinthPaint = new THREE.MeshStandardMaterial({ color: 0x13212f, metalness: .27, roughness: .78 });
const trimPaint = new THREE.MeshStandardMaterial({ color: 0x3b566c, metalness: .44, roughness: .65 });
const ledPaint = new THREE.MeshBasicMaterial({ color: 0x66849c });
const activeWire = new THREE.MeshBasicMaterial({ color: 0xf6a251 });
const glowWire = new THREE.MeshBasicMaterial({ color: 0xd18235, transparent: true, opacity: .17, depthWrite: false });
const sleepingWire = new THREE.MeshBasicMaterial({ color: 0x56728a });

function rectangle(parent, material, x, y, z, w, h, d) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.receiveShadow = material === platformPaint;
  parent.add(mesh);
  return mesh;
}

function studioEnvironment(renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, 256);
  sky.addColorStop(0, '#a4baca');
  sky.addColorStop(.48, '#455d78');
  sky.addColorStop(.55, '#152535');
  sky.addColorStop(1, '#121821');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#deefff';
  ctx.fillRect(48, 36, 100, 53);
  ctx.fillStyle = '#9bc7ff';
  ctx.fillRect(258, 64, 120, 15);
  ctx.fillStyle = '#ffd7b0';
  ctx.fillRect(443, 97, 26, 44);
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromEquirectangular(texture);
  texture.dispose();
  generator.dispose();
  return target;
}

function addGround(scene) {
  const geometry = new THREE.PlaneGeometry(540, 540);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 point;
      void main() {
        point = (modelMatrix * vec4(position, 1.)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(point, 1.);
      }
    `,
    fragmentShader: `
      varying vec3 point;
      float grid(vec2 uv) {
        vec2 unit = abs(fract(uv - .5) - .5) / max(fwidth(uv), vec2(.0001));
        return 1. - min(min(unit.x, unit.y), 1.);
      }
      void main() {
        float distanceFromView = length(cameraPosition.xz - point.xz);
        float nearGrid = grid(point.xz * 1.25) * .16;
        float majorGrid = grid(point.xz * .25) * .42;
        float halo = exp(-abs(point.z) * .075) * exp(-distanceFromView * .024);
        float fog = exp(-pow(distanceFromView * .021, 1.7));
        vec3 horizon = vec3(.035, .066, .105);
        vec3 base = vec3(.065, .115, .17) + vec3(.015, .052, .088) * halo;
        vec3 detail = vec3(.16, .30, .42) * (nearGrid + majorGrid);
        gl_FragColor = vec4(mix(horizon, base + detail, fog), 1.);
      }
    `,
  });
  const floor = new THREE.Mesh(geometry, material);
  floor.position.y = -.64;
  scene.add(floor);
}

function addPlatforms(scene) {
  for (const [name, { start, end, depth, z }] of Object.entries(phasePads)) {
    const x = (start + end) / 2;
    const width = end - start;
    rectangle(scene, plinthPaint, x, -.395, z, width + .25, .47, depth + .2);
    rectangle(scene, platformPaint, x, -.105, z, width, .18, depth);
    for (const side of [-1, 1]) {
      const edge = z + side * (depth / 2 - .18);
      rectangle(scene, trimPaint, x, -.013, edge, width - .3, .022, .04);
      for (let tick = start + .6; tick < end - .3; tick += .85) {
        const long = Math.round((tick - start - .6) / .85) % 4 === 0;
        rectangle(scene, long ? ledPaint : trimPaint, tick, -.014, edge - side * .10, .022, .02, long ? .31 : .12);
      }
    }
    if (name === 'server') {
      for (let row = 0; row < 5; row += 1) {
        rectangle(scene, trimPaint, x, -.012, z - 3.25 + row * .5, width - 1.2, .018, .018);
      }
    }
  }
}

function contactTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 5, 32, 32, 31);
  gradient.addColorStop(0, 'rgba(0, 4, 10, .83)');
  gradient.addColorStop(.55, 'rgba(0, 4, 10, .59)');
  gradient.addColorStop(1, 'rgba(0, 4, 10, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

function makeCable(start, end, offset) {
  const [sx, sz] = start;
  const [ex, ez] = end;
  const span = ex - sx;
  return new THREE.CubicBezierCurve3(
    new THREE.Vector3(sx, .025, sz + offset),
    new THREE.Vector3(sx + span * .54, .025, sz + offset),
    new THREE.Vector3(ex - span * .54, .025, ez + offset),
    new THREE.Vector3(ex, .025, ez + offset),
  );
}

function trackEdges(source) {
  const route = [...generation[source].stops, ...grid, ...siteEntry, 'transfer', ...siteOutput, ...server];
  return [
    ...route.slice(1).map((end, index) => [route[index], end]),
    ['generator', 'transfer'], ['battery', 'ups'],
  ];
}

function releaseGeometries(group) {
  group.traverse((child) => child.geometry?.dispose());
}

export function createStage({ mount, hotspots, select, onUnavailable, onInteract }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  mount.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1828);
  scene.fog = new THREE.FogExp2(0x0b1828, .025);
  const environment = studioEnvironment(renderer);
  scene.environment = environment.texture;
  scene.environmentIntensity = .72;
  addGround(scene);
  addPlatforms(scene);

  const skyLight = new THREE.HemisphereLight(0xc7e7ff, 0x374659, 1.58);
  const key = new THREE.DirectionalLight(0xe3efff, 2.64);
  key.position.set(-10, 14, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -13, right: 13, top: 11, bottom: -11, near: 1, far: 42 });
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.normalBias = .06;
  key.shadow.bias = -.00021;
  scene.add(key.target);
  const rim = new THREE.DirectionalLight(0x84bfff, 2.05);
  rim.position.set(4, 7, -10);
  const warm = new THREE.DirectionalLight(0xffbd86, .78);
  warm.position.set(5, 4, 8);
  scene.add(skyLight, key, rim, warm);

  const view = new THREE.PerspectiveCamera(39, 1, .15, 250);
  const center = new THREE.Vector3();
  const cameraFrom = new THREE.Vector3();
  const cameraTo = new THREE.Vector3();
  const shadowCenter = new THREE.Vector3(Infinity, 0, 0);
  let angle = .37;
  let altitude = .50;
  let distance = 16;
  let width = 1;
  let height = 1;
  let transition = null;
  let drag = null;
  let settings = null;
  let frameId = null;
  let lastFrame = 0;
  let animationTime = 0;
  let lost = false;

  const cache = new Map();
  const modelRoot = new THREE.Group();
  const cableRoot = new THREE.Group();
  const shadows = new THREE.MeshBasicMaterial({ map: contactTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
  scene.add(modelRoot, cableRoot);
  const sparkPaint = new THREE.MeshBasicMaterial({ color: 0xffd895 });
  const sparkGeometry = new THREE.SphereGeometry(.058, 8, 6);
  const projection = new THREE.Vector3();
  const hit = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let cables = [];
  let labels = [];
  let currentRecords = [];
  let leavingRecords = [];
  let movingCables = [];

  function getRecord(id, source, exposed = false) {
    const key = id + (modelPhase[id] === 'generation' ? `/${source}` : '') + (exposed ? '/inside' : '');
    if (cache.has(key)) return cache.get(key);
    const model = factories[id](exposed);
    const [x, z] = positionFor(id, source);
    const box = new THREE.Box3().setFromObject(model);
    const extent = box.getSize(new THREE.Vector3());
    const middle = box.getCenter(new THREE.Vector3());
    const rotors = [];
    model.traverse((part) => {
      if (part.userData.spin) rotors.push(part);
    });
    model.position.set(x, 0, z);
    model.userData.component = id;
    model.visible = false;
    modelRoot.add(model);
    const contact = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(2.8, extent.x * 1.24), Math.max(2.5, extent.z * 1.27)), shadows);
    contact.rotation.x = -Math.PI / 2;
    contact.position.set(x + middle.x, .006, z + middle.z);
    model.add(contact);
    contact.position.sub(model.position);
    const anchor = new THREE.Vector3(x + middle.x, Math.max(1.16, box.max.y + .2), z + middle.z);
    const record = { id, model, rotors, anchor, extent };
    cache.set(key, record);
    return record;
  }

  function buildTracks(source) {
    for (const child of [...cableRoot.children]) {
      if (!child.isMesh || child.geometry !== sparkGeometry) releaseGeometries(child);
      cableRoot.remove(child);
    }
    cables = trackEdges(source).map(([from, to]) => {
      const start = positionFor(from, source);
      const end = positionFor(to, source);
      const track = new THREE.Group();
      const curve = makeCable(start, end, .32);
      const glow = new THREE.Mesh(new THREE.TubeGeometry(curve, 38, .12, 6, false), glowWire);
      track.add(glow);
      const strands = [-.12, 0, .12].map((shift) => {
        const strand = new THREE.Mesh(
          new THREE.TubeGeometry(makeCable(start, end, .32 + shift), 38, shift === 0 ? .029 : .015, 6, false),
          activeWire,
        );
        track.add(strand);
        return strand;
      });
      const sparks = Array.from({ length: 3 }, () => {
        const spark = new THREE.Mesh(sparkGeometry, sparkPaint);
        cableRoot.add(spark);
        return spark;
      });
      cableRoot.add(track);
      return { from, to, curve, glow, strands, sparks };
    });
  }

  function energize(route, mode) {
    const firstLive = mode === 'battery' ? route.indexOf('battery') : mode === 'generator' ? route.indexOf('generator') : 0;
    const isLive = (from, to) => {
      const index = route.indexOf(from);
      return index >= firstLive && route[index + 1] === to;
    };
    movingCables = [];
    for (const cable of cables) {
      const active = isLive(cable.from, cable.to);
      cable.glow.visible = active;
      for (const strand of cable.strands) strand.material = active ? activeWire : sleepingWire;
      for (const spark of cable.sparks) spark.visible = active && !settings.reduced;
      if (active) movingCables.push(cable);
    }
  }

  function updateLabels() {
    hotspots.replaceChildren();
    const route = routeFor(settings.source, settings.mode);
    labels = currentRecords.map((record) => {
      const button = document.createElement('button');
      button.className = 'spot';
      button.hidden = true;
      button.dataset.go = record.id;
      button.dataset.hotspot = '';
      button.innerHTML = `${icon('plus', 13)} <span>${modelLabels[record.id]}</span>`;
      button.setAttribute('aria-label', `Inspect ${modelLabels[record.id]}`);
      if (settings.active === record.id) button.setAttribute('aria-current', 'step');
      if (!route.includes(record.id)) button.classList.add('off-route');
      hotspots.append(button);
      return { button, record };
    });
  }

  function layoutLabels() {
    const occupied = [];
    const sorted = [...labels].sort((a, b) => Number(b.record.id === settings.active) - Number(a.record.id === settings.active));
    for (const { button, record } of sorted) {
      projection.copy(record.anchor).project(view);
      const rawX = (projection.x + 1) * width * .5;
      const rawY = (1 - projection.y) * height * .5;
      const active = record.id === settings.active;
      const labelInset = Math.min(92, width / 4);
      const centerX = THREE.MathUtils.clamp(rawX, labelInset, width - labelInset);
      const reservedTop = rawX < 264 || rawX > width - 153 ? 105 : 79;
      const y = Math.max(reservedTop, rawY);
      const box = { x1: centerX - 70, x2: centerX + 70, y1: y - 24, y2: y };
      const overlap = !active && occupied.some((rect) => rect.x1 < box.x2 && rect.x2 > box.x1 && rect.y1 < box.y2 && rect.y2 > box.y1);
      button.hidden = projection.z < -1 || projection.z > 1 || rawX < 25 || rawX > width - 25 || rawY < -35 || y > height - 44 || overlap;
      if (!button.hidden) {
        button.style.left = `${centerX}px`;
        button.style.top = `${y}px`;
        occupied.push(box);
      }
    }
  }

  function placeCamera() {
    if (shadowCenter.distanceTo(center) > 3) {
      shadowCenter.copy(center);
      key.target.position.copy(shadowCenter);
      key.position.copy(shadowCenter).add(new THREE.Vector3(-10, 14, 9));
      renderer.shadowMap.needsUpdate = true;
    }
    const horizontal = Math.cos(altitude) * distance;
    view.position.set(
      center.x + Math.sin(angle) * horizontal,
      center.y + Math.sin(altitude) * distance,
      center.z + Math.cos(angle) * horizontal,
    );
    view.lookAt(center);
    view.updateMatrixWorld();
  }

  function focus(animate) {
    const record = currentRecords.find(({ id }) => id === settings.active);
    if (!record) return;
    const [x, z] = positionFor(settings.active, settings.source);
    const first = settings.active === generation[settings.source].stops[0];
    const extraRoom = view.aspect < 1.15 ? 0 : first ? 2.25 : .55;
    cameraTo.set(x + extraRoom, Math.max(.65, record.extent.y * .31), z - .06);
    const wideFactor = Math.max(1, 1.35 / view.aspect);
    const targetDistance = Math.max(first ? 16.7 : 13.6, record.extent.y * 2.52, record.extent.x * 1.98) * wideFactor;
    if (!animate || settings.reduced) {
      transition = null;
      mount.removeAttribute('data-camera-moving');
      center.copy(cameraTo);
      angle = .37;
      altitude = .50;
      distance = targetDistance;
      clearLeaving();
      return;
    }
    cameraFrom.copy(center);
    mount.setAttribute('data-camera-moving', '');
    transition = {
      start: performance.now(), duration: center.distanceTo(cameraTo) > 16 ? 1460 : 1000,
      fromDistance: distance, toDistance: targetDistance, fromAngle: angle, fromAltitude: altitude,
    };
  }

  function clearLeaving() {
    for (const record of leavingRecords) {
      if (!currentRecords.includes(record)) record.model.visible = false;
    }
    leavingRecords = [];
  }

  function scheduleFrame() {
    if (!lost && frameId === null) frameId = requestAnimationFrame(renderFrame);
  }

  function renderFrame(now) {
    frameId = null;
    if (lost || !settings) return;
    const elapsed = lastFrame ? Math.min((now - lastFrame) / 1000, .05) : 0;
    lastFrame = now;
    if (transition) {
      const progress = Math.min((now - transition.start) / transition.duration, 1);
      const eased = progress * progress * (3 - 2 * progress);
      center.lerpVectors(cameraFrom, cameraTo, eased);
      distance = THREE.MathUtils.lerp(transition.fromDistance, transition.toDistance, eased);
      if (transition.duration > 1000) distance += Math.sin(progress * Math.PI) * 3.5;
      angle = THREE.MathUtils.lerp(transition.fromAngle, .37, eased);
      altitude = THREE.MathUtils.lerp(transition.fromAltitude, .50, eased);
      if (progress === 1) {
        transition = null;
        mount.removeAttribute('data-camera-moving');
        clearLeaving();
      }
    }
    if (!settings.reduced) {
      animationTime += elapsed;
      for (const { rotors } of currentRecords) {
        for (const rotor of rotors) {
          const { axis, speed } = rotor.userData.spin;
          rotor.rotation[axis] += speed * elapsed;
        }
      }
      for (const { curve, sparks } of movingCables) {
        sparks.forEach((spark, i) => {
          curve.getPointAt((animationTime * .52 + i / sparks.length) % 1, spark.position);
          spark.position.y += .025;
        });
      }
    }
    placeCamera();
    layoutLabels();
    renderer.render(scene, view);
    if (transition || !settings.reduced) scheduleFrame();
  }

  function update(next) {
    if (lost) return;
    const previous = settings;
    const changedModel = !previous || previous.active !== next.active || previous.source !== next.source || previous.cutaway !== next.cutaway;
    const changedRoute = !previous || previous.source !== next.source || previous.mode !== next.mode;
    settings = { ...next };
    if (!previous || previous.source !== next.source) buildTracks(next.source);
    energize(routeFor(next.source, next.mode), next.mode);
    if (changedModel) {
      renderer.shadowMap.needsUpdate = true;
      leavingRecords = [...new Set([...leavingRecords, ...currentRecords])];
      const phase = modelPhase[next.active];
      currentRecords = visibleStops(next.source, phase).map((id) => getRecord(id, next.source, next.cutaway && id === next.active));
      for (const record of currentRecords) record.model.visible = true;
      // Keep the adjoining scene visible during a camera move, but switch models in place for a cutaway.
      const sameStop = previous?.active === next.active;
      const samePhase = previous && modelPhase[previous.active] === phase;
      if ((samePhase && !transition) || sameStop || next.reduced) clearLeaving();
      if (!sameStop || previous.source !== next.source) focus(Boolean(previous));
    }
    if (next.reduced && transition) focus(false);
    if (changedModel || changedRoute) updateLabels();
    scheduleFrame();
  }

  const size = new ResizeObserver(() => {
    width = mount.clientWidth;
    height = mount.clientHeight;
    if (!width || !height) return;
    view.aspect = width / height;
    view.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    if (settings) focus(false);
    scheduleFrame();
  });
  size.observe(mount);

  function cancelTravel() {
    if (transition) {
      transition = null;
      mount.removeAttribute('data-camera-moving');
      clearLeaving();
    }
  }

  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || drag) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    canvas.setPointerCapture(event.pointerId);
    onInteract();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const x = event.clientX - drag.x;
    const y = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(x, y) < 4) return;
    drag.moved = true;
    cancelTravel();
    angle -= x * .006;
    altitude = THREE.MathUtils.clamp(altitude + y * .005, .16, 1.32);
    drag.x = event.clientX;
    drag.y = event.clientY;
    scheduleFrame();
  });
  canvas.addEventListener('pointerup', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const shouldPick = !drag.moved;
    drag = null;
    if (!shouldPick) return;
    const bounds = canvas.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2);
    hit.setFromCamera(pointer, view);
    const intersections = hit.intersectObjects(currentRecords.map(({ model }) => model), true);
    const item = intersections.find(({ object }) => object.material !== shadows);
    if (!item) return;
    let target = item.object;
    while (target.parent && !target.userData.component) target = target.parent;
    if (target.userData.component) select(target.userData.component);
  });
  canvas.addEventListener('lostpointercapture', () => { drag = null; });

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(frameId);
    hotspots.replaceChildren();
    onUnavailable();
  });

  return {
    update,
    canCutaway: (id) => !lost && cutaways.has(id),
    zoom(factor) {
      cancelTravel();
      distance = THREE.MathUtils.clamp(distance * factor, 5, 44);
      scheduleFrame();
    },
    reset() {
      focus(true);
      scheduleFrame();
    },
  };
}
