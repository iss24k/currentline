import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { assemblyPart as part, setInspection } from './model-assembly.js';

export const solarEquipmentModels = {
  solar: () => solarArray(),
  'solar-inverter': () => solarInverter(),
  'step-up': () => gridTransformer(),
};

const matte = (color, metalness = .12, roughness = .63) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness });
const paint = {
  steel: matte(0x879092, .66, .41),
  zinc: matte(0xa1a7a5, .68, .51),
  white: matte(0xb9bcb2, .17, .52),
  enamel: matte(0x626d68, .21, .56),
  conductor: matte(0x707976, .52, .56),
  cabinet: matte(0x383f3e, .25, .62),
  shadow: matte(0x181c1d, .18, .72),
  rubber: matte(0x181919, .02, .83),
  concrete: matte(0x8e8b80, .02, .94),
  gravel: matte(0x797163, .02, .96),
  copper: matte(0xb97848, .73, .37),
  brass: matte(0x958154, .68, .47),
  porcelain: matte(0x593c2a, .04, .27),
  polymer: matte(0x5c6665, .05, .44),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0x92b3c7, roughness: .14, metalness: .04, transparent: true,
    opacity: .10, depthWrite: false, clearcoat: .74, clearcoatRoughness: .14,
  }),
  film: new THREE.MeshPhysicalMaterial({
    color: 0x162532, roughness: .23, metalness: .08, clearcoat: .54, clearcoatRoughness: .15,
  }),
  filmBack: matte(0x525550, .38, .51),
  contact: new THREE.MeshPhysicalMaterial({
    color: 0x677d7d, roughness: .28, metalness: .52, transparent: true,
    opacity: .38, depthWrite: false,
  }),
  board: matte(0x27443e, .18, .61),
  insulation: matte(0x634d3b, .08, .76),
  red: matte(0x9a4231, .11, .61),
};

const block = new THREE.BoxGeometry(1, 1, 1);
const cylinder = new THREE.CylinderGeometry(1, 1, 1, 20);
const hex = new THREE.CylinderGeometry(1, 1, 1, 6);
const unitUp = new THREE.Vector3(0, 1, 0);
const zNormal = new THREE.Vector3(0, 0, 1);
const textureCache = new Map();

function group(parent, position = [0, 0, 0]) {
  const object = new THREE.Group();
  object.position.fromArray(position);
  parent?.add(object);
  return object;
}

function mesh(parent, geometry, material, position = [0, 0, 0], scale = [1, 1, 1]) {
  const object = new THREE.Mesh(geometry, material);
  object.position.fromArray(position);
  object.scale.fromArray(scale);
  parent.add(object);
  return object;
}

const box = (parent, position, dimensions, material) => mesh(parent, block, material, position, dimensions);

function casing(parent, position, dimensions, material, radius = .024) {
  return mesh(parent, new RoundedBoxGeometry(...dimensions, 2, radius), material, position);
}

function round(parent, position, radius, length, material, axis = 'y') {
  const object = mesh(parent, cylinder, material, position, [radius, length, radius]);
  if (axis === 'x') object.rotation.z = Math.PI / 2;
  if (axis === 'z') object.rotation.x = Math.PI / 2;
  return object;
}

function beam(parent, start, end, width, depth, material) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const object = box(parent, a.lerp(b, .5).toArray(), [width, direction.length(), depth], material);
  object.quaternion.setFromUnitVectors(unitUp, direction.normalize());
  return object;
}

function wire(parent, points, radius, material = paint.rubber) {
  const route = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
  return mesh(parent, new THREE.TubeGeometry(route, Math.max(12, points.length * 5), radius, 8), material);
}

function repeated(parent, geometry, material, points, scale, axis = unitUp) {
  const items = new THREE.InstancedMesh(geometry, material, points.length);
  const dummy = new THREE.Object3D();
  dummy.scale.fromArray(scale);
  dummy.quaternion.setFromUnitVectors(unitUp, axis);
  points.forEach((point, index) => {
    dummy.position.fromArray(point);
    dummy.updateMatrix();
    items.setMatrixAt(index, dummy.matrix);
  });
  items.computeBoundingBox();
  items.computeBoundingSphere();
  parent.add(items);
  return items;
}

function boltLine(parent, points, radius = .027, axis = unitUp, material = paint.zinc) {
  return repeated(parent, hex, material, points, [radius, radius * .54, radius], axis);
}

function canvasTexture(key, width, height, draw) {
  if (typeof document === 'undefined') return null;
  if (textureCache.has(key)) return textureCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  textureCache.set(key, map);
  return map;
}

function plaque(parent, text, position, width, height, pale = false) {
  const map = canvasTexture(text, 512, 112, (context, w, h) => {
    context.fillStyle = pale ? '#d8d9cd' : '#272b2a';
    context.fillRect(0, 0, w, h);
    context.strokeStyle = pale ? '#727973' : '#77817a';
    context.lineWidth = 2;
    context.strokeRect(7, 7, w - 14, h - 14);
    context.fillStyle = pale ? '#232927' : '#e8e4d9';
    context.font = '500 38px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, w / 2, h / 2 + 1, w - 38);
  });
  if (!map) return;
  const label = new THREE.MeshBasicMaterial({ map });
  mesh(parent, new THREE.PlaneGeometry(width, height), label, position);
}

