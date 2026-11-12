import * as THREE from 'three';

const steel = material(0x657d93, 0.40);
const chrome = material(0xaec8d8, 0.48, 0.27);
const navy = material(0x263d56, 0.30);
const dark = material(0x122233, 0.20);
const graphite = material(0x304459, 0.28);
const white = material(0xb7cfda, 0.22);
const concrete = material(0x677988, 0.06, 0.85);
const copper = material(0xc8804e, 0.38, 0.31);
const bronze = material(0x7e5645, 0.25);
const cyan = material(0x52c4ed, 0.22, 0.33, 0x0b5981, 0.50);
const amber = material(0xf6af56, 0.22, 0.38, 0xac480b, 0.46);
const glass = material(0x176696, 0.32, 0.23, 0x073a69, 0.38);
const water = material(0x20668c, 0.32, 0.22, 0x0a2634, 0.33);
const shadow = material(0x0c1924, 0.10, 0.74);

function material(color, metalness, roughness = 0.47, emissive = 0x000000, emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({color, metalness, roughness, emissive, emissiveIntensity});
}

function mesh(parent, geometry, paint, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, paint);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function box(parent, x, y, z, width, height, depth, paint) {
  return mesh(parent, new THREE.BoxGeometry(width, height, depth), paint, x, y, z);
}

function cylinder(parent, x, y, z, upperRadius, lowerRadius, height, paint, axis = 'y', sides = 32) {
  const item = mesh(parent, new THREE.CylinderGeometry(upperRadius, lowerRadius, height, sides), paint, x, y, z);
  if (axis === 'x') item.rotation.z = -Math.PI / 2;
  if (axis === 'z') item.rotation.x = Math.PI / 2;
  return item;
}

function pipe(parent, points, radius, paint) {
  const path = new THREE.CurvePath();
  const vertices = points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  let from = vertices[0];
  for (let index = 1; index < vertices.length - 1; index++) {
    const vertex = vertices[index];
    const previous = vertices[index - 1];
    const next = vertices[index + 1];
    const bend = Math.min(radius * 3.4, vertex.distanceTo(previous) / 3, vertex.distanceTo(next) / 3);
    const start = vertex.clone().lerp(previous, bend / vertex.distanceTo(previous));
    const end = vertex.clone().lerp(next, bend / vertex.distanceTo(next));
    path.add(new THREE.LineCurve3(from, start));
    path.add(new THREE.QuadraticBezierCurve3(start, vertex, end));
    from = end;
  }
  path.add(new THREE.LineCurve3(from, vertices.at(-1)));
  return mesh(parent, new THREE.TubeGeometry(path, 12 * points.length, radius, 10, false), paint);
}

function ring(parent, x, y, z, radius, thickness, paint, axis = 'z', arc = Math.PI * 2) {
  const item = mesh(parent, new THREE.TorusGeometry(radius, thickness, 9, 44, arc), paint, x, y, z);
  if (axis === 'x') item.rotation.y = Math.PI / 2;
  if (axis === 'y') item.rotation.x = Math.PI / 2;
  return item;
}

function group(parent, x = 0, y = 0, z = 0) {
  const item = new THREE.Group();
  item.position.set(x, y, z);
  parent?.add(item);
  return item;
}

function sphere(parent, x, y, z, radius, paint, topHalf = false) {
  const geometry = new THREE.SphereGeometry(radius, 40, 22, 0, Math.PI * 2, 0, topHalf ? Math.PI / 2 : Math.PI);
  return mesh(parent, geometry, paint, x, y, z);
}

function skid(parent, width, depth, x = 0, z = 0) {
  box(parent, x, 0.13, z, width, 0.25, depth, dark);
  box(parent, x, 0.27, z, width - 0.10, 0.09, depth - 0.10, graphite);
  for (const edge of [-1, 1]) {
    box(parent, x, 0.15, z + edge * (depth / 2 + 0.018), width - 0.16, 0.053, 0.035, steel);
    for (let index = -1; index <= 1; index++) {
      box(parent, x + index * width / 3, 0.15, z + edge * (depth / 2 + 0.04), 0.21, 0.075, 0.05, shadow);
    }
  }
}

function handwheel(parent, x, y, z, radius = 0.17) {
  ring(parent, x, y, z, radius, radius * 0.16, amber, 'y');
  cylinder(parent, x, y - 0.07, z, radius * 0.24, radius * 0.24, 0.18, chrome);
  for (const angle of [0, Math.PI / 3, -Math.PI / 3]) {
    const spoke = box(parent, x, y, z, radius * 1.9, 0.022, 0.022, copper);
    spoke.rotation.y = angle;
  }
}

