import * as THREE from 'three';
import { assemblyPart as part, setInspection } from './model-assembly.js';

const steel = material(0x767a77, 0.58);
const chrome = material(0xbbc0bc, 0.72, 0.32);
const navy = material(0x3c4442, 0.34);
const dark = material(0x252928, 0.21);
const graphite = material(0x464a46, 0.38);
const white = material(0xbec2b8, 0.22);
const concrete = material(0x85847a, 0.06, 0.85);
const copper = material(0x9e6543, 0.61, 0.36);
const bronze = material(0x765344, 0.45);
const cyan = material(0x89a8a7, 0.22, 0.37, 0x325450, 0.34);
const amber = material(0xc3985e, 0.29, 0.43, 0x7a4d1f, 0.22);
const glass = material(0x2b4948, 0.46, 0.22, 0x1e3530, 0.16);
const water = material(0x314b4b, 0.35, 0.22, 0x192b26, 0.18);
const siding = material(0x888d86, 0.39, 0.65);
const rib = material(0x6f756e, 0.46, 0.62);
const paintedPipe = material(0xb69c57, 0.24, 0.49);
const shadow = material(0x1f2422, 0.10, 0.74);

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
  box(building, 0, 1.15, 0, 5.05, 2.30, 1.68, siding);
  for (let x = -2.46; x < 2.50; x += 0.16) {
    box(building, x, 1.15, 0.85, 0.02, 2.25, 0.026, rib);
  }
  for (let z = -.76; z <= .77; z += 0.16) {
    for (const x of [-2.535, 2.535]) box(building, x, 1.15, z, 0.026, 2.25, 0.025, rib);
  }
  box(building, 0, 2.34, 0, 5.24, 0.17, 1.88, chrome);
  box(building, 0, 2.47, 0, 4.94, 0.09, 1.62, graphite);
  box(building, 0, 2.15, 0.871, 4.94, 0.047, 0.048, steel);
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
  const inlet = group(root);
  const regulator = group(root);
  const shutoff = group(root);
  pipe(inlet, [[-3.38,.60,2.11],[-2.41,.60,2.11],[-2.41,1.02,2.11],[.20,1.02,2.11]], .105, paintedPipe);
  pipe(regulator, [[.24,1.02,2.11],[1.82,1.02,2.11]], .105, paintedPipe);
  pipe(shutoff, [[1.82,1.02,2.11],[1.83,.60,2.11],[3.35,.60,2.11]], .105, paintedPipe);
  for (const [assembly,x] of [[inlet,-2.40],[regulator,.24],[shutoff,1.82]]) {
    box(assembly,x,.46,2.10,.29,.25,.32,dark);
    cylinder(assembly,x,1.02,2.11,.16,.16,.21,bronze,'x',12);
    if (assembly !== regulator) handwheel(assembly,x,1.28,2.11);
  }
  cylinder(regulator,.24,1.25,2.11,.12,.23,.18,navy);
  cylinder(regulator,.24,1.32,2.11,.24,.24,.057,chrome);
  cylinder(regulator,.24,1.45,2.11,.094,.104,.21,steel);
  pipe(vessels, [[.56,1.02,1.45],[.56,1.39,1.45],[.56,1.39,.79],[.56,.91,.79]], .074,copper);
  pipe(vessels, [[1.02,.82,0],[2.23,.82,0],[2.23,1.20,0],[2.23,1.20,-1.33]], .087,steel);
  controlCabinet(root, 2.54, 0.30, 0.40, 0.82, 1.72, 0.86);
  box(root, 1.26, 0.33, 0.55, 0.97, 0.11, 1.25, shadow);
  for (let index = 0; index < 6; index++) {
    const stripe = box(root, 0.70 + 0.17 * index, 0.395, 1.25, 0.085, 0.016, 0.27, amber);
    stripe.rotation.y = -0.41;
  }
  return setInspection(root, [
    part('Inlet piping', inlet, [-.8,.44,.32], .69),
    part('Filter separator', vessels, [-.22,.91,.31], .95, [-1.47,.95,.95]),
    part('Pressure regulator', regulator, [.16,.65,.75], .65, [.25,1.25,2.11]),
    part('Fuel shutoff valve', shutoff, [.84,.48,.24], .68, [1.82,1.20,2.11]),
  ]);
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