function filmSurface() {
  const material = paint.film.clone();
  material.map = canvasTexture('thin-film', 1024, 512, (context, width, height) => {
    const finish = context.createLinearGradient(0, 0, width, height);
    finish.addColorStop(0, '#afb5bc');
    finish.addColorStop(.56, '#a1adb8');
    finish.addColorStop(1, '#8796a7');
    context.fillStyle = finish;
    context.fillRect(0, 0, width, height);
    for (let x = 2; x < width - 2; x += 6.2) {
      context.fillStyle = x % 4 > 2 ? '#bbc2c8' : '#8d9aa6';
      context.fillRect(x, 0, .64, height);
    }
    context.fillStyle = '#707779';
    context.fillRect(0, 0, width, 2);
    context.fillRect(0, height - 2, width, 2);
  });
  return material;
}

function gravelSurface() {
  const material = paint.gravel.clone();
  material.map = canvasTexture('gravel', 320, 160, (context, width, height) => {
    let seed = 20;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const gravel = context.createImageData(width, height);
    for (let index = 0; index < gravel.data.length; index += 4) {
      const grain = 123 + Math.round(random() * 89);
      gravel.data[index] = grain + 9;
      gravel.data[index + 1] = grain + 3;
      gravel.data[index + 2] = grain - 5;
      gravel.data[index + 3] = 255;
    }
    context.putImageData(gravel, 0, 0);
  });
  return material;
}

function route(model, segments, input, output, inputForm, outputForm) {
  model.userData.equipmentFlow = segments;
  model.userData.equipmentPorts = { input, output, inputForm, outputForm };
  return model;
}

function solarArray() {
  const model = group();
  model.name = 'Thin-film modules on single-axis tracker';
  casing(model, [-.032, -.039, 0], [6.59, .082, 2.27], gravelSurface(), .028);
  const rack = group(model, [0, 1.39, 0]);
  rack.rotation.x = .28;
  const glass = group(rack);
  const film = group(rack);
  const contacts = group(rack);
  const junction = group(rack);
  const surface = filmSurface();

  // Proportions follow the public First Solar Series 6 Plus module drawing.
  const pitch = 1.276;
  const width = 1.245;
  const length = 2.024;
  for (let index = -2; index <= 2; index += 1) {
    const x = pitch * index;
    const detailed = index === 0;
    const backing = detailed ? contacts : rack;
    const absorber = detailed ? film : rack;
    const cover = detailed ? glass : rack;
    const boxes = detailed ? junction : rack;
    box(absorber, [x, .046, 0], [1.219, .011, 2.003], surface);
    box(backing, [x, .034, 0], [1.221, .012, 2.005], paint.filmBack);
    box(backing, [x, .053, 0], [1.218, .002, 2.005], paint.contact);
    box(cover, [x, .059, 0], [1.216, .005, 2.016], paint.glass);
    for (const side of [-1, 1]) {
      box(rack, [x + side * (width / 2 - .011), .022, 0], [.022, .046, length], paint.zinc);
      box(rack, [x, .023, side * (length / 2 - .013)], [1.207, .041, .025], paint.zinc);
      box(rack, [x, -.009, side * .64], [1.18, .026, .069], paint.zinc);
      casing(boxes, [x + side * .38, -.019, .54], [.147, .041, .084], paint.shadow, .007);
      round(boxes, [x + side * .465, -.025, .54], .019, .04, paint.rubber, 'x');
      round(boxes, [x + side * .508, -.033, .54], .018, .05, paint.rubber, 'x');
    }
    box(rack, [x, -.012, 0], [1.21, .045, .046], paint.steel);
    boltLine(rack, [[x - .44, -.006, -.64], [x + .44, -.006, -.64],
      [x - .44, -.006, .64], [x + .44, -.006, .64]], .024);
    if (index < 2) {
      wire(rack, [[x + .524, -.037, .54], [x + .618, -.135, .55], [x + .752, -.037, .54]], .009);
    }
  }
  round(rack, [0, -.126, 0], .083, 6.47, paint.steel, 'x');
  const pileHeads = [-2.72, -.78, 1.23, 2.81];
  for (const x of pileHeads) {
    box(model, [x, .63, 0], [.069, 1.26, .163], paint.steel);
    for (const z of [-.085, .085]) box(model, [x, .63, z], [.166, 1.26, .031], paint.steel);
    box(model, [x, .034, 0], [.29, .064, .31], paint.zinc);
    round(model, [x, 1.266, 0], .137, .104, paint.zinc, 'x');
    boltLine(model, [[x - .09, .072, -.10], [x + .09, .072, -.10],
      [x - .09, .072, .10], [x + .09, .072, .10]], .024);
    for (const z of [-.43, .43]) {
      beam(rack, [x, -.124, 0], [x, -.065, z], .04, .053, paint.steel);
    }
  }
  const tracker = group(model, [1.24, 1.111, .025]);
  round(tracker, [0, .151, -.02], .113, .23, paint.cabinet, 'x');
  round(tracker, [.138, .151, -.02], .099, .05, paint.zinc, 'x');
  casing(tracker, [.04, -.112, .08], [.42, .24, .23], paint.cabinet, .025);
  round(tracker, [.25, -.112, .08], .095, .16, paint.steel, 'x');
  const motorRibs = Array.from({ length: 5 }, (_, index) => [.158 + index * .025, -.112, .08]);
  repeated(tracker, cylinder, paint.shadow, motorRibs, [.10, .014, .10], new THREE.Vector3(1, 0, 0));

  const railTip = rack.localToWorld(new THREE.Vector3(3.067, -.033, .54)).toArray();
  const output = [3.42, .19, .86];
  const drop = [railTip, [3.12, 1.015, .64], [3.1, .63, .75], [3.22, .24, .85], output];
  wire(model, drop, .024);
  wire(model, drop.map(([x, y, z]) => [x - .037, y, z + .022]), .02);
  round(model, output, .046, .095, paint.cabinet, 'x');
  const point = (x, y, z) => rack.localToWorld(new THREE.Vector3(x, y, z)).toArray();
  const cell = point(0, .065, .15);
  const junctionPoint = point(.38, -.025, .54);
  setInspection(model, [
    part('Front glass', glass, [0, .95, -.15], .92),
    part('CdTe film', film, [0, .95, .32], .60),
    part('Conductive cell strips', contacts, [0, .39, .93], .51),
    part('DC junction box', junction, [0, -.08, 1], .78),
  ]);
  return route(model, [
    { form: 'light', label: 'Sunlight reaches the film', part: 'Front glass', points: [[-.44, 2.71, -.21], [-.24, 2.13, -.05], cell] },
    { form: 'dc', label: 'The thin film makes DC', part: 'CdTe film', weight: 1.55, points: [cell, point(.36, .065, .35), junctionPoint] },
    { form: 'dc', label: 'DC leaves through the module leads', part: 'DC junction box',
      points: [junctionPoint, point(.55, -.03, .54), point(1.50, -.03, .54), point(2.56, -.03, .54), ...drop] },
  ], null, output, 'light', 'dc');
}

