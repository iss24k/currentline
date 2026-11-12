import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

function finish(color, metalness = 0.4, roughness = 0.5, emissive = 0x000000, emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness, emissive, emissiveIntensity });
}

const material = {
  nickel: finish(0xa8ada8, 0.63, 0.38),
  steel: finish(0x656b66, 0.58, 0.46),
  navy: finish(0x404744, 0.37),
  dark: finish(0x242928, 0.28),
  black: finish(0x101211, 0.15, 0.64),
  white: finish(0xd0d1c6, 0.32),
  rubber: finish(0x2c302d, 0.04, 0.85),
  ceramic: finish(0x76796e, 0.14, 0.34),
  copper: finish(0xa46b48, 0.63, 0.36),
  gold: finish(0xc59c5d, 0.56, 0.38),
  amber: finish(0xc99b56, 0.19, 0.36, 0xae6c27, .52),
  aqua: finish(0x87afa9, 0.20, 0.37, 0x528b81, .46),
  blue: finish(0x4a5b5c, 0.39, 0.51),
  glass: finish(0x344345, 0.4, 0.22, 0x233333, 0.21),
  pcb: finish(0x3a5043, 0.21, 0.58),
  red: finish(0xa2614e, 0.35, 0.46),
};

function mesh(parent, geometry, surface, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, surface);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function group(parent, x = 0, y = 0, z = 0) {
  const object = new THREE.Group();
  object.position.set(x, y, z);
  parent?.add(object);
  return object;
}

function box(parent, x, y, z, w, h, d, surface, bevel = 0) {
  const geometry = bevel
    ? new RoundedBoxGeometry(w, h, d, 1, Math.min(bevel, w / 2, h / 2, d / 2))
    : new THREE.BoxGeometry(w, h, d);
  return mesh(parent, geometry, surface, x, y, z);
}

function cylinder(parent, x, y, z, radius, length, surface, axis = 'y', segments = 16) {
  const object = mesh(parent, new THREE.CylinderGeometry(radius, radius, length, segments), surface, x, y, z);
  if (axis === 'x') object.rotation.z = -Math.PI / 2;
  if (axis === 'z') object.rotation.x = Math.PI / 2;
  return object;
}

function beam(parent, from, to, width, surface, round = false) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const axis = end.clone().sub(start);
  const midpoint = start.addScaledVector(axis, 0.5);
  const geometry = round
    ? new THREE.CylinderGeometry(width / 2, width / 2, axis.length(), 8)
    : new THREE.BoxGeometry(width, axis.length(), width);
  const object = mesh(parent, geometry, surface, ...midpoint.toArray());
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
  return object;
}

function tube(parent, points, radius, surface) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  return mesh(parent, new THREE.TubeGeometry(curve, Math.max(12, points.length * 5), radius, 8, false), surface);
}

function label(parent, text, x, y, z, width, height, accent = '#cad1c5') {
  box(parent, x, y, z - 0.01, width + 0.045, height + 0.045, 0.035, material.dark, 0.012);
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = Math.max(36, Math.round(canvas.width * height / width));
  const context = canvas.getContext('2d');
  if (!context) return;
  context.fillStyle = '#262c29';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = accent;
  context.fillRect(8, 9, 3, canvas.height - 18);
  context.font = `bold ${Math.floor(canvas.height * 0.46)}px monospace`;
  context.textBaseline = 'middle';
  context.fillText(text, 23, canvas.height / 2 + 1, canvas.width - 36);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const surface = new THREE.MeshBasicMaterial({ map: texture });
  const face = mesh(parent, new THREE.PlaneGeometry(width, height), surface, x, y, z + 0.009);
  face.castShadow = false;
  face.receiveShadow = false;
}

function fasteners(parent, x, y, z, w, h, radius = 0.043) {
  for (const side of [-1, 1]) {
    for (const edge of [-1, 1]) {
      cylinder(parent, x + side * w / 2, y + edge * h / 2, z, radius, 0.045, material.nickel, 'z', 6);
    }
  }
}

function louvers(parent, x, y, z, width, rows, spacing = 0.115) {
  box(parent, x, y, z, width + 0.09, rows * spacing + 0.045, 0.045, material.black, 0.02);
  for (let row = 0; row < rows; row++) {
    box(parent, x, y + (row - (rows - 1) / 2) * spacing, z + 0.038, width, 0.038, 0.045, material.steel, 0.012);
  }
}

function lamp(parent, x, y, z, surface = material.aqua, radius = 0.06) {
  cylinder(parent, x, y, z, radius + 0.024, 0.032, material.black, 'z', 10);
  cylinder(parent, x, y, z + 0.025, radius, 0.035, surface, 'z', 10);
}

function plinth(parent, width, depth, color = material.navy, x = 0, z = 0) {
  box(parent, x, 0.09, z, width, 0.18, depth, material.dark, 0.055);
  box(parent, x, 0.22, z, width - 0.2, 0.12, depth - 0.18, color, 0.045);
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      cylinder(parent, x + side * (width / 2 - 0.29), 0.305, z + end * (depth / 2 - 0.26), 0.07, 0.06, material.nickel, 'y', 6);
    }
  }
}

function bushing(parent, x, y, z, scale = 1) {
  const item = group(parent, x, y, z);
  item.scale.setScalar(scale);
  cylinder(item, 0, 0.08, 0, 0.24, 0.14, material.steel, 'y', 12);
  cylinder(item, 0, 0.62, 0, 0.12, 1.16, material.ceramic);
  for (let ring = 0; ring < 7; ring++) {
    cylinder(item, 0, 0.22 + ring * 0.13, 0, 0.17 - ring * 0.008, 0.065, material.ceramic);
  }
  cylinder(item, 0, 1.14, 0, 0.12, 0.22, material.nickel, 'y', 12);
  cylinder(item, 0, 1.27, 0, 0.056, 0.13, material.copper, 'y', 8);
  return item;
}

