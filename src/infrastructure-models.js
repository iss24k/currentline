import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { assemblyPart as part, setInspection } from './model-assembly.js';

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
  const windings = group(bank);
  const primary = group(windings);
  const secondary = group(windings);
  const insulation = group(windings);
  const core = group(bank);
  const limbs = group(core);
  const yoke = group(core);
  const clamps = group(core);
  for (const lane of [-1, 0, 1]) {
    const center = lane * 1.02;
    cylinder(limbs, center, 1.02, 0, .22, 1.95, material.steel, 'y', 16);
    cylinder(secondary, center, .97, 0, .31, 1.66, material.copper, 'y', 32);
    cylinder(insulation, center, .99, 0, .343, 1.74, material.ceramic, 'y', 32);
    const coil = mesh(primary, new THREE.CylinderGeometry(.374,.374,1.8,36,1,true), material.copper, center, 1.02, 0);
    coil.material = material.copper.clone();
    coil.material.side = THREE.DoubleSide;
    for (let layer = 0; layer < 15; layer++) {
      cylinder(primary, center, .22 + layer * .11, 0, .395, .054, layer % 3 === 0 ? material.gold : material.copper, 'y', 32);
    }
    cylinder(insulation, center, .11, 0, .44, .14, material.dark);
    cylinder(insulation, center, 1.93, 0, .44, .12, material.dark);
    beam(secondary, [center,2,0], [center,2.37,-.23], .106, material.copper);
  }
  for (const yBar of [.08, 1.96]) {
    box(yoke, 0, yBar, 0, 3.06, .225, .46, material.steel, .02);
    for (const zBar of [-.48,.48]) box(clamps, 0, yBar, zBar, 3.07, .207, .22, material.nickel);
  }
  for (const edge of [-1,1]) box(clamps, edge * 1.51, 1.04, -.15, .22, 1.92, .46, material.steel);
  setInspection(windings, [
    part('Higher-voltage winding', primary, [-.77,.4,.46], .68),
    part('Lower-voltage winding', secondary, [.75,.29,.48], .66),
    part('Interwinding insulation', insulation, [0,.96,.3], .72),
  ]);
  setInspection(core, [
    part('Core limb', limbs, [-.60,.45,.52], .48),
    part('Yoke', yoke, [0,.92,.39], .61),
    part('Core clamp', clamps, [.79,.42,.2], .54),
  ]);
  bank.userData.windings = windings;
  bank.userData.core = core;
  return bank;
}

function stepUp(cutaway = false) {
  const scene = group();
  plinth(scene, 6.8, 4.65);
  box(scene, 0, 0.43, -0.25, 4.9, 0.31, 2.67, material.steel, 0.06);
  const tank = group(scene);
  const terminals = group(scene);
  const bank = coilBank(scene, 0, .55, -.22, 1.05);
  if (cutaway) {
    box(tank, 0, 1.53, -1.54, 4.27, 2.1, 0.16, material.navy, 0.06);
    const movedPanel = box(tank, 2.53, 1.35, 1.38, 1.55, 1.65, 0.14, material.steel, 0.06);
    movedPanel.rotation.y = -0.5;
    label(tank, 'WINDINGS', -0.25, 0.58, 1.68, 1.55, 0.23, '#ffca80');
  } else {
    box(tank, 0, 1.63, -0.25, 4.38, 2.13, 2.48, material.steel, 0.13);
    box(tank, 0, 1.78, 1.025, 3.77, 1.62, 0.13, material.navy, 0.065);
    fasteners(tank, 0, 1.77, 1.123, 3.57, 1.42);
    label(tank, 'GSU / STEP-UP', 0, 2.25, 1.135, 2.14, 0.27);
    box(tank, 0, 1.69, 1.135, 2.18, 0.035, 0.045, material.aqua);
    box(tank, 0, 2.72, -0.25, 4.63, 0.19, 2.7, material.nickel, 0.055);
    for (const side of [-1, 1]) {
      for (let fin = 0; fin < 10; fin++) {
        box(tank, side * 2.53, 1.49, -1.3 + fin * 0.23, 0.87, 1.78, 0.095, material.steel, 0.024);
      }
      for (const y of [0.64, 2.38]) {
        cylinder(tank, side * 2.66, y, -0.25, 0.13, 2.42, material.nickel, 'z');
      }
    }
  }
  for (const x of [-1.35, 0, 1.35]) {
    bushing(terminals, x, 2.77, -0.56, 1.3);
    bushing(terminals, x * 0.78, 2.78, 0.63, 0.62);
  }
  cylinder(tank, 0, 3.0, -1.72, 0.32, 3.25, material.navy, 'x');
  for (const x of [-1.7, 1.7]) {
    cylinder(tank, x, 3.0, -1.72, 0.37, 0.17, material.nickel, 'x');
  }
  box(tank, -2.48, 0.88, 1.55, 0.85, 1.14, 0.55, material.navy, 0.055);
  lamp(tank, -2.51, 1.23, 1.85, material.amber);
  tube(tank, [[-2.62, 0.46, 1.5], [-2.58, 0.3, 1.85], [-1.65, 0.33, 1.91], [-1.37, 0.56, 1.17]], 0.055, material.copper);
  setInspection(scene, [
    part('Winding assembly', bank.userData.windings, [-.75,.45,.49], 1.05, [-.53,1.62,.16]),
    part('Magnetic core', bank.userData.core, [.74,.51,.4], 1.05, [.61,1.68,-.12]),
    part('High-voltage bushing', terminals, [.38,.84,-.19], .66, [0,3.54,-.29]),
    part('Tank and cooling', tank, [.08,.86,-.47], .82, [0,2.48,-.51]),
  ], { hidden: [bank], shell: [tank] });
  if (cutaway) bank.visible = true;
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
  const insulators = group(object);
  const clamps = group(object);
  for (const [level, halfWidth] of [[0.82, 1.02], [0.64, 1.22], [0.49, 1.12]]) {
    const y = height * level;
    const zOffset = halfWidth * (height / 5.7);
    beam(object, [0, y, -zOffset], [0, y, zOffset], 0.092, material.nickel);
    for (const direction of [-1, 1]) {
      beam(object, [0, y + 0.41, 0], [0, y, direction * zOffset], 0.056, material.steel);
    }
    for (let i = 0; i < 5; i++) {
      cylinder(insulators, 0, y - 0.075 - i * 0.07, zOffset, 0.088, 0.041, material.ceramic, 'y', 10);
    }
    cylinder(clamps,0,y-.44,zOffset,.078,.24,material.nickel,'x',16);
    points.push([x, y - 0.44, z + zOffset]);
  }
  beam(object, [0, height, 0], [0, height + 0.15, 0], 0.05, material.nickel);
  return { points, object, insulators, clamps };
}