function controlCabinet(parent, x, y, z, width, height, depth, numberOfVents = 6) {
  box(parent, x, y + height / 2, z, width, height, depth, navy);
  box(parent, x, y + height / 2, z + depth / 2, width - 0.08, height - 0.10, 0.036, steel);
  box(parent, x, y + height * 0.76, z + depth / 2 + 0.025, width * 0.74, height * 0.15, 0.032, dark);
  box(parent, x - width * 0.16, y + height * 0.76, z + depth / 2 + 0.045, width * 0.20, height * 0.056, 0.016, cyan);
  box(parent, x + width * 0.17, y + height * 0.76, z + depth / 2 + 0.045, width * 0.075, height * 0.040, 0.016, amber);
  for (let vent = 0; vent < numberOfVents; vent++) {
    box(parent, x, y + height * (0.22 + vent * 0.046), z + depth / 2 + 0.023, width * 0.72, height * 0.022, 0.032, shadow);
  }
  box(parent, x + width * 0.39, y + height * 0.55, z + depth / 2 + 0.04, 0.035, height * 0.12, 0.042, dark);
}

function gasPlant() {
  const root = group();
  skid(root, 6.8, 5.0);
  const building = group(root, -0.23, 0.31, -1.45);
  box(building, 0, 1.15, 0, 5.05, 2.30, 1.68, navy);
  box(building, 0, 2.34, 0, 5.24, 0.17, 1.88, chrome);
  box(building, 0, 2.47, 0, 4.94, 0.09, 1.62, graphite);
  box(building, 0, 2.15, 0.853, 4.94, 0.035, 0.035, cyan);
  for (const x of [-2.30, -1.51, -0.74, 0.05, 0.83, 1.62, 2.35]) {
    box(building, x, 1.14, 0.853, 0.046, 2.16, 0.074, steel);
  }
  for (const x of [-1.94, -1.13, 0.41, 1.22, 1.99]) {
    box(building, x, 1.82, 0.851, 0.53, 0.30, 0.048, glass);
    box(building, x, 1.82, 0.881, 0.044, 0.30, 0.02, chrome);
  }
  box(building, -0.34, 0.66, 0.865, 0.62, 1.29, 0.06, shadow);
  box(building, -0.34, 0.66, 0.905, 0.50, 1.19, 0.045, graphite);
  for (let index = 0; index < 5; index++) {
    box(building, 1.73, 0.48 + index * 0.10, 0.86, 0.93, 0.053, 0.05, shadow);
  }
  for (const [x, height, radius] of [[-1.65, 1.49, 0.22], [0.90, 0.92, 0.16], [1.62, 1.17, 0.21]]) {
    box(building, x, 2.52, 0, radius * 2.9, 0.11, radius * 2.9, steel);
    cylinder(building, x, 2.54 + height / 2, 0, radius, radius, height, graphite);
    cylinder(building, x, 2.54 + height, 0, radius * 1.17, radius * 1.17, 0.11, chrome);
    cylinder(building, x, 2.60 + height, 0, radius * 0.77, radius * 0.77, 0.02, shadow);
    cylinder(building, x, 2.54 + height * 0.33, 0, radius * 1.04, radius * 1.04, 0.08, chrome);
  }
  const vessels = group(root, -1.47, 0, 0.66);
  for (const z of [0, 0.79]) {
    for (const x of [-0.78, 0.78]) {
      box(vessels, x, 0.46, z, 0.27, 0.31, 0.49, graphite);
    }
    cylinder(vessels, 0, 0.82, z, 0.32, 0.32, 2.06, chrome, 'x');
    sphere(vessels, -1.03, 0.82, z, 0.32, steel).scale.x = 0.46;
    sphere(vessels, 1.03, 0.82, z, 0.32, steel).scale.x = 0.46;
    for (const x of [-0.79, 0.79]) cylinder(vessels, x, 0.82, z, 0.336, 0.336, 0.10, navy, 'x');
    box(vessels, 0.18, 0.82, z + 0.32, 0.43, 0.068, 0.025, cyan);
  }
  const manifold = group(root);
  pipe(manifold, [[-3.38, 0.60, 2.11], [-2.41, 0.60, 2.11], [-2.41, 1.02, 2.11], [1.83, 1.02, 2.11], [1.83, 0.60, 2.11], [3.35, 0.60, 2.11]], 0.105, copper);
  for (const x of [-2.40, 0.24, 1.82]) {
    box(manifold, x, 0.46, 2.10, 0.29, 0.25, 0.32, dark);
    cylinder(manifold, x, 1.02, 2.11, 0.16, 0.16, 0.21, bronze, 'x', 12);
    handwheel(manifold, x, 1.28, 2.11);
  }
  pipe(manifold, [[-0.91, 1.02, 2.11], [-0.91, 1.39, 2.11], [-0.91, 1.39, 1.45], [-0.91, 0.91, 1.45]], 0.074, copper);
  pipe(manifold, [[-0.45, 0.82, 0.66], [0.76, 0.82, 0.66], [0.76, 1.20, 0.66], [0.76, 1.20, -0.67]], 0.087, steel);
  controlCabinet(root, 2.54, 0.30, 0.40, 0.82, 1.72, 0.86);
  box(root, 1.26, 0.33, 0.55, 0.97, 0.11, 1.25, shadow);
  for (let index = 0; index < 6; index++) {
    const stripe = box(root, 0.70 + 0.17 * index, 0.395, 1.25, 0.085, 0.016, 0.27, amber);
    stripe.rotation.y = -0.41;
  }
  return root;
}