function ventPanel(parent, center, width, height, rows) {
  const [x, y, z] = center;
  const pitch = height / rows;
  casing(parent, [x, y, z - .016], [width + .06, height + .062, .048], paint.steel, .012);
  box(parent, [x, y, z + .011], [width, height, .023], paint.shadow);
  const slats = Array.from({ length: rows }, (_, index) => [x, y - height / 2 + pitch * (index + .5), z + .035]);
  const bank = repeated(parent, block, paint.white, slats, [width - .026, pitch * .62, .023]);
  return bank;
}

function cabinetHinges(parent, x, depth, positions) {
  for (const y of positions) {
    box(parent, [x, y, depth], [.115, .112, .025], paint.steel);
    round(parent, [x + .03, y, depth + .029], .024, .143, paint.shadow);
    boltLine(parent, [[x - .02, y - .031, depth + .019], [x - .02, y + .031, depth + .019]], .013, zNormal);
  }
}

function busbar(parent, start, end, width = .07, depth = .032) {
  return beam(parent, start, end, width, depth, paint.copper);
}

function cabinetFrame(parent, centerX, width, depth, height) {
  const front = depth / 2;
  const rear = -front;
  const edges = [centerX - width / 2, centerX + width / 2];
  casing(parent, [centerX, .22, 0], [width + .22, .26, depth + .19], paint.shadow, .036);
  casing(parent, [centerX, height + .021, 0], [width + .12, .08, depth + .09], paint.white, .024);
  for (const x of edges) {
    for (const z of [front, rear]) box(parent, [x, (height + .35) / 2, z], [.088, height - .28, .086], paint.steel);
  }
  for (const y of [.39, height - .11]) {
    for (const z of [front, rear]) box(parent, [centerX, y, z], [width, .067, .078], paint.steel);
    for (const x of edges) box(parent, [x, y, 0], [.06, .07, depth], paint.steel);
  }
}