function coilBank(parent, x, y, z, scale = 1) {
  const bank = group(parent, x, y, z);
  bank.scale.setScalar(scale);
  for (const lane of [-1, 0, 1]) {
    cylinder(bank, lane * 1.02, 1.01, 0, 0.37, 1.8, material.copper, 'y', 20);
    for (let layer = 0; layer < 14; layer++) {
      cylinder(bank, lane * 1.02, 0.22 + layer * 0.115, 0, 0.395, 0.058, layer % 3 === 0 ? material.gold : material.copper, 'y', 20);
    }
    cylinder(bank, lane * 1.02, 0.11, 0, 0.44, 0.14, material.dark);
    cylinder(bank, lane * 1.02, 1.93, 0, 0.44, 0.12, material.dark);
    beam(bank, [lane * 1.02, 2, 0], [lane * 1.02, 2.43, -0.25], 0.11, material.copper);
  }
  for (const zSide of [-1, 1]) {
    box(bank, 0, 1.95, zSide * 0.49, 3.1, 0.23, 0.27, material.steel);
    box(bank, 0, 0.1, zSide * 0.49, 3.1, 0.23, 0.27, material.steel);
  }
  for (const edge of [-1, 1]) {
    box(bank, edge * 1.51, 1.04, -0.15, 0.22, 1.92, 0.46, material.steel);
  }
  return bank;
}

function stepUp(cutaway = false) {
  const scene = group();
  plinth(scene, 6.8, 4.65);
  box(scene, 0, 0.43, -0.25, 4.9, 0.31, 2.67, material.steel, 0.06);
  if (cutaway) {
    box(scene, 0, 1.53, -1.54, 4.27, 2.1, 0.16, material.navy, 0.06);
    coilBank(scene, -0.27, 0.59, 0.04, 1.12);
    const movedPanel = box(scene, 2.53, 1.35, 1.38, 1.55, 1.65, 0.14, material.steel, 0.06);
    movedPanel.rotation.y = -0.5;
    label(scene, 'WINDINGS', -0.25, 0.58, 1.68, 1.55, 0.23, '#ffca80');
  } else {
    box(scene, 0, 1.63, -0.25, 4.38, 2.13, 2.48, material.steel, 0.13);
    box(scene, 0, 1.78, 1.025, 3.77, 1.62, 0.13, material.navy, 0.065);
    fasteners(scene, 0, 1.77, 1.123, 3.57, 1.42);
    label(scene, 'GSU / STEP-UP', 0, 2.25, 1.135, 2.14, 0.27);
    box(scene, 0, 1.69, 1.135, 2.18, 0.035, 0.045, material.aqua);
    box(scene, 0, 2.72, -0.25, 4.63, 0.19, 2.7, material.nickel, 0.055);
    for (const side of [-1, 1]) {
      for (let fin = 0; fin < 10; fin++) {
        box(scene, side * 2.53, 1.49, -1.3 + fin * 0.23, 0.87, 1.78, 0.095, material.steel, 0.024);
      }
      for (const y of [0.64, 2.38]) {
        cylinder(scene, side * 2.66, y, -0.25, 0.13, 2.42, material.nickel, 'z');
      }
    }
  }
  for (const x of [-1.35, 0, 1.35]) {
    bushing(scene, x, 2.77, -0.56, 1.3);
    bushing(scene, x * 0.78, 2.78, 0.63, 0.62);
  }
  cylinder(scene, 0, 3.0, -1.72, 0.32, 3.25, material.navy, 'x');
  for (const x of [-1.7, 1.7]) {
    cylinder(scene, x, 3.0, -1.72, 0.37, 0.17, material.nickel, 'x');
  }
  box(scene, -2.48, 0.88, 1.55, 0.85, 1.14, 0.55, material.navy, 0.055);
  lamp(scene, -2.51, 1.23, 1.85, material.amber);
  tube(scene, [[-2.62, 0.46, 1.5], [-2.58, 0.3, 1.85], [-1.65, 0.33, 1.91], [-1.37, 0.56, 1.17]], 0.055, material.copper);
  return scene;
}

function tower(parent, x, z, height, spread) {
  const object = group(parent, x, 0, z);
  const levels = [
    [0.17, spread],
    [height * 0.3, spread * 0.7],
    [height * 0.6, spread * 0.4],
    [height * 0.89, spread * 0.33],
    [height, spread * 0.14],
  ];
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (let i = 0; i < levels.length - 1; i++) {
    const [bottom, wide] = levels[i];
    const [top, narrow] = levels[i + 1];
    corners.forEach(([sx, sz], j) => {
      const [nx, nz] = corners[(j + 1) % corners.length];
      const start = [sx * wide, bottom, sz * wide];
      const end = [sx * narrow, top, sz * narrow];
      beam(object, start, end, 0.082, material.nickel);
      beam(object, start, [nx * wide, bottom, nz * wide], 0.056, material.steel);
      beam(object, start, [nx * narrow, top, nz * narrow], 0.055, material.steel);
      beam(object, [nx * wide, bottom, nz * wide], end, 0.043, material.steel);
    });
  }
  for (const [sx, sz] of corners) {
    box(object, sx * spread, 0.13, sz * spread, 0.46, 0.26, 0.46, material.steel, 0.045);
  }
  const points = [];
  for (const [level, halfWidth] of [[0.82, 1.02], [0.64, 1.22], [0.49, 1.12]]) {
    const y = height * level;
    const zOffset = halfWidth * (height / 5.7);
    beam(object, [0, y, -zOffset], [0, y, zOffset], 0.092, material.nickel);
    for (const direction of [-1, 1]) {
      beam(object, [0, y + 0.41, 0], [0, y, direction * zOffset], 0.056, material.steel);
    }
    for (let i = 0; i < 5; i++) {
      cylinder(object, 0, y - 0.075 - i * 0.07, zOffset, 0.088, 0.041, material.ceramic, 'y', 10);
    }
    points.push([x, y - 0.44, z + zOffset]);
  }
  beam(object, [0, height, 0], [0, height + 0.15, 0], 0.05, material.nickel);
  return points;
}

function lines() {
  const scene = group();
  const from = tower(scene, -2.45, -0.5, 5.75, 0.81);
  const to = tower(scene, 2.45, -0.5, 5.75, 0.81);
  for (let conductor = 0; conductor < 3; conductor++) {
    const a = from[conductor];
    const b = to[conductor];
    const route = [a, [-1.3, a[1] - 0.42, a[2]], [0, a[1] - 0.57, a[2]], [1.3, b[1] - 0.42, b[2]], b];
    tube(scene, route, 0.037, conductor === 1 ? material.aqua : material.nickel);
  }
  tube(scene, [[-2.45, 5.86, -0.5], [0, 5.38, -0.5], [2.45, 5.86, -0.5]], 0.022, material.steel);
  box(scene, -2.46, 0.45, 1.14, 0.75, 0.55, 0.45, material.navy, 0.04);
  label(scene, 'HV SPAN', -2.46, 0.47, 1.37, 0.6, 0.2);
  return scene;
}

