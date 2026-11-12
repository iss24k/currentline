import * as THREE from 'three';
import { generationModels } from './generation-models.js';
import { infrastructureModels } from './infrastructure-models.js';
import { modelLabels, modelPhase, routeFor, visibleStops } from './route.js';
import { createJourneySettings, environmentFor, heatModel, isInterior, worldPosition } from './journey-settings.js';
import { createEnergyTrace, flowTarget } from './energy-trace.js';

const factories = { ...generationModels, ...infrastructureModels, heat: heatModel };
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

function floorMaterial() {
  const texture = concreteTexture();
  texture.repeat.set(5, 2);
  const bump = texture.clone();
  bump.colorSpace = THREE.NoColorSpace;
  return new THREE.MeshStandardMaterial({
    map: texture, bumpMap: bump, bumpScale: .019, roughness: .91, metalness: .02, envMapIntensity: .27,
  });
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

export function createStage({ mount, hotspots, select, onUnavailable, onInteract, onViewReset }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.19;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  mount.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x536769);
  scene.fog = new THREE.FogExp2(0x88999a, .020);
  const environment = studioEnvironment(renderer);
  scene.environment = environment.texture;
  scene.environmentIntensity = .94;
  const journey = createJourneySettings(scene, floorMaterial());
  const energy = createEnergyTrace(scene);
  const brushedMetal = metalTexture();

  const skyLight = new THREE.HemisphereLight(0xe2ebf0, 0x777163, 1.10);
  const key = new THREE.DirectionalLight(0xffeddb, 2.83);
  const lightOffset = new THREE.Vector3(-7, 8, 6);
  key.position.copy(lightOffset);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -13, right: 13, top: 11, bottom: -11, near: 1, far: 42 });
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.normalBias = .038;
  key.shadow.bias = -.00021;
  scene.add(key.target);
  const fill = new THREE.DirectionalLight(0xdce9f2, 1.29);
  fill.position.set(5, 6, 9);
  const subjectLight = new THREE.SpotLight(0xfff4e7, 96, 27, .43, .79, 2);
  const subjectOffset = new THREE.Vector3(-2.6, 5.2, 6.2);
  scene.add(skyLight, key, fill, subjectLight, subjectLight.target);

  const view = new THREE.PerspectiveCamera(34, 1, .09, 290);
  const center = new THREE.Vector3();
  const cameraFrom = new THREE.Vector3();
  const cameraTo = new THREE.Vector3();
  const shadowCenter = new THREE.Vector3(Infinity, 0, 0);
  const orbitPoint = new THREE.Vector3();
  const viewTarget = new THREE.Vector3();
  const flightPoint = new THREE.Vector3();
  const flightAhead = new THREE.Vector3();
  const flightSide = new THREE.Vector3();
  const yUp = new THREE.Vector3(0, 1, 0);
  const roomFog = new THREE.Color(0x3b494d);
  const openFog = new THREE.Color(0x8b9a99);
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
  let flowFocused = false;
  let textSpace = 0;

  const cache = new Map();
  const modelRoot = new THREE.Group();
  const shadows = new THREE.MeshBasicMaterial({ map: contactTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
  scene.add(modelRoot);
  const projection = new THREE.Vector3();
  const hit = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let labels = [];
  let currentRecords = [];
  let leavingRecords = [];

  function getRecord(id, source) {
    const key = id + (modelPhase[id] === 'generation' ? `/${source}` : '');
    if (cache.has(key)) return cache.get(key);
    const model = factories[id]();
    const [x, z] = worldPosition(id, source);
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
      button.hidden = Boolean(transition?.flightMix > .28) || projection.z < -1 || projection.z > 1 || rawX < 25 || rawX > width - 25 || rawY < -52 || rawY > height - 44 || overlap || (!active && rawX < leftGuard);
      if (!button.hidden) {
        button.style.left = `${centerX}px`;
        button.style.top = `${y}px`;
        occupied.push(box);
      }
    }
  }

  function placeCamera(elapsed) {
    const location = environmentFor(settings.active);
    const inside = isInterior(location);
    const smooth = elapsed ? Math.min(1, elapsed * 6) : 1;
    scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, inside ? .034 : .021, smooth);
    scene.fog.color.lerp(inside ? roomFog : openFog, smooth);
    key.intensity = THREE.MathUtils.lerp(key.intensity, inside ? 2.24 : 2.83, smooth);
    skyLight.intensity = THREE.MathUtils.lerp(skyLight.intensity, inside ? .82 : 1.16, smooth);
    if (shadowCenter.distanceTo(center) > 2.2) {
      shadowCenter.copy(center);
      key.target.position.copy(shadowCenter);
      key.position.copy(shadowCenter).add(lightOffset);
      renderer.shadowMap.needsUpdate = true;
    }
    subjectLight.position.copy(center).add(subjectOffset);
    subjectLight.target.position.copy(center);
    subjectLight.intensity = inside ? 92 : 51;
    const horizontal = Math.cos(altitude) * distance;
    orbitPoint.set(
      center.x + Math.sin(angle) * horizontal,
      center.y + Math.sin(altitude) * distance,
      center.z + Math.cos(angle) * horizontal,
    );
    viewTarget.copy(center);
    view.position.copy(orbitPoint);
    const flightMix = transition?.flightMix ?? 0;
    if (flightMix > 0) {
      const { curve, reversed } = transition.flight;
      const t = reversed ? 1 - transition.pathProgress : transition.pathProgress;
      curve.getPointAt(t, flightPoint);
      curve.getPointAt(THREE.MathUtils.clamp(t + (reversed ? -.055 : .055), 0, 1), flightAhead);
      flightSide.copy(flightAhead).sub(flightPoint).normalize().cross(yUp).normalize();
      if (flightSide.lengthSq() < .01) flightSide.set(0, 0, 1);
      if (flightSide.z < 0) flightSide.negate();
      view.position.lerp(flightPoint.addScaledVector(flightSide, transition.flySide).addScaledVector(yUp, transition.flyHeight), flightMix);
      viewTarget.lerp(flightAhead.addScaledVector(yUp, .17), flightMix);
    }
    const field = 34 + flightMix * 15;
    if (view.fov !== field) view.fov = field;
    if (width > 1 && height > 1) {
      view.setViewOffset(width, height, -width * textSpace * (1 - flightMix), height * .035, width, height);
    }
    view.lookAt(viewTarget);
    view.updateMatrixWorld();
    journey.update(view, settings.source, location, elapsed, Math.cos(angle) < -.48);
  }

  function focus(animate, flight = null) {
    const record = currentRecords.find(({ id }) => id === settings.active);
    if (!record) return;
    const [x, z] = worldPosition(settings.active, settings.source);
    const id = settings.active;
    const lowEquipment = record.extent.y < 2;
    const targetAngle = flowFocused ? .15 : id === 'lines' ? .39 : id === 'wind' ? -.18 : .25;
    const targetAltitude = flowFocused ? .26 : lowEquipment ? .41 : id === 'gas' ? .19 : id === 'lines' ? .19 : .24;
    if (flowFocused) cameraTo.copy(flowTarget(id, settings.source, settings.mode));
    else cameraTo.set(x, Math.max(.50, record.extent.y * .43), z - .06);
    const widthFactor = Math.max(1, 1.11 / view.aspect);
    const targetDistance = (flowFocused
      ? Math.max(2.1, Math.min(3.8, record.extent.x * .47))
      : Math.max(lowEquipment ? 8.7 : 10.25, record.extent.y * 2.43, record.extent.x * 2.04)) * widthFactor;
    if (!animate || settings.reduced) {
      transition = null;
      mount.removeAttribute('data-camera-moving');
      mount.removeAttribute('data-flight');
      center.copy(cameraTo);
      angle = targetAngle;
      altitude = targetAltitude;
      distance = targetDistance;
      clearLeaving();
      return;
    }
    cameraFrom.copy(center);
    mount.setAttribute('data-camera-moving', '');
    mount.toggleAttribute('data-flight', Boolean(flight));
    const span = center.distanceTo(cameraTo);
    transition = {
      start: performance.now(), duration: flight ? (span > 17 ? 1490 : 1180) : (span > 28 ? 1370 : 830),
      fromDistance: distance, toDistance: targetDistance, fromAngle: angle, fromAltitude: altitude,
      toAngle: targetAngle, toAltitude: targetAltitude, flight, flightMix: 0, pathProgress: 0,
      flySide: span > 17 ? 1.35 : .92, flyHeight: span > 17 ? 1.09 : .74,
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
      if (transition.duration > 1000 && !transition.flight) distance += Math.sin(progress * Math.PI) * 4.3;
      angle = THREE.MathUtils.lerp(transition.fromAngle, transition.toAngle, eased);
      altitude = THREE.MathUtils.lerp(transition.fromAltitude, transition.toAltitude, eased);
      if (transition.flight) {
        transition.pathProgress = THREE.MathUtils.smootherstep(progress, .12, .88) * .90 + .05;
        transition.flightMix = THREE.MathUtils.smootherstep(progress, .04, .32)
          * (1 - THREE.MathUtils.smootherstep(progress, .63, .98));
      }
      if (progress === 1) {
        transition = null;
        mount.removeAttribute('data-camera-moving');
        mount.removeAttribute('data-flight');
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
    }
    energy.animate(animationTime, Boolean(transition?.flightMix > .3));
    placeCamera(settings.reduced ? 0 : elapsed);
    layoutLabels();
    renderer.render(scene, view);
    if (transition || !settings.reduced) scheduleFrame();
  }

  function update(next) {
    if (lost) return;
    const previous = settings;
    const changedModel = !previous || previous.active !== next.active || previous.source !== next.source;
    const changedRoute = !previous || previous.source !== next.source || previous.mode !== next.mode;
    settings = { ...next };
    const route = routeFor(next.source, next.mode);
    energy.select(settings, route);
    mount.dataset.journeyEnvironment = environmentFor(next.active);
    if (changedModel) {
      const sameStop = previous?.active === next.active;
      if (!sameStop || previous?.source !== next.source) flowFocused = false;
      renderer.shadowMap.needsUpdate = true;
      leavingRecords = [...new Set([...leavingRecords, ...currentRecords])];
      const phase = modelPhase[next.active];
      const [x] = worldPosition(next.active, next.source);
      const sceneIds = new Set(visibleStops(next.source, phase));
      sceneIds.add(next.active);
      currentRecords = [...sceneIds]
        .filter((id) => Math.abs(worldPosition(id, next.source)[0] - x) < 28)
        .map((id) => getRecord(id, next.source));
      for (const record of currentRecords) record.model.visible = true;
      const samePhase = previous && modelPhase[previous.active] === phase;
      const flight = previous && next.travel === 'fly' && previous.source === next.source && !sameStop
        ? energy.flightPath(previous.active, next.active) : null;
      if ((samePhase && !flight && !transition) || sameStop || next.reduced) clearLeaving();
      if (!sameStop || previous.source !== next.source) focus(Boolean(previous), flight);
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
    textSpace = width >= 880 ? .16 : width >= 640 ? .09 : 0;
    renderer.setSize(width, height, false);
    if (settings) focus(false);
    scheduleFrame();
  });
  size.observe(mount);

  function cancelTravel() {
    if (transition) {
      transition = null;
      mount.removeAttribute('data-camera-moving');
      mount.removeAttribute('data-flight');
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
    flowFocused = false;
    focus(true);
    scheduleFrame();
    onViewReset?.();
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
    distance = THREE.MathUtils.clamp(distance * factor, flowFocused ? .86 : 1.65, 45);
    scheduleFrame();
  }

  return {
    update,
    zoom,
    focusFlow() {
      if (!settings || lost) return;
      flowFocused = true;
      focus(true);
      scheduleFrame();
    },
    reset() {
      flowFocused = false;
      focus(true);
      scheduleFrame();
    },
  };
}