function solarInverter() {
  const model = group();
  model.name = 'Central PV inverter and collection transformer';
  const cabin = -1.62;
  const width = 3.78;
  const depth = 1.81;
  const top = 2.65;
  const front = .94;
  const chassis = group(model);
  const shell = group(model);
  const inputBay = group(model);
  const bridgeBay = group(model);
  const filterBay = group(model);
  const controller = group(model);
  const transfer = group(model, [2.52, 0, .015]);

  // The inverter enclosure and the separate pad transformer share an illustrative skid.
  casing(model, [-.08, .071, 0], [7.08, .14, 2.43], paint.concrete, .046);
  for (const side of [-1, 1]) {
    box(chassis, [cabin, .14, side * 1.035], [4.06, .103, .085], paint.steel);
    box(chassis, [2.53, .14, side * .89], [1.83, .095, .07], paint.steel);
    boltLine(chassis, [[cabin - 1.71, .203, side * 1.035], [cabin + 1.71, .203, side * 1.035], [2.53, .199, side * .89]], .035);
  }
  cabinetFrame(chassis, cabin, width, depth, top);
  for (const x of [cabin - width / 2, cabin + width / 2]) {
    casing(shell, [x, 1.485, -.004], [.059, 2.11, 1.76], paint.white, .024);
  }
  casing(shell, [cabin, 1.485, -.912], [width - .04, 2.11, .044], paint.white, .018);
  casing(shell, [cabin, .356, .927], [width - .063, .115, .061], paint.shadow, .015);
  const doorX = [-2.861, -1.62, -.379];
  doorX.forEach((x, index) => {
    casing(shell, [x, 1.491, front], [1.202, 2.112, .072], paint.white, .025);
    casing(shell, [x + .451, 1.566, front + .049], [.063, .23, .044], paint.shadow, .009);
    cabinetHinges(shell, x - .59, front + .041, [.585, 1.342, 2.35]);
    ventPanel(shell, [x - .035, index === 1 ? 2.255 : 2.153, front + .045], .99, index === 1 ? .34 : .46, 9);
    if (index !== 1) ventPanel(shell, [x - .035, .72, front + .045], .98, .31, 7);
  });
  casing(shell, [-1.69, 1.68, front + .048], [.353, .217, .038], paint.shadow, .014);
  box(shell, [-1.69, 1.694, front + .07], [.249, .121, .012], paint.polymer);
  for (const x of [-1.78, -1.72, -1.66]) round(shell, [x, 1.618, front + .072], .016, .021, paint.zinc, 'z');
  plaque(shell, 'PV INVERTER', [-1.66, 2.535, front + .043], .68, .09, true);
  plaque(shell, 'DC INPUT', [-2.87, 1.449, front + .043], .31, .069, true);
  plaque(shell, 'AC OUTPUT', [-.38, 1.449, front + .043], .33, .069, true);

  const input = [-3.58, .194, .876];
  const dcTray = [input, [-3.24, .198, .87], [-2.98, .24, .83], [-2.82, .396, .65], [-2.82, .52, .42]];
  wire(model, dcTray, .043);
  wire(model, dcTray.map(([x, y, z]) => [x, y, z - .14]), .043);
  round(model, input, .062, .1, paint.shadow, 'x');
  for (const z of [.68, .82]) round(chassis, [-3.31, .211, z], .073, .14, paint.steel, 'x');

  box(inputBay, [-2.81, 1.33, -.385], [.97, 1.74, .082], paint.steel);
  box(inputBay, [-2.805, 1.413, .235], [.82, .111, .52], paint.cabinet);
  for (const x of [-3.053, -2.822, -2.591]) {
    casing(inputBay, [x, 1.094, .285], [.144, .42, .218], paint.shadow, .015);
    round(inputBay, [x, 1.068, .403], .05, .169, paint.insulation, 'z');
    busbar(inputBay, [x, .555, .466], [x, .914, .42], .053);
    busbar(inputBay, [x, 1.29, .415], [x, 1.403, .467], .047);
    boltLine(inputBay, [[x, .554, .497], [x, 1.369, .503]], .038, zNormal);
  }
  for (const y of [1.41, 1.52]) busbar(inputBay, [-3.147, y, .47], [-2.191, y, .47], .056);
  casing(inputBay, [-2.79, 1.81, .12], [.79, .37, .248], paint.white, .022);
  round(inputBay, [-2.80, 1.808, .268], .102, .054, paint.shadow, 'z');
  box(inputBay, [-2.80, 1.814, .304], [.057, .139, .036], paint.red);
  plaque(inputBay, 'DC PROTECTION', [-2.8, .438, .54], .68, .078);

  box(bridgeBay, [-1.61, 1.528, -.251], [.91, 1.75, .096], paint.steel);
  for (const y of [.86, 1.379, 1.89]) {
    box(bridgeBay, [-1.609, y, .191], [.94, .064, .76], paint.cabinet);
    casing(bridgeBay, [-1.665, y + .124, .303], [.436, .191, .411], paint.shadow, .014);
    const fins = Array.from({ length: 11 }, (_, index) => [-1.99 + index * .065, y + .239, .151]);
    repeated(bridgeBay, block, paint.zinc, fins, [.022, .17, .418]);
    for (const x of [-1.87, -1.67, -1.46]) {
      busbar(bridgeBay, [x, y + .127, .501], [x + .043, y + .127, .638], .058);
      boltLine(bridgeBay, [[x, y + .239, .49]], .023);
    }
  }
  for (const z of [-.18, .017]) {
    for (const x of [-1.97, -1.8, -1.63, -1.46, -1.29]) {
      round(bridgeBay, [x, 2.13, z], .061, .241, paint.cabinet);
      round(bridgeBay, [x, 2.259, z], .057, .018, paint.steel);
    }
  }
  for (const y of [1.39, 1.50]) busbar(bridgeBay, [-2.195, y, .47], [-1.86, y + .013, .48], .056);
  busbar(bridgeBay, [-1.25, 1.523, .573], [-.955, 1.523, .573], .066);
  plaque(bridgeBay, 'SWITCHING BRIDGE', [-1.61, .654, .58], .72, .078);

  box(filterBay, [-.415, 1.259, -.35], [.903, 1.55, .094], paint.steel);
  box(filterBay, [-.417, 1.252, .138], [.93, .073, .74], paint.cabinet);
  for (const x of [-.721, -.42, -.119]) {
    box(filterBay, [x, 1.435, .228], [.247, .329, .43], paint.insulation);
    const blades = Array.from({ length: 10 }, (_, index) => [x, 1.418, .026 + .044 * index]);
    repeated(filterBay, block, paint.copper, blades, [.227, .351, .025]);
    box(filterBay, [x, 1.619, .23], [.258, .079, .46], paint.steel);
    box(filterBay, [x, 1.303, .23], [.258, .075, .45], paint.steel);
    round(filterBay, [x, .799, .13], .095, .338, paint.polymer);
    round(filterBay, [x, .971, .13], .082, .023, paint.steel);
    busbar(filterBay, [x, 1.449, .467], [x, 1.449, .593], .06);
  }
  busbar(filterBay, [-.961, 1.523, .573], [-.721, 1.449, .593], .065);
  plaque(filterBay, 'AC FILTER', [-.41, .584, .543], .51, .078);

  box(controller, [-.43, 2.15, -.335], [.82, .497, .047], paint.steel);
  box(controller, [-.43, 2.17, -.303], [.692, .371, .02], paint.board);
  for (const [x, y] of [[-.669, 2.136], [-.45, 2.216], [-.235, 2.11]]) {
    casing(controller, [x, y, -.273], [.105, .12, .039], paint.shadow, .008);
  }
  for (let pin = 0; pin < 10; pin += 1) {
    const x = -.694 + pin * .058;
    box(controller, [x, 2.034, -.274], [.024, .044, .038], paint.brass);
  }
  wire(controller, [[-.66, 1.996, -.258], [-.76, 1.953, -.203], [-.99, 1.956, .008], [-1.253, 1.972, .037]], .014, paint.insulation);
  plaque(controller, 'CONTROLLER', [-.40, 2.377, -.27], .44, .078, true);

  const pad = padTransformer(transfer);
  const acLead = [[-.12, 1.429, .593], [-.03, 1.158, .681], [.105, .498, .71],
    [.305, .241, .854], [.921, .227, .93], [1.61, .254, .936], [1.94, .465, .936], [2.02, .859, .928]];
  for (const z of [-.113, 0, .113]) wire(model, acLead.map(([x, y, at]) => [x, y, at + z]), .044);
  casing(model, [.91, .167, .95], [1.44, .091, .338], paint.steel, .018);
  const collectionOutput = [3.57, .192, .833];
  const mvLead = [[3.01, 1.236, .871], [3.183, .90, .909], [3.23, .38, .92],
    [3.385, .199, .868], collectionOutput];
  for (const z of [-.092, 0, .092]) wire(model, mvLead.map(([x, y, at]) => [x, y, at + z]), .039);
  round(model, collectionOutput, .065, .101, paint.cabinet, 'x');
  setInspection(model, [
    part('DC input and protection', inputBay, [-.62, .2, .72], .7, [-2.83, 1.17, .53]),
    part('Inverter bridge', bridgeBay, [-.08, .72, .72], .82, [-1.57, 1.56, .63]),
    part('AC output filter', filterBay, [.63, .26, .73], .69, [-.41, 1.46, .62]),
    part('Controller board', controller, [.45, .79, .4], .66, [-.43, 2.17, -.26]),
    part('Collection transformer', transfer, [.7, .2, .72], .46, [2.54, 1.44, .65]),
  ], { hidden: [inputBay, bridgeBay, filterBay, controller, pad.coils, pad.core],
    shell: [shell, pad.enclosure] });

  return route(model, [
    { form: 'dc', label: 'DC enters through the input cables', part: 'DC input and protection',
      points: [...dcTray, [-2.82, .914, .42], [-2.82, 1.41, .47], [-2.19, 1.41, .47]] },
    { form: 'dc', label: 'Steady DC reaches the switches', part: 'Inverter bridge',
      points: [[-2.19, 1.41, .47], [-1.864, 1.427, .48], [-1.66, 1.50, .55]] },
    { form: 'ac', label: 'The switches and filter make AC', part: 'AC output filter',
      points: [[-1.66, 1.50, .55], [-1.24, 1.523, .573], [-.96, 1.523, .573], [-.721, 1.449, .593], [-.12, 1.429, .593]] },
    { form: 'ac', label: 'AC enters the collection transformer',
      note: 'Three AC conductors leave the inverter cabinet and enter the separate transformer.',
      points: [...acLead, [2.26, .87, .41], [2.26, .98, .145]] },
    { form: 'magnetic', label: 'A magnetic field transfers energy between its coils', part: 'Collection transformer',
      points: [[2.28, .632, -.11], [2.28, 1.392, -.11], [2.76, 1.392, -.11], [2.76, .632, -.11], [2.28, .632, -.11]] },
    { form: 'ac', label: '34.5 kV AC leaves for the collection network',
      note: 'The output winding supplies the collection cable that leads toward the main transformer.',
      points: [[2.79, 1.14, .135], [2.88, 1.27, .43], ...mvLead] },
  ], input, collectionOutput, 'dc', 'ac');
}

