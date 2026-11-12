import * as THREE from 'three';
import { beatPath, beatPathForm } from './energy-trace.js';

export const flowTints = {
  ac: 0xffd38a,
  dc: 0xd0b6ff,
  magnetic: 0x8ad9e8,
  light: 0xffecbc,
  thermal: 0xffad7a,
  fuel: 0xffd794,
  shaft: 0xd3ece5,
};

const electrical = new Set(['ac', 'dc']);
const labels = {
  ac: 'Alternating current',
  dc: 'Direct current',
  magnetic: 'Magnetic field',
  light: 'Sunlight',
  thermal: 'Heat',
  fuel: 'Stored chemical energy',
  shaft: 'Shaft rotation',
};

// Labels and inspection anchors for equipment shared with the wider field guide.
const referenceSteps = {
  'site-transformer': [
    ['Medium-voltage AC', 'Higher-voltage winding'],
    ['Magnetic coupling', 'Magnetic core'],
    ['480 V AC', 'Lower-voltage winding'],
  ],
  ups: [
    ['480 V AC to rectifier', 'Input rectifier'],
    ['DC link', 'DC link'],
    ['480 V AC from inverter', 'Inverter and output filter'],
  ],
  battery: [
    ['Energy stored in cells', 'Battery module'],
    ['DC to the UPS'],
  ],
  'floor-pdu': [
    ['480 V AC to floor transformer', 'Isolation transformer'],
    ['Magnetic coupling', 'Isolation transformer'],
    ['208 V AC to the rack', 'Distribution section'],
  ],
  busway: [
    ['208 V AC through busway', 'Busway rail'],
  ],
  cord: [
    ['208 V AC through the server cord', 'Flexible cable'],
  ],
  psu: [
    ['208 V AC at the server inlet', 'AC inlet and interference filter'],
    ['DC inside the power supply', 'Power factor correction stage'],
    ['Magnetic coupling', 'Isolated resonant converter'],
    ['12 V DC to the board', 'Secondary rectifier and DC output'],
  ],
  chip: [
    ['Low-voltage DC to the silicon', 'Package substrate'],
    ['Heat from the processor', 'Integrated heat spreader'],
  ],
};

const referenceGeometry = {
  intake: [
    { form: 'ac', label: 'Medium-voltage feeder', part: 'Cable termination', points: [
      [-1.47, .31, 1.47], [-1.67, .36, 1.31], [-1.75, .36, .99], [-1.75, .56, .65],
      [-1.75, .82, .32], [-1.75, 1.32, .29],
    ] },
    { form: 'ac', label: 'Vacuum breaker protects the feeder', part: 'Withdrawable vacuum circuit breaker', points: [
      [-1.75, 1.32, .29], [-1.75, 1.77, .29], [-.37, 1.77, .13], [-.37, 2.15, .13],
    ] },
    { form: 'ac', label: 'Protected AC leaves on the busbars', part: 'Phase busbars', points: [
      [-.37, 2.15, .13], [-.37, 2.30, -.20], [1.75, 2.30, -.20], [1.75, 1.32, .29],
      [1.75, .56, .65], [1.75, .36, .99], [1.83, .36, 1.31], [2.03, .31, 1.47],
    ] },
  ],
  transfer: [
    { form: 'ac', label: '480 V AC from the building transformer', part: 'Source and load terminals', points: [
      [-1.02, 4.155, -.73], [-1.02, 3.60, -.73], [-1.02, 3.06, -.21],
    ] },
    { form: 'ac', label: 'The transfer switch selects the utility feed', part: 'Transfer contactor', points: [
      [-1.02, 3.06, -.21], [-1.02, 2.44, -.13], [-.32, 1.58, .09],
      [.46, .84, -.01], [.46, .42, -.01], [.46, .40, 1.12], [2.14, .39, 1.12],
    ] },
  ],
  'rack-pdu': [
    { form: 'ac', label: 'Rack feeder enters at the top', part: 'Input connection', points: [
      [2.55, 4.23, -.42], [2.55, 4.14, .18], [2.55, 3.97, .52], [2.55, 3.89, .71],
    ] },
    { form: 'ac', label: '208 V AC at the server outlet', part: 'Protected outlet bank', points: [
      [2.55, 3.89, .71], [2.55, 2.14, .71], [2.55, 2.14, .88],
    ] },
  ],
  vrm: [
    { form: 'dc', label: '12 V DC to the switches', part: 'Integrated power stage', points: [
      [-2.80, .515, -.33], [-2.16, .515, -.33], [-1.88, .64, -.33], [-1.59, .515, -.33],
    ] },
    { form: 'dc', label: 'The coil smooths switching pulses', part: 'Phase inductor', points: [
      [-1.59, .515, -.33], [-1.15, .515, -.33], [-.88, .72, -.33], [-.61, .515, -.33],
    ] },
    { form: 'dc', label: 'About 1 V DC to the processor', part: 'Output capacitor bank', points: [
      [-.61, .515, -.33], [.04, .515, -.33], [.84, .515, -.33], [1.06, .515, -.26], [2.65, .515, -.26],
    ] },
  ],
};