function lowerShell(parent, x, y, z, radius, length, paint, open) {
  const segments = open ? [0, Math.PI] : [0, Math.PI * 2];
  const shell = new THREE.CylinderGeometry(radius, radius, length, 48, 1, true, ...segments);
  const finish = open ? paint.clone() : paint;
  if (open) finish.side = THREE.DoubleSide;
  const side = mesh(parent, shell, finish, x, y, z);
  side.rotation.z = -Math.PI / 2;
  for (const xEdge of [x - length / 2, x + length / 2]) {
    const lip = ring(parent, xEdge, y, z, radius, 0.059, chrome, 'x', open ? Math.PI : Math.PI * 2);
    if (open) lip.rotation.x = Math.PI;
  }
  if (open) {
    for (const edge of [-1, 1]) {
      box(parent, x, y, z + edge * radius, length + 0.08, 0.075, 0.10, chrome);
    }
  }
}

function shaftRotor(parent, x, y, z, radius, width, paint, bladeCount) {
  const rotor = group(parent, x, y, z);
  cylinder(rotor, 0, 0, 0, radius * 0.48, radius * 0.48, width * 1.52, chrome, 'x');
  cylinder(rotor, 0, 0, 0, radius * 0.71, radius * 0.71, width, paint, 'x');
  for (let index = 0; index < bladeCount; index++) {
    const bladeAssembly = group(rotor);
    bladeAssembly.rotation.x = index * Math.PI * 2 / bladeCount;
    const blade = box(bladeAssembly, 0, radius * 0.81, 0, width * 1.18, radius * 0.35, radius * 0.135, paint);
    blade.rotation.y = 0.54;
  }
  rotor.userData.spin = {axis: 'x', speed: 2.2};
  return rotor;
}

function bearing(parent, x, y, radius) {
  cylinder(parent, x, y, 0, radius, radius, 0.20, steel, 'x');
  ring(parent, x + 0.11, y, 0, radius * 0.69, 0.041, chrome, 'x');
  for (let index = 0; index < 8; index++) {
    const angle = index * Math.PI / 4;
    cylinder(parent, x + 0.115, y + Math.cos(angle) * radius * 0.84, Math.sin(angle) * radius * 0.84, 0.038, 0.038, 0.042, chrome, 'x', 6);
  }
}