function substation() {
  const scene = group();
  plinth(scene, 6.7, 5.05);
  const transformer = group(scene, 0, 0.28, -1.02);
  box(transformer, 0, 0.65, 0, 3.55, 1.3, 1.37, material.navy, 0.08);
  box(transformer, 0, 1.3, 0, 3.69, 0.15, 1.5, material.steel, 0.043);
  for (const x of [-1.34, 0, 1.34]) {
    bushing(transformer, x, 1.4, -0.15, 0.52);
  }
  for (const side of [-1, 1]) {
    for (let rib = 0; rib < 6; rib++) {
      box(transformer, side * 1.86, 0.7, -0.5 + rib * 0.2, 0.44, 0.95, 0.079, material.steel, 0.018);
    }
  }
  label(transformer, 'UTILITY TRANSFORMER', 0.16, 0.83, 0.708, 1.48, 0.19);
  for (const z of [-1.57, 1.27]) {
    for (const x of [-2.6, 2.6]) {
      box(scene, x, 0.44, z, 0.45, 0.3, 0.48, material.steel);
      box(scene, x, 1.74, z, 0.19, 2.65, 0.19, material.nickel);
    }
    box(scene, 0, 3.03, z, 5.43, 0.18, 0.19, material.nickel);
    for (const x of [-1.55, 0, 1.55]) {
      for (let ring = 0; ring < 6; ring++) {
        cylinder(scene, x, 2.97 - ring * 0.085, z, 0.115, 0.038, material.ceramic, 'y', 12);
      }
    }
  }
  for (const x of [-1.55, 0, 1.55]) {
    tube(scene, [[x, 2.48, -1.57], [x, 2.23, -0.22], [x, 2.48, 1.27]], 0.046, material.copper);
    const breaker = group(scene, x, 0.32, 0.18);
    box(breaker, 0, 0.16, 0, 0.72, 0.27, 0.94, material.navy, 0.045);
    box(breaker, 0, 0.72, 0, 0.33, 0.97, 0.71, material.steel, 0.035);
    for (const z of [-0.3, 0.3]) bushing(breaker, 0, 1.14, z, 0.63);
    beam(breaker, [0, 1.97, 0.31], [0, 2.05, -0.31], 0.07, material.copper);
  }
  box(scene, -2.18, 0.71, 1.82, 0.88, 0.88, 0.68, material.blue, 0.055);
  label(scene, 'YARD CONTROL', -2.18, 0.83, 2.16, 0.75, 0.15);
  lamp(scene, -2.38, 0.56, 2.18);
  lamp(scene, -2.18, 0.56, 2.18, material.amber);
  return scene;
}

function cabinet(parent, x, y, z, width, height, depth, cutaway = false, panel = material.navy) {
  const body = group(parent, x, y, z);
  const rear = -depth / 2;
  if (cutaway) {
    box(body, 0, height / 2, rear + 0.06, width, height, 0.13, panel, 0.025);
    for (const side of [-1, 1]) {
      for (const face of [-1, 1]) {
        box(body, side * (width / 2 - 0.075), height / 2, face * (depth / 2 - 0.075), 0.15, height, 0.15, material.nickel);
      }
    }
    for (const level of [0.08, height - 0.08]) {
      box(body, 0, level, 0, width, 0.16, depth, material.steel, 0.025);
    }
  } else {
    box(body, 0, height / 2, 0, width, height, depth, panel, 0.065);
    box(body, 0, height - 0.06, 0, width + 0.03, 0.12, depth + 0.035, material.steel, 0.036);
  }
  return body;
}

function intake() {
  const scene = group();
  plinth(scene, 6.12, 3.42);
  for (const [i, x] of [-1.75, 0, 1.75].entries()) {
    const body = cabinet(scene, x, 0.28, -0.22, 1.7, 3.38, 1.72, false, material.steel);
    const z = 0.87;
    box(body, 0, 2.85, z, 1.51, 0.73, 0.08, material.navy, 0.05);
    box(body, 0, 1.46, z, 1.5, 1.82, 0.075, material.navy, 0.04);
    label(body, ['MV INCOMING', 'PROTECTION', 'METERING'][i], 0, 3.02, z + 0.057, 1.23, 0.24);
    box(body, -0.22, 2.71, z + 0.06, 0.48, 0.24, 0.05, material.glass, 0.026);
    lamp(body, 0.36, 2.74, z + 0.064, material.aqua, 0.049);
    lamp(body, 0.54, 2.74, z + 0.064, material.amber, 0.049);
    box(body, 0.58, 1.7, z + 0.065, 0.11, 0.54, 0.075, material.nickel, 0.025);
    fasteners(body, 0, 1.46, z + 0.06, 1.27, 1.6, 0.027);
    louvers(body, -0.08, 0.91, z + 0.064, 0.86, 4, 0.095);
    tube(body, [[0, 0.28, z], [0, 0.08, 1.21], [0.08, 0.08, 1.53], [0.28, 0.03, 1.69]], 0.075, material.copper);
  }
  return scene;
}

function siteTransformer(cutaway = false) {
  const scene = group();
  plinth(scene, 5.92, 4.0);
  const body = cabinet(scene, 0, 0.28, -0.18, 4.72, 3.45, 2.64, cutaway, material.steel);
  if (cutaway) {
    coilBank(body, 0, 0.32, 0.21, 1.08);
    for (const x of [-1.1, 0, 1.1]) {
      tube(body, [[x, 2.52, -0.03], [x, 2.92, -0.03], [x, 3.15, -0.51]], 0.068, material.copper);
    }
    label(body, 'CORE & WINDINGS', 0, 0.25, 1.38, 1.9, 0.25, '#ffd197');
  } else {
    for (const x of [-1.08, 1.08]) {
      box(body, x, 1.74, 1.36, 2.01, 2.95, 0.075, material.navy, 0.06);
      fasteners(body, x, 1.74, 1.44, 1.81, 2.73);
      louvers(body, x, 1.17, 1.44, 1.52, 11);
    }
    label(body, 'DRY-TYPE TRANSFORMER', 0, 2.82, 1.48, 2.42, 0.29);
    lamp(body, 1.56, 2.48, 1.45, material.amber);
  }
  for (const x of [-1.43, 0, 1.43]) {
    box(body, x, 3.47, -0.43, 0.88, 0.17, 0.77, material.navy, 0.04);
    box(body, x, 3.64, -0.43, 0.68, 0.24, 0.54, material.steel, 0.035);
    box(body, x, 3.74, -0.43, 0.56, 0.07, 0.43, material.nickel, 0.02);
  }
  return scene;
}

