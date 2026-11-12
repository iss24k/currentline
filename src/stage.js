import * as THREE from 'three';
import { generationModels, generationCutaways } from './generation-models.js';
import { infrastructureModels, infrastructureCutaways } from './infrastructure-models.js';
import {
  generation, grid, modelLabels, modelPhase, positionFor, routeFor, server, siteEntry,
  siteOutput, visibleStops,
} from './route.js';

const factories = { ...generationModels, ...infrastructureModels };
const cutaways = new Set([...generationCutaways, ...infrastructureCutaways]);
const floorLevel = -.012;
const fogColor = 0x303331;
const activeWire = new THREE.MeshBasicMaterial({ color: 0xb98346 });
const sleepingWire = new THREE.MeshStandardMaterial({ color: 0x302e2b, metalness: .26, roughness: .7 });

function rectangle(parent, material, x, y, z, w, h, d) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function randomGenerator(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function studioEnvironment(renderer) {
  const width = 256;
  const height = 128;
  const pixels = new Float32Array(width * height * 4);
  const lights = [
    { x: .78, y: .26, w: .19, h: .12, color: [3.15, 2.62, 2.12] },
    { x: .21, y: .36, w: .1, h: .17, color: [1.03, 1.25, 1.42] },
    { x: .42, y: .16, w: .15, h: .08, color: [.88, .87, .81] },
  ];
  for (let y = 0; y < height; y += 1) {
    const vertical = y / height;
    for (let x = 0; x < width; x += 1) {
      const horizontal = x / width;
      const index = (y * width + x) * 4;
      const sky = Math.max(.022, .23 - vertical * .34);
      pixels[index] = sky;
      pixels[index + 1] = sky * 1.03;
      pixels[index + 2] = sky * 1.06;
      pixels[index + 3] = 1;
      for (const light of lights) {
        const dx = (horizontal - light.x) / light.w;
        const dy = (vertical - light.y) / light.h;
        const weight = Math.exp(-4 * (dx ** 4 + dy ** 4));
        for (let channel = 0; channel < 3; channel += 1) pixels[index + channel] += light.color[channel] * weight;
      }
    }
  }
  const texture = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat, THREE.FloatType);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromEquirectangular(texture);
  texture.dispose();
  generator.dispose();
  return target;
}

function makeTexture(size, draw, colorSpace = THREE.NoColorSpace) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = colorSpace;
  texture.anisotropy = 8;
  return texture;
}

function concreteTexture() {
  return makeTexture(512, (ctx, size) => {
    const pixels = ctx.createImageData(size, size);
    const rng = randomGenerator(1912);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const index = (y * size + x) * 4;
        const u = x / size * Math.PI * 2;
        const v = y / size * Math.PI * 2;
        const cloud = Math.sin(u * 2 + Math.sin(v * 3)) * 4.5
          + Math.sin(v * 4 + u + Math.sin(u * 5)) * 3.1
          + Math.sin(u * 11 - v * 9 + Math.sin(v * 5)) * 1.8;
        const noise = rng();
        const edge = Math.min(x, y, size - x - 1, size - y - 1);
        const joint = edge < 2 ? -27 : edge < 3 ? -11 : edge < 5 ? 4 : 0;
        const grain = (noise - .5) * 15 - (noise < .021 ? 13 : 0);
        const value = 94 + cloud + grain + joint;
        pixels.data[index] = value * 1.018;
        pixels.data[index + 1] = value;
        pixels.data[index + 2] = value * .97;
        pixels.data[index + 3] = 255;
      }
    }
    ctx.putImageData(pixels, 0, 0);

    for (let i = 0; i < 90; i += 1) {
      const x = rng() * size;
      const y = rng() * size;
      const radius = 4 + rng() * 28;
      const stain = ctx.createRadialGradient(x, y, 0, x, y, radius);
      stain.addColorStop(0, 'rgba(24,23,20,.12)');
      stain.addColorStop(1, 'rgba(24,23,20,0)');
      ctx.fillStyle = stain;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
  }, THREE.SRGBColorSpace);
}