function turbine(cutaway, steam) {
  const root = group();
  const axisHeight = 1.52;
  skid(root, 6.8, 3.4);
  const stages = steam
    ? [[-1.50, 0.59, 0.20], [-1.16, 0.68, 0.20], [-0.78, 0.73, 0.22], [-0.38, 0.79, 0.22], [0.12, 0.86, 0.25], [0.65, 0.96, 0.25], [1.30, 1.08, 0.29]]
    : [[-1.80, 0.82, 0.20], [-1.48, 0.72, 0.19], [-1.14, 0.63, 0.17], [-0.82, 0.56, 0.15], [0.64, 0.61, 0.20], [1.04, 0.71, 0.21], [1.49, 0.82, 0.22]];
  for (const x of [-2.0, 2.0]) {
    box(root, x, 0.54, 0, 0.38, 0.48, 1.58, navy);
    box(root, x, 0.80, 0, 0.48, 0.08, 1.43, steel);
  }
  cylinder(root, 0, axisHeight, 0, 0.155, 0.155, cutaway ? 6.27 : 5.39, chrome, 'x');
  if (steam) {
    lowerShell(root, cutaway ? -1.11 : -0.97, axisHeight, 0, 0.83, 1.61, steel, cutaway);
    lowerShell(root, cutaway ? 0.77 : 0.66, axisHeight, 0, 1.13, 1.76, navy, cutaway);
    pipe(root, [[-1.60, 1.51, -0.67], [-1.60, 3.08, -0.67], [-2.86, 3.08, -0.67]], 0.20, chrome);
    pipe(root, [[1.19, 1.31, -0.93], [1.19, 0.54, -1.14], [2.81, 0.54, -1.14]], 0.25, steel);
  } else {
    lowerShell(root, cutaway ? -1.22 : -1.08, axisHeight, 0, 0.90, 1.74, steel, cutaway);
    lowerShell(root, 0, axisHeight, 0, 0.79, 0.72, bronze, cutaway);
    lowerShell(root, cutaway ? 1.25 : 1.12, axisHeight, 0, 0.92, 1.46, navy, cutaway);
    pipe(root, [[-0.21, 2.21, -0.26], [-0.21, 2.88, -0.26], [1.41, 2.88, -0.26]], 0.083, copper);
    if (cutaway) {
      for (let index = 0; index < 7; index++) {
        const angle = -0.60 + index * 0.73;
        const y = axisHeight + Math.cos(angle) * 0.46;
        const z = Math.sin(angle) * 0.46;
        cylinder(root, 0, y, z, 0.12, 0.16, 0.57, copper, 'x');
        ring(root, -0.18, y, z, 0.125, 0.030, amber, 'x');
      }
    }
  }
  for (const [x, radius, width] of stages) {
    const exposed = cutaway || x === stages[0][0];
    if (exposed) {
      shaftRotor(root, x * (cutaway ? 1.23 : 1.15), axisHeight, 0, radius, width, x > 0.38 ? copper : chrome, 19);
    }
  }
  for (const x of [cutaway ? -2.62 : -2.20, cutaway ? 2.53 : 2.14]) bearing(root, x, axisHeight, 0.39);
  for (const x of [-1.80, -1.27, 0.65, 1.19]) {
    if (!cutaway) ring(root, x, axisHeight, 0, steam && x > 0 ? 1.13 : 0.92, 0.04, steel, 'x');
  }
  return root;
}

function reactor(cutaway) {
  const root = group();
  skid(root, 6.48, 5.50);
  const originX = -0.45;
  const originZ = -0.30;
  const radius = 1.86;
  if (cutaway) {
    const wall = mesh(root, new THREE.CylinderGeometry(radius, radius, 2.46, 48, 1, true, Math.PI / 2, Math.PI), concrete, originX, 1.57, originZ);
    wall.material = concrete.clone();
    wall.material.side = THREE.DoubleSide;
    const dome = new THREE.SphereGeometry(radius, 42, 20, 0, Math.PI, 0, Math.PI / 2);
    mesh(root, dome, wall.material, originX, 2.80, originZ).rotation.y = Math.PI;
    cylinder(root, originX, 0.43, originZ, radius + 0.08, radius + 0.08, 0.24, steel);
    cylinder(root, -1.17, 1.50, 0.10, 0.58, 0.58, 1.60, steel);
    sphere(root, -1.17, 2.28, 0.10, 0.58, chrome, true).scale.y = 0.47;
    for (const x of [-1.39, -1.17, -0.94]) {
      cylinder(root, x, 2.75, 0.10, 0.06, 0.06, 0.62, copper);
    }
    for (const y of [0.91, 2.17]) {
      cylinder(root, -1.17, y, 0.10, 0.61, 0.61, 0.11, chrome);
    }
    const steamGenerator = group(root, 0.75, 0, 0.09);
    cylinder(steamGenerator, 0, 1.73, 0, 0.48, 0.48, 2.39, graphite);
    cylinder(steamGenerator, 0, 2.62, 0, 0.56, 0.56, 0.66, chrome);
    sphere(steamGenerator, 0, 2.95, 0, 0.56, steel, true).scale.y = 0.50;
    box(steamGenerator, 0, 1.59, 0.477, 0.37, 1.38, 0.055, shadow);
    for (const x of [-0.12, 0, 0.12]) box(steamGenerator, x, 1.60, 0.514, 0.045, 1.22, 0.036, copper);
    pipe(root, [[-0.78, 2.02, 0.14], [-0.62, 2.02, 0.95], [0.48, 2.02, 0.95], [0.48, 2.02, 0.23]], 0.101, copper);
    pipe(root, [[0.67, 0.94, 0.28], [0.65, 0.94, 1.03], [-0.95, 0.94, 1.03], [-0.95, 0.94, 0.38]], 0.102, cyan);
    cylinder(root, 0.04, 0.94, 1.03, 0.19, 0.19, 0.28, steel, 'x');
    pipe(root, [[0.75, 3.02, 0.09], [0.75, 3.60, 0.09], [2.66, 3.60, 0.09], [2.66, 1.37, 0.09]], 0.093, chrome);
  } else {
    cylinder(root, originX, 1.56, originZ, radius, radius, 2.46, concrete);
    sphere(root, originX, 2.79, originZ, radius, concrete, true).scale.y = 0.79;
    for (const y of [0.52, 1.04, 2.75, 2.84]) {
      cylinder(root, originX, y, originZ, radius + 0.025, radius + 0.025, 0.047, steel);
    }
    for (let index = 0; index < 16; index++) {
      const angle = index * Math.PI / 8;
      const seam = box(root, originX + Math.sin(angle) * radius, 1.65, originZ + Math.cos(angle) * radius, 0.041, 2.10, 0.046, steel);
      seam.rotation.y = angle;
    }
    box(root, originX, 0.87, originZ + radius, 0.62, 1.09, 0.10, graphite);
    box(root, originX, 1.43, originZ + radius + 0.04, 0.64, 0.046, 0.062, cyan);
  }
  box(root, 2.20, 0.85, -0.52, 1.65, 1.08, 2.11, navy);
  box(root, 2.20, 1.42, -0.52, 1.77, 0.11, 2.22, chrome);
  for (const x of [1.71, 2.19, 2.67]) {
    box(root, x, 1.09, 0.551, 0.34, 0.19, 0.034, glass);
  }
  box(root, 2.20, 0.56, 0.552, 0.93, 0.23, 0.04, shadow);
  return root;
}