function padTransformer(parent) {
  const enclosure = group(parent);
  const coils = group(parent);
  const core = group(parent);
  casing(parent, [0, .215, 0], [1.72, .138, 1.75], paint.cabinet, .028);
  casing(enclosure, [0, .962, -.08], [1.64, 1.38, 1.50], paint.polymer, .059);
  casing(enclosure, [0, 1.682, -.08], [1.71, .085, 1.59], paint.steel, .03);
  for (const x of [-.408, .408]) {
    casing(enclosure, [x, .997, .707], [.765, 1.273, .073], paint.polymer, .033);
    cabinetHinges(enclosure, x + Math.sign(x) * .349, .75, [.522, 1.411]);
    casing(enclosure, [x * .25, 1.12, .761], [.07, .159, .046], paint.shadow, .009);
  }
  const fins = Array.from({ length: 12 }, (_, index) => [.852, .91, -.712 + .111 * index]);
  repeated(enclosure, block, paint.cabinet, fins, [.186, .941, .035]);
  for (const x of [-.554, -.444, -.334, .372, .482, .592]) {
    round(enclosure, [x, 1.642, .26], .062, .143, paint.porcelain);
    round(enclosure, [x, 1.732, .26], .068, .054, paint.copper);
  }
  casing(enclosure, [.524, .678, .779], [.51, .69, .087], paint.cabinet, .02);
  for (const z of [.81, .913, 1.014]) round(enclosure, [-.50, .852, z], .075, .133, paint.rubber, 'z');
  round(enclosure, [.49, 1.235, .855], .11, .176, paint.cabinet, 'z');
  plaque(enclosure, 'COLLECTION TRANSFORMER', [0, 1.45, .75], .90, .085, true);

  const ring = new THREE.TorusGeometry(1, .042, 6, 28).rotateX(-Math.PI / 2);
  const coilShell = new THREE.CylinderGeometry(1, 1, 1, 28, 1, true);
  for (const x of [-.47, 0, .47]) {
    round(core, [x, 1.011, -.125], .102, .771, paint.cabinet);
    mesh(coils, coilShell, paint.copper, [x, 1.016, -.125], [.185, .578, .185]);
    const turns = Array.from({ length: 11 }, (_, index) => [x, .746 + .053 * index, -.125]);
    repeated(coils, ring, paint.copper, turns, [.192, .43, .192]);
    round(coils, [x, .703, -.125], .205, .041, paint.insulation);
    round(coils, [x, 1.311, -.125], .205, .041, paint.insulation);
  }
  for (const y of [.615, 1.381]) box(core, [0, y, -.125], [1.19, .115, .21], paint.cabinet);
  busbar(coils, [-.265, .89, .344], [-.255, .99, .065], .046);
  busbar(coils, [.268, 1.144, .069], [.365, 1.268, .422], .05);
  setInspection(parent, [
    part('Collection transformer coils', coils, [.72, .39, .65], .47, [0, 1.05, .06]),
    part('Collection transformer core', core, [-.63, .61, .55], .46, [0, 1.22, -.11]),
  ], { hidden: [coils, core], shell: [enclosure] });
  return { enclosure, coils, core };
}