function transfer(cutaway = false) {
  const scene = group();
  plinth(scene, 5.3, 3.55);
  const cabinetZ = -0.38;
  const body = cabinet(scene, 0, 0.28, cabinetZ, 3.79, 3.48, 2.0, cutaway, material.navy);
  const front = 1.04;
  for (const [x, tag, surface] of [[-1.02, 'UTILITY', material.aqua], [1.02, 'GENERATOR', material.amber]]) {
    box(body, x, 3.64, -0.35, 1.45, 0.31, 0.87, material.steel, 0.058);
    box(body, x, 3.82, -0.35, 0.81, 0.11, 0.61, surface, 0.032);
    if (cutaway) {
      for (let bar = 0; bar < 3; bar++) {
        const dx = x + (bar - 1) * 0.26;
        box(body, dx, 2.78, 0.17, 0.14, 1.3, 0.12, material.copper);
        cylinder(body, dx, 2.16, 0.25, 0.105, 0.19, surface, 'z');
        beam(body, [dx, 2.13, 0.33], [dx * 0.31, 1.3, 0.47], 0.095, material.copper);
      }
      label(body, tag, x, 2.13, 0.57, 0.88, 0.21, x < 0 ? '#b3ebf3' : '#ffd197');
    }
  }
  if (cutaway) {
    box(body, 0, 1.11, 0.32, 1.63, 0.5, 0.43, material.dark, 0.065);
    for (const x of [-0.46, 0, 0.46]) box(body, x, 0.56, 0.37, 0.16, 0.84, 0.17, material.copper);
    label(body, 'TO UPS', 0, 1.12, 0.57, 0.85, 0.18);
  } else {
    box(body, 0, 2.52, front, 3.38, 1.35, 0.1, material.steel, 0.05);
    label(body, 'AUTOMATIC TRANSFER', 0, 2.91, front + 0.067, 2.39, 0.27);
    box(body, 0, 2.28, front + 0.074, 1.38, 0.43, 0.084, material.glass, 0.043);
    lamp(body, -1.17, 2.24, front + 0.078);
    lamp(body, 1.17, 2.24, front + 0.078, material.amber);
    box(body, 0, 0.99, front, 3.38, 1.48, 0.1, material.steel, 0.05);
    louvers(body, 0, 0.84, front + 0.06, 1.48, 6);
    fasteners(body, 0, 1, front + 0.071, 3.12, 1.26);
  }
  return scene;
}

function fan(parent, x, y, z, radius, animate = false) {
  cylinder(parent, x, y, z, radius * 1.03, 0.13, material.dark, 'z');
  cylinder(parent, x, y, z + 0.083, radius * 0.9, 0.036, material.black, 'z');
  const hub = group(parent, x, y, z + 0.11);
  cylinder(hub, 0, 0, 0.05, radius * 0.18, 0.11, material.nickel, 'z');
  for (let index = 0; index < 7; index++) {
    const blade = group(hub);
    blade.rotation.z = index * Math.PI * 2 / 7;
    const fin = box(blade, 0.08 * radius, radius * 0.48, 0, radius * 0.28, radius * 0.7, radius * 0.075, material.steel, 0.022);
    fin.rotation.z = -0.26;
  }
  if (animate) hub.userData.spin = { axis: 'z', speed: 3.8 };
  return hub;
}

function generator(cutaway = false) {
  const scene = group();
  plinth(scene, 7.03, 3.95);
  box(scene, 0, 0.46, 0, 6.34, 0.35, 2.47, material.steel, 0.08);
  const engine = group(scene, -1.1, 0.61, -0.06);
  box(engine, 0, 0.57, 0, 2.55, 1.12, 1.72, material.blue, 0.15);
  for (const side of [-1, 1]) {
    const bank = group(engine, 0, 1.24, side * 0.43);
    bank.rotation.x = side * 0.16;
    box(bank, 0, 0.12, 0, 2.45, 0.51, 0.7, material.nickel, 0.1);
    for (let index = 0; index < 6; index++) {
      box(bank, -0.96 + 0.38 * index, 0.44, 0, 0.21, 0.16, 0.47, material.dark, 0.04);
    }
    tube(engine, [[-1.3, 0.82, side * 0.8], [-0.64, 1.12, side * 0.89], [0.6, 1.12, side * 0.89], [1.11, 1.51, side * 0.7]], 0.105, material.copper);
  }
  const alternator = group(scene, 1.54, 1.39, -0.04);
  cylinder(alternator, 0, 0, 0, 0.73, 1.98, cutaway ? material.copper : material.navy, 'x', 24);
  for (let rib = 0; rib < 12; rib++) {
    const shell = group(alternator, -0.76 + rib * 0.14, 0, 0);
    cylinder(shell, 0, 0, 0, 0.79, 0.054, cutaway ? material.gold : material.steel, 'x', 24);
  }
  for (const x of [-1.01, 1.01]) cylinder(alternator, x, 0, 0, 0.81, 0.16, material.nickel, 'x', 24);
  cylinder(alternator, 1.15, 0, 0, 0.25, 0.37, material.dark, 'x');
  box(scene, -2.79, 1.67, -0.12, 0.4, 2.37, 2.45, material.navy, 0.075);
  box(scene, -2.79, 1.61, 1.15, 0.34, 1.55, 0.13, material.nickel, 0.04);
  if (!cutaway) {
    for (const x of [-2.63, 2.63]) box(scene, x, 2.46, -1.05, 0.18, 3.6, 0.18, material.steel);
    box(scene, 0, 4.13, -0.42, 6.06, 0.24, 2.2, material.navy, 0.09);
    label(scene, 'STANDBY / GENSET', -1.2, 4.1, 0.7, 2.18, 0.19, '#ffd197');
  } else {
    label(scene, 'ENGINE', -1.13, 0.5, 1.27, 1.15, 0.2);
    label(scene, 'ALTERNATOR', 1.55, 0.5, 1.27, 1.4, 0.2);
  }
  tube(scene, [[-0.66, 2.03, -0.3], [-0.63, 2.89, -0.48], [-0.4, 3.02, -0.86], [0.54, 3.02, -0.86]], 0.11, material.steel);
  cylinder(scene, 0.2, 3.03, -0.86, 0.24, 1.04, material.steel, 'x');
  return scene;
}