function photovoltaicArray() {
  const root = group();
  skid(root, 6.92, 5.57);
  const panelWidth = 1.87;
  const panelDepth = 1.03;
  const panelLines = new THREE.LineBasicMaterial({color: 0x6c9ac2});
  const panelFaces = material(0x1b4f83, 0.33, 0.23, 0x082955, 0.48);
  for (const z of [-1.62, 0.10, 1.82]) {
    for (const x of [-2.06, 0, 2.06]) {
      for (const offset of [-0.62, 0.62]) {
        box(root, x + offset, 0.56, z, 0.078, 0.50, 0.10, steel);
        box(root, x + offset, 0.33, z, 0.23, 0.07, 0.27, concrete);
      }
      const module = group(root, x, 0.83, z);
      module.rotation.x = 0.49;
      box(module, 0, 0, 0, panelWidth, 0.084, panelDepth, chrome);
      box(module, 0, 0.047, 0, panelWidth - 0.076, 0.015, panelDepth - 0.07, panelFaces);
      const vertices = [];
      for (let index = 1; index < 12; index++) {
        const traceX = -0.90 + index * 0.15;
        vertices.push(traceX, 0.058, -0.48, traceX, 0.058, 0.48);
      }
      for (let index = 1; index < 6; index++) {
        const traceZ = -0.48 + index * 0.16;
        vertices.push(-0.90, 0.058, traceZ, 0.90, 0.058, traceZ);
      }
      const grid = new THREE.BufferGeometry();
      grid.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      module.add(new THREE.LineSegments(grid, panelLines));
    }
    pipe(root, [[-3.15, 0.39, z], [3.22, 0.39, z]], 0.034, copper);
  }
  pipe(root, [[3.22, 0.39, -1.62], [3.22, 0.39, 2.42], [2.04, 0.39, 2.42]], 0.047, amber);
  return root;
}

function converter(cutaway, wind) {
  const root = group();
  skid(root, 5.3, 3.45);
  const height = wind ? 2.78 : 2.19;
  const width = wind ? 1.42 : 1.27;
  const separation = width + 0.085;
  for (const x of [-separation, 0, separation]) {
    if (cutaway && x === 0) {
      box(root, x, 0.31 + height / 2, -0.59, width, height, 0.14, steel);
      for (const edge of [-1, 1]) {
        box(root, edge * (width / 2 - 0.04), 0.31 + height / 2, 0.02, 0.08, height, 1.35, graphite);
      }
      for (const y of [0.41, height + 0.27]) box(root, x, y, 0.02, width, 0.10, 1.35, graphite);
      box(root, x, 0.35 + height / 2, -0.23, width - 0.25, height - 0.21, 0.055, dark);
      for (const level of [0.68, 1.28, 1.80]) {
        box(root, x, level, 0.09, width - 0.22, 0.09, 0.88, steel);
        for (const offset of [-0.30, 0, 0.30]) {
          cylinder(root, offset, level + 0.18, 0.18, 0.10, 0.10, 0.27, navy);
          cylinder(root, offset, level + 0.325, 0.18, 0.087, 0.087, 0.019, copper);
        }
      }
      pipe(root, [[-0.48, 0.42, 0.49], [-0.48, 1.98, 0.49], [0.33, 1.98, 0.49]], 0.037, amber);
    } else {
      controlCabinet(root, x, 0.31, 0, width, height, 1.36, wind ? 8 : 6);
    }
  }
  for (const z of [1.10, 1.23, 1.36]) {
    pipe(root, [[-2.57, 0.47, z], [-separation, 0.47, z], [-separation, 0.47, 0.72]], 0.043, copper);
    pipe(root, [[separation, 0.47, 0.72], [separation, 0.47, z], [2.57, 0.47, z]], 0.041, wind ? steel : cyan);
  }
  return root;
}