function lines() {
  const scene = group();
  const from = tower(scene, -2.45, -0.5, 5.75, 0.81);
  const to = tower(scene, 2.45, -0.5, 5.75, 0.81);
  const conductors = group(scene);
  for (let conductor = 0; conductor < 3; conductor++) {
    const a = from.points[conductor];
    const b = to.points[conductor];
    const route = [a, [-1.3, a[1] - 0.42, a[2]], [0, a[1] - 0.57, a[2]], [1.3, b[1] - 0.42, b[2]], b];
    tube(conductors, route, 0.037, conductor === 1 ? material.aqua : material.nickel);
  }
  tube(scene, [[-2.45, 5.86, -0.5], [0, 5.38, -0.5], [2.45, 5.86, -0.5]], 0.022, material.steel);
  box(scene, -2.46, 0.45, 1.14, 0.75, 0.55, 0.45, material.navy, 0.04);
  label(scene, 'HV SPAN', -2.46, 0.47, 1.37, 0.6, 0.2);
  const steelwork = [from.object,to.object].flatMap(({ children }) => children.filter((node) => ![from.insulators,to.insulators,from.clamps,to.clamps].includes(node)));
  return setInspection(scene,[
    part('Phase conductor',conductors,[.13,.64,.72],.88,[0,3.42,.77]),
    part('Suspension insulator',[from.insulators,to.insulators],[-.31,.63,.58],.66,[-2.45,3.56,.75]),
    part('Conductor clamp',[from.clamps,to.clamps],[.53,.29,.69],.68,[2.45,3.24,.76]),
    part('Transmission tower',steelwork,[-.17,.57,-.63],.72,[2.45,4.62,-.45]),
  ]);
}

function substation() {
  const scene = group();
  plinth(scene, 6.7, 5.05);
  const transformer = group(scene, 0, 0.28, -1.02);
  const tank = group(transformer);
  const terminals = group(transformer);
  const bank = coilBank(transformer, 0, .12, .04, .56);
  box(tank, 0, 0.65, 0, 3.55, 1.3, 1.37, material.navy, 0.08);
  box(tank, 0, 1.3, 0, 3.69, 0.15, 1.5, material.steel, 0.043);
  for (const x of [-1.34, 0, 1.34]) {
    bushing(terminals, x, 1.4, -0.15, 0.52);
  }
  for (const side of [-1, 1]) {
    for (let rib = 0; rib < 6; rib++) {
      box(tank, side * 1.86, 0.7, -0.5 + rib * 0.2, 0.44, 0.95, 0.079, material.steel, 0.018);
    }
  }
  label(tank, 'UTILITY TRANSFORMER', 0.16, 0.83, 0.708, 1.48, 0.19);
  setInspection(transformer, [
    part('Winding assembly', bank.userData.windings, [-.72,.51,.42], .47),
    part('Magnetic core', bank.userData.core, [.73,.49,.45], .47),
    part('High-voltage bushing', terminals, [.2,.94,-.20], .46),
    part('Tank and cooling', tank, [0,.83,-.54], .50),
  ], { hidden: [bank], shell: [tank] });
  const transmission = group(scene);
  const distribution = group(scene);
  const protection = group(scene);
  for (const z of [-1.57, 1.27]) {
    const gantry = z < 0 ? transmission : distribution;
    for (const x of [-2.6, 2.6]) {
      box(gantry, x, 0.44, z, 0.45, 0.3, 0.48, material.steel);
      box(gantry, x, 1.74, z, 0.19, 2.65, 0.19, material.nickel);
    }
    box(gantry, 0, 3.03, z, 5.43, 0.18, 0.19, material.nickel);
    for (const x of [-1.55, 0, 1.55]) {
      for (let ring = 0; ring < 6; ring++) {
        cylinder(gantry, x, 2.97 - ring * 0.085, z, 0.115, 0.038, material.ceramic, 'y', 12);
      }
    }
  }
  for (const x of [-1.55, 0, 1.55]) {
    tube(distribution, [[x, 2.48, -1.57], [x, 2.23, -0.22], [x, 2.48, 1.27]], 0.046, material.copper);
    const breaker = group(protection, x, 0.32, 0.18);
    box(breaker, 0, 0.16, 0, 0.72, 0.27, 0.94, material.navy, 0.045);
    box(breaker, 0, 0.72, 0, 0.33, 0.97, 0.71, material.steel, 0.035);
    for (const z of [-0.3, 0.3]) bushing(breaker, 0, 1.14, z, 0.63);
    beam(breaker, [0, 1.97, 0.31], [0, 2.05, -0.31], 0.07, material.copper);
  }
  box(protection, -2.18, 0.71, 1.82, 0.88, 0.88, 0.68, material.blue, 0.055);
  label(protection, 'YARD CONTROL', -2.18, 0.83, 2.16, 0.75, 0.15);
  lamp(protection, -2.38, 0.56, 2.18);
  lamp(protection, -2.18, 0.56, 2.18, material.amber);
  return setInspection(scene,[
    part('Transmission bay',transmission,[-.39,.66,-.45],.82,[-1.60,2.68,-1.57]),
    part('Substation power transformer',transformer,[.06,.46,.75],.83,[0,1.41,-.86]),
    part('Distribution bus',distribution,[.45,.67,.45],.76,[1.56,2.79,1.22]),
    part('Feeder protection',protection,[-.58,.28,.69],.67,[-1.58,1.18,.32]),
  ], { hidden: [bank], shell: [tank] });
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
  const enclosure = group(scene);
  const feeder = group(scene);
  const ends = group(scene);
  const breaker = group(scene);
  const bars = group(scene);
  const meters = group(scene);
  const relay = group(scene);
  for (const [i, x] of [-1.75, 0, 1.75].entries()) {
    const body = cabinet(enclosure, x, 0.28, -0.22, 1.7, 3.38, 1.72, false, material.steel);
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
    tube(feeder,[[x,.56,z-.22],[x,.36,.99],[x+.08,.36,1.31],[x+.28,.31,1.47]],.075,material.rubber);
    tube(ends,[[x,.56,z-.22],[x,.82,.32],[x,1.32,.29]],.065,material.copper);
    bushing(ends,x,1.08,.29,.43);
    box(bars,0,2.3+i*.23,-.20-i*.175,4.72,.069,.132,material.copper,.018);
    cylinder(meters,1.62+i*.24,1.62,.04,.118,.15,material.navy,'z',24);
    cylinder(meters,1.62+i*.24,1.62,.146,.064,.044,material.copper,'z',20);
  }
  box(breaker,0,1.44,.12,1.17,.66,1.08,material.steel,.06);
  for (const x of [-.37,0,.37]) {
    cylinder(breaker,x,1.83,.13,.11,.57,material.ceramic,'y',20);
    cylinder(breaker,x,2.15,.13,.072,.12,material.copper,'y',20);
  }
  box(relay,.17,2.82,.36,.53,.46,.16,material.dark,.04);
  box(relay,.17,2.87,.454,.37,.17,.056,material.glass,.024);
  lamp(relay,.07,2.71,.453,material.aqua,.031);
  return setInspection(scene,[
    part('Incoming feeder cable',feeder,[-.68,.23,.61],.55,[-1.67,.39,1.04]),
    part('Cable termination',ends,[-.72,.43,.35],.65,[-1.74,1.12,.35]),
    part('Withdrawable vacuum circuit breaker',breaker,[.03,.37,.91],.85,[0,1.65,.24]),
    part('Phase busbars',bars,[.25,.91,-.11],.65,[.27,2.63,-.35]),
    part('Current transformer',meters,[.79,.48,.31],.63,[1.82,1.65,.11]),
    part('Feeder protection relay',relay,[.48,.61,.62],.65,[.19,2.84,.44]),
  ],{ hidden:[ends,breaker,bars,meters,relay],shell:[enclosure] });
}