function battery(cutaway = false) {
  const scene = group();
  plinth(scene, 5.55, 3.68);
  const rack = cabinet(scene, -0.4, 0.28, -0.25, 3.51, 3.96, 2.22, true, material.navy);
  const service = cabinet(scene, 1.78, 0.28, -0.25, 0.76, 3.96, 2.22, false, material.steel);
  label(service, 'BMS', 0, 3.42, 1.16, 0.54, 0.2);
  box(service, 0, 2.97, 1.15, 0.48, 0.31, 0.047, material.glass, 0.018);
  lamp(service, 0, 2.55, 1.18, material.amber, 0.056);
  louvers(service, 0, 0.58, 1.14, 0.4, 5, 0.093);
  for (let row = 0; row < 5; row++) {
    const y = 0.45 + row * 0.66;
    const opened = cutaway && row === 2;
    box(rack, 0, y - 0.09, opened ? 0.8 : 0, 3.06, 0.09, 2.02, material.steel, 0.035);
    for (let cell = 0; cell < 4; cell++) {
      const x = (cell - 1.5) * 0.73;
      const tray = group(rack, x, y, opened ? 1.03 : 0.03);
      box(tray, 0, 0.23, 0, 0.66, 0.45, 1.75, cell % 2 === 0 ? material.blue : material.navy, 0.05);
      box(tray, 0, 0.23, 0.9, 0.6, 0.37, 0.09, material.steel, 0.028);
      box(tray, 0, 0.2, 0.96, 0.23, 0.064, 0.037, material.dark, 0.02);
      lamp(tray, 0.197, 0.29, 0.956, material.aqua, 0.033);
      if (opened) {
        for (const terminal of [-1, 1]) {
          cylinder(tray, terminal * 0.17, 0.5, 0.6, 0.076, 0.1, terminal < 0 ? material.copper : material.gold, 'y', 10);
        }
      }
    }
    if (opened) {
      beam(rack, [-1.25, y + 0.57, 1.63], [1.25, y + 0.57, 1.63], 0.08, material.copper);
    }
  }
  label(rack, 'BATTERY / DC', 0, 3.77, 1.12, 1.75, 0.22, '#ffd197');
  tube(scene, [[1.78, 3.85, -1.11], [1.6, 4.24, -1.12], [0.62, 4.32, -1.12], [0.53, 4.09, -1.02]], 0.064, material.copper);
  return scene;
}

function powerModule(parent, y, caption, tint, depthOffset) {
  const unit = group(parent, 0, y, depthOffset);
  box(unit, 0, 0, 0, 3.1, 0.13, 1.86, material.steel, 0.038);
  box(unit, 0, 0.103, 0, 2.84, 0.08, 1.49, material.pcb, 0.023);
  for (const x of [-1.1, -0.69, -0.28]) {
    cylinder(unit, x, 0.37, -0.15, 0.16, 0.47, material.dark, 'y', 12);
    cylinder(unit, x, 0.613, -0.15, 0.148, 0.028, material.nickel, 'y', 12);
  }
  box(unit, 0.66, 0.29, -0.13, 0.98, 0.33, 1.02, material.steel, 0.026);
  for (let fin = 0; fin < 9; fin++) {
    box(unit, 0.245 + fin * 0.104, 0.49, -0.13, 0.045, 0.17, 0.96, material.nickel);
  }
  box(unit, 0, 0.068, 0.96, 3.13, 0.21, 0.13, material.dark, 0.035);
  label(unit, caption, -0.71, 0.07, 1.036, 1.21, 0.15);
  lamp(unit, 1.12, 0.08, 1.035, tint, 0.039);
}

function ups(cutaway = false) {
  const scene = group();
  plinth(scene, 5.7, 3.76);
  const body = cabinet(scene, 0, 0.28, -0.24, 4.68, 3.74, 2.43, cutaway, material.navy);
  if (cutaway) {
    powerModule(body, 0.52, 'RECTIFIER', material.aqua, 0.31);
    powerModule(body, 1.61, 'DC LINK', material.amber, 0.55);
    powerModule(body, 2.7, 'INVERTER', material.aqua, 0.76);
    tube(body, [[1.79, 0.52, 0.59], [1.93, 1.12, 0.52], [1.93, 2.09, 0.53], [1.76, 2.7, 0.93]], 0.047, material.copper);
  } else {
    box(body, 0, 2.43, 1.24, 4.18, 1.85, 0.095, material.steel, 0.056);
    box(body, -0.59, 2.58, 1.3, 2.46, 1.05, 0.12, material.dark, 0.055);
    box(body, -0.62, 2.67, 1.38, 1.82, 0.47, 0.06, material.glass, 0.045);
    label(body, 'ONLINE UPS', -0.62, 2.67, 1.42, 1.53, 0.23, '#b8f2f2');
    for (const x of [-1.18, -0.9, -0.62]) lamp(body, x, 2.26, 1.4, material.aqua, 0.044);
    box(body, 1.43, 2.48, 1.31, 0.39, 1.37, 0.093, material.dark, 0.025);
    box(body, 1.43, 2.48, 1.37, 0.074, 1.24, 0.043, material.aqua, 0.025);
    for (const x of [-1, 1]) {
      box(body, x, 0.79, 1.24, 1.9, 1.22, 0.088, material.steel, 0.045);
      louvers(body, x, 0.78, 1.303, 1.56, 8, 0.092);
    }
  }
  louvers(body, 0, 3.52, 1.23, 2.78, 2, 0.09);
  return scene;
}