function localSegments(id, model) {
  const segments = model.userData.equipmentFlow ?? referenceGeometry[id];
  if (segments) return segments;
  return Array.from({ length: 4 }, (_, index) => {
    const form = beatPathForm(id, 'utility', index);
    const points = beatPath(id, 'utility', index);
    const [label, part] = referenceSteps[id]?.[index] ?? [];
    return { form, points, label, part };
  }).filter(({ form, points }) => form && points);
}

export function equipmentPorts(id, model, segments = localSegments(id, model)) {
  const first = segments[0];
  const last = segments.at(-1);
  const ports = model.userData.equipmentPorts ?? {};
  const input = ports.input === undefined
    ? electrical.has(first?.form) ? first.points[0] : null
    : ports.input;
  const output = ports.output === undefined
    ? electrical.has(last?.form) ? last.points.at(-1) : null
    : ports.output;
  return {
    input: input ? new THREE.Vector3(...input) : null,
    output: output ? new THREE.Vector3(...output) : null,
    inputForm: ports.inputForm ?? first?.form,
    outputForm: ports.outputForm ?? last?.form,
  };
}

function polyline(points) {
  const path = new THREE.CurvePath();
  const vertices = points.map((point) => new THREE.Vector3(...point));
  for (let index = 1; index < vertices.length; index += 1) {
    if (vertices[index - 1].distanceToSquared(vertices[index]) > 1e-10) {
      path.add(new THREE.LineCurve3(vertices[index - 1], vertices[index]));
    }
  }
  return path;
}

function routeMaterial(color, opacity, additive = false) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}

function tube(curve, radius, material, order) {
  const geometry = new THREE.TubeGeometry(curve, Math.max(16, Math.ceil(curve.getLength() * 14)), radius, 6, false);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = order;
  return mesh;
}

function renderTrack(parent, curve, form, radius, color) {
  const core = routeMaterial(color, .42);
  const glow = routeMaterial(color, .18, true);
  const track = new THREE.Group();
  parent.add(track);
  if (form === 'magnetic') {
    // A dashed field path distinguishes magnetic coupling from conductive wiring.
    const count = Math.max(5, Math.round(curve.getLength() / (radius * 9)));
    for (let index = 0; index < count; index += 1) {
      const from = index / count;
      const to = (index + .58) / count;
      const points = [from, (from + to) / 2, to].map((fraction) => curve.getPointAt(fraction));
      track.add(tube(polyline(points.map((point) => point.toArray())), radius, core, 9));
    }
  } else {
    const feather = form === 'light' || form === 'thermal' ? 1.55 : 1.85;
    track.add(tube(curve, radius * feather, glow, 8));
    track.add(tube(curve, radius, core, 9));
  }
  return { track, core, glow };
}

function inspectionNode(model, part) {
  if (!part) return undefined;
  for (const entry of model.userData.inspection ?? []) {
    if (entry.name === part) return entry.nodes[0];
    for (const node of entry.nodes) {
      const nested = inspectionNode(node, part);
      if (nested) return nested;
    }
  }
  return undefined;
}

function renderPulse(parent, radius) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), routeMaterial(0xfff5dc, 1));
  const aura = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.9, 12, 8), routeMaterial(0xfff5dc, .31, true));
  mesh.renderOrder = 11;
  aura.renderOrder = 10;
  parent.add(mesh, aura);
  return { mesh, aura };
}