function bushing(parent, position, length, radius, tilt = 0) {
  const stem = group(parent, position);
  stem.rotation.z = tilt;
  const rim = 1.24 * radius;
  round(stem, [0, .026, 0], rim * 1.29, .094, paint.zinc);
  round(stem, [0, length * .45, 0], radius * .54, length * .88, paint.porcelain);
  const sheds = Math.round(length / .119);
  const pitch = (length - .16) / sheds;
  for (let index = 0; index < sheds; index += 1) {
    const y = .1 + pitch * index;
    const scale = 1 - .23 * index / sheds;
    const broad = index % 2 === 0 ? rim : rim * .86;
    round(stem, [0, y, 0], broad * scale, .033, paint.porcelain);
    round(stem, [0, y + .022, 0], broad * .80 * scale, .023, paint.porcelain);
  }
  round(stem, [0, length - .062, 0], radius * .61, .13, paint.zinc);
  casing(stem, [0, length + .013, 0], [radius * 1.38, .107, radius], paint.copper, .011);
  boltLine(stem, [[0, length + .074, 0]], radius * .37);
  return stem;
}

function radiatorBank(parent, x, z) {
  const bank = group(parent, [x, 0, z]);
  const fins = Array.from({ length: 13 }, (_, index) => [-.69 + index * .114, 1.42, 0]);
  repeated(bank, block, paint.enamel, fins, [.054, 1.78, .49]);
  for (const y of [.51, 2.34]) {
    round(bank, [0, y, 0], .086, 1.53, paint.steel, 'x');
    round(bank, [-.723, y, -.117], .09, .40, paint.steel, 'z');
    round(bank, [.725, y, -.117], .09, .40, paint.steel, 'z');
    round(bank, [-.715, y, -.234], .112, .065, paint.zinc, 'z');
    round(bank, [.715, y, -.234], .112, .065, paint.zinc, 'z');
  }
  for (const side of [-1, 1]) {
    box(bank, [side * .69, 1.41, .246], [.043, 1.59, .045], paint.zinc);
    box(bank, [0, side > 0 ? 2.07 : .766, .252], [1.46, .035, .042], paint.zinc);
  }
  return bank;
}

function windingStack(parent) {
  const winding = group(parent);
  const primary = group(winding);
  const secondary = group(winding);
  const spacers = group(winding);
  const ring = new THREE.TorusGeometry(1, .034, 6, 40).rotateX(-Math.PI / 2);
  const layer = new THREE.CylinderGeometry(1, 1, 1, 42, 1, true);
  const coilPaint = paint.copper.clone();
  coilPaint.side = THREE.DoubleSide;
  const centers = [-1.44, 0, 1.44];
  for (const x of centers) {
    mesh(primary, layer, coilPaint, [x, 1.49, -.205], [.39, 1.55, .39]);
    mesh(secondary, layer, coilPaint, [x, 1.51, -.205], [.52, 1.62, .52]);
    const turns = Array.from({ length: 20 }, (_, index) => [x, .75 + .078 * index, -.205]);
    repeated(secondary, ring, paint.copper, turns, [.53, .75, .53]);
    repeated(primary, ring, paint.copper, turns.slice(2, 16), [.399, .87, .399]);
    for (const side of [-1, 1]) {
      const y = 1.51 + side * .845;
      round(spacers, [x, y, -.205], .556, .055, paint.insulation);
      for (const offset of [-.48, .48]) {
        box(spacers, [x + offset, 1.49, -.205], [.038, 1.675, .033], paint.insulation);
      }
    }
    busbar(primary, [x - .243, 2.24, .073], [x - .249, 2.57, .51], .075);
    busbar(secondary, [x + .287, 2.31, -.618], [x + .295, 2.57, -.73], .076);
  }
  return setInspection(winding, [
    part('Lower-voltage winding', primary, [-.68, .42, .82], .82, [-.245, 1.63, .194]),
    part('Higher-voltage winding', secondary, [.71, .36, .66], .88, [.395, 1.72, .189]),
    part('Interwinding insulation', spacers, [0, .95, .2], .81, [0, 2.43, -.204]),
  ]);
}