function busway(cutaway = false) {
  const scene = group();
  plinth(scene, 7.02, 4.18);
  for (const x of [-2.76, 2.76]) {
    for (const z of [-1.12, 1.09]) {
      box(scene, x, 0.36, z, 0.4, 0.2, 0.43, material.steel, 0.028);
      box(scene, x, 2.19, z, 0.19, 3.62, 0.21, material.nickel);
      for (let slot = 0; slot < 8; slot++) {
        box(scene, x, 0.78 + 0.41 * slot, z + 0.111, 0.075, 0.106, 0.013, material.dark);
      }
    }
    box(scene, x, 4.05, 0, 0.25, 0.2, 2.51, material.nickel);
    beam(scene, [x, 3.32, -1.11], [x, 4.03, -0.44], 0.095, material.steel);
    beam(scene, [x, 3.32, 1.09], [x, 4.03, 0.44], 0.095, material.steel);
  }
  box(scene, 0, 4.04, -0.93, 5.92, 0.21, 0.18, material.steel);
  box(scene, 0, 3.74, 0.05, 6.08, 0.3, 0.76, material.navy, 0.035);
  if (cutaway) {
    for (const [i, z] of [-0.21, -0.035, 0.145, 0.315].entries()) {
      box(scene, 0.07, 4.01, z, 5.68, 0.105, 0.071, i < 3 ? material.copper : material.gold, 0.012);
    }
    box(scene, 0.07, 4.27, 0.22, 3.44, 0.1, 0.71, material.nickel, 0.031);
    label(scene, 'CONDUCTOR BARS', 0, 4.26, 0.61, 1.82, 0.19, '#ffd197');
  } else {
    box(scene, 0, 3.95, 0.05, 6.08, 0.15, 0.76, material.steel, 0.044);
    for (const x of [-2.56, -1.03, 0.66, 2.28]) {
      box(scene, x, 3.86, 0.05, 0.155, 0.39, 0.86, material.nickel, 0.035);
    }
    label(scene, 'OVERHEAD BUSWAY', 0, 3.77, 0.462, 2.02, 0.21);
  }
  for (const x of [-1.46, 1.42]) {
    box(scene, x, 3.35, 0.16, 0.65, 0.52, 0.63, material.blue, 0.045);
    lamp(scene, x + 0.16, 3.32, 0.484, material.amber, 0.042);
    tube(scene, [[x, 3.1, 0.12], [x, 2.85, 0.14], [x + 0.21, 2.53, 0.28], [x + 0.27, 2.27, 0.28], [x + 0.27, 1.5, 0.28]], 0.064, material.rubber);
  }
  return scene;
}

function floorPdu(cutaway = false) {
  const scene = group();
  plinth(scene, 4.89, 3.75);
  const body = cabinet(scene, -0.3, 0.28, -0.28, 3.13, 3.51, 2.42, cutaway, material.blue);
  const wing = cabinet(scene, 1.72, 0.28, -0.28, 0.86, 3.51, 2.18, cutaway, material.steel);
  if (cutaway) {
    coilBank(body, 0, 0.17, 0.16, 0.89);
    for (const x of [-0.89, 0, 0.89]) {
      tube(body, [[x, 2.26, -0.07], [x, 2.64, -0.08], [x + 0.1, 2.9, -0.36]], 0.058, material.copper);
    }
    for (let row = 0; row < 6; row++) {
      const y = 0.78 + row * 0.31;
      box(wing, 0, y, 0.51, 0.54, 0.25, 0.34, material.dark, 0.026);
      box(wing, 0, y, 0.701, 0.21, 0.096, 0.08, row % 2 ? material.nickel : material.amber, 0.015);
    }
    label(wing, 'BREAKERS', 0, 2.83, 0.795, 0.64, 0.16);
  } else {
    box(body, 0, 1.74, 1.24, 2.77, 3.12, 0.085, material.navy, 0.055);
    label(body, 'FLOOR PDU', -0.36, 2.9, 1.3, 1.5, 0.25);
    box(body, -0.38, 2.42, 1.3, 1.53, 0.35, 0.073, material.glass, 0.028);
    louvers(body, 0, 1.15, 1.306, 2.13, 11, 0.097);
    fasteners(body, 0, 1.75, 1.316, 2.59, 2.92);
    box(wing, 0, 1.78, 1.105, 0.67, 3.13, 0.082, material.dark, 0.041);
    lamp(wing, 0, 2.8, 1.154, material.aqua, 0.057);
    box(wing, 0.03, 1.7, 1.171, 0.11, 0.59, 0.09, material.nickel, 0.025);
  }
  return scene;
}

function rackPdu(cutaway = false) {
  const scene = group();
  plinth(scene, 6.0, 4.76);
  for (const [index, x] of [-1.34, 1.34].entries()) {
    const rack = cabinet(scene, x, 0.28, -0.48, 2.28, 4.25, 2.38, true, material.dark);
    for (const side of [-1, 1]) {
      box(rack, side * 0.98, 2.12, 1.07, 0.105, 4.06, 0.16, material.steel);
      for (let slot = 0; slot < 22; slot++) {
        box(rack, side * 0.98, 0.28 + slot * 0.165, 1.169, 0.041, 0.057, 0.023, material.black);
      }
    }
    for (let unit = 0; unit < 8; unit++) {
      const y = 0.39 + unit * 0.44;
      const depth = cutaway && unit === 4 && index === 1 ? 0.81 : 0;
      box(rack, -0.11, y, depth, 1.59, 0.35, 1.99, material.navy, 0.029);
      box(rack, -0.11, y, depth + 1.027, 1.61, 0.31, 0.075, material.steel, 0.025);
      for (let bay = 0; bay < 4; bay++) {
        const dx = -0.67 + bay * 0.368;
        box(rack, dx, y, depth + 1.08, 0.29, 0.208, 0.036, material.dark, 0.016);
        box(rack, dx - 0.061, y + 0.018, depth + 1.106, 0.123, 0.057, 0.023, material.black, 0.01);
      }
      lamp(rack, 0.609, y + 0.056, depth + 1.117, material.aqua, 0.024);
    }
    const pduX = index === 0 ? 0.81 : 1.21;
    box(rack, pduX, 2.06, 1.19, 0.28, 3.47, 0.24, index === 1 ? material.copper : material.steel, 0.031);
    box(rack, pduX, 3.58, 1.325, 0.15, 0.22, 0.048, material.glass, 0.018);
    for (let outlet = 0; outlet < 13; outlet++) {
      box(rack, pduX, 0.58 + outlet * 0.213, 1.33, 0.155, 0.116, 0.053, material.black, 0.015);
    }
    label(rack, index === 0 ? 'RACK / 01' : 'RACK PDU', 0, 3.95, 1.19, 1.44, 0.21, index === 0 ? '#cad1c5' : '#ffd197');
    if (index === 1) {
      for (const y of [0.99, 2.03, 2.66]) {
        tube(rack, [[pduX, y, 1.34], [1.22, y, 1.5], [1.04, y - 0.14, 1.52], [0.73, y - 0.14, 1.26], [0.68, y - 0.11, 1.12]], 0.039, material.gold);
      }
    }
  }
  return scene;
}