function siteTransformer(cutaway = false) {
  const scene = group();
  plinth(scene, 5.92, 4.0);
  const body = cabinet(scene, 0, 0.28, -0.18, 4.72, 3.45, 2.64, cutaway, material.steel);
  const terminalBank = group(scene, 0, .28, -.18);
  const bank = coilBank(scene, 0, .59, .01, 1.08);
  if (cutaway) {
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
    box(terminalBank, x, 3.47, -0.43, 0.88, 0.17, 0.77, material.navy, 0.04);
    box(terminalBank, x, 3.64, -0.43, 0.68, 0.24, 0.54, material.steel, 0.035);
    box(terminalBank, x, 3.74, -0.43, 0.56, 0.07, 0.43, material.nickel, 0.02);
  }
  setInspection(scene, [
    part('Winding assembly', bank.userData.windings, [-.71,.38,.59], .91, [-.51,1.66,.12]),
    part('Magnetic core', bank.userData.core, [.73,.46,.42], .97, [.52,1.67,-.09]),
    part('Input and output terminals', terminalBank, [.29,.87,-.17], .72, [0,3.98,-.61]),
    part('Ventilated enclosure', body, [.13,.82,-.44], .84, [0,2.63,-.82]),
  ], { hidden: [bank], shell: [body] });
  if (cutaway) bank.visible = true;
  return scene;
}