function coreStack(parent) {
  const core = group(parent);
  const legs = group(core);
  const yoke = group(core);
  const fasteners = group(core);
  for (const x of [-1.44, 0, 1.44]) {
    round(legs, [x, 1.51, -.206], .275, 1.85, paint.cabinet);
    const sheets = Array.from({ length: 22 }, (_, index) => [x, .62 + .083 * index, -.206]);
    repeated(legs, cylinder, paint.steel, sheets, [.28, .015, .28]);
  }
  for (const y of [.514, 2.449]) {
    const sheets = Array.from({ length: 15 }, (_, index) => [0, y, -.473 + index * .038]);
    repeated(yoke, block, paint.cabinet, sheets, [3.55, .205, .031]);
    for (const z of [-.518, .111]) {
      box(fasteners, [0, y, z], [3.85, .223, .071], paint.steel);
      boltLine(fasteners, [-1.73, -.83, 0, .83, 1.73].map((x) => [x, y, z + .041]), .043, zNormal);
    }
  }
  return setInspection(core, [
    part('Core limb', legs, [-.63, .30, .63], .62, [-1.44, 1.52, -.20]),
    part('Yoke', yoke, [0, .9, .25], .62, [0, 2.45, -.21]),
    part('Core clamp', fasteners, [.77, .41, .63], .60, [1.31, 2.45, .13]),
  ]);
}

function transformerConservator(parent) {
  const bank = group(parent, [0, 0, -1.49]);
  for (const x of [-1.44, 1.44]) {
    box(bank, [x, 2.91, 0], [.154, .302, .366], paint.steel);
    beam(bank, [x, 2.78, .318], [x, 3.049, .03], .068, .068, paint.steel);
  }
  round(bank, [0, 3.21, -.046], .303, 3.58, paint.steel, 'x');
  for (const x of [-1.77, 1.77]) {
    round(bank, [x, 3.21, -.046], .326, .069, paint.zinc, 'x');
    round(bank, [x * 1.022, 3.21, -.046], .285, .058, paint.steel, 'x');
  }
  for (const x of [-1.25, 1.25]) round(bank, [x, 3.21, -.046], .312, .069, paint.cabinet, 'x');
  wire(bank, [[-1.24, 3.05, .14], [-1.242, 2.88, .17], [-1.24, 2.74, .36], [-1.24, 2.64, .46]], .047, paint.steel);
  round(bank, [-1.24, 2.82, .285], .081, .116, paint.zinc);
  return bank;
}

