import * as THREE from 'three';
import { generationModels } from './generation-models.js';
import { infrastructureModels } from './infrastructure-models.js';
import { modelLabels, modelPhase } from './route.js';
import { createJourneySettings, environmentFor, heatModel, isInterior, worldPosition } from './journey-settings.js';
import { beatPath, beatPathForm } from './energy-trace.js';
import { createOnsiteAssembly, createGuideParticles } from './onsite-assembly.js';

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

export function createStage({ mount, hotspots, selectPart, onUnavailable }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: false });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.17;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  mount.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x536769);
  scene.fog = new THREE.FogExp2(0x88999a, .020);
  const environment = studioEnvironment(renderer);
  scene.environment = environment.texture;
  scene.environmentIntensity = 1.03;
  const journey = createJourneySettings(scene, floorMaterial());
  const guide = createGuideParticles(scene);
  const brushedMetal = metalTexture();

  const skyLight = new THREE.HemisphereLight(0xe2ebf0, 0x777163, 1.10);
  const key = new THREE.DirectionalLight(0xffeddb, 2.83);
  const lightOffset = new THREE.Vector3(-7, 8, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -11, right: 11, top: 10, bottom: -10, near: 1, far: 42 });
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.normalBias = .038;
  key.shadow.bias = -.00021;
  const fill = new THREE.DirectionalLight(0xdce9f2, 1.29);
  fill.position.set(5, 6, 9);
  const subjectLight = new THREE.SpotLight(0xfff4e7, 96, 27, .43, .79, 2);
  const subjectOffset = new THREE.Vector3(-2.6, 5.2, 6.2);
  scene.add(skyLight, key, key.target, fill, subjectLight, subjectLight.target);

  const camera = new THREE.PerspectiveCamera(34, 1, .035, 290);
  const center = new THREE.Vector3();
  const shadowCenter = new THREE.Vector3(Infinity, 0, 0);
  const local = new THREE.Vector3();
  const roomFog = new THREE.Color(0x3b494d);
  const openFog = new THREE.Color(0x8b9a99);
  const cache = new Map();
  const shadows = new THREE.MeshBasicMaterial({ map: contactTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
  let current;
  let settings;
  let inspectState;
  let beat;
  let beatMode;
  let projectionLabels = [];
  let azimuth = .25;
  let altitude = .30;
  let distance = 13;
  let width = 1;
  let height = 1;
  let motion;
  let frame = null;
  let previousFrame = 0;
  let lost = false;

  function getRecord(id, source) {
    const cacheKey = modelPhase[id] === 'generation' ? `${id}/${source}` : id;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    const model = factories[id]();
    const [x, z] = worldPosition(id, source);
    const bounds = new THREE.Box3().setFromObject(model, true);
    const extent = bounds.getSize(new THREE.Vector3());
    const midpoint = bounds.getCenter(new THREE.Vector3());
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
    const contact = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(2.8, extent.x * 1.24), Math.max(2.5, extent.z * 1.27)), shadows);
    contact.rotation.x = -Math.PI / 2;
    contact.position.set(midpoint.x, .006, midpoint.z);
    model.add(contact);
    scene.add(model);
    model.updateWorldMatrix(true, true);
    const assembly = createOnsiteAssembly(model);
    const record = { id, model, rotors, midpoint, extent, assembly };
    cache.set(cacheKey, record);
    return record;
  }

  function makeLabels() {
    hotspots.replaceChildren();
    projectionLabels = [];
    if (!current) return;
    const level = current.assembly.active;
    if (level && inspectState?.ancestry?.length) {
      if (!level.node.children?.length) return;
      projectionLabels = level.items.map((item, index) => {
        const button = document.createElement('button');
        const name = inspectState.partNames?.[index] ?? item.part.name;
        button.className = 'spot part-spot';
        button.type = 'button';
        button.dataset.stagePart = String(index);
        const number = String(index + 1).padStart(2, '0');
        button.textContent = number;
        button.setAttribute('aria-label', `${number} ${name}`);
        button.title = name;
        button.setAttribute('aria-pressed', 'false');
        button.hidden = true;
        hotspots.append(button);
        return { item, button };
      });
      return;
    }
    const label = document.createElement('span');
    label.className = 'spot energy-spot';
    label.setAttribute('aria-current', 'step');
    label.dataset.stageBeat = '';
    label.textContent = beat?.name ?? modelLabels[current.id];
    label.hidden = true;
    hotspots.append(label);
    projectionLabels = [{ button: label }];
  }

  function setLabelPosition() {
    for (const { button, item } of projectionLabels) {
      if (item) {
        const picked = item.index === current.assembly.selected;
        button.setAttribute('aria-pressed', String(picked));
        local.copy(item.anchor);
        local.y += THREE.MathUtils.clamp(current.assembly.active.radius * .22, .03, .63);
      } else if (beat?.at) {
        local.fromArray(beat.at);
        local.y += .38;
        current.model.localToWorld(local);
      } else {
        local.copy(current.midpoint);
        local.y = Math.max(1.16, local.y + current.extent.y * .5 + .20);
        current.model.localToWorld(local);
      }
      local.project(camera);
      const x = (local.x + 1) * width * .5;
      const y = (1 - local.y) * height * .5;
      const hidden = local.z < -1 || local.z > 1 || x < 18 || x > width - 18 || y < -25 || y > height - 20;
      button.hidden = hidden;
      if (hidden) continue;
      button.style.left = `${THREE.MathUtils.clamp(x, 35, width - 35)}px`;
      button.style.top = `${THREE.MathUtils.clamp(y, width >= 760 ? 90 : 67, height * .87)}px`;
    }
  }

  function panelOffset() {
    return width >= 1100 ? .145 : width >= 760 ? .117 : 0;
  }

  function placeCamera(elapsed) {
    const location = environmentFor(current.id);
    const inside = isInterior(location);
    const smooth = elapsed ? Math.min(1, elapsed * 7) : 1;
    scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, inside ? .034 : .026, smooth);
    scene.fog.color.lerp(inside ? roomFog : openFog, smooth);
    key.intensity = THREE.MathUtils.lerp(key.intensity, inside ? 2.24 : 2.83, smooth);
    skyLight.intensity = THREE.MathUtils.lerp(skyLight.intensity, inside ? .86 : 1.16, smooth);
    if (shadowCenter.distanceTo(center) > 1.8) {
      shadowCenter.copy(center);
      key.target.position.copy(shadowCenter);
      key.position.copy(shadowCenter).add(lightOffset);
      renderer.shadowMap.needsUpdate = true;
    }
    subjectLight.position.copy(center).add(subjectOffset);
    subjectLight.target.position.copy(center);
    subjectLight.intensity = inside ? 105 : 52;

    const horizontal = Math.cos(altitude) * distance;
    camera.position.set(center.x + Math.sin(azimuth) * horizontal, center.y + Math.sin(altitude) * distance,
      center.z + Math.cos(azimuth) * horizontal);
    camera.near = Math.max(.009, Math.min(.09, distance * .014));
    camera.setViewOffset(width, height, -width * panelOffset(), height * .021, width, height);
    camera.lookAt(center);
    camera.updateMatrixWorld();
    journey.update(camera, settings.source, location, elapsed);
  }

  function focus(animate, duration = 630) {
    if (!current) return;
    const level = inspectState?.ancestry?.length && current.assembly.active;
    const lowEquipment = current.extent.y < 2;
    const viewWidthFactor = Math.max(1, 1.28 / camera.aspect);
    let toAzimuth = current.id === 'lines' ? .34 : current.id === 'wind' ? -.13 : .23;
    let toAltitude = lowEquipment ? .40 : .24;
    let toDistance = Math.max(lowEquipment ? 8.6 : 10.25, current.extent.y * 2.44, current.extent.x * 2.01);
    let target = current.model.localToWorld(new THREE.Vector3(current.midpoint.x, Math.max(.52, current.extent.y * .43), current.midpoint.z));
    if (level) {
      target = level.focus;
      toAzimuth = level.depth ? .19 : .17;
      toAltitude = level.depth ? .36 : .28;
      const angle = Math.tan(THREE.MathUtils.degToRad(camera.fov * .5));
      const availableWidth = 1 - 2 * panelOffset() - .085;
      const projectedX = (level.extent.x + level.extent.z * .18) * .51;
      const projectedY = (level.extent.y + level.extent.z * .29) * .57;
      toDistance = Math.max(.38, projectedX / (angle * camera.aspect * availableWidth), projectedY / angle)
        + level.extent.z * .25;
    } else if (beat?.at) {
      target = current.model.localToWorld(new THREE.Vector3(...beat.at));
      toAzimuth = beat.azimuth ?? (current.id === 'lines' ? .31 : .14);
      toAltitude = beat.altitude ?? (lowEquipment ? .45 : .26);
      toDistance = beat.distance ?? THREE.MathUtils.clamp(Math.max(current.extent.x, current.extent.y) * .94, 2.9, 8);
    }
    if (!level) toDistance *= viewWidthFactor;
    if (!animate || settings.reduced) {
      motion = undefined;
      mount.removeAttribute('data-camera-moving');
      center.copy(target);
      azimuth = toAzimuth;
      altitude = toAltitude;
      distance = toDistance;
      return;
    }
    mount.setAttribute('data-camera-moving', '');
    motion = {
      from: center.clone(), to: target.clone(), start: performance.now(), duration,
      fromAzimuth: azimuth, toAzimuth, fromAltitude: altitude, toAltitude, fromDistance: distance, toDistance,
    };
  }

  function draw(now) {
    frame = null;
    if (lost || !current || !width || !height) return;
    const elapsed = previousFrame ? Math.min((now - previousFrame) / 1000, .06) : 0;
    previousFrame = now;
    if (motion) {
      const progress = THREE.MathUtils.clamp((now - motion.start) / motion.duration, 0, 1);
      const eased = progress * progress * (3 - 2 * progress);
      center.lerpVectors(motion.from, motion.to, eased);
      azimuth = THREE.MathUtils.lerp(motion.fromAzimuth, motion.toAzimuth, eased);
      altitude = THREE.MathUtils.lerp(motion.fromAltitude, motion.toAltitude, eased);
      distance = THREE.MathUtils.lerp(motion.fromDistance, motion.toDistance, eased);
      if (progress === 1) {
        motion = undefined;
        mount.removeAttribute('data-camera-moving');
      }
    }
    const motorMotion = !settings.reduced && !inspectState?.ancestry?.length && current.rotors.length > 0;
    if (motorMotion) {
      for (const rotor of current.rotors) {
        const { axis, speed } = rotor.userData.spin;
        rotor.rotation[axis] += speed * elapsed;
      }
    }
    current.assembly.animate(now);
    if (current.assembly.animating) renderer.shadowMap.needsUpdate = true;
    guide.animate(now);
    placeCamera(settings.reduced ? 0 : elapsed);
    setLabelPosition();
    renderer.render(scene, camera);
    if (motion || current.assembly.animating || (!settings.reduced && (beat || motorMotion || settings.source === 'wind'))) schedule();
  }

  function schedule() {
    if (!lost && frame === null) frame = requestAnimationFrame(draw);
  }

  function update(next) {
    if (lost) return;
    const changed = current?.id !== next.active || settings?.source !== next.source;
    settings = { ...next };
    if (changed) {
      if (current) {
        current.assembly.restore();
        current.model.visible = false;
      }
      current = getRecord(next.active, next.source);
      current.model.visible = true;
      inspectState = undefined;
      beat = undefined;
      mount.removeAttribute('data-assembly-level');
      mount.removeAttribute('data-assembly-style');
      mount.dataset.journeyEnvironment = environmentFor(next.active);
      guide.set(null, current.model, settings.reduced);
      makeLabels();
      focus(false);
      renderer.shadowMap.needsUpdate = true;
    } else if (next.reduced) {
      if (motion) focus(false);
      current.assembly.settle();
    }
    if (!changed && beat) guide.set(beat, current.model, settings.reduced);
    schedule();
  }

  function inspect(next) {
    if (!current || lost) return;
    const previousLevel = current.assembly.active;
    const priorBeat = inspectState?.beat;
    inspectState = next;
    const newBeat = next?.beat;
    if (newBeat && (newBeat !== priorBeat || beatMode !== settings.mode)) {
      const hasSegment = Number.isInteger(newBeat.segment);
      const path = newBeat.path ?? (hasSegment ? beatPath(current.id, settings.mode, newBeat.segment, newBeat.span, newBeat.at) : []);
      const pathForm = hasSegment ? beatPathForm(current.id, settings.mode, newBeat.segment) : undefined;
      beat = { ...newBeat, path, inputForm: newBeat.inputForm ?? pathForm };
      beatMode = settings.mode;
    } else if (!newBeat) beat = undefined;
    guide.set(next?.ancestry?.length ? null : beat, current.model, settings.reduced);
    if (next?.ancestry?.length) {
      current.assembly.configure(next.ancestry, next.selectedIndex, settings.reduced, false);
      mount.dataset.assemblyLevel = String(next.ancestry.length);
      mount.dataset.assemblyStyle = current.assembly.active?.isSchematic ? 'schematic' : 'equipment';
    } else {
      delete mount.dataset.assemblyLevel;
      delete mount.dataset.assemblyStyle;
      if (previousLevel) current.assembly.close(settings.reduced, Boolean(newBeat?.inside));
      else current.assembly.configure([], -1, settings.reduced, Boolean(newBeat?.inside));
    }
    const levelChanged = previousLevel !== current.assembly.active;
    if (levelChanged || priorBeat !== newBeat || (!next?.ancestry?.length && previousLevel)) makeLabels();
    if (levelChanged || priorBeat !== newBeat || (!next?.ancestry?.length && previousLevel)) focus(true, 650);
    renderer.shadowMap.needsUpdate = true;
    schedule();
  }

  const resize = new ResizeObserver(() => {
    width = mount.clientWidth;
    height = mount.clientHeight;
    if (!width || !height) return;
    const raster = Math.min(Math.max(devicePixelRatio || 1, 1.2), 2, 3840 / width, 2160 / height);
    renderer.setPixelRatio(raster);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    if (current) focus(false);
    schedule();
  });
  resize.observe(mount);

  hotspots.addEventListener('click', (event) => {
    const part = event.target.closest('[data-stage-part]');
    if (part) selectPart?.(Number(part.dataset.stagePart));
  });
  const raycast = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  renderer.domElement.addEventListener('click', (event) => {
    if (lost || !inspectState?.ancestry?.length || !current?.assembly.active) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycast.setFromCamera(pointer, camera);
    const items = current.assembly.active.items;
    const hits = raycast.intersectObjects(items.flatMap(({ nodes }) => nodes), true);
    for (const { object } of hits) {
      let subject = object;
      while (subject && subject !== current.model) {
        const item = items.find(({ nodes }) => nodes.includes(subject));
        if (item) {
          selectPart?.(item.index);
          return;
        }
        subject = subject.parent;
      }
    }
  });
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(frame);
    hotspots.replaceChildren();
    onUnavailable();
  });

  return { update, inspect };
}