function windTurbine() {
  const root = group();
  skid(root, 4.83, 4.76);
  const z = -0.25;
  const hubHeight = 4.66;
  cylinder(root, 0, 0.41, z, 0.75, 0.84, 0.27, concrete);
  cylinder(root, 0, 2.45, z, 0.18, 0.37, 3.98, white);
  for (const [y, radius] of [[0.52, 0.376], [1.60, 0.318], [3.02, 0.251], [4.36, 0.195]]) {
    ring(root, 0, y, z, radius, 0.021, steel, 'y');
  }
  box(root, 0, 0.89, z + 0.35, 0.21, 0.55, 0.076, graphite);
  cylinder(root, 0, 4.46, z, 0.26, 0.26, 0.12, steel);
  box(root, 0, hubHeight, z, 0.59, 0.49, 1.02, white);
  box(root, 0, hubHeight + 0.25, z - 0.10, 0.39, 0.08, 0.68, chrome);
  box(root, 0, hubHeight + 0.31, z - 0.36, 0.07, 0.13, 0.07, amber);
  box(root, 0.296, hubHeight, z - 0.13, 0.033, 0.11, 0.37, navy);
  const rotor = group(root, 0, hubHeight, z + 0.64);
  cylinder(rotor, 0, 0, 0, 0.27, 0.29, 0.37, steel, 'z');
  sphere(rotor, 0, 0, 0.18, 0.259, white).scale.z = 0.62;
  const shape = new THREE.Shape();
  shape.moveTo(-0.116, 0.10);
  shape.quadraticCurveTo(-0.19, 0.70, -0.22, 1.11);
  shape.quadraticCurveTo(-0.19, 1.72, -0.074, 2.38);
  shape.quadraticCurveTo(0.025, 2.44, 0.052, 2.33);
  shape.quadraticCurveTo(0.08, 1.46, 0.213, 0.59);
  shape.quadraticCurveTo(0.155, 0.28, 0.11, 0.10);
  shape.closePath();
  for (const angle of [0, Math.PI * 2 / 3, Math.PI * 4 / 3]) {
    const blade = mesh(rotor, new THREE.ExtrudeGeometry(shape, {depth: 0.038, bevelEnabled: true, bevelThickness: 0.021, bevelSize: 0.023, bevelSegments: 2, curveSegments: 10}), white);
    blade.rotation.z = angle;
  }
  rotor.rotation.z = -0.29;
  rotor.userData.spin = {axis: 'z', speed: -0.37};
  controlCabinet(root, 1.39, 0.31, 0.50, 0.69, 0.79, 0.67, 3);
  pipe(root, [[0.45, 0.38, 0.62], [1.37, 0.38, 0.62]], 0.043, copper);
  return root;
}

