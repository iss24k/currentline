import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { generationModels } from './generation-models.js';
import { infrastructureModels } from './infrastructure-models.js';
import { solarEquipmentModels } from './solar-equipment.js';
import { createOnsiteAssembly } from './onsite-assembly.js';
import { createEquipmentFlow, flowTints } from './equipment-flow.js';
import { createCable, createSolarGround, equipmentLanes, linkKey, placeBranch, placeEquipment, worldPort } from './equipment-scene.js';

const factories = { ...generationModels, ...infrastructureModels, ...solarEquipmentModels };
const laneFor = new Map(equipmentLanes.flatMap((lane) => lane.map((id) => [id, lane])));
const frames = {
  solar: [.26, .51], 'solar-inverter': [-.18, .34], 'step-up': [.22, .31],
  intake: [-.23, .26], ups: [.26, .24], psu: [-.22, .39], vrm: [.29, .65], chip: [.18, .66],
  'floor-pdu': [.20, .29], 'rack-pdu': [-.24, .28], busway: [.32, .28], cord: [-.14, .48],
  'site-transformer': [.20, .33], transfer: [-.18, .29], battery: [.25, .31], generator: [.27, .34],
};

const clamp = THREE.MathUtils.clamp;
const interpolate = THREE.MathUtils.lerp;
const smooth = THREE.MathUtils.smoothstep;
const lift = new THREE.Vector3(0, 1, 0);
const lens = 36;
const halfField = Math.tan(THREE.MathUtils.degToRad(lens / 2));

function shadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const falloff = ctx.createRadialGradient(64, 64, 2, 64, 64, 63);
  falloff.addColorStop(0, 'rgba(0,0,0,.76)');
  falloff.addColorStop(.48, 'rgba(0,0,0,.36)');
  falloff.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = falloff;
  ctx.fillRect(0, 0, 128, 128);
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

function frameFor(record, progress, width, height, layout) {
  const nested = layout?.depth > 0;
  const extent = nested ? layout.extent : layout ? record.size.clone().max(layout.extent) : record.size;
  const frameWidth = width <= 960 ? .79 : .58;
  const horizontalRange = (extent.x + extent.z * .12) / (2 * halfField * (width / height) * frameWidth);
  const range = Math.max(extent.y * 2.10, horizontalRange, extent.z * 1.78, (nested ? 2.3 : 4.9) * record.scale);
  const center = record.center.clone();
  if (layout) {
    center.lerp(layout.focus, nested ? 1 : .46);
  } else {
    const localPoint = record.flow.sample?.(progress);
    if (localPoint?.isVector3) center.lerp(record.model.localToWorld(localPoint.clone()), .15);
  }
  const [heading, angle] = frames[record.id] ?? [.22, .34];
  const tilt = record.id === 'solar' && !layout ? angle - .29 * smooth(progress, .24, 1) : angle;
  return { center, range, heading: heading + (progress - .5) * .10, tilt };
}

function handoffFrame(from, to, cable, progress, width, height) {
  const start = frameFor(from, 1, width, height);
  const end = frameFor(to, 0, width, height);
  const blend = smooth(progress, 0, 1);
  const center = start.center.clone().lerp(end.center, blend);
  const lead = smooth(progress, .10, .92);
  const follow = smooth(progress, 0, .28) * (1 - smooth(progress, .72, 1));
  if (cable && follow > 0) {
    const anchor = cable.curve.getPointAt(lead);
    const clearance = Math.min(from.size.y, to.size.y) * .38;
    center.lerp(anchor.addScaledVector(lift, clearance), follow * .81);
  }
  const wide = Math.pow(Math.sin(Math.PI * progress), 2);
  const span = to.center.x + to.size.x / 2 - from.center.x + from.size.x / 2;
  const baseRange = interpolate(start.range, end.range, blend);
  const jointRange = span * 1.04 / (2 * halfField * width / height);
  return {
    center,
    range: interpolate(baseRange, Math.max(baseRange * 1.06, jointRange), wide * .93),
    heading: interpolate(start.heading, end.heading, blend) - .12 * follow,
    tilt: interpolate(start.tilt, end.tilt, blend) + .08 * follow,
    wide,
    lead,
  };
}

function travelSteps(from, to, lane, getRecord, getCable) {
  const start = lane?.indexOf(from) ?? -1;
  const end = lane?.indexOf(to) ?? -1;
  if (start < 0 || end <= start) return [];
  const steps = [];
  for (let index = start; index < end; index += 1) {
    const leaving = getRecord(lane[index]);
    const arriving = getRecord(lane[index + 1]);
    const cable = getCable(leaving, arriving);
    steps.push({ from: leaving, to: arriving, cable, weight: 1 });
    if (index + 1 < end) steps.push({ station: arriving, weight: .82 });
  }
  return steps;
}

