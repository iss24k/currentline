import * as THREE from 'three';

export const equipmentLanes = [
  ['solar', 'solar-inverter', 'step-up'],
  ['intake', 'site-transformer', 'transfer', 'ups', 'floor-pdu', 'busway', 'rack-pdu', 'cord', 'psu', 'vrm', 'chip'],
];

const modelScale = {
  cord: .65,
  psu: .61,
  vrm: .38,
  chip: .38,
};

const links = {
  'solar>solar-inverter': 'DC cable from the solar row',
  'solar-inverter>step-up': '34.5 kV AC collection cable',
  'intake>site-transformer': 'Protected utility feed',
  'site-transformer>transfer': '480 V AC service',
  'transfer>ups': '480 V AC to the UPS',
  'ups>floor-pdu': '480 V AC to rack distribution',
  'floor-pdu>busway': '208 V AC feed to the busway',
  'busway>rack-pdu': '208 V AC rack branch',
  'rack-pdu>cord': '208 V AC rack outlet',
  'cord>psu': '208 V AC into the server',
  'psu>vrm': '12 V DC through the server power connection',
  'vrm>chip': 'Low-voltage DC along the board',
};

const defaultTints = { ac: 0xffd38a, dc: 0xd0b6ff };

export const linkKey = (from, to) => `${from}>${to}`;

export function placeEquipment(record, id, previous) {
  const { model } = record;
  const bounds = new THREE.Box3().setFromObject(model, true);
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = modelScale[id] ?? 1;
  const width = bounds.max.x - bounds.min.x;
  const gap = id === 'chip' ? .67 : id === 'psu' || id === 'vrm' ? 1.75 : 3.9;
  const x = previous ? previous.center.x + previous.size.x / 2 + gap + width * scale / 2 : 0;
  const z = id === 'site-transformer' || id === 'busway' ? -.52 : 0;
  model.scale.setScalar(scale);
  model.position.set(x - center.x * scale, -bounds.min.y * scale, z - center.z * scale);
  model.updateWorldMatrix(true, true);
  bounds.setFromObject(model, true);
  record.size = bounds.getSize(new THREE.Vector3());
  record.center = bounds.getCenter(new THREE.Vector3());
  record.front = bounds.max.z;
  record.scale = scale;
}

export function placeBranch(record, base) {
  const { model } = record;
  const bounds = new THREE.Box3().setFromObject(model, true);
  const center = bounds.getCenter(new THREE.Vector3());
  const width = bounds.max.x - bounds.min.x;
  const x = base.center.x;
  const z = base.center.z + base.size.z + width * .58 + 2.5;
  model.position.set(x - center.x, -bounds.min.y, z - center.z);
  model.updateWorldMatrix(true, true);
  bounds.setFromObject(model, true);
  record.size = bounds.getSize(new THREE.Vector3());
  record.center = bounds.getCenter(new THREE.Vector3());
  record.front = bounds.max.z;
  record.scale = 1;
}

export function worldPort(record, which) {
  const { model, flow } = record;
  const port = flow[which];
  return port?.isVector3 ? model.localToWorld(port.clone()) : null;
}

function cableCurve(from, to, exit, entry) {
  if (from.id === 'vrm' && to.id === 'chip') {
    const distance = entry.x - exit.x;
    return new THREE.CatmullRomCurve3([
      exit,
      exit.clone().add(new THREE.Vector3(distance * .25, 0, 0)),
      entry.clone().add(new THREE.Vector3(-distance * .25, 0, 0)),
      entry,
    ]);
  }
  const front = Math.max(exit.z, entry.z, from.front, to.front) + .4;
  const gap = entry.x - exit.x;
  const right = Math.max(.28, Math.min(1.35, Math.abs(gap) * .23));
  const low = Math.min(exit.y, entry.y, .35);
  return new THREE.CatmullRomCurve3([
    exit,
    new THREE.Vector3(exit.x, exit.y, front - .08),
    new THREE.Vector3(exit.x + right, low, front),
    new THREE.Vector3(entry.x - right, low, front),
    new THREE.Vector3(entry.x, entry.y, front - .08),
    entry,
  ]);
}