function gridTransformer() {
  const model = group();
  model.name = 'Three-phase oil-filled grid transformer';
  const tank = group(model);
  const terminals = group(model);
  const windings = windingStack(model);
  const core = coreStack(model);
  casing(model, [0, .064, -.06], [6.51, .128, 3.91], paint.concrete, .048);
  for (const z of [-1.075, .825]) {
    box(model, [0, .19, z], [5.35, .158, .145], paint.cabinet);
    const anchors = [-2.43, -1.7, 1.7, 2.43].map((x) => [x, .276, z]);
    boltLine(model, anchors, .047);
  }
  casing(tank, [0, 1.46, -.205], [4.61, 2.43, 2.68], paint.enamel, .125);
  casing(tank, [0, .29, -.205], [4.75, .174, 2.79], paint.cabinet, .06);
  casing(tank, [0, 2.69, -.205], [4.83, .162, 2.86], paint.enamel, .055);
  box(tank, [0, 2.593, -.205], [4.72, .036, 2.75], paint.cabinet);
  for (const z of [-1.56, 1.155]) {
    const bolts = Array.from({ length: 17 }, (_, index) => [-2.19 + index * .274, 2.775, z]);
    boltLine(tank, bolts, .043);
  }
  for (const x of [-2.34, 2.34]) {
    const bolts = Array.from({ length: 8 }, (_, index) => [x, 2.775, -1.43 + index * .338]);
    boltLine(tank, bolts, .043);
  }
  for (const side of [-1, 1]) {
    const z = side > 0 ? 1.158 : -1.554;
    for (const x of [-2.15, -.39, .39, 2.15]) {
      box(tank, [x, 1.48, z], [.112, 2.05, .049], paint.enamel);
    }
  }
  radiatorBank(tank, -1.255, 1.464);
  radiatorBank(tank, 1.255, 1.464);
  transformerConservator(tank);

  const cabinet = group(tank, [0, 0, 1.227]);
  casing(cabinet, [0, 1.23, .157], [.713, 1.156, .326], paint.polymer, .026);
  casing(cabinet, [0, 1.23, .336], [.648, 1.09, .058], paint.steel, .014);
  cabinetHinges(cabinet, -.303, .373, [.875, 1.56]);
  casing(cabinet, [.251, 1.219, .372], [.061, .164, .045], paint.shadow, .008);
  round(cabinet, [0, 1.411, .371], .084, .038, paint.cabinet, 'z');
  round(cabinet, [0, 1.411, .394], .065, .013, paint.white, 'z');
  const pointer = box(cabinet, [.005, 1.432, .402], [.012, .053, .007], paint.red);
  pointer.rotation.z = -.67;
  plaque(cabinet, '34.5 / 230 kV', [0, 1.638, .373], .397, .079);
  wire(cabinet, [[0, .644, .204], [0, .51, .184], [.008, .366, .13], [.008, .346, -.19]], .031, paint.rubber);
  round(cabinet, [0, .65, .203], .051, .058, paint.steel);
  for (const side of [-1, 1]) {
    const x = side * 1.35;
    box(tank, [x, .264, -1.06], [.19, .16, .087], paint.brass);
    boltLine(tank, [[x, .291, -1.104]], .03, zNormal, paint.brass);
  }

  const highXs = [-1.53, 0, 1.53];
  const highZ = -.69;
  const highTops = [];
  highXs.forEach((x) => {
    const stem = bushing(terminals, [x, 2.761, highZ], 1.855, .20, -.105);
    highTops.push(stem.localToWorld(new THREE.Vector3(0, 1.889, 0)).toArray());
  });
  const lowX = [-1.32, -.02, 1.26];
  const lowZ = .685;
  const lowTops = lowX.map((x) => {
    const stem = bushing(terminals, [x, 2.763, lowZ], .74, .134, .07);
    return stem.localToWorld(new THREE.Vector3(0, .769, 0)).toArray();
  });
  bushing(terminals, [-2.012, 2.761, -.674], .64, .103, 0);

  const input = [-3.29, .19, .844];
  const upfeed = [input, [-2.993, .204, .837], [-2.82, .54, .822], [-2.78, 1.75, .809],
    [-2.74, 3.0, .789], [-2.37, 3.65, .739], [-1.79, 3.74, .712], lowTops[0]];
  wire(model, upfeed, .038);
  for (const z of [-.21, .21]) {
    const offset = upfeed.slice(0, -2).map(([x, y, at]) => [x, y, at + z]);
    offset.push([-1.98, 3.8 + .32 * z, .723 + z], lowTops[z > 0 ? 1 : 2]);
    wire(model, offset, .032);
  }
  casing(model, [-2.805, .192, .836], [.56, .131, .64], paint.cabinet, .027);
  for (const y of [.55, 1.28, 2.0, 2.72]) {
    casing(model, [-2.772, y, .815], [.13, .051, .56], paint.steel, .013);
  }
  beam(model, [-2.837, .27, .533], [-2.837, 3.10, .533], .105, .102, paint.steel);
  beam(model, [-2.837, .27, 1.098], [-2.837, 3.10, 1.098], .105, .102, paint.steel);
  box(model, [-2.836, .168, .811], [.271, .104, .656], paint.concrete);
  round(model, input, .052, .089, paint.cabinet, 'x');

  const highLead = [highTops[2], [2.028, 4.802, -.734], [2.624, 4.81, -.8], [3.26, 4.93, -.876]];
  wire(model, highLead, .024, paint.conductor);
  const output = highLead.at(-1);
  for (const [index, top] of highTops.slice(0, 2).entries()) {
    wire(model, [top, [top[0] + .45, 4.781, top[2] - .115 * (index + 1)],
      [2.2, 4.89 + index * .10, -1.26 - index * .31], [3.26, 4.93 + index * .11, -1.36 - index * .31]], .022, paint.conductor);
  }

  setInspection(model, [
    part('Winding assembly', windings, [-.68, .57, .70], 1.03, [-.44, 1.59, .28]),
    part('Magnetic core', core, [.62, .56, .69], 1.05, [.51, 1.63, -.15]),
    part('High-voltage bushing', terminals, [.34, .79, -.12], .66, [1.73, 4.11, highZ]),
    part('Tank and cooling', tank, [.18, .4, -.91], .78, [0, 1.63, 1.41]),
  ], { hidden: [windings, core], shell: [tank] });

  const lowerWindingLead = [lowTops[0], [-1.33, 2.77, lowZ], [-1.66, 2.53, .47],
    [-1.683, 2.30, .098], [-1.673, 1.68, .14]];
  const higherWindingLead = [[1.72, 1.73, -.607], [1.735, 2.33, -.62], [1.72, 2.57, -.73],
    [1.54, 2.77, highZ], ...highLead];
  return route(model, [
    { form: 'ac', label: '34.5 kV AC enters the lower-voltage bushing',
      note: 'The bushing insulates the incoming conductor as it passes into the tank to the first winding.', points: upfeed },
    { form: 'ac', label: 'The lower-voltage winding creates a changing field', part: 'Lower-voltage winding', points: lowerWindingLead },
    { form: 'magnetic', label: 'The steel core guides the magnetic field', part: 'Magnetic core',
      points: [[-1.44, 2.45, -.205], [1.44, 2.45, -.205], [1.44, .53, -.205],
        [-1.44, .53, -.205], [-1.44, 2.45, -.205]] },
    { form: 'ac', label: 'The higher-voltage winding sends out 230 kV AC', part: 'Higher-voltage winding', points: higherWindingLead },
  ], input, output, 'ac', 'ac');
}