function addGround(scene) {
  const width = 420;
  const texture = concreteTexture();
  texture.repeat.set(width / 8, width / 8);
  const bump = texture.clone();
  bump.colorSpace = THREE.NoColorSpace;
  const material = new THREE.MeshStandardMaterial({
    map: texture, bumpMap: bump, bumpScale: .018, roughness: .89, metalness: .02, envMapIntensity: .28,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(width, width), material);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(68, floorLevel, 0);
  ground.receiveShadow = true;
  scene.add(ground);
}

function metalTexture() {
  return makeTexture(192, (ctx, size) => {
    const pixels = ctx.createImageData(size, size);
    const rng = randomGenerator(180);
    for (let y = 0; y < size; y += 1) {
      const band = rng();
      for (let x = 0; x < size; x += 1) {
        const index = (y * size + x) * 4;
        const n = 180 + (band - .5) * 38 + (rng() - .5) * 22;
        pixels.data.set([n, n, n, 255], index);
      }
    }
    ctx.putImageData(pixels, 0, 0);
  });
}

const galvanized = new THREE.MeshStandardMaterial({ color: 0x666763, metalness: .6, roughness: .56 });
const paintedSteel = new THREE.MeshStandardMaterial({ color: 0x383c3b, metalness: .37, roughness: .61 });
const roof = new THREE.MeshStandardMaterial({ color: 0x4d504c, metalness: .47, roughness: .68 });
const darkSteel = new THREE.MeshStandardMaterial({ color: 0x1c1f1e, metalness: .34, roughness: .63 });
const concreteWall = new THREE.MeshStandardMaterial({ color: 0x4d504c, roughness: .9 });
const windowGlass = new THREE.MeshStandardMaterial({ color: 0x242b2c, roughness: .26, metalness: .38 });
const practical = new THREE.MeshBasicMaterial({ color: 0xa8987a });
const fixture = new THREE.MeshStandardMaterial({
  color: 0xb7ac96, emissive: 0x9a7b4a, emissiveIntensity: .46, roughness: .74,
});
const roadStripe = new THREE.MeshBasicMaterial({ color: 0x63543c });

function metalBuilding(parent, x, z, width, height, depth) {
  rectangle(parent, concreteWall, x, height / 2, z, width, height, depth);
  const front = z + depth / 2;
  rectangle(parent, roof, x, height + .16, z, width + .55, .31, depth + .5);
  for (let rib = -width / 2 + .3; rib < width / 2; rib += .54) {
    rectangle(parent, paintedSteel, x + rib, height * .5, front + .027, .05, height - .24, .073);
  }
  for (let bay = -width / 2 + 1.8; bay < width / 2 - 1; bay += 3.7) {
    const bx = x + bay;
    rectangle(parent, darkSteel, bx, height * .67, front + .052, 2.87, .81, .08);
    rectangle(parent, windowGlass, bx, height * .67, front + .10, 2.67, .63, .021);
    rectangle(parent, galvanized, bx, height * .67, front + .113, .033, .63, .025);
    rectangle(parent, paintedSteel, bx, height * .67 - .4, front + .117, 2.88, .07, .20);
  }
  rectangle(parent, paintedSteel, x, .27, front + .023, width, .54, .07);
}

function pipeRun(parent, x, z, span, y) {
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, span, 18), galvanized);
  pipe.position.set(x, y, z);
  pipe.rotation.z = Math.PI / 2;
  parent.add(pipe);
  for (let offset = -span / 2 + .7; offset < span / 2; offset += 3.8) {
    rectangle(parent, paintedSteel, x + offset, y / 2 - .10, z, .15, y - .2, .14);
    rectangle(parent, concreteWall, x + offset, .13, z, .38, .26, .4);
    rectangle(parent, galvanized, x + offset, y - .15, z, .20, .10, .36);
  }
}

function fence(parent, start, end, z) {
  const height = 1.85;
  for (let x = start; x <= end; x += 2.5) {
    rectangle(parent, galvanized, x, height / 2, z, .067, height, .067);
    rectangle(parent, concreteWall, x, .11, z, .19, .22, .19);
  }
  for (const y of [.25, 1.12, 1.79]) {
    rectangle(parent, paintedSteel, (start + end) / 2, y, z, end - start, .032, .034);
  }
}