function dam(cutaway) {
  const root = group();
  skid(root, 6.90, 5.55);
  box(root, 0, 0.47, 1.67, 6.74, 0.31, 2.04, concrete);
  box(root, 0, 1.04, -1.74, 6.74, 1.48, 1.93, water);
  box(root, 0, 0.64, 2.07, 6.68, 0.060, 1.24, water);
  const shape = new THREE.Shape();
  shape.moveTo(-1.13, 0.34);
  shape.lineTo(1.24, 0.34);
  shape.lineTo(1.24, 2.27);
  shape.lineTo(0.60, 2.27);
  shape.closePath();
  const wallWidth = cutaway ? 3.84 : 6.68;
  const wall = mesh(root, new THREE.ExtrudeGeometry(shape, {depth: wallWidth, bevelEnabled: false}), concrete, -3.34);
  wall.rotation.y = Math.PI / 2;
  box(root, -3.34 + wallWidth / 2, 2.30, -0.91, wallWidth, 0.11, 0.74, chrome);
  for (const x of [-2.74, -1.71, -0.67, 0.37, 1.41, 2.44]) {
    if (x > -3.34 + wallWidth) break;
    const seam = box(root, x, 1.31, -0.26, 0.076, 2.59, 0.093, steel);
    seam.rotation.x = -0.73;
    box(root, x, 2.47, -0.56, 0.066, 0.30, 0.063, steel);
  }
  box(root, -3.34 + wallWidth / 2, 2.61, -0.56, wallWidth - 0.14, 0.041, 0.057, steel);
  for (const x of [-2.67, -1.72, -0.77]) {
    const outlet = box(root, x, 1.15, 0.04, 0.57, 0.68, 0.097, dark);
    outlet.rotation.x = -0.73;
    const flow = box(root, x, 0.93, 0.24, 0.49, 1.38, 0.025, water);
    flow.rotation.x = -0.73;
    box(root, x, 1.84, -0.43, 0.56, 0.07, 0.33, chrome);
  }
  for (const z of [1.60, 1.79, 1.99, 2.35, 2.61]) {
    for (const x of [-2.39, -1.42, -0.51, 0.55, 1.72, 2.63]) {
      box(root, x + Math.sin(z * 17) * 0.16, 0.68, z, 0.51, 0.012, 0.022, z > 2 ? cyan : glass);
    }
  }
  for (const z of [-2.58, -2.25, -1.94]) {
    for (const x of [-2.75, -1.60, -0.53, 0.43, 1.54, 2.47]) {
      box(root, x, 1.786, z, 0.62, 0.015, 0.020, glass);
    }
  }
  if (cutaway) {
    pipe(root, [[2.42, 1.55, -2.24], [2.42, 1.55, -1.31], [2.42, 0.89, -0.35], [2.42, 0.89, 0.91], [1.82, 0.89, 0.91]], 0.23, chrome);
    ring(root, 2.42, 1.55, -2.23, 0.235, 0.033, cyan);
    ring(root, 2.42, 0.89, 0.24, 0.237, 0.035, copper);
    box(root, 1.62, 0.66, 0.93, 0.70, 0.66, 0.75, navy);
  } else {
    pipe(root, [[2.42, 1.55, -2.20], [2.42, 1.55, -1.54]], 0.23, graphite);
    box(root, 2.20, 0.90, 1.15, 1.71, 0.96, 1.51, navy);
    box(root, 2.20, 1.42, 1.15, 1.80, 0.10, 1.64, chrome);
    for (const x of [1.67, 2.20, 2.73]) box(root, x, 1.05, 1.91, 0.33, 0.23, 0.044, glass);
  }
  return root;
}

function hydraulicTurbine(cutaway) {
  const root = group();
  skid(root, 5.7, 4.63);
  const radius = 0.84;
  const y = 1.22;
  const path = [];
  for (let step = 0; step <= (cutaway ? 8 : 13); step++) {
    const angle = step * Math.PI * 2 / 15;
    const winding = 1.07 - step * 0.027;
    path.push(new THREE.Vector3(Math.sin(angle) * winding, y, -Math.cos(angle) * winding));
  }
  path.unshift(new THREE.Vector3(-2.52, y, -1.07));
  const spiral = new THREE.CatmullRomCurve3(path);
  const tube = new THREE.TubeGeometry(spiral, 110, 0.39, 14, false);
  const points = tube.attributes.position;
  const vertex = new THREE.Vector3();
  for (let index = 0; index < points.count; index++) {
    const fraction = Math.floor(index / 15) / 110;
    const center = spiral.getPointAt(fraction);
    vertex.fromBufferAttribute(points, index).sub(center).multiplyScalar(1.25 - 0.69 * fraction).add(center);
    points.setXYZ(index, vertex.x, vertex.y, vertex.z);
  }
  tube.computeVertexNormals();
  mesh(root, tube, navy);
  ring(root, -2.51, y, -1.07, 0.49, 0.063, chrome, 'x');
  ring(root, -2.35, y, -1.07, 0.46, 0.031, cyan, 'x');
  cylinder(root, 0, 0.69, 0, 0.65, 0.79, 0.68, steel);
  cylinder(root, 0, 0.36, 0, 0.88, 0.88, 0.105, chrome);
  const cover = cylinder(root, 0, cutaway ? 2.50 : 1.52, 0, radius + 0.08, radius + 0.08, 0.19, steel);
  const coverGroup = group(root, 0, cover.position.y, 0);
  cover.position.y = 0;
  coverGroup.add(cover);
  for (let bolt = 0; bolt < 14; bolt++) {
    const angle = bolt * Math.PI / 7;
    cylinder(coverGroup, Math.cos(angle) * radius, 0.11, Math.sin(angle) * radius, 0.041, 0.041, 0.054, chrome, 'y', 6);
  }
  cylinder(root, 0, 2.23, 0, 0.146, 0.146, 1.59, chrome);
  cylinder(root, 0, 3.06, 0, 0.27, 0.27, 0.13, copper);
  if (cutaway) {
    const runner = group(root, 0, 1.25, 0);
    cylinder(runner, 0, 0.12, 0, 0.29, 0.39, 0.36, chrome);
    for (let index = 0; index < 12; index++) {
      const radial = group(runner);
      radial.rotation.y = index * Math.PI / 6;
      const blade = box(radial, 0, 0, 0.47, 0.16, 0.27, 0.43, copper);
      blade.rotation.y = -0.66;
      blade.rotation.z = 0.30;
    }
    ring(runner, 0, -0.16, 0, 0.66, 0.045, chrome, 'y');
    runner.userData.spin = {axis: 'y', speed: 1.18};
  }
  for (const x of [-1.12, 1.12]) {
    box(root, x, 0.59, 0.57, 0.21, 0.59, 0.49, graphite);
  }
  controlCabinet(root, 2.08, 0.31, -0.61, 0.80, 1.55, 0.76);
  return root;
}