function connector(parent, x, y, z, contacts, turn) {
  const item = group(parent, x, y, z);
  item.rotation.y = turn;
  box(item, 0, 0, 0.1, 1.37, 1.09, 1.45, material.rubber, 0.19);
  box(item, 0, 0, 0.82, 1.3, 0.97, 0.15, material.steel, 0.12);
  box(item, 0, 0, 0.917, 1.03, 0.735, 0.096, material.dark, 0.11);
  const pinPositions = [[-0.34, -0.1], [0.34, -0.1], [0, 0.196]];
  for (const [px, py] of pinPositions) {
    if (contacts) {
      box(item, px, py, 1.025, 0.126, 0.102, 0.207, material.gold, 0.022);
    } else {
      box(item, px, py, 0.98, 0.164, 0.124, 0.065, material.black, 0.025);
      box(item, px, py - 0.03, 1.013, 0.079, 0.027, 0.012, material.gold, 0.007);
    }
  }
  for (let ring = 0; ring < 5; ring++) {
    const radius = 0.215 - 0.018 * ring;
    cylinder(item, 0, 0, -0.65 - ring * 0.095, radius, 0.098, material.dark, 'z', 14);
    cylinder(item, 0, 0, -0.69 - ring * 0.096, radius + 0.023, 0.036, material.steel, 'z', 14);
  }
  return item;
}

function cord(cutaway = false) {
  const scene = group();
  plinth(scene, 6.48, 4.15);
  connector(scene, -1.52, 1.07, 0.38, true, -0.28);
  connector(scene, 1.7, 1.11, 0.1, false, 0.38);
  tube(scene, [[-1.2, 1.07, -0.67], [-0.99, 0.77, -1.28], [-0.3, 0.57, -1.67], [0.69, 0.56, -1.66], [1.16, 0.78, -1.25], [1.29, 1.1, -0.94]], 0.129, material.rubber);
  for (const x of [-1.51, 1.69]) box(scene, x, 0.478, 0.29, 1.33, 0.41, 1.2, material.navy, 0.055);
  label(scene, 'C14 / RACK', -1.51, 0.53, 0.92, 0.95, 0.19);
  label(scene, 'C13 / SERVER', 1.69, 0.53, 0.92, 1.05, 0.19);
  if (cutaway) {
    for (const [i, surface] of [material.red, material.aqua, material.gold].entries()) {
      const y = 1.53 + i * 0.36;
      tube(scene, [[-1.57, 1.46, -0.5], [-1.02, y, -0.94], [-0.08, y + 0.11, -1.18], [0.84, y, -0.95], [1.67, 1.53, -0.34]], 0.064, surface);
    }
  }
  return scene;
}

function serverBoard(parent, width, depth, y, z) {
  box(parent, 0, y, z, width, 0.14, depth, material.pcb, 0.06);
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      cylinder(parent, side * (width / 2 - 0.21), y + 0.09, z + end * (depth / 2 - 0.23), 0.11, 0.067, material.gold, 'y', 12);
    }
  }
}

function psu(cutaway = false) {
  const scene = group();
  plinth(scene, 6.59, 3.77);
  const metal = group(scene, 0, 0.41, -0.13);
  box(metal, 0, 0.12, 0, 5.42, 0.24, 2.51, material.steel, 0.06);
  if (cutaway) {
    serverBoard(metal, 4.96, 2.16, 0.32, -0.03);
    for (const z of [-0.64, 0.09, 0.74]) {
      cylinder(metal, -1.79, 0.75, z, 0.23, 0.7, material.dark, 'y', 16);
      cylinder(metal, -1.79, 1.111, z, 0.214, 0.052, material.nickel, 'y', 16);
    }
    box(metal, -0.37, 0.67, 0.26, 0.93, 0.58, 1.21, material.gold, 0.065);
    for (let turn = 0; turn < 7; turn++) {
      box(metal, -0.725 + turn * 0.117, 0.984, 0.26, 0.074, 0.048, 1.125, material.copper, 0.018);
    }
    box(metal, 0.84, 0.53, -0.02, 0.9, 0.31, 1.67, material.steel, 0.03);
    for (let i = 0; i < 7; i++) {
      box(metal, 0.49 + i * 0.116, 0.765, -0.02, 0.043, 0.27, 1.61, material.nickel, 0.012);
    }
    for (const z of [-0.56, -0.05, 0.46]) {
      cylinder(metal, 1.82, 0.66, z, 0.15, 0.55, material.dark, 'y', 12);
      cylinder(metal, 1.82, 0.949, z, 0.142, 0.042, material.nickel, 'y', 12);
    }
    const lid = box(metal, 0.3, 1.93, -0.48, 4.51, 0.12, 1.65, material.nickel, 0.055);
    lid.rotation.x = -0.26;
    label(metal, 'AC TO DC', 0.46, 0.2, 1.287, 1.02, 0.175, '#ffd197');
  } else {
    box(metal, 0, 0.8, 0, 5.29, 1.29, 2.41, material.nickel, 0.077);
    box(metal, 0, 1.44, 0, 5.02, 0.12, 2.18, material.steel, 0.041);
    label(metal, 'SERVER PSU', -0.71, 0.95, 1.245, 1.72, 0.22);
    louvers(metal, 0.14, 0.52, 1.232, 2.33, 5, 0.091);
  }
  box(metal, -2.015, 0.72, 1.24, 0.96, 0.94, 0.14, material.dark, 0.04);
  box(metal, -2.015, 0.72, 1.338, 0.63, 0.45, 0.065, material.black, 0.046);
  for (const x of [-2.15, -1.875]) box(metal, x, 0.7, 1.38, 0.081, 0.102, 0.046, material.gold, 0.012);
  box(metal, -2.015, 0.82, 1.38, 0.085, 0.09, 0.046, material.gold, 0.012);
  fan(metal, 1.92, 0.76, 1.283, 0.46, cutaway);
  box(metal, 2.73, 0.72, -0.35, 0.24, 0.72, 1.19, material.dark, 0.041);
  for (let pin = 0; pin < 8; pin++) {
    box(metal, 2.875, 0.72, -0.82 + pin * 0.133, 0.16, 0.114, 0.071, material.gold, 0.012);
  }
  return scene;
}