export function createEquipmentFlow(id, model, size) {
  const segments = localSegments(id, model);
  const { input: entry, output: exit, inputForm, outputForm } = equipmentPorts(id, model, segments);
  const scale = Math.max(size.x, size.y, size.z);
  const radius = THREE.MathUtils.clamp(scale * .0028, .010, .024);
  const pulseRadius = THREE.MathUtils.clamp(scale * .0105, .037, .073);
  const group = new THREE.Group();
  group.name = 'Illustrated energy transfer';
  group.visible = false;

  let length = 0;
  const paths = segments.flatMap(({ form, points, label, note, part, weight }) => {
    const curve = polyline(points);
    if (!curve.curves.length) return [];
    const start = length;
    length += weight ?? Math.max(.75, curve.getLength());
    const color = flowTints[form] ?? 0xf6e9ca;
    const art = renderTrack(group, curve, form, radius, color);
    const node = inspectionNode(model, part);
    const home = node ? model.worldToLocal(node.getWorldPosition(new THREE.Vector3())) : null;
    const underModule = id === 'solar' && part === 'DC junction box';
    return [{ curve, form, label: label ?? labels[form], note, part, start, end: length, color, node, home, underModule, ...art }];
  });

  const pulses = [1, .70, .42].map((ratio) => renderPulse(group, pulseRadius * ratio));
  const position = new THREE.Vector3();
  const traceOffset = new THREE.Vector3();
  const highlight = new THREE.Color(0xfff6dc);
  model.add(group);

  function location(progress) {
    const distance = THREE.MathUtils.clamp(progress, 0, 1) * length;
    const segment = paths.find(({ end }) => distance <= end) ?? paths.at(-1);
    if (!segment) return null;
    return {
      segment,
      fraction: THREE.MathUtils.clamp((distance - segment.start) / (segment.end - segment.start), 0, 1),
    };
  }

  function sample(progress, target = new THREE.Vector3()) {
    const step = location(progress);
    return step ? step.segment.curve.getPointAt(step.fraction, target) : target.set(0, 0, 0);
  }

  function phase(progress) {
    const step = location(progress);
    return step ? { form: step.segment.form, label: step.segment.label, note: step.segment.note, part: step.segment.part } : null;
  }

  function update(_now, { visible, quiet, progress = .5, inspection, pulse: showPulse = true } = {}) {
    group.visible = Boolean(visible && paths.length);
    if (!group.visible) return false;
    const step = location(progress);
    const layout = inspection?.layout;
    const selected = layout?.items?.[inspection.selected]?.part?.name;

    for (const segment of paths) {
      const current = step.segment === segment;
      const inspectFocus = selected && segment.part === selected;
      segment.core.opacity = layout ? (inspectFocus ? .84 : .22) : current ? .85 : .36;
      segment.glow.opacity = layout ? (inspectFocus ? .15 : .03) : current ? .14 : .045;
      // The module lead lives under the tilted panels. Let the glass and film
      // hide it naturally until the camera reaches the underside or cable drop.
      segment.core.depthTest = segment.glow.depthTest = segment.underModule && !layout;
      if (segment.node) {
        model.worldToLocal(segment.node.getWorldPosition(traceOffset));
        segment.track.position.copy(traceOffset).sub(segment.home);
      }
    }

    pulses.forEach(({ mesh, aura }, index) => {
      const at = progress - index * .018;
      const pulse = location(at);
      const show = showPulse && at >= 0 && !layout && (!quiet || index === 0) && (index === 0 || pulse.segment === step.segment);
      mesh.visible = aura.visible = show;
      if (!show) return;
      pulse.segment.curve.getPointAt(pulse.fraction, position);
      position.add(pulse.segment.track.position);
      mesh.position.copy(position);
      aura.position.copy(position);
      mesh.material.color.set(pulse.segment.color).lerp(highlight, .34);
      aura.material.color.setHex(pulse.segment.color);
      mesh.material.depthTest = aura.material.depthTest = pulse.segment.underModule;
    });
    return false;
  }

  return { entry, exit, inputForm, outputForm, sample, phase, update };
}