function alternator(cutaway) {
  const root = group();
  skid(root, 6.79, 3.52);
  const y = 1.54;
  box(root, 0, 0.62, 0, 3.66, 0.58, 1.92, graphite);
  for (const x of [-1.35, 1.35]) {
    box(root, x, 0.51, 0, 0.33, 0.41, 2.13, navy);
  }
  cylinder(root, -0.14, y, 0, 0.15, 0.15, cutaway ? 6.00 : 4.70, chrome, 'x');
  if (cutaway) {
    lowerShell(root, 0.55, y, 0, 0.98, 2.28, navy, true);
    for (const edge of [-0.64, 1.78]) {
      ring(root, edge, y, 0, 0.94, 0.069, steel, 'x');
      ring(root, edge, y, 0, 0.82, 0.040, copper, 'x');
    }
    for (let index = 0; index < 16; index++) {
      const angle = index * Math.PI / 8;
      const winding = group(root, 0.55, y, 0);
      winding.rotation.x = angle;
      box(winding, 0, 0.87, 0, 2.24, 0.085, 0.12, index % 3 ? copper : bronze);
    }
    const rotor = group(root, -1.85, y, 0);
    cylinder(rotor, 0, 0, 0, 0.38, 0.38, 1.88, steel, 'x');
    for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2]) {
      const pole = group(rotor);
      pole.rotation.x = angle;
      box(pole, 0, 0.42, 0, 1.70, 0.17, 0.32, copper);
      box(pole, 0, 0.53, 0, 1.70, 0.054, 0.38, chrome);
    }
    rotor.userData.spin = {axis: 'x', speed: 1.35};
    bearing(root, 2.56, y, 0.50);
  } else {
    cylinder(root, 0, y, 0, 1.03, 1.03, 3.44, navy, 'x');
    for (const x of [-1.68, -1.46, 1.46, 1.68]) {
      ring(root, x, y, 0, 1.04, 0.051, chrome, 'x');
    }
    for (let index = 0; index < 16; index++) {
      const fin = group(root, 0, y, 0);
      fin.rotation.x = index * Math.PI / 8;
      box(fin, 0, 1.04, 0, 2.77, 0.12, 0.061, steel);
    }
    for (const x of [-1.84, 1.84]) {
      cylinder(root, x, y, 0, 0.83, 0.83, 0.28, graphite, 'x');
      bearing(root, x * 1.13, y, 0.45);
    }
    box(root, 0.47, 2.63, -0.02, 0.90, 0.25, 0.68, steel);
    box(root, 0.47, 2.775, -0.02, 0.95, 0.073, 0.75, chrome);
    box(root, 0.47, 2.65, 0.33, 0.29, 0.058, 0.031, cyan);
  }
  for (const z of [0.87, 1.00, 1.13]) {
    pipe(root, [[2.53, 0.48, z], [1.45, 0.48, z], [1.45, 0.79, z]], 0.043, copper);
  }
  return root;
}

export const generationModels = {
  gas: gasPlant,
  'gas-turbine': (cutaway = false) => turbine(cutaway, false),
  nuclear: reactor,
  'steam-turbine': (cutaway = false) => turbine(cutaway, true),
  solar: photovoltaicArray,
  'solar-inverter': (cutaway = false) => converter(cutaway, false),
  wind: windTurbine,
  'wind-converter': (cutaway = false) => converter(cutaway, true),
  hydro: dam,
  'water-turbine': hydraulicTurbine,
  alternator,
};

export const generationCutaways = [
  'gas-turbine', 'nuclear', 'steam-turbine', 'solar-inverter',
  'wind-converter', 'hydro', 'water-turbine', 'alternator',
];