function airfoil(radius, width, turning = .54) {
  const vertices = [];
  const faces = [];
  const points = 18;
  const spans = 5;
  for (let span = 0; span <= spans; span += 1) {
    const t = span / spans;
    const chord = width * (1.67 - .39 * t);
    const twist = turning - .31 * t;
    for (let index = 0; index < points; index += 1) {
      const phase = index * 2 * Math.PI / points;
      const camber = (1 - Math.cos(phase)) / 2;
      const x = (camber - .5) * chord;
      const z = (.116 * Math.sin(phase) + .12 * Math.sin(Math.PI * camber)) * chord;
      vertices.push(x * Math.cos(twist) + z * Math.sin(twist) + .055 * t,
        radius * (.64 + .36 * t), z * Math.cos(twist) - x * Math.sin(twist));
      if (span === spans) continue;
      const start = span * points + index;
      const next = span * points + (index + 1) % points;
      faces.push(start, next, start + points, next, next + points, start + points);
    }
  }
  for (let index = 1; index < points - 1; index += 1) {
    faces.push(0, index + 1, index, spans * points, spans * points + index, spans * points + index + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(faces);
  geometry.computeVertexNormals();
  return geometry;
}

function shaftRotor(parent, x, y, z, radius, width, paint, bladeCount, fixed = false, showBladeDetails = false) {
  const rotor = group(parent, x, y, z);
  const wheel = group(rotor);
  if (fixed) ring(wheel, 0, 0, 0, radius * .96, .037, paint, 'x');
  else {
    cylinder(wheel, 0, 0, 0, radius * 0.48, radius * 0.48, width * 1.52, chrome, 'x');
    cylinder(wheel, 0, 0, 0, radius * 0.69, radius * 0.69, width, paint, 'x');
  }
  const bladeSet = group(rotor);
  const geometry = airfoil(radius, width, fixed ? -.50 : .62);
  const selectedBlade = showBladeDetails ? group(bladeSet) : undefined;
  for (let index = 0; index < bladeCount; index += 1) {
    if (showBladeDetails && index === 0) continue;
    const blade = mesh(bladeSet, geometry, paint);
    blade.rotation.x = index * Math.PI * 2 / bladeCount;
  }
  let detail;
  if (selectedBlade) {
    const foil = group(selectedBlade);
    const surface = mesh(foil, geometry, paint);
    const platform = box(selectedBlade, .016, radius * .645, 0, width * 1.53, .022, width * .49, chrome);
    const foot = group(selectedBlade);
    for (const [height, depth] of [[.60,.38],[.57,.29],[.54,.39]]) {
      box(foot,.016,radius*height,0,width*1.12,.023,width*depth,paint);
    }
    const coolant = pipe(foil, [[-.024,radius*.662,0],[-.044,radius*.928,0],[.047,radius*.947,0],[.057,radius*.735,0],[.102,radius*.747,0],[.116,radius*.914,0]],.006,cyan);
    const coating = mesh(foil, geometry, white);
    coating.scale.set(1.014,1.003,1.026);
    setInspection(foil,[part('Cooling circuit',coolant,[-.55,.32,.72],.16),part('Surface coating system',coating,[.48,.69,.54],.15)],{hidden:[coolant,coating],shell:[surface]});
    detail = { foil, platform, foot };
  }
  if (!fixed) rotor.userData.spin = { axis: 'x', speed: 2.2 };
  return { rotor, wheel, bladeSet, selectedBlade, detail };
}

function splitTurbineHousing(parent, top, x, y, radius, length, paint) {
  lowerShell(parent, x, y, 0, radius, length, paint, true);
  const outer = new THREE.CylinderGeometry(radius, radius, length, 48, 1, true, Math.PI, Math.PI);
  const inner = paint.clone();
  inner.side = THREE.DoubleSide;
  mesh(top, outer, inner, x, y, 0).rotation.z = -Math.PI / 2;
  for (const side of [-1, 1]) {
    box(top, x, y + .022, side * radius, length + .07, .09, .12, steel);
    for (let index = 0; index < 6; index += 1) {
      const xBolt = x - length / 2 + length * (index + .5) / 6;
      cylinder(top, xBolt, y + .081, side * radius, .033, .033, .044, chrome, 'y', 6);
    }
  }
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
  const housing = group(root);
  const supports = group(root);
  const shaft = group(supports);
  const bearings = group(supports);
  const admission = group(root);
  const compressor = group(root);
  const compressorStage = group(compressor);
  const combustion = group(root);
  const hotPath = group(root);
  const turbineWheels = group(hotPath);
  const turbineNozzles = group(hotPath);
  const shroud = group(hotPath);
  const hidden = [compressor, combustion, hotPath];
  for (const x of [-2.0, 2.0]) {
    box(root, x, 0.54, 0, 0.38, 0.48, 1.58, navy);
    box(root, x, 0.80, 0, 0.48, 0.08, 1.43, steel);
  }
  cylinder(shaft, 0, axisHeight, 0, .155, .155, 5.39, chrome, 'x');
  for (const x of [-2.20, 2.14]) bearing(bearings, x, axisHeight, .39);
  if (steam) {
    splitTurbineHousing(root, housing, -.97, axisHeight, .83, 1.61, steel);
    splitTurbineHousing(root, housing, .66, axisHeight, 1.13, 1.76, navy);
    pipe(admission, [[-1.60, 1.51, -.67], [-1.60, 3.08, -.67], [-2.86, 3.08, -.67]], .20, chrome);
    pipe(admission, [[1.19, 1.31, -.93], [1.19, .54, -1.14], [2.81, .54, -1.14]], .25, steel);
    for (const [x, radius, width] of [[-1.50,.59,.20],[-1.16,.68,.20],[-.78,.73,.22],[-.38,.79,.22],[.12,.86,.25],[.65,.96,.25],[1.30,1.08,.29]]) {
      shaftRotor(turbineWheels, x, axisHeight, 0, radius, width, x > 0 ? bronze : chrome, 19);
    }
  } else {
    splitTurbineHousing(root, housing, -1.08, axisHeight, .90, 1.74, steel);
    splitTurbineHousing(root, housing, 0, axisHeight, .79, .72, bronze);
    splitTurbineHousing(root, housing, 1.12, axisHeight, .92, 1.46, navy);
    const fuelFeed = group(root);
    pipe(fuelFeed, [[-.21, 2.21, -.26], [-.21, 2.88, -.26], [1.41, 2.88, -.26]], .083, copper);
    const inlet = group(compressor);
    ring(inlet, -2.17, axisHeight, 0, .73, .061, chrome, 'x');
    for (let index = 0; index < 7; index += 1) {
      const z = -.53 + index * .177;
      const span = 1.39 * Math.sqrt(1 - (z / .72) ** 2);
      box(inlet, -2.17, axisHeight, z, .032, span, .012, steel);
      box(inlet, -2.17, axisHeight + z, 0, .033, .012, span, steel);
    }
    const guide = shaftRotor(compressor, -1.95, axisHeight, 0, .80, .13, steel, 19, true).rotor;
    const compressorRows = [];
    for (const [x, radius, width] of [[-1.74,.82,.17],[-1.45,.74,.16],[-1.15,.66,.15],[-.85,.58,.14]]) {
      compressorRows.push(shaftRotor(compressorStage, x, axisHeight, 0, radius, width, chrome, 21));
    }
    const stage = compressorRows[1];
    const fixedRow = shaftRotor(compressorStage, -1.30, axisHeight, 0, .71, .12, steel, 18, true);
    setInspection(compressorStage, [
      part('Rotor blade', stage.bladeSet, [0,.63,.7], .40),
      part('Stator vane', fixedRow.rotor, [.2,.95,.1], .44),
      part('Rotor wheel', stage.wheel, [-.4,-.25,.8], .45),
    ]);
    setInspection(compressor, [
      part('Inlet air filter', inlet, [-1,.35,.15], .55),
      part('Variable inlet guide vanes', guide, [-.55,.3,.7], .52),
      part('Compressor stage', compressorStage, [.4,.7,.5], .51),
    ]);
    const nozzles = group(combustion);
    const liners = group(combustion);
    const transitions = group(combustion);
    for (let index = 0; index < 8; index += 1) {
      const angle = -.43 + index * Math.PI / 4;
      const y = axisHeight + Math.cos(angle) * .45;
      const z = Math.sin(angle) * .45;
      cylinder(nozzles, -.30, y, z, .076, .086, .17, chrome, 'x');
      ring(nozzles, -.35, y, z, .078, .02, bronze, 'x');
      cylinder(liners, -.016, y, z, .142, .131, .43, copper, 'x');
      ring(liners, -.143, y, z, .141, .020, steel, 'x');
      ring(liners, .115, y, z, .141, .018, bronze, 'x');
      cylinder(transitions, .255, y, z, .099, .133, .22, bronze, 'x');
    }
    setInspection(combustion, [
      part('Fuel nozzle', nozzles, [-.85,.35,.2], .42),
      part('Combustion liner', liners, [0,.65,.72], .49),
      part('Transition piece', transitions, [.85,.35,.2], .42),
    ]);
    const hotRows=[];
    for (const [x, radius, width] of [[.64,.61,.19],[1.04,.71,.2],[1.49,.82,.21]]) {
      hotRows.push(shaftRotor(turbineWheels, x, axisHeight, 0, radius, width, copper, 22, false, x === 1.04));
      shaftRotor(turbineNozzles, x - .17, axisHeight, 0, radius * .96, .105, steel, 17, true);
      ring(shroud, x, axisHeight, 0, radius * 1.034, .024, chrome, 'x');
    }
    const [, sample] = hotRows;
    const { foil, platform, foot } = sample.detail;
    setInspection(turbineWheels, [
      part('Airfoil',foil,[.25,.84,.41],.30),
      part('Blade platform',platform,[-.41,.46,.74],.27),
      part('Blade root',foot,[.63,-.15,.72],.27),
    ], { shell: [hotRows[0].rotor,hotRows[2].rotor,sample.wheel,...sample.bladeSet.children.filter((node)=>node!==sample.selectedBlade)] });
    setInspection(hotPath, [
      part('Fixed turbine nozzle vanes', turbineNozzles, [-.55,.75,.2], .6),
      part('Rotating turbine blade', turbineWheels, [.7,.25,.5], .61),
      part('Shroud segment', shroud, [.4,.85,.1], .53),
    ]);
  }
  const parts = steam ? [
    part('Steam admission', admission, [-.83,.46,.23], .82, [-1.68,2.55,-.45]),
    part('Steam-path stages', hotPath, [.21,.72,.64], 1.05, [.34,1.54,.12]),
    part('Rotor, bearings and seals', [supports, housing], [.8,.48,.2], .9, [2.22,1.56,.1]),
  ] : [
    part('Air inlet and compressor', compressor, [-.87,.38,.3], .88, [-1.43,1.57,.07]),
    part('Combustion section', combustion, [0,.85,.55], 1.04, [0,1.62,.04]),
    part('Hot-gas turbine stages', hotPath, [.70,.32,.55], .92, [1.16,1.60,.08]),
    part('Shaft and supports', [supports, housing], [.52,.82,-.23], 1.08, [2.34,1.55,.05]),
  ];
  if (!steam) setInspection(supports, [
    part('Shaft coupling', shaft, [.85,.4,.2], .72),
    part('Journal bearing', bearings, [-.3,.45,.74], .52),
    part('Outer casing', housing, [0,.94,.3], .71),
  ]);
  setInspection(root, parts, { hidden, shell: [housing] });
  if (cutaway) {
    housing.visible = false;
    for (const item of hidden) item.visible = true;
  }
  return root;
}

function reactor(cutaway) {
  const root = group();
  skid(root,6.48,5.50);
  const originX=-.45, originZ=-.30, radius=1.86;
  const enclosure=group(root);
  const vessel=group(root);
  const vesselShell=group(vessel);
  const fuel=group(root);
  const controls=group(root);
  const primary=group(root);
  const steam=group(root,.75,0,.09);
  cylinder(enclosure,originX,1.56,originZ,radius,radius,2.46,concrete);
  sphere(enclosure,originX,2.79,originZ,radius,concrete,true).scale.y=.79;
  for (const y of [.52,1.04,2.75,2.84]) cylinder(enclosure,originX,y,originZ,radius+.025,radius+.025,.047,steel);
  for (let i=0;i<16;i+=1) {
    const angle=i*Math.PI/8;
    box(enclosure,originX+Math.sin(angle)*radius,1.65,originZ+Math.cos(angle)*radius,.041,2.10,.046,steel).rotation.y=angle;
  }
  box(enclosure,originX,.87,originZ+radius,.62,1.09,.10,graphite);
  box(enclosure,originX,1.43,originZ+radius+.04,.64,.046,.062,cyan);
  cylinder(vesselShell,-1.17,1.50,.10,.58,.58,1.60,steel);
  sphere(vesselShell,-1.17,2.28,.10,.58,chrome,true).scale.y=.47;
  for (const y of [.91,2.17]) cylinder(vesselShell,-1.17,y,.10,.61,.61,.11,chrome);
  for (const x of [-1.40,-1.25,-1.10,-.95]) {
    for (const z of [-.13,.02,.17,.32]) cylinder(fuel,x,1.46,z,.049,.049,1.0,x < -1.15 ? bronze : copper);
  }
  for (const y of [1.05,1.43,1.85]) box(fuel,-1.17,y,.10,.60,.044,.56,steel);
  for (const x of [-1.39,-1.17,-.94]) {
    cylinder(controls,x,2.52,.10,.064,.064,.83,copper);
    cylinder(controls,x,2.90,.10,.092,.092,.21,steel);
  }
  pipe(primary,[[-.78,2.02,.14],[-.62,2.02,.95],[.48,2.02,.95],[.48,2.02,.23]],.101,copper);
  pipe(primary,[[.67,.94,.28],[.65,.94,1.03],[-.95,.94,1.03],[-.95,.94,.38]],.102,cyan);
  cylinder(primary,.04,.94,1.03,.19,.19,.28,steel,'x');
  cylinder(primary,.20,2.45,-.47,.16,.16,.94,steel);
  cylinder(steam,0,1.73,0,.48,.48,2.39,graphite);
  cylinder(steam,0,2.62,0,.56,.56,.66,chrome);
  sphere(steam,0,2.95,0,.56,steel,true).scale.y=.50;
  box(steam,0,1.59,.477,.37,1.38,.055,shadow);
  for (const x of [-.12,0,.12]) box(steam,x,1.60,.514,.045,1.22,.036,copper);
  pipe(steam,[[0,3.02,0],[0,3.60,0],[1.91,3.60,0],[1.91,1.37,0]],.093,chrome);
  box(root,2.20,.85,-.52,1.65,1.08,2.11,navy);
  box(root,2.20,1.42,-.52,1.77,.11,2.22,chrome);
  for (const x of [1.71,2.19,2.67]) box(root,x,1.09,.551,.34,.19,.034,glass);
  box(root,2.20,.56,.552,.93,.23,.04,shadow);
  setInspection(vessel,[part('Reactor pressure vessel',vesselShell,[.31,.59,.68],.44),part('Containment',enclosure,[-.33,.55,-.64],.49)]);
  setInspection(root,[
    part('Core assemblies',fuel,[-.54,.34,.73],.83,[-1.17,1.52,.11]),
    part('Reactivity control',controls,[-.39,.89,.20],.68,[-1.17,2.67,.12]),
    part('Primary circulation and pressure',primary,[.19,.35,.88],.72,[.03,.95,1.04]),
    part('Vessel and containment',[vessel,enclosure],[.17,.81,-.45],.72,[-.51,2.15,-.26]),
    part('Steam generator',steam,[.85,.36,.28],.76,[.75,2.43,.18]),
  ],{ hidden:[vessel,fuel,controls,primary,steam],shell:[enclosure,vesselShell] });
  if (cutaway) {
    enclosure.visible=false;
    for (const item of root.userData.inspectionHidden) item.visible=true;
  }
  return root;
}

function photovoltaicArray() {
  const root = group();
  skid(root, 6.92, 5.57);
  const panels=group(root);
  const wiring=group(root);
  const mounting=group(root);
  const panelWidth = 1.87;
  const panelDepth = 1.03;
  const panelLines = new THREE.LineBasicMaterial({color: 0x6c9ac2});
  const panelFaces = material(0x1b4f83, 0.33, 0.23, 0x082955, 0.48);
  for (const z of [-1.62, 0.10, 1.82]) {
    for (const x of [-2.06, 0, 2.06]) {
      for (const offset of [-0.62, 0.62]) {
        box(mounting, x + offset, 0.56, z, 0.078, 0.50, 0.10, steel);
        box(mounting, x + offset, 0.33, z, 0.23, 0.07, 0.27, concrete);
      }
      const module = group(panels, x, 0.83, z);
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
      box(wiring,x,.712,z-.28,.29,.089,.18,graphite);
      pipe(wiring,[[x,.68,z-.28],[x,.44,z-.24],[x+.11,.39,z]],.025,dark);
    }
    pipe(wiring, [[-3.15, 0.39, z], [3.22, 0.39, z]], 0.034, copper);
  }
  pipe(wiring, [[3.22, 0.39, -1.62], [3.22, 0.39, 2.42], [2.04, 0.39, 2.42]], 0.047, amber);
  return setInspection(root,[
    part('PV module',panels,[-.18,.90,.32],.81,[.02,.87,1.6]),
    part('Junction box and cable',wiring,[.58,.32,.64],.69,[2.55,.45,1.78]),
    part('Module mounting',mounting,[-.59,.40,-.57],.66,[-1.99,.53,1.78]),
  ]);
}

function converter(cutaway,wind) {
  const root=group();
  skid(root,5.3,3.45);
  const height=wind?2.78:2.19;
  const width=wind?1.42:1.27;
  const separation=width+.085;
  const shell=group(root);
  for (const x of [-separation,0,separation]) controlCabinet(shell,x,.31,0,width,height,1.36,wind?8:6);
  const rectifier=group(root);
  const dcLink=group(root);
  const bridge=group(root);
  const filter=group(root);
  const controller=group(root);
  const wiring=group(root);
  const tray=(target,y)=>{
    box(target,0,y,.16,width-.20,.074,.86,steel);
    box(target,0,y+.061,.19,width-.28,.05,.74,glass);
  };
  tray(rectifier,.69);
  tray(dcLink,1.23);
  tray(bridge,1.67);
  for (const x of [-.32,0,.32]) {
    box(rectifier,x,.86,.27,.22,.24,.21,graphite);
    for (const z of [.07,.45]) box(rectifier,x,.80,z,.117,.049,.092,copper);
    cylinder(dcLink,x,1.47,.20,.102,.102,.37,navy);
    cylinder(dcLink,x,1.67,.20,.094,.094,.04,chrome);
    box(bridge,x,1.83,.20,.19,.18,.29,graphite);
    for (const z of [.035,.37]) box(bridge,x,1.82,z,.11,.06,.07,copper);
  }
  box(filter,separation,.89,.29,width-.26,.107,.76,steel);
  for (const x of [-.32,0,.32]) {
    cylinder(filter,separation+x,1.08,.27,.118,.118,.27,copper);
    cylinder(filter,separation+x,1.23,.27,.105,.105,.06,steel);
  }
  box(controller,separation,1.69,-.23,width-.26,.55,.07,glass);
  for (const x of [-.25,.08,.35]) box(controller,separation+x,1.72,-.16,.12,.13,.064,shadow);
  for (const z of [1.10,1.23,1.36]) {
    pipe(wiring,[[-2.57,.47,z],[-separation,.47,z],[-separation,.47,.72]],.043,copper);
    pipe(wiring,[[separation,.47,.72],[separation,.47,z],[2.57,.47,z]],.041,wind?steel:cyan);
  }
  setInspection(root,[
    part(wind?'Machine-side rectifier':'DC input and protection',rectifier,[-.71,.23,.60],.57,[-.27,.86,.20]),
    part(wind?'Shared DC link':'DC-link assembly',dcLink,[-.39,.45,.72],.58,[0,1.46,.27]),
    part(wind?'Grid-side inverter':'Inverter bridge',bridge,[.04,.71,.61],.61,[.22,1.84,.22]),
    part('AC output filter',filter,[.87,.20,.37],.57,[separation,1.12,.26]),
    part(wind?'Control and feedback':'Controller board',controller,[.55,.70,.35],.59,[separation,1.71,-.16]),
  ],{ hidden:[rectifier,dcLink,bridge,filter,controller],shell:[shell] });
  if (cutaway) {
    shell.visible=false;
    for (const node of root.userData.inspectionHidden) node.visible=true;
  }
  return root;
}

function windTurbine() {
  const root = group();
  skid(root, 4.83, 4.76);
  const tower=group(root);
  const nacelle=group(tower);
  const generator=group(root);
  const z = -0.25;
  const hubHeight = 4.66;
  cylinder(tower, 0, 0.41, z, 0.75, 0.84, 0.27, concrete);
  cylinder(tower, 0, 2.45, z, 0.18, 0.37, 3.98, white);
  for (const [y, radius] of [[0.52, 0.376], [1.60, 0.318], [3.02, 0.251], [4.36, 0.195]]) {
    ring(tower, 0, y, z, radius, 0.021, steel, 'y');
  }
  box(tower, 0, 0.89, z + 0.35, 0.21, 0.55, 0.076, graphite);
  cylinder(tower, 0, 4.46, z, 0.26, 0.26, 0.12, steel);
  box(nacelle, 0, hubHeight, z, 0.59, 0.49, 1.02, white);
  box(nacelle, 0, hubHeight + 0.25, z - 0.10, 0.39, 0.08, 0.68, chrome);
  box(nacelle, 0, hubHeight + 0.31, z - 0.36, 0.07, 0.13, 0.07, amber);
  box(nacelle, 0.296, hubHeight, z - 0.13, 0.033, 0.11, 0.37, navy);
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
  cylinder(generator,0,hubHeight,z+.18,.21,.41,.35,steel,'z');
  for (const plane of [-.10,.18,.39]) ring(generator,0,hubHeight,z+plane,.24,.026,copper);
  for (let index=0;index<14;index+=1) {
    const angle=index*Math.PI/7;
    box(generator,.227*Math.sin(angle),hubHeight+.227*Math.cos(angle),z+.19,.06,.07,.41,bronze).rotation.z=-angle;
  }
  return setInspection(root,[
    part('Blade and hub assembly',rotor,[-.52,.19,.82],.85,[0,hubHeight,z+.72]),
    part('Direct-drive generator',generator,[.77,.48,.33],.73,[0,hubHeight,z+.19]),
    part('Nacelle and tower',tower,[.34,.28,-.70],.59,[0,hubHeight-.31,z-.18]),
  ],{ hidden:[generator],shell:[nacelle] });
}

function dam(cutaway) {
  const root = group();
  skid(root, 6.90, 5.55);
  box(root, 0, 0.47, 1.67, 6.74, 0.31, 2.04, concrete);
  box(root, 0, 1.04, -1.74, 6.74, 1.48, 1.93, water);
  box(root, 0, 0.64, 2.07, 6.68, 0.060, 1.24, water);
  const structure=group(root);
  const intake=group(root);
  const penstock=group(root);
  const shape = new THREE.Shape();
  shape.moveTo(-1.13, 0.34);
  shape.lineTo(1.24, 0.34);
  shape.lineTo(1.24, 2.27);
  shape.lineTo(0.60, 2.27);
  shape.closePath();
  const wallWidth = cutaway ? 3.84 : 6.68;
  const wall = mesh(structure, new THREE.ExtrudeGeometry(shape, {depth: wallWidth, bevelEnabled: false}), concrete, -3.34);
  wall.rotation.y = Math.PI / 2;
  box(structure, -3.34 + wallWidth / 2, 2.30, -0.91, wallWidth, 0.11, 0.74, chrome);
  for (const x of [-2.74, -1.71, -0.67, 0.37, 1.41, 2.44]) {
    if (x > -3.34 + wallWidth) break;
    const seam = box(structure, x, 1.31, -0.26, 0.076, 2.59, 0.093, steel);
    seam.rotation.x = -0.73;
    box(structure, x, 2.47, -0.56, 0.066, 0.30, 0.063, steel);
  }
  box(structure, -3.34 + wallWidth / 2, 2.61, -0.56, wallWidth - 0.14, 0.041, 0.057, steel);
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
  pipe(penstock,[[2.42,1.55,-2.24],[2.42,1.55,-1.31],[2.42,.89,-.35],[2.42,.89,.91],[1.82,.89,.91]],.23,chrome);
  ring(penstock,2.42,.89,.24,.237,.035,copper);
  ring(intake,2.42,1.55,-2.23,.235,.033,cyan);
  pipe(intake,[[2.42,1.55,-2.20],[2.42,1.55,-1.54]],.23,graphite);
  for (let i=0;i<7;i+=1) box(intake,2.22+i*.065,1.55,-2.282,.018,.35,.042,steel);
  if (cutaway) {
    box(root, 1.62, 0.66, 0.93, 0.70, 0.66, 0.75, navy);
  } else {
    box(root, 2.20, 0.90, 1.15, 1.71, 0.96, 1.51, navy);
    box(root, 2.20, 1.42, 1.15, 1.80, 0.10, 1.64, chrome);
    for (const x of [1.67, 2.20, 2.73]) box(root, x, 1.05, 1.91, 0.33, 0.23, 0.044, glass);
  }
  setInspection(root,[
    part('Dam and reservoir',structure,[-.27,.54,-.67],.58,[.1,1.67,-.65]),
    part('Intake structure',intake,[.74,.64,-.13],.56,[2.41,1.55,-2.15]),
    part('Penstock',penstock,[.46,.62,.51],.57,[2.40,1.17,-.17]),
  ],{ hidden:[penstock] });
  if (cutaway) penstock.visible=true;
  return root;
}

function hydraulicTurbine(cutaway) {
  const root = group();
  skid(root, 5.7, 4.63);
  const admission=group(root);
  const discharge=group(root);
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
  mesh(admission, tube, navy);
  ring(admission, -2.51, y, -1.07, 0.49, 0.063, chrome, 'x');
  ring(admission, -2.35, y, -1.07, 0.46, 0.031, cyan, 'x');
  cylinder(discharge, 0, 0.69, 0, 0.65, 0.79, 0.68, steel);
  cylinder(discharge, 0, 0.36, 0, 0.88, 0.88, 0.105, chrome);
  const cover = cylinder(root, 0, cutaway ? 2.50 : 1.52, 0, radius + 0.08, radius + 0.08, 0.19, steel);
  const coverGroup = group(root, 0, cover.position.y, 0);
  cover.position.y = 0;
  coverGroup.add(cover);
  for (let bolt = 0; bolt < 14; bolt++) {
    const angle = bolt * Math.PI / 7;
    cylinder(coverGroup, Math.cos(angle) * radius, 0.11, Math.sin(angle) * radius, 0.041, 0.041, 0.054, chrome, 'y', 6);
  }
  cylinder(discharge, 0, 2.23, 0, 0.146, 0.146, 1.59, chrome);
  cylinder(discharge, 0, 3.06, 0, 0.27, 0.27, 0.13, copper);
  const runner = group(root, 0, 1.25, 0);
  {
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
  setInspection(root,[
    part('Water admission',admission,[-.67,.37,.53],.72,[-1.40,1.22,-.87]),
    part('Runner',runner,[.07,.85,.44],.67,[0,1.25,.06]),
    part('Shaft and discharge',[discharge,coverGroup],[.67,.54,-.14],.64,[0,2.24,.06]),
  ],{ hidden:[runner],shell:[coverGroup] });
  if (cutaway) runner.visible=true;
  return root;
}

function alternator(cutaway) {
  const root = group();
  skid(root, 6.79, 3.52);
  const y = 1.54;
  box(root, 0, .62, 0, 3.66, .58, 1.92, graphite);
  for (const x of [-1.35, 1.35]) box(root, x, .51, 0, .33, .41, 2.13, navy);
  const rotor = group(root, 0, y, 0);
  const rotorBody = group(rotor);
  const field = group(rotor);
  cylinder(rotorBody, 0, 0, 0, .38, .38, 2.43, steel, 'x');
  for (const x of [-1.14, 1.14]) ring(rotorBody, x, 0, 0, .39, .032, chrome, 'x');
  for (const angle of [0,Math.PI/2,Math.PI,Math.PI*3/2]) {
    const pole = group(field);
    pole.rotation.x = angle;
    box(pole, 0, .40, 0, 2.17, .11, .30, bronze);
    for (let i = 0; i < 15; i += 1) box(pole, -.96 + i * .136, .47, 0, .11, .087, .35, copper);
    box(pole, 0, .54, 0, 2.17, .048, .38, chrome);
  }
  rotor.userData.spin = { axis: 'x', speed: 1.35 };
  setInspection(rotor, [part('Rotor body', rotorBody, [-.8,.27,.42], .59), part('Field coil', field, [.18,.74,.51], .65)]);
  const stator = group(root);
  const statorCore = group(stator);
  const statorBars = group(stator);
  for (const edge of [-1.49, 1.49]) {
    ring(statorCore, edge, y, 0, .96, .082, steel, 'x');
    ring(statorBars, edge, y, 0, .81, .038, copper, 'x');
  }
  for (let index = 0; index < 24; index += 1) {
    const angle = index * Math.PI / 12;
    const wind = group(statorBars, 0, y, 0);
    wind.rotation.x = angle;
    box(wind, 0, .846, 0, 2.92, .071, .096, index % 3 ? copper : bronze);
    const lamination = group(statorCore, 0, y, 0);
    lamination.rotation.x = angle;
    box(lamination, 0, .945, 0, 2.88, .115, .080, steel);
  }
  setInspection(stator, [part('Stator bar', statorBars, [.1,.3,.83], .54), part('Laminated stator core', statorCore, [.25,.87,-.16], .56)]);
  const excitation = group(root);
  const fieldSupply = group(excitation);
  const collector = group(excitation);
  box(fieldSupply, -1.83, .69, -.86, .66, .72, .65, navy);
  box(fieldSupply, -1.83, .86, -.522, .43, .15, .042, cyan);
  pipe(fieldSupply, [[-1.82,1.05,-.86],[-2.18,1.16,-.86],[-2.24,1.38,0]], .031, bronze);
  for (const x of [-2.30,-2.19]) ring(collector, x, y, 0, .20, .047, copper, 'x');
  setInspection(excitation, [part('Field supply', fieldSupply, [-.4,.2,.9], .41), part('Collector ring', collector, [-.92,.25,.14], .43)]);
  const support = group(root);
  const coupling = group(support);
  const output = group(support);
  cylinder(coupling, -.14, y, 0, .15, .15, 4.70, chrome, 'x');
  const housing = group(root);
  splitTurbineHousing(root, housing, 0, y, 1.03, 3.44, navy);
  for (const x of [-1.68,-1.46,1.46,1.68]) ring(housing, x, y, 0, 1.04, .045, chrome, 'x');
  for (let index = 0; index < 16; index += 1) {
    const fin = group(housing, 0, y, 0);
    fin.rotation.x = index * Math.PI / 8;
    box(fin, 0, 1.04, 0, 2.77, .12, .061, steel);
  }
  for (const x of [-1.84,1.84]) {
    cylinder(housing, x, y, 0, .83, .83, .28, graphite, 'x');
    bearing(coupling, x * 1.13, y, .45);
  }
  box(output, .47, 2.63, -.02, .90, .25, .68, steel);
  box(output, .47, 2.775, -.02, .95, .073, .75, chrome);
  box(output, .47, 2.65, .33, .29, .058, .031, cyan);
  for (const z of [.87,1,1.13]) pipe(output, [[2.53,.48,z],[1.45,.48,z],[1.45,.79,z]], .043, copper);
  setInspection(support, [part('Bearing', coupling, [-.45,.12,.64], .47), part('Output terminal', output, [.44,.49,.36], .54)]);
  setInspection(root, [
    part('Rotor and field', rotor, [-.84,.46,.45], 1.2, [0,1.54,0]),
    part('Stator assembly', stator, [.24,.76,.42], .96, [0,1.54,.22]),
    part('Excitation system', excitation, [-.65,.32,.82], .57, [-1.90,1.02,-.63]),
    part('Support and output', [support,housing], [.85,.58,-.15], .88, [2.02,1.65,.2]),
  ], { hidden: [rotor,stator], shell: [housing] });
  if (cutaway) {
    rotor.visible = true;
    stator.visible = true;
    housing.visible = false;
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