function addSettings(scene) {
  const contexts = {
    gas: new THREE.Group(), nuclear: new THREE.Group(), solar: new THREE.Group(),
    wind: new THREE.Group(), hydro: new THREE.Group(),
  };

  metalBuilding(contexts.gas, -1, -18, 29, 6.4, 6.3);
  for (const x of [-10.2, 0.9, 8.3]) {
    rectangle(contexts.gas, darkSteel, x, 3.55, -14.73, .62, .16, .31);
    rectangle(contexts.gas, fixture, x, 3.46, -14.69, .47, .021, .21);
  }
  pipeRun(contexts.gas, 2, -8.5, 27, 1.35);
  pipeRun(contexts.gas, 2, -9, 27, 1.64);
  for (const [x, height] of [[-11, 8.9], [-8.6, 10.1], [10.2, 7.1]]) {
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(.26, .33, height, 28), galvanized);
    stack.position.set(x, height / 2, -13.5);
    contexts.gas.add(stack);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .17, 28), paintedSteel);
    ring.position.set(x, height - .16, -13.5);
    contexts.gas.add(ring);
  }

  metalBuilding(contexts.nuclear, 1, -19, 27, 5.6, 6.5);
  fence(contexts.nuclear, -16, 16, -10.5);
  fence(contexts.solar, -15, 14, -10);
  fence(contexts.wind, -15, 14, -10);
  rectangle(contexts.hydro, concreteWall, 0, .41, -12, 32, .87, .3);

  const yard = new THREE.Group();
  fence(yard, 18, 48, -8.8);
  const facility = new THREE.Group();
  metalBuilding(facility, 77, -21, 53, 7.3, 6.8);
  for (let x = 53; x <= 101; x += 9.4) {
    rectangle(facility, paintedSteel, x, 2.8, -17.38, .25, 5.6, .22);
    rectangle(facility, darkSteel, x, 3.32, -17.13, .63, .17, .36);
    rectangle(facility, practical, x, 3.23, -17.09, .50, .025, .25);
  }
  const rows = new THREE.Group();
  for (let x = 105; x < 159; x += 1.55) {
    rectangle(rows, darkSteel, x, 2.12, -13, 1.45, 4.24, 1.95);
    rectangle(rows, paintedSteel, x, 2.12, -12.015, 1.18, 3.96, .041);
    for (const y of [.51, 1.24, 1.96, 2.69, 3.42]) {
      rectangle(rows, darkSteel, x, y, -11.981, 1.07, .56, .045);
    }
    rectangle(rows, galvanized, x + .54, 2.12, -11.953, .035, 3.93, .04);
    if (Math.round(x) % 2 === 0) rectangle(rows, practical, x + .39, 3.6, -11.95, .07, .022, .02);
  }

  for (const [start, end, z] of [[-12, 12, 3.9], [20, 43, 4.7], [52, 100, 4.7], [111, 151, 3.8]]) {
    for (let x = start; x <= end; x += 2.8) {
      rectangle(scene, roadStripe, x, floorLevel + .004, z, 1.35, .004, .042);
    }
  }
  const backdrop = new THREE.Group();
  backdrop.add(yard, facility, rows, ...Object.values(contexts));
  scene.add(backdrop);
  return { backdrop, contexts };
}

function contactTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 5, 32, 32, 31);
  gradient.addColorStop(0, 'rgba(0, 0, 0, .67)');
  gradient.addColorStop(.55, 'rgba(0, 0, 0, .42)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

function makeCable(start, end, offset) {
  const [sx, sz] = start;
  const [ex, ez] = end;
  const span = ex - sx;
  return new THREE.CubicBezierCurve3(
    new THREE.Vector3(sx, .015, sz + offset),
    new THREE.Vector3(sx + span * .54, .015, sz + offset),
    new THREE.Vector3(ex - span * .54, .015, ez + offset),
    new THREE.Vector3(ex, .015, ez + offset),
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
  renderer.toneMappingExposure = 1.09;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  mount.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(fogColor);
  scene.fog = new THREE.FogExp2(fogColor, .038);
  const environment = studioEnvironment(renderer);
  scene.environment = environment.texture;
  scene.environmentIntensity = .82;
  addGround(scene);
  const { backdrop, contexts } = addSettings(scene);
  const brushedMetal = metalTexture();

  const skyLight = new THREE.HemisphereLight(0xd1d5cf, 0x595247, .8);
  const key = new THREE.DirectionalLight(0xffe9cf, 2.52);
  const lightOffset = new THREE.Vector3(-7, 9, -5);
  key.position.copy(lightOffset);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -13, right: 13, top: 11, bottom: -11, near: 1, far: 42 });
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.normalBias = .038;
  key.shadow.bias = -.00021;
  scene.add(key.target);
  const fill = new THREE.DirectionalLight(0xd5deda, 1.29);
  fill.position.set(5, 6, 9);
  const subjectLight = new THREE.SpotLight(0xfff4e7, 96, 27, .43, .79, 2);
  const subjectOffset = new THREE.Vector3(-2.6, 5.2, 6.2);
  scene.add(skyLight, key, fill, subjectLight, subjectLight.target);

  const view = new THREE.PerspectiveCamera(33, 1, .15, 180);
  const center = new THREE.Vector3();
  const cameraFrom = new THREE.Vector3();
  const cameraTo = new THREE.Vector3();
  const shadowCenter = new THREE.Vector3(Infinity, 0, 0);
  let angle = .25;
  let altitude = .28;
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
  const sparkPaint = new THREE.MeshBasicMaterial({ color: 0xf6c588 });
  const sparkGeometry = new THREE.SphereGeometry(.036, 8, 6);
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
      const finish = part.material;
      if (finish?.isMeshStandardMaterial && finish.metalness >= .24 && !finish.roughnessMap) {
        finish.roughnessMap = brushedMetal;
        finish.needsUpdate = true;
      }
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
      const strand = new THREE.Mesh(new THREE.TubeGeometry(curve, 38, .021, 6, false), activeWire);
      track.add(strand);
      const sparks = Array.from({ length: 2 }, () => {
        const spark = new THREE.Mesh(sparkGeometry, sparkPaint);
        cableRoot.add(spark);
        return spark;
      });
      cableRoot.add(track);
      return { from, to, curve, strand, sparks };
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
      cable.strand.material = active ? activeWire : sleepingWire;
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
      button.innerHTML = `<span class="spot-dot" aria-hidden="true"></span><span>${modelLabels[record.id]}</span>`;
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
    const leftGuard = view.aspect > 1.2 ? width * .32 : 0;
    for (const { button, record } of sorted) {
      projection.copy(record.anchor).project(view);
      const rawX = (projection.x + 1) * width * .5;
      const rawY = (1 - projection.y) * height * .5;
      const active = record.id === settings.active;
      const labelInset = Math.min(92, width / 4);
      const centerX = THREE.MathUtils.clamp(rawX, labelInset, width - labelInset);
      const y = THREE.MathUtils.clamp(rawY, width >= 760 ? 113 : 92, height * .75);
      const box = { x1: centerX - 70, x2: centerX + 70, y1: y - 24, y2: y };
      const overlap = !active && occupied.some((rect) => rect.x1 < box.x2 && rect.x2 > box.x1 && rect.y1 < box.y2 && rect.y2 > box.y1);
      button.hidden = projection.z < -1 || projection.z > 1 || rawX < 25 || rawX > width - 25 || rawY < -52 || rawY > height - 44 || overlap || (!active && rawX < leftGuard);
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
      key.position.copy(shadowCenter).add(lightOffset);
      renderer.shadowMap.needsUpdate = true;
    }
    subjectLight.position.copy(center).add(subjectOffset);
    subjectLight.target.position.copy(center);
    // Context walls face the route. A rear orbit keeps the model unobstructed.
    backdrop.visible = Math.cos(angle) > -.50;
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
    const id = settings.active;
    const lowEquipment = record.extent.y < 2;
    const targetAngle = id === 'lines' ? .39 : id === 'wind' ? -.18 : .25;
    const targetAltitude = lowEquipment ? .43 : id === 'gas' ? .24 : .28;
    cameraTo.set(x, Math.max(.48, record.extent.y * .43), z - .06);
    const widthFactor = Math.max(1, 1.12 / view.aspect);
    const targetDistance = Math.max(lowEquipment ? 8.1 : 9.8, record.extent.y * 2.55, record.extent.x * 2.03) * widthFactor;
    if (!animate || settings.reduced) {
      transition = null;
      mount.removeAttribute('data-camera-moving');
      center.copy(cameraTo);
      angle = targetAngle;
      altitude = targetAltitude;
      distance = targetDistance;
      clearLeaving();
      return;
    }
    cameraFrom.copy(center);
    mount.setAttribute('data-camera-moving', '');
    transition = {
      start: performance.now(), duration: center.distanceTo(cameraTo) > 16 ? 1480 : 900,
      fromDistance: distance, toDistance: targetDistance, fromAngle: angle, fromAltitude: altitude,
      toAngle: targetAngle, toAltitude: targetAltitude,
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
      angle = THREE.MathUtils.lerp(transition.fromAngle, transition.toAngle, eased);
      altitude = THREE.MathUtils.lerp(transition.fromAltitude, transition.toAltitude, eased);
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
          spark.position.y += .012;
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
    if (!previous || previous.source !== next.source) {
      for (const [id, context] of Object.entries(contexts)) context.visible = id === next.source;
      buildTracks(next.source);
    }
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
    const textSpace = width >= 880 ? .16 : width >= 640 ? .09 : 0;
    view.setViewOffset(width, height, -width * textSpace, height * .035, width, height);
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
  canvas.addEventListener('wheel', (event) => {
    if (event.ctrlKey || event.metaKey || !event.deltaY) return;
    event.preventDefault();
    onInteract();
    const delta = event.deltaY * (event.deltaMode ? 14 : 1);
    zoom(Math.exp(THREE.MathUtils.clamp(delta, -240, 240) * .0017));
  }, { passive: false });
  canvas.addEventListener('dblclick', () => {
    focus(true);
    scheduleFrame();
  });

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(frameId);
    hotspots.replaceChildren();
    onUnavailable();
  });

  function zoom(factor) {
    cancelTravel();
    distance = THREE.MathUtils.clamp(distance * factor, 4.5, 39);
    scheduleFrame();
  }

  return {
    update,
    canCutaway: (id) => !lost && cutaways.has(id),
    zoom,
    reset() {
      focus(true);
      scheduleFrame();
    },
  };
}