function trace(parent, from, to, y, surface = material.gold, width = 0.04) {
  const [x0, z0] = from;
  const [x1, z1] = to;
  beam(parent, [x0, y, z0], [x1, y, z1], width, surface);
}

function vrm(cutaway = false) {
  const scene = group();
  plinth(scene, 6.81, 4.59);
  serverBoard(scene, 6.31, 3.98, 0.39, 0);
  box(scene, 1.69, 0.56, 0.0, 1.47, 0.23, 1.51, material.dark, 0.085);
  box(scene, 1.69, 0.71, 0, 1.22, 0.12, 1.27, material.steel, 0.05);
  const banks = [-0.93, -0.33, 0.29, 0.91];
  for (const [index, z] of banks.entries()) {
    const lift = cutaway ? 0.22 + index * 0.23 : 0;
    box(scene, -1.88, 0.52 + lift, z, 0.52, 0.19, 0.38, material.dark, 0.029);
    box(scene, -1.88, 0.628 + lift, z, 0.29, 0.034, 0.22, material.steel, 0.012);
    box(scene, -0.88, 0.56 + lift, z, 0.54, 0.27, 0.45, material.steel, 0.055);
    box(scene, -0.88, 0.709 + lift, z, 0.15, 0.035, 0.38, material.nickel, 0.015);
    cylinder(scene, 0.04, 0.69 + lift, z, 0.15, 0.48, material.navy, 'y', 16);
    cylinder(scene, 0.04, 0.944 + lift, z, 0.141, 0.04, material.nickel, 'y', 16);
    trace(scene, [-2.58, z], [0.84, z], 0.484, index === 1 ? material.aqua : material.copper, 0.046);
    trace(scene, [0.84, z], [1.06, z * 0.79], 0.484, index === 1 ? material.aqua : material.copper, 0.046);
    if (cutaway) {
      for (const x of [-1.88, -0.88, 0.04]) {
        beam(scene, [x, 0.49, z], [x, 0.49 + lift, z], 0.022, material.gold, true);
      }
    }
  }
  label(scene, 'VOLTAGE REGULATOR', -0.95, 0.39, 2.035, 2.27, 0.22);
  label(scene, 'TO PROCESSOR', 1.73, 0.39, 2.035, 1.63, 0.22, '#ffd197');
  return scene;
}

function chip(cutaway = false) {
  const scene = group();
  plinth(scene, 6.76, 4.8);
  serverBoard(scene, 6.14, 4.25, 0.38, 0);
  box(scene, 0, 0.54, -0.08, 2.71, 0.24, 2.54, material.dark, 0.08);
  box(scene, 0, 0.69, -0.08, 2.53, 0.12, 2.36, material.copper, 0.06);
  for (let lane = 0; lane < 14; lane++) {
    const edge = -0.84 + lane * 0.126;
    const far = 2.82 - (lane % 4) * 0.12;
    for (const side of [-1, 1]) {
      trace(scene, [side * 1.27, edge], [side * 1.74, edge], 0.47, material.copper, 0.032);
      trace(scene, [side * 1.74, edge], [side * 2.12, edge * 1.48], 0.47, lane % 3 === 0 ? material.aqua : material.copper, 0.032);
      trace(scene, [side * 2.12, edge * 1.48], [side * far, edge * 1.48], 0.47, lane % 3 === 0 ? material.aqua : material.copper, 0.032);
    }
  }
  for (const x of [-2.37, 2.37]) {
    for (const z of [-1.58, 1.48]) {
      box(scene, x, 0.58, z, 0.74, 0.19, 0.38, material.dark, 0.038);
      for (const pin of [-0.22, 0, 0.22]) {
        box(scene, x + pin, 0.51, z + 0.21, 0.075, 0.065, 0.134, material.gold, 0.012);
      }
    }
  }
  if (cutaway) {
    box(scene, 0, 0.89, -0.08, 2.26, 0.16, 2.12, material.pcb, 0.041);
    for (const x of [-0.47, 0.47]) {
      box(scene, x, 1.06, -0.08, 0.79, 0.127, 1.27, material.blue, 0.04);
      for (let i = 0; i < 8; i++) {
        box(scene, x, 1.135, -0.56 + i * 0.136, 0.58, 0.019, 0.033, i % 2 === 0 ? material.aqua : material.nickel);
      }
    }
    box(scene, 0, 1.92, -0.29, 2.52, 0.17, 2.36, material.nickel, 0.085);
    for (const x of [-0.93, 0.93]) {
      for (const z of [-0.94, 0.91]) beam(scene, [x, 1.2, z], [x, 1.87, z - 0.19], 0.019, material.gold, true);
    }
    label(scene, 'SILICON DIES', 0, 0.88, 1.05, 1.43, 0.17, '#b8eff5');
  } else {
    box(scene, 0, 0.87, -0.08, 2.37, 0.25, 2.22, material.nickel, 0.095);
    box(scene, 0, 1.014, -0.08, 2.04, 0.06, 1.9, material.steel, 0.07);
    box(scene, 0, 1.054, -0.08, 1.72, 0.034, 1.59, material.blue, 0.065);
    box(scene, 0, 1.085, -0.08, 1.37, 0.04, 1.23, material.nickel, 0.051);
  }
  label(scene, 'PROCESSOR PACKAGE', 0, 0.39, 2.194, 2.25, 0.22);
  return scene;
}

export const infrastructureModels = {
  'step-up': stepUp,
  lines,
  substation,
  intake,
  'site-transformer': siteTransformer,
  transfer,
  generator,
  battery,
  ups,
  'busway': busway,
  'floor-pdu': floorPdu,
  'rack-pdu': rackPdu,
  cord,
  psu,
  vrm,
  chip,
};

export const infrastructureCutaways = [
  'step-up',
  'site-transformer',
  'transfer',
  'generator',
  'battery',
  'ups',
  'busway',
  'floor-pdu',
  'rack-pdu',
  'cord',
  'psu',
  'vrm',
  'chip',
];