function travelAt(steps, travel) {
  const total = steps.reduce((sum, step) => sum + step.weight, 0);
  if (!total) return null;
  let distance = travel * total;
  for (const step of steps) {
    if (distance <= step.weight) return { ...step, position: clamp(distance / step.weight, 0, 1) };
    distance -= step.weight;
  }
  return { ...steps.at(-1), position: 1 };
}

export function createEquipmentCamera(host) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .92;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-label', 'Drag or use the arrow keys to look around the connected equipment');
  canvas.tabIndex = 0;
  host.append(canvas);

  const scene = new THREE.Scene();
  const room = new RoomEnvironment();
  const generator = new THREE.PMREMGenerator(renderer);
  const environment = generator.fromScene(room, .035);
  room.dispose();
  generator.dispose();
  scene.environment = environment.texture;
  scene.environmentIntensity = .96;

  const key = new THREE.DirectionalLight(0xfff2de, 2.45);
  key.position.set(-4, 7, 4);
  const fill = new THREE.DirectionalLight(0xa8cce4, 1.18);
  fill.position.set(7, 3, 1);
  const rim = new THREE.DirectionalLight(0xf3d6bd, 1.65);
  rim.position.set(3, 5, -7);
  const root = new THREE.Group();
  const shade = shadowTexture();
  const shadowMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: .62, map: shade, depthWrite: false });
  const shadowGeometry = new THREE.PlaneGeometry(1, 1);
  scene.add(root, key, fill, rim);

  const camera = new THREE.PerspectiveCamera(lens, 1, .045, 140);
  const marker = document.createElement('span');
  marker.className = 'equipment-marker';
  marker.hidden = true;
  host.append(marker);

  const markerPosition = new THREE.Vector3();
  const lookCenter = new THREE.Vector3();
  const records = new Map();
  const cables = new Map();
  let current;
  let active;
  let base;
  let routeEnd;
  let route = [];
  let width = 0;
  let height = 0;
  let frame;
  let previousFrame = 0;
  let lookRange = 0;
  let viewShift = 0;
  let ground;
  let orbitX = 0;
  let orbitY = 0;
  let yaw = 0;
  let altitude = 0;
  let beat = .5;
  let travel = 0;
  let approach = 0;
  let reduced = false;
  let drag;
  let selected = -1;
  let selectionPath = [];
  let selectedPart;
  let disposed = false;

  function schedule() {
    if (frame === undefined && !disposed) frame = requestAnimationFrame(render);
  }

  function getRecord(id, branchBase) {
    if (records.has(id)) return records.get(id);
    const model = factories[id]?.();
    if (!model) return null;
    model.name ||= id;
    root.add(model);
    const record = { id, model, open: false };
    const lane = laneFor.get(id);
    const previousId = lane?.[lane.indexOf(id) - 1];
    if (branchBase && !lane) placeBranch(record, branchBase);
    else placeEquipment(record, id, previousId ? getRecord(previousId) : undefined);
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.renderOrder = 2;
    shadow.position.set(record.center.x, -.035, record.center.z);
    shadow.scale.set(Math.max(2.6 * record.scale, record.size.x * 1.56), Math.max(2.4 * record.scale, record.size.z * 1.72), 1);
    root.add(shadow);
    record.shadow = shadow;
    record.assembly = createOnsiteAssembly(model);
    record.assemblyRoot = tree(id, model);
    record.flow = createEquipmentFlow(id, model, record.size.clone().divideScalar(record.scale));
    model.visible = shadow.visible = false;
    records.set(id, record);
    return record;
  }

  function getCable(from, to) {
    const key = linkKey(from.id, to.id);
    if (!cables.has(key)) {
      const cable = createCable(from, to, root, flowTints);
      if (cable) cable.group.visible = false;
      cables.set(key, cable);
    }
    return cables.get(key);
  }

  function resize() {
    width = host.clientWidth;
    height = host.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2, 3840 / width, 2160 / height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    viewShift = 0;
    camera.setViewOffset(width, height, 0, 0, width, height);
    camera.updateProjectionMatrix();
    schedule();
  }

  function neighbor(id, offset) {
    const lane = laneFor.get(id);
    const adjacent = lane?.[lane.indexOf(id) + offset];
    return adjacent ? getRecord(adjacent) : null;
  }

  function frameRecords(first, last = first) {
    const visible = new Set([first, last]);
    const visibleCables = new Set();
    if (first === last) {
      const before = neighbor(first.id, -1);
      const after = neighbor(first.id, 1);
      if (before) {
        visible.add(before);
        visibleCables.add(getCable(before, first));
      }
      if (after) {
        visible.add(after);
        visibleCables.add(getCable(first, after));
      }
    } else {
      visibleCables.add(getCable(first, last));
      const before = neighbor(first.id, -1);
      const after = neighbor(last.id, 1);
      if (before) {
        visible.add(before);
        visibleCables.add(getCable(before, first));
      }
      if (after) {
        visible.add(after);
        visibleCables.add(getCable(last, after));
      }
    }
    return { visible, visibleCables };
  }

  function updateStage(now, routeFrame, focus) {
    const first = routeFrame?.from ?? routeFrame?.station ?? current;
    const last = routeFrame?.to ?? first;
    const { visible, visibleCables } = frameRecords(first, last);
    if (current.open && current.id !== base) {
      const branchBase = records.get(base);
      if (branchBase) visible.add(branchBase);
    }

    let tracing = false;
    for (const record of records.values()) {
      const shown = visible.has(record);
      record.model.visible = record.shadow.visible = shown;
      if (!shown) continue;
      const isOutgoing = record === routeFrame?.from;
      const isIncoming = record === routeFrame?.to;
      const isStation = record === routeFrame?.station;
      const active = isOutgoing || isIncoming || isStation || (!routeFrame && record === current);
      const progress = isOutgoing ? 1 : isIncoming ? 0 : isStation ? routeFrame.position : beat;
      const hold = Boolean((isOutgoing && focus.lead > .02) || (isIncoming && focus.lead < .98));
      const running = record.flow.update(now, {
        visible: active,
        quiet: reduced || hold,
        pulse: !hold,
        progress,
        inspection: record === current && current.open ? { layout: current.assembly.active, selected } : undefined,
      });
      if (active && running) tracing = true;
    }
    for (const cable of cables.values()) {
      if (!cable) continue;
      cable.group.visible = visibleCables.has(cable);
      cable.update(cable === routeFrame?.cable ? focus.lead : undefined);
    }
    return tracing;
  }

  function render(now) {
    frame = undefined;
    if (!current || !width || !height || !host.getClientRects().length) return;
    const elapsed = previousFrame ? Math.min(40, now - previousFrame) : 16;
    previousFrame = now;
    const ease = reduced ? 1 : 1 - Math.exp(-elapsed / 72);
    current.assembly.animate(now);
    const routeFrame = travel > 0 && !current.open ? travelAt(route, travel) : null;
    const station = routeFrame?.station;
    const layout = current.assembly.active;
    const localProgress = station ? routeFrame.position : beat;
    const focus = routeFrame?.cable || routeFrame?.from
      ? handoffFrame(routeFrame.from, routeFrame.to, routeFrame.cable, routeFrame.position, width, height)
      : frameFor(station ?? current, localProgress, width, height, layout);
    const { center } = focus;
    const exterior = routeFrame || layout ? 0 : approach;
    const range = focus.range * (1 + exterior * .22);
    const goalX = focus.heading + orbitX * (routeFrame ? .38 : 1) + exterior * .10;
    const goalY = focus.tilt + orbitY * (routeFrame ? .38 : 1);
    if (!lookRange) {
      yaw = goalX;
      altitude = goalY;
    }
    yaw += (goalX - yaw) * ease;
    altitude += (goalY - altitude) * ease;
    lookCenter.lerp(center, lookRange ? ease : 1);
    lookRange = lookRange ? interpolate(lookRange, range, ease) : range;
    camera.position.copy(lookCenter).add(new THREE.Vector3(
      Math.sin(yaw) * Math.cos(altitude) * lookRange,
      Math.sin(altitude) * lookRange,
      Math.cos(yaw) * Math.cos(altitude) * lookRange,
    ));
    camera.lookAt(lookCenter);
    const nextShift = width <= 960 ? 0 : -width * .17 * (1 - (focus.wide ?? 0));
    if (viewShift !== nextShift) {
      camera.setViewOffset(width, height, nextShift, 0, width, height);
      viewShift = nextShift;
    }
    camera.updateMatrixWorld();

    const item = layout?.items[selected];
    if (item && selectedPart && !routeFrame) {
      markerPosition.copy(item.anchor).project(camera);
      marker.hidden = Math.abs(markerPosition.x) > .97 || Math.abs(markerPosition.y) > .97;
      if (!marker.hidden) {
        const x = (markerPosition.x + 1) * width / 2;
        const y = (1 - markerPosition.y) * height / 2;
        const left = x + marker.offsetWidth + 12 > width;
        marker.dataset.side = left ? 'left' : 'right';
        const labelX = left ? Math.max(8, x - marker.offsetWidth - 6) : x + 6;
        const labelY = clamp(y, 8, height - marker.offsetHeight - 8);
        marker.style.transform = `translate(${Math.round(labelX)}px, ${Math.round(labelY)}px)`;
      }
    } else {
      marker.hidden = true;
    }
    const tracing = updateStage(now, routeFrame, focus);
    host.dataset.powerScene = station?.id ?? current.id;
    if (routeFrame?.cable) host.dataset.powerBridge = linkKey(routeFrame.from.id, routeFrame.to.id);
    else delete host.dataset.powerBridge;
    const framing = Math.abs(range - lookRange) > .012 || center.distanceToSquared(lookCenter) > .00015;
    host.toggleAttribute('data-assembly-moving', current.assembly.animating || framing);
    renderer.render(scene, camera);
    if (tracing || current.assembly.animating || framing || Math.abs(goalX - yaw) > .001 || Math.abs(goalY - altitude) > .001) schedule();
  }

  function show(id, { progress = .5, quiet = false, reveal = false, nextId, travel: nextTravel = 0, baseId = id, approach: nextApproach = 0 } = {}) {
    reduced = quiet;
    beat = clamp(progress, 0, 1);
    approach = reduced ? 0 : clamp(nextApproach, 0, 1);
    if (base !== baseId || routeEnd !== nextId) {
      const entersAlongCable = routeEnd === baseId && travel > .64;
      const retracesCable = nextId === base && nextTravel > .64;
      if (base && base !== baseId && !entersAlongCable && !retracesCable) lookRange = 0;
      base = baseId;
      routeEnd = nextId;
      route = travelSteps(base, routeEnd, laneFor.get(base), getRecord, getCable);
    }
    const solarSite = laneFor.get(base) === equipmentLanes[0];
    if (solarSite && !ground) {
      ground = createSolarGround(getRecord('solar'), getRecord('step-up'));
      root.add(ground);
    }
    if (ground) ground.visible = solarSite;
    travel = reveal || reduced || base !== id ? 0 : clamp(nextTravel, 0, 1);
    if (active !== id) {
      if (current?.open) {
        current.assembly.close(true);
        current.open = false;
      }
      active = id;
      current = getRecord(id, base !== id ? getRecord(base) : undefined);
      if (!current) return;
      marker.hidden = true;
      selected = -1;
      selectionPath = [current.assemblyRoot];
      selectedPart = undefined;
      if (!lookRange || base === id) orbitX = orbitY = 0;
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

  function port(which = 'entry') {
    if (!current || !lookRange) return null;
    const local = current.flow.sample?.(which === 'exit' ? 1 : 0);
    const point = worldPort(current, which) ?? (local ? current.model.localToWorld(local) : null);
    if (!point) return null;
    point.project(camera);
    const x = (point.x + 1) / 2;
    const y = (1 - point.y) / 2;
    return { x, y, visible: x >= 0 && x <= 1 && y >= 0 && y <= 1 && point.z >= -1 && point.z <= 1 };
  }

  function phase() {
    if (!current) return null;
    const step = travel > 0 && !current.open ? travelAt(route, travel) : null;
    if (step?.cable) {
      return { id: linkKey(step.from.id, step.to.id), label: step.cable.label, form: step.cable.form };
    }
    const record = step?.station ?? current;
    const local = record.flow.phase?.(step?.station ? step.position : beat);
    return local ? { id: record.id, ...local } : null;
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
    orbitX = clamp(orbitX - dx * .006, -.55, .55);
    orbitY = clamp(orbitY + dy * .004, -.18, .27);
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
    orbitX = clamp(orbitX + adjustments[event.key], -.55, .55);
    schedule();
  });

  return {
    show, highlight, port, phase,
    destroy() {
      disposed = true;
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
      environment.dispose();
      shade.dispose();
      shadowMaterial.dispose();
      shadowGeometry.dispose();
      if (ground) {
        ground.geometry.dispose();
        ground.material.map.dispose();
        ground.material.dispose();
      }
      renderer.dispose();
      canvas.remove();
      marker.remove();
    },
  };
}