function transfer(cutaway = false) {
  const scene = group();
  plinth(scene, 5.3, 3.55);
  const cabinetZ = -0.38;
  const body = cabinet(scene, 0, 0.28, cabinetZ, 3.79, 3.48, 2.0, cutaway, material.navy);
  const front = 1.04;
  const terminals = group(scene,0,.28,cabinetZ);
  const contacts = group(scene,0,.28,cabinetZ);
  const control = group(scene,0,.28,cabinetZ);
  const terminalBars = group(contacts);
  for (const [x, tag, surface] of [[-1.02, 'UTILITY', material.aqua], [1.02, 'GENERATOR', material.amber]]) {
    box(terminals, x, 3.64, -0.35, 1.45, 0.31, 0.87, material.steel, 0.058);
    box(terminals, x, 3.82, -0.35, 0.81, 0.11, 0.61, surface, 0.032);
    for (let bar = 0; bar < 3; bar++) {
      const dx = x + (bar - 1) * 0.26;
      box(terminalBars, dx, 2.78, 0.17, 0.14, 1.3, 0.12, material.copper);
      cylinder(contacts, dx, 2.16, 0.25, 0.105, 0.19, surface, 'z');
      beam(contacts, [dx, 2.13, 0.33], [dx * 0.31, 1.3, 0.47], 0.095, material.copper);
    }
    label(contacts, tag, x, 2.13, 0.57, 0.88, 0.21, x < 0 ? '#b3ebf3' : '#ffd197');
  }
  box(contacts, 0, 1.11, 0.32, 1.63, 0.5, 0.43, material.dark, 0.065);
  for (const x of [-0.46, 0, 0.46]) box(contacts, x, 0.56, 0.37, 0.16, 0.84, 0.17, material.copper);
  label(contacts, 'TO UPS', 0, 1.12, 0.57, 0.85, 0.18);
  if (!cutaway) {
    box(body, 0, 2.52, front, 3.38, 1.35, 0.1, material.steel, 0.05);
    label(body, 'AUTOMATIC TRANSFER', 0, 2.91, front + 0.067, 2.39, 0.27);
    box(body, 0, 2.28, front + 0.074, 1.38, 0.43, 0.084, material.glass, 0.043);
    lamp(body, -1.17, 2.24, front + 0.078);
    lamp(body, 1.17, 2.24, front + 0.078, material.amber);
    box(body, 0, 0.99, front, 3.38, 1.48, 0.1, material.steel, 0.05);
    louvers(body, 0, 0.84, front + 0.06, 1.48, 6);
    fasteners(body, 0, 1, front + 0.071, 3.12, 1.26);
  }
  box(control,1.39,1.61,-.25,.58,1.13,.07,material.pcb,.018);
  for (const y of [1.3,1.65,2.0]) box(control,1.40,y,-.18,.35,.19,.095,material.dark,.02);
  setInspection(scene,[
    part('Source and load terminals',terminals,[-.32,.71,-.37],.71,[-.48,3.14,-.31]),
    part('Transfer contactor',contacts,[.15,.27,.92],.89,[0,1.91,.08]),
    part('Source sensing and controller',control,[.76,.51,.37],.63,[1.39,1.89,-.53]),
  ],{ hidden:[contacts,control],shell:[body] });
  if (cutaway) for (const hidden of scene.userData.inspectionHidden) hidden.visible = true;
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
  box(scene, 0, .46, 0, 6.34, .35, 2.47, material.steel, .08);
  const fuel = group(scene);
  box(fuel, -1.62, .58, .48, 1.47, .29, 1.02, material.steel, .075);
  box(fuel, -2.18, .73, .78, .34, .068, .23, material.dark, .03);
  cylinder(fuel, -1.76, .91, .86, .095, .35, material.nickel, 'y', 22);
  tube(fuel, [[-2.16,.63,.84],[-1.81,.75,.83],[-1.76,1.09,.85],[-1.38,1.53,.79]], .035, material.gold);
  const cooling = group(scene);
  const roof = group(scene);
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
  box(cooling, -2.79, 1.67, -0.12, 0.4, 2.37, 2.45, material.navy, 0.075);
  box(cooling, -2.79, 1.61, 1.15, 0.34, 1.55, 0.13, material.nickel, 0.04);
  louvers(cooling, -2.79, 1.69, 1.23, .26, 8, .151);
  if (!cutaway) {
    for (const x of [-2.63, 2.63]) box(roof, x, 2.46, -1.05, 0.18, 3.6, 0.18, material.steel);
    box(roof, 0, 4.13, -0.42, 6.06, 0.24, 2.2, material.navy, 0.09);
    label(roof, 'STANDBY / GENSET', -1.2, 4.1, 0.7, 2.18, 0.19, '#ffd197');
  } else {
    label(scene, 'ENGINE', -1.13, 0.5, 1.27, 1.15, 0.2);
    label(scene, 'ALTERNATOR', 1.55, 0.5, 1.27, 1.4, 0.2);
  }
  tube(scene, [[-0.66, 2.03, -0.3], [-0.63, 2.89, -0.48], [-0.4, 3.02, -0.86], [0.54, 3.02, -0.86]], 0.11, material.steel);
  cylinder(scene, 0.2, 3.03, -0.86, 0.24, 1.04, material.steel, 'x');
  return setInspection(scene, [
    part('Fuel system', fuel, [-.69,.28,.68], .73, [-1.89,.78,.78]),
    part('Diesel engine', engine, [0,.7,.56], .79, [-1.08,1.67,.16]),
    part('Alternator', alternator, [.91,.32,.17], .93, [1.54,1.42,.04]),
    part('Engine cooling and starting', cooling, [-.47,.61,-.48], .63, [-2.79,1.75,.12]),
  ], { shell: [roof] });
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
  const modules = group(rack);
  const controller = group(scene, 1.78, .28, -.25);
  const output = group(scene, 1.78, .28, -.25);
  box(controller, 0, 2.62, .43, .52, .89, .09, material.pcb, .019);
  for (const y of [2.29,2.61,2.93]) {
    box(controller, 0, y, .49, .25, .15, .07, material.dark, .015);
    for (const x of [-.156,.156]) box(controller, x, y, .50, .045, .112, .027, material.gold);
  }
  for (const x of [-.17,.17]) {
    box(output, x, .92, .35, .13, .71, .105, material.copper, .018);
    box(output, x, .52, .39, .19, .22, .155, material.dark, .022);
  }
  box(output, 0, 1.42, .35, .47, .33, .28, material.steel, .025);
  let sample;
  for (let row = 0; row < 5; row++) {
    const y = 0.45 + row * 0.66;
    const opened = cutaway && row === 2;
    box(rack, 0, y - 0.09, opened ? 0.8 : 0, 3.06, 0.09, 2.02, material.steel, 0.035);
    for (let cell = 0; cell < 4; cell++) {
      const x = (cell - 1.5) * 0.73;
      const tray = group(modules, x, y, opened ? 1.03 : 0.03);
      if (row === 2 && cell === 1) sample = tray;
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
  tube(scene, [[1.78,3.85,-1.11],[1.6,4.24,-1.12],[.62,4.32,-1.12],[.53,4.09,-1.02]], .064, material.copper);
  const cells = group(sample);
  const links = group(sample);
  const sense = group(sample);
  for (let index = 0; index < 6; index += 1) {
    const z = -.56 + index * .226;
    box(cells, 0, .231, z, .47, .35, .20, material.steel, .018);
    for (const x of [-.12,.12]) cylinder(links, x, .425, z, .043, .045, material.copper, 'y', 12);
    tube(sense, [[.10,.42,z],[.239,.42,z],[.252,.34,.76]], .008, material.amber);
  }
  setInspection(modules, [
    part('Rechargeable cell', cells, [-.48,.55,.56], .48),
    part('Module bus links', links, [.64,.64,.2], .47),
    part('Cell sensing leads', sense, [.18,.72,.62], .44),
  ], { hidden: [cells,links,sense], shell: [...sample.children].filter((item) => ![cells,links,sense].includes(item)) });
  return setInspection(scene, [
    part('Battery module', modules, [-.43,.37,.79], .79, [-.78,1.86,.78]),
    part('Battery management system', controller, [.75,.56,.23], .78, [1.78,2.77,.2]),
    part('DC protection and output', output, [.82,.13,.5], .74, [1.79,1.29,.12]),
  ], { hidden: [controller,output], shell: [service] });
}

function powerModule(parent, y, caption, tint, depthOffset, kind) {
  const unit = group(parent, 0, y, depthOffset);
  box(unit, 0, 0, 0, 3.1, .13, 1.86, material.steel, .038);
  box(unit, 0, .103, 0, 2.84, .08, 1.49, material.pcb, .023);
  const switches = group(unit);
  const choke = group(unit);
  const capacitors = group(unit);
  const control = group(unit);
  const bus = group(unit);
  for (const [index,x] of [-1.04,-.57,-.10].entries()) {
    const z = kind === 'link' ? 0 : -.27;
    const radius = kind === 'link' ? .19 : .13;
    const body = kind === 'link' ? .44 : .27;
    cylinder(capacitors, x, .15 + body / 2, z, radius, body, material.dark, 'y', 24);
    cylinder(capacitors, x, .17 + body, z, radius * .94, .027, material.nickel, 'y', 24);
    for (const sign of [-1,1]) cylinder(capacitors, x + sign * radius * .43, .20 + body, z, .023, .044, material.copper, 'y', 12);
    if (kind !== 'link') {
      box(switches, x, .207, .39, .36, .125, .29, material.dark, .026);
      for (const offset of [-.11,0,.11]) box(switches,x+offset,.153,.59,.035,.035,.15,material.copper);
      cylinder(choke, .48 + index * .225, .27, -.28, .14, .25, material.copper, 'y', 24);
      cylinder(choke, .48 + index * .225, .41, -.28, .106, .038, material.steel, 'y', 18);
    }
  }
  if (kind === 'link') {
    for (const z of [-.39,.39]) box(bus,.11,.226,z,2.48,.046,.13,material.copper);
    for (const x of [.82,1.10]) box(switches,x,.31,.47,.22,.33,.42,material.rubber,.025);
  } else {
    box(control, .79,.158,.38, .95,.061,.4, material.pcb,.02);
    for (const x of [.51,.76,1.01]) box(control,x,.222,.42,.14,.081,.157,material.dark,.014);
    for (let fin = 0; fin < 8; fin += 1) box(switches,-1.22+fin*.149,.312,.37,.054,.16,.38,material.nickel);
  }
  box(unit, 0,.068,.96,3.13,.21,.13,material.dark,.035);
  label(unit, caption, -.71,.07,1.036,1.21,.15);
  lamp(unit, 1.12,.08,1.035,tint,.039);
  const parts = {
    rectifier: [['Rectifier switching module',switches],['Input choke',choke],['Gate drive board',control]],
    link: [['DC-link capacitor',capacitors],['Battery input terminals',switches],['DC bus conductors',bus]],
    inverter: [['Inverter switching module',switches],['Output filter choke',choke],['Output filter capacitor',capacitors]],
  };
  return setInspection(unit, parts[kind].map(([name,node],index) => part(name,node,[index - 1,.72,.55],.40)));
}

function ups(cutaway = false) {
  const scene = group();
  plinth(scene,5.7,3.76);
  const body = cabinet(scene,0,.28,-.24,4.68,3.74,2.43,cutaway,material.navy);
  const equipment = group(scene, 0,.28,-.24);
  const rectifier = powerModule(equipment,.52,'RECTIFIER',material.aqua,.08,'rectifier');
  const dcLink = powerModule(equipment,1.61,'DC LINK',material.amber,.08,'link');
  const inverter = powerModule(equipment,2.7,'INVERTER',material.aqua,.08,'inverter');
  const bypass = group(equipment,1.88,1.21,-.3);
  box(bypass,0,0,0,.57,1.61,.67,material.steel,.06);
  box(bypass,0,0,.356,.43,1.34,.06,material.pcb,.025);
  for (const y of [-.46,0,.46]) {
    box(bypass,0,y,.435,.31,.22,.15,material.dark,.022);
    for (const x of [-.135,.135]) box(bypass,x,y,.53,.046,.14,.06,material.copper);
  }
  tube(equipment, [[1.57,.52,.59],[1.67,1.12,.52],[1.67,2.09,.53],[1.59,2.7,.60]], .047, material.copper);
  if (!cutaway) {
    box(body,0,2.43,1.24,4.18,1.85,.095,material.steel,.056);
    box(body,-.59,2.58,1.3,2.46,1.05,.12,material.dark,.055);
    box(body,-.62,2.67,1.38,1.82,.47,.06,material.glass,.045);
    label(body,'ONLINE UPS',-.62,2.67,1.42,1.53,.23,'#b8f2f2');
    for (const x of [-1.18,-.9,-.62]) lamp(body,x,2.26,1.4,material.aqua,.044);
    box(body,1.43,2.48,1.31,.39,1.37,.093,material.dark,.025);
    box(body,1.43,2.48,1.37,.074,1.24,.043,material.aqua,.025);
    for (const x of [-1,1]) {
      box(body,x,.79,1.24,1.9,1.22,.088,material.steel,.045);
      louvers(body,x,.78,1.303,1.56,8,.092);
    }
  }
  louvers(body,0,3.52,1.23,2.78,2,.09);
  setInspection(scene,[
    part('Input rectifier',rectifier,[-.61,.20,.74],.85,[-.6,.95,.35]),
    part('DC link',dcLink,[-.39,.44,.72],.90,[-.2,2.09,.33]),
    part('Inverter and output filter',inverter,[.18,.64,.62],.88,[.13,3.12,.35]),
    part('Static bypass',bypass,[.82,.24,.45],.85,[1.88,1.51,-.28]),
  ],{ hidden:[equipment],shell:[body] });
  if (cutaway) equipment.visible = true;
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
  const rails = group(scene);
  const housing = group(scene);
  const joints = group(scene);
  const tap = group(scene);
  box(housing, 0, 4.04, -0.93, 5.92, 0.21, 0.18, material.steel);
  box(housing, 0, 3.74, 0.05, 6.08, 0.3, 0.76, material.navy, 0.035);
  for (const [i,z] of [-.21,-.035,.145,.315].entries()) {
    box(rails,.07,3.88,z,5.68,.105,.071,i<3?material.copper:material.gold,.012);
    box(joints,.66,3.88,z,.27,.117,.097,material.gold,.01);
  }
  if (cutaway) {
    box(housing, 0.07, 4.27, 0.22, 3.44, 0.1, 0.71, material.nickel, 0.031);
    label(housing, 'CONDUCTOR BARS', 0, 4.26, 0.61, 1.82, 0.19, '#ffd197');
  } else {
    box(housing, 0, 3.95, 0.05, 6.08, 0.15, 0.76, material.steel, 0.044);
    for (const x of [-2.56, -1.03, 0.66, 2.28]) {
      box(x === .66 ? joints : housing, x, 3.86, 0.05, 0.155, 0.39, 0.86, material.nickel, 0.035);
    }
    label(housing, 'OVERHEAD BUSWAY', 0, 3.77, 0.462, 2.02, 0.21);
  }
  for (const x of [-1.46, 1.42]) {
    box(tap, x, 3.35, 0.16, 0.65, 0.52, 0.63, material.blue, 0.045);
    lamp(tap, x + 0.16, 3.32, 0.484, material.amber, 0.042);
    tube(tap, [[x, 3.1, 0.12], [x, 2.85, 0.14], [x + 0.21, 2.53, 0.28], [x + 0.27, 2.27, 0.28], [x + 0.27, 1.5, 0.28]], 0.064, material.rubber);
  }
  setInspection(scene,[
    part('Busway rail',rails,[-.26,.79,.47],.65,[-.87,3.89,.10]),
    part('Section joint',joints,[.30,.83,-.41],.60,[.66,3.93,.07]),
    part('Rack tap box',tap,[.44,.24,.84],.69,[1.42,3.35,.15]),
  ],{ hidden:[rails],shell:[housing] });
  if (cutaway) rails.visible = true;
  return scene;
}

function floorPdu(cutaway = false) {
  const scene = group();
  plinth(scene, 4.89, 3.75);
  const body = cabinet(scene, -0.3, 0.28, -0.28, 3.13, 3.51, 2.42, cutaway, material.blue);
  const wing = cabinet(scene, 1.72, 0.28, -0.28, 0.86, 3.51, 2.18, cutaway, material.steel);
  const isolation = coilBank(scene,-.30,.45,-.12,.89);
  const distribution = group(scene,1.72,.28,-.28);
  const meter = group(scene,-.30,.28,-.28);
  box(meter,-.42,2.47,.75,.81,.46,.09,material.pcb,.025);
  box(meter,-.48,2.54,.811,.47,.195,.045,material.glass,.017);
  lamp(meter,-.23,2.37,.81,material.aqua,.028);
  for (let row=0;row<6;row+=1) {
    const y=.78+row*.31;
    box(distribution,0,y,.51,.54,.25,.34,material.dark,.026);
    box(distribution,0,y,.701,.21,.096,.08,row%2?material.nickel:material.amber,.015);
    box(distribution,.02,y,.24,.44,.044,.21,material.copper,.012);
  }
  if (cutaway) {
    for (const x of [-0.89, 0, 0.89]) {
      tube(body, [[x, 2.26, -0.07], [x, 2.64, -0.08], [x + 0.1, 2.9, -0.36]], 0.058, material.copper);
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
  setInspection(scene,[
    part('Isolation transformer',isolation,[-.54,.36,.72],.80,[-.30,1.58,.05]),
    part('Distribution section',distribution,[.76,.42,.42],.70,[1.72,1.9,.33]),
    part('Metering assembly',meter,[.12,.74,.58],.63,[-.76,2.76,.50]),
  ],{ hidden:[isolation,distribution,meter],shell:[body,wing] });
  if (cutaway) for (const hidden of scene.userData.inspectionHidden) hidden.visible=true;
  return scene;
}

function rackPdu(cutaway = false) {
  const scene = group();
  plinth(scene, 6.0, 4.76);
  const inlet = group(scene);
  const outlets = group(scene);
  const meter = group(scene);
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
    const outletBank = index === 1 ? group(outlets,x,.28,-.48) : rack;
    box(outletBank, pduX, 2.06, 1.19, 0.28, 3.47, 0.24, index === 1 ? material.copper : material.steel, 0.031);
    box(rack, pduX, 3.58, 1.325, 0.15, 0.22, 0.048, material.glass, 0.018);
    for (let outlet = 0; outlet < 13; outlet++) {
      box(outletBank, pduX, 0.58 + outlet * 0.213, 1.33, 0.155, 0.116, 0.053, material.black, 0.015);
    }
    label(rack, index === 0 ? 'RACK / 01' : 'RACK PDU', 0, 3.95, 1.19, 1.44, 0.21, index === 0 ? '#cad1c5' : '#ffd197');
    if (index === 1) {
      tube(inlet,[[2.55,4.23,-.42],[2.55,4.14,.18],[2.55,3.97,.52],[2.55,3.89,.71]],.053,material.rubber);
      box(inlet,2.55,3.89,.711,.205,.17,.20,material.dark,.034);
      box(meter,2.55,3.83,.87,.147,.22,.062,material.pcb,.024);
      box(meter,2.55,3.86,.909,.098,.102,.031,material.glass,.011);
      lamp(meter,2.55,3.751,.914,material.aqua,.023);
      for (const y of [0.99, 2.03, 2.66]) {
        tube(rack, [[pduX, y, 1.34], [1.22, y, 1.5], [1.04, y - 0.14, 1.52], [0.73, y - 0.14, 1.26], [0.68, y - 0.11, 1.12]], 0.039, material.gold);
      }
    }
  }
  return setInspection(scene,[
    part('Input connection',inlet,[-.23,.77,.50],.57,[2.55,4.15,.32]),
    part('Protected outlet bank',outlets,[.73,.11,.67],.65,[2.55,2.33,.86]),
    part('Metering board',meter,[.56,.53,.62],.54,[2.55,3.84,.91]),
  ]);
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
  const plug = connector(scene, -1.52, 1.07, 0.38, true, -0.28);
  const socket = connector(scene, 1.7, 1.11, 0.1, false, 0.38);
  const cable = tube(scene, [[-1.2, 1.07, -0.67], [-0.99, 0.77, -1.28], [-0.3, 0.57, -1.67], [0.69, 0.56, -1.66], [1.16, 0.78, -1.25], [1.29, 1.1, -0.94]], 0.129, material.rubber);
  for (const x of [-1.51, 1.69]) box(scene, x, 0.478, 0.29, 1.33, 0.41, 1.2, material.navy, 0.055);
  label(scene, 'C14 / RACK', -1.51, 0.53, 0.92, 0.95, 0.19);
  label(scene, 'C13 / SERVER', 1.69, 0.53, 0.92, 1.05, 0.19);
  if (cutaway) {
    for (const [i, surface] of [material.red, material.aqua, material.gold].entries()) {
      const y = 1.53 + i * 0.36;
      tube(scene, [[-1.57, 1.46, -0.5], [-1.02, y, -0.94], [-0.08, y + 0.11, -1.18], [0.84, y, -0.95], [1.67, 1.53, -0.34]], 0.064, surface);
    }
  }
  return setInspection(scene,[
    part('C14 plug end',plug,[-.81,.32,.44],.58,[-1.53,1.09,1.04]),
    part('Flexible cable',cable,[.08,.40,-.87],.49,[0,.66,-1.52]),
    part('C13 connector end',socket,[.82,.34,.41],.58,[1.88,1.12,.82]),
  ]);
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
  plinth(scene,6.59,3.77);
  const metal = group(scene,0,.41,-.13);
  box(metal,0,.12,0,5.42,.24,2.51,material.steel,.06);
  const cover = group(metal);
  const chassis = group(metal);
  const input = group(metal);
  const pfc = group(metal);
  const transformer = group(metal);
  const output = group(metal);
  const internals = group(metal);
  serverBoard(internals,4.96,2.16,.32,-.03);
  for (const [x,z] of [[-1.92,.47],[-1.68,.17]]) {
    box(input,x,.49,z,.22,.22,.33,material.dark,.032);
    for (const offset of [-.055,.055]) cylinder(input,x+offset,.62,z,.072,.059,material.copper,'y',16);
  }
  box(input,-2.015,.72,1.24,.96,.94,.14,material.dark,.04);
  box(input,-2.015,.72,1.338,.63,.45,.065,material.black,.046);
  for (const x of [-2.15,-1.875]) box(input,x,.7,1.38,.081,.102,.046,material.gold,.012);
  box(input,-2.015,.82,1.38,.085,.09,.046,material.gold,.012);
  for (const z of [-.64,.09,.66]) {
    cylinder(pfc,-1.23,.70,z,.185,.59,material.dark,'y',24);
    cylinder(pfc,-1.23,1.004,z,.171,.034,material.nickel,'y',24);
    box(pfc,-.88,.435,z,.19,.16,.22,material.steel,.019);
  }
  box(transformer,-.34,.67,.26,.84,.58,1.14,material.gold,.065);
  for (let turn = 0; turn < 7; turn += 1) box(transformer,-.67+turn*.111,.984,.26,.072,.043,1.08,material.copper,.016);
  for (const x of [-.63,-.46]) box(transformer,x,.47,-.69,.13,.17,.24,material.dark,.018);
  box(chassis,.73,.53,-.02,.90,.31,1.67,material.steel,.03);
  for (let index = 0; index < 7; index += 1) box(chassis,.39+index*.116,.765,-.02,.043,.27,1.61,material.nickel,.012);
  for (const z of [-.56,-.05,.46]) {
    cylinder(output,1.66,.66,z,.15,.55,material.dark,'y',24);
    cylinder(output,1.66,.949,z,.142,.042,material.nickel,'y',24);
    box(output,1.02,.45,z,.16,.11,.24,material.steel,.02);
  }
  fan(chassis,1.92,.76,1.283,.46,true);
  box(output,2.73,.72,-.35,.24,.72,1.19,material.dark,.041);
  for (let pin = 0; pin < 8; pin += 1) box(output,2.875,.72,-.82+pin*.133,.16,.114,.071,material.gold,.012);
  if (!cutaway) {
    box(cover,0,1.39,0,5.29,.11,2.41,material.nickel,.047);
    box(cover,0,1.47,0,5.02,.055,2.18,material.steel,.023);
    for (const side of [-1,1]) box(cover,0,.82,side*1.21,5.26,1.18,.10,material.nickel,.035);
    for (const side of [-1,1]) box(cover,side*2.61,.82,0,.09,1.18,2.36,material.nickel,.035);
    label(cover,'SERVER PSU',-.71,.95,1.271,1.72,.22);
    louvers(cover,.14,.52,1.253,2.33,5,.091);
  }
  const inputFilter = group(metal);
  inputFilter.add(...input.children.filter((node)=>node.position.z < .8));
  setInspection(scene,[
    part('AC inlet and interference filter',[input,inputFilter],[-.70,.48,.46],.67,[-1.93,1.18,.7]),
    part('Power factor correction stage',pfc,[-.42,.68,-.35],.65,[-1.21,1.18,.08]),
    part('Isolated resonant converter',transformer,[.06,.90,.31],.70,[-.33,1.13,.15]),
    part('Secondary rectifier and DC output',output,[.85,.52,.19],.65,[1.67,1.13,-.18]),
    part('Cooling and chassis',[chassis,cover],[.32,.67,-.53],.68,[.78,.99,-.26]),
  ],{ hidden:[internals,inputFilter,pfc,transformer],shell:[cover] });
  if (cutaway) for (const hidden of scene.userData.inspectionHidden) hidden.visible = true;
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
  const controller = group(scene);
  box(controller,-2.43,.57,.05,.35,.15,.27,material.dark,.034);
  for (const side of [-1,1]) {
    for (let pin=0;pin<5;pin+=1) box(controller,-2.55+.062*pin,.51,.05+side*.143,.034,.024,.078,material.gold,.008);
  }
  const phase = group(scene);
  const switchNodes = group(phase);
  const inductor = group(phase);
  const capacitors = group(scene);
  const banks = [-0.93, -0.33, 0.29, 0.91];
  for (const [index, z] of banks.entries()) {
    const lift = cutaway ? 0.22 + index * 0.23 : 0;
    box(switchNodes, -1.88, 0.52 + lift, z, 0.52, 0.19, 0.38, material.dark, 0.029);
    box(switchNodes, -1.88, 0.628 + lift, z, 0.29, 0.034, 0.22, material.steel, 0.012);
    box(inductor, -0.88, 0.56 + lift, z, 0.54, 0.27, 0.45, material.steel, 0.055);
    box(inductor, -0.88, 0.709 + lift, z, 0.15, 0.035, 0.38, material.nickel, 0.015);
    cylinder(capacitors, 0.04, 0.69 + lift, z, 0.15, 0.48, material.navy, 'y', 16);
    cylinder(capacitors, 0.04, 0.944 + lift, z, 0.141, 0.04, material.nickel, 'y', 16);
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
  setInspection(phase,[
    part('Integrated power stage',switchNodes,[-.35,.74,.43],.36),
    part('Phase inductor',inductor,[.51,.7,.27],.44),
  ]);
  return setInspection(scene,[
    part('Feedback and phase controller',controller,[-.69,.63,.36],.51,[-2.43,.57,.06]),
    part('One switching phase',phase,[.02,.90,.26],.63,[-1.36,.62,-.34]),
    part('Output capacitor bank',capacitors,[.43,.68,.53],.60,[.04,.7,-.33]),
  ]);
}

function chip(cutaway = false) {
  const scene = group();
  plinth(scene, 6.76, 4.8);
  serverBoard(scene, 6.14, 4.25, 0.38, 0);
  const substrate = group(scene);
  const dies = group(scene);
  const spreader = group(scene);
  const solder = group(substrate);
  const dieBase = group(dies);
  const interconnect = group(dies);
  box(substrate,0,.54,-.08,2.71,.24,2.54,material.dark,.08);
  box(substrate,0,.69,-.08,2.53,.12,2.36,material.pcb,.06);
  for (let row = 0; row < 10; row += 1) {
    for (let column = 0; column < 10; column += 1) {
      cylinder(solder,-1.03+row*.23,.438,-1.1+column*.228,.053,.035,material.gold,'y',9);
    }
  }
  for (const x of [-.47,.47]) {
    box(dieBase,x,.807,-.08,.79,.124,1.27,material.blue,.04);
    for (let lane = 0; lane < 12; lane += 1) box(interconnect,x,.875,-.61+lane*.095,.58,.018,.026,lane%2===0?material.aqua:material.nickel);
  }
  setInspection(dies,[part('Logic cell',dieBase,[-.45,.66,.41],.32),part('On-die interconnect stack',interconnect,[.38,.79,.33],.31)]);
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
  box(spreader,0,.87,-.08,2.37,.25,2.22,material.nickel,.095);
  box(spreader,0,1.014,-.08,2.04,.06,1.9,material.steel,.07);
  box(spreader,0,1.054,-.08,1.72,.034,1.59,material.blue,.065);
  box(spreader,0,1.085,-.08,1.37,.04,1.23,material.nickel,.051);
  label(scene, 'PROCESSOR PACKAGE', 0, 0.39, 2.194, 2.25, 0.22);
  setInspection(scene,[
    part('Processor die',dies,[.21,.91,.23],.49,[0,.84,-.12]),
    part('Package substrate',substrate,[-.31,.43,.71],.48,[0,.61,-.08]),
    part('Integrated heat spreader',spreader,[.27,.80,-.40],.97,[0,1.09,-.08]),
  ], { hidden:[dies],shell:[spreader] });
  if (cutaway) {
    dies.visible = true;
    spreader.position.y += .88;
  }
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