export function createCable(from, to, root, tints = defaultTints) {
  const exit = worldPort(from, 'exit');
  const entry = worldPort(to, 'entry');
  if (!entry || !exit) return null;
  const curve = cableCurve(from, to, exit, entry);
  const scale = Math.min(from.scale, to.scale);
  const trace = from.id === 'vrm' && to.id === 'chip';
  const radius = trace ? .023 : Math.max(.033, .067 * scale);
  const form = from.flow.outputForm ?? to.flow.inputForm ?? 'ac';
  const color = tints[form] ?? defaultTints.ac;
  const group = new THREE.Group();
  const label = links[linkKey(from.id, to.id)];
  group.name = label ?? 'Power handoff';

  const cableMaterial = new THREE.MeshStandardMaterial({ color: 0x333b39, metalness: .12, roughness: .72 });
  if (trace) {
    // The regulator and processor are adjoining magnified sections of a board.
    const substrate = new THREE.Mesh(
      new THREE.BoxGeometry(entry.x - exit.x + .09, .047, Math.abs(entry.z - exit.z) + .42),
      new THREE.MeshStandardMaterial({ color: 0x3b5347, roughness: .64 }),
    );
    substrate.position.copy(exit).lerp(entry, .5);
    substrate.position.y -= .032;
    group.add(substrate);
    const copper = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 36, .014, 6),
      new THREE.MeshStandardMaterial({ color: 0xb67c4b, metalness: .72, roughness: .36 }),
    );
    group.add(copper);
  } else {
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, radius, 8), cableMaterial));
  }

  // The illuminated route marks one conductor through the assembly.
  if (form === 'dc' && !trace) {
    const returnCurve = new THREE.CatmullRomCurve3(curve.getSpacedPoints(26).map((point) => {
      point.z += radius * 2.3;
      return point;
    }));
    group.add(new THREE.Mesh(new THREE.TubeGeometry(returnCurve, 64, radius * .86, 8), cableMaterial));
  }

  const coreMaterial = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: .47, depthTest: false, depthWrite: false, toneMapped: false,
  });
  const core = new THREE.Mesh(new THREE.TubeGeometry(curve, 65, radius * .26, 5), coreMaterial);
  core.renderOrder = 9;
  const auraMaterial = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: .08, depthTest: false, depthWrite: false, toneMapped: false,
    blending: THREE.AdditiveBlending,
  });
  const aura = new THREE.Mesh(new THREE.TubeGeometry(curve, 65, radius * .54, 6), auraMaterial);
  aura.renderOrder = 8;
  const lead = new THREE.Mesh(
    new THREE.SphereGeometry(trace ? .026 : Math.max(.042, radius * 1.05), 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff0d4, depthTest: false, depthWrite: false, toneMapped: false }),
  );
  lead.renderOrder = 10;
  lead.visible = false;
  group.add(core, aura, lead);
  root.add(group);

  return {
    group, curve, form, label,
    update(progress) {
      lead.visible = Number.isFinite(progress);
      coreMaterial.opacity = lead.visible ? .90 : .47;
      auraMaterial.opacity = lead.visible ? .22 : .08;
      if (lead.visible) curve.getPointAt(THREE.MathUtils.clamp(progress, 0, 1), lead.position);
    },
  };
}

function gravelTexture() {
  const canvas = document.createElement('canvas');
  const width = 1280;
  const height = 448;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const texture = context.createImageData(width, height);
  let seed = 0x4fbb41e5;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 0x100000000;
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const edge = Math.max(Math.abs(x / width - .5), Math.abs(y / height - .5));
      const fine = (random() - .5) * 31;
      const shade = 11 * Math.sin(x * .049 + y * .031) * Math.sin(x * .019 - y * .067)
        + 5 * Math.sin(x * .15 - y * .24);
      const gray = 83 + fine + shade;
      texture.data[index] = gray + 5;
      texture.data[index + 1] = gray;
      texture.data[index + 2] = gray - 10;
      texture.data[index + 3] = 255 * (1 - THREE.MathUtils.smoothstep(edge, .30, .50));
    }
  }
  context.putImageData(texture, 0, 0);
  context.globalCompositeOperation = 'source-atop';
  for (let index = 0; index < 7800; index += 1) {
    const x = random() * width;
    const y = random() * height;
    const radius = .18 + random() * .95;
    context.fillStyle = random() > .52 ? 'rgba(161,144,114,.34)' : 'rgba(32,26,23,.32)';
    context.beginPath();
    context.ellipse(x, y, radius * 1.5, radius, random() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  return map;
}

export function createSolarGround(first, last) {
  const west = first.center.x - first.size.x / 2;
  const east = last.center.x + last.size.x / 2;
  const map = gravelTexture();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(east - west + 14, 16),
    new THREE.MeshStandardMaterial({ map, transparent: true, depthWrite: false, roughness: 1 }),
  );
  ground.name = 'Gravel beneath the solar plant equipment';
  ground.position.set((east + west) / 2, -.055, .9);
  ground.rotation.x = -Math.PI / 2;
  ground.renderOrder = 1;
  return ground;
}
