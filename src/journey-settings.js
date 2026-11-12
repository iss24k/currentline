import * as THREE from 'three';
import { generation } from './route.js';

const generationStops = [-6, 11, 23];
const worldStops = {
  'step-up': [43, -.1], lines: [69, .3], substation: [93, -.7],
  intake: [117, .1], 'site-transformer': [129, 0], transfer: [141, 0],
  generator: [131, -11], battery: [145, -9], ups: [153, .2],
  'floor-pdu': [165, .2], busway: [176, .1], 'rack-pdu': [189, .1],
  cord: [201, .1], psu: [214, .1], vrm: [227, .1], chip: [240, .1], heat: [253, .1],
};

export function worldPosition(id, source) {
  if (worldStops[id]) return worldStops[id];
  const index = generation[source].stops.indexOf(id);
  return [generationStops[index], index === 0 && source === 'hydro' ? -.65 : .2];
}

export function environmentFor(id) {
  if (id === 'gas') return 'pipeline-station';
  if (id === 'nuclear') return 'nuclear-station';
  if (id === 'solar' || id === 'solar-inverter') return 'solar-farm';
  if (id === 'wind' || id === 'wind-converter') return 'wind-farm';
  if (id === 'hydro') return 'reservoir';
  if (id === 'water-turbine') return 'hydro-powerhouse';
  if (['gas-turbine', 'steam-turbine', 'alternator'].includes(id)) return 'turbine-hall';
  if (id === 'step-up') return 'plant-switchyard';
  if (id === 'lines') return 'transmission-corridor';
  if (id === 'substation') return 'utility-substation';
  if (['intake', 'site-transformer', 'generator'].includes(id)) return 'data-center-yard';
  if (['transfer', 'ups', 'battery', 'floor-pdu', 'busway'].includes(id)) return 'electrical-room';
  if (['rack-pdu', 'cord'].includes(id)) return 'server-aisle';
  return 'server-interior';
}

const interiors = new Set(['turbine-hall', 'hydro-powerhouse', 'electrical-room', 'server-aisle', 'server-interior']);
export const isInterior = (setting) => interiors.has(setting);

function randomGenerator(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function finish(color, metalness = .12, roughness = .78, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
}

const paint = {
  steel: finish(0x62696a, .57, .5),
  bracing: finish(0x373d40, .55, .57),
  siding: finish(0x77817f, .36, .65),
  seal: finish(0x242d31, .18, .61),
  pane: finish(0x637b8b, .46, .24),
  beige: finish(0x81807a, .11, .86),
  dark: finish(0x1e2829, .37, .58),
  copper: finish(0x9c6744, .54, .48),
  yellow: finish(0x9c763d, .14, .64),
  road: finish(0x343c39, .03, .94),
  lane: finish(0xa49169, .03, .8),
  wall: finish(0x6c716b, .12, .7),
  gravel: finish(0x696b61, .05, .95),
  glass: finish(0x173653, .41, .28),
  light: new THREE.MeshBasicMaterial({ color: 0xddeef5, toneMapped: false }),
  green: new THREE.MeshBasicMaterial({ color: 0x86baa2 }),
  trees: finish(0x3e5040, .0, .94),
  trunks: finish(0x4b473b, .0, .92),
  water: finish(0x376a7a, .45, .28, { envMapIntensity: .72 }),
};

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitTube = new THREE.CylinderGeometry(1, 1, 1, 14);
const poleVector = new THREE.Vector3(0, 1, 0);

function block(group, material, x, y, z, w, h, d) {
  const mesh = new THREE.Mesh(unitBox, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  mesh.receiveShadow = material === paint.road || material === paint.gravel;
  group.add(mesh);
  return mesh;
}

function cylinder(group, material, x, y, z, r0, r1, height, rotation = 0) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, height, 22), material);
  mesh.position.set(x, y, z);
  mesh.rotation.z = rotation;
  group.add(mesh);
  return mesh;
}

function beam(group, material, start, end, radius, round = false) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const span = b.clone().sub(a);
  const mesh = new THREE.Mesh(round ? unitTube : unitBox, material);
  mesh.position.copy(a).lerp(b, .5);
  mesh.scale.set(radius, span.length(), radius);
  mesh.quaternion.setFromUnitVectors(poleVector, span.normalize());
  group.add(mesh);
  return mesh;
}

function terrainTexture() {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  const rng = randomGenerator(2234);
  for (let y = 0; y < size; y++) {
    const v = y * Math.PI * 2 / size;
    for (let x = 0; x < size; x++) {
      const u = x * Math.PI * 2 / size;
      const ridges = Math.sin(u * 3 + Math.sin(v * 3)) * 11 + Math.sin(v * 5 - u * 6) * 6;
      const grain = (rng() - .5) * 32;
      const value = 95 + ridges + grain;
      data.set([value * .94, value * 1.04, value * .82, 255], (y * size + x) * 4);
    }
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(55, 22);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function addTerrain(scene) {
  const texture = terrainTexture();
  const material = finish(0xddd8c0, .02, .98, { map: texture, envMapIntensity: .16 });
  const terrain = new THREE.Mesh(new THREE.PlaneGeometry(480, 220), material);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.set(106, -.092, -23);
  terrain.receiveShadow = true;
  scene.add(terrain);
  const geometry = new THREE.PlaneGeometry(420, 95, 76, 26);
  geometry.rotateX(-Math.PI / 2);
  const vertices = geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i);
    const z = vertices.getZ(i);
    const swell = Math.pow(Math.sin(Math.PI * (z + 47.5) / 95), 1.2);
    const hill = 4.4 + Math.sin(x * .043 + z * .08) * 3.5 + Math.sin(x * .107 - z * .051) * 2.4;
    vertices.setY(i, -.08 + swell * (hill + 2));
  }
  geometry.computeVertexNormals();
  const hills = new THREE.Mesh(geometry, finish(0x53604c, .02, .98));
  hills.position.set(104, 0, -71);
  scene.add(hills);
}

function createSky(scene) {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { interior: { value: 0 } },
    vertexShader: `
      varying vec3 direction;
      void main() {
        direction = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float interior;
      varying vec3 direction;
      float cloud(vec2 p) {
        return sin(p.x + sin(p.y*.62))*.40 + sin(p.x*2.3 - p.y*1.8 + sin(p.y*2.2))*.24
          + sin(p.x*4.1 + p.y*3.8)*.10 + sin(p.x*7.9 - p.y*6.2)*.045;
      }
      void main() {
        vec3 dir = normalize(direction);
        float altitude = max(0., dir.y);
        vec3 horizon = vec3(.57, .62, .64);
        vec3 zenith = vec3(.22, .37, .48);
        float sun = pow(max(0., dot(dir, normalize(vec3(-.73, .23, -.51)))), 13.);
        vec3 color = mix(horizon, zenith, pow(altitude, .52));
        float haze = cloud(vec2(atan(dir.z, dir.x)*9., dir.y*18.)) * .29;
        color += vec3(.15, .12, .08) * sun + haze * smoothstep(0., .16, altitude);
        vec3 room = mix(vec3(.17, .21, .23), vec3(.10, .13, .15), altitude);
        gl_FragColor = vec4(mix(color, room, interior), 1.);
        #include <colorspace_fragment>
      }
    `,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(140, 36, 22), material);
  sky.renderOrder = -4;
  sky.frustumCulled = false;
  scene.add(sky);
  return sky;
}

function foliage(group, start, end, near, far, count, seed) {
  const rng = randomGenerator(seed);
  const crown = new THREE.IcosahedronGeometry(1, 2);
  const branchCount = 5;
  const branches = new THREE.InstancedMesh(crown, paint.trees, count * branchCount);
  const trunks = new THREE.InstancedMesh(unitTube, paint.trunks, count);
  const matrix = new THREE.Matrix4();
  const rotation = new THREE.Quaternion();
  const point = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const color = new THREE.Color();
  for (let index = 0; index < count; index++) {
    const x = start + rng() * (end - start);
    const z = near + rng() * (far - near);
    const height = 1.4 + rng() * 4.4;
    point.set(x, height * .26, z);
    matrix.compose(point, rotation, scale.set(.085, height * .52, .085));
    trunks.setMatrixAt(index, matrix);
    const canopy = [[0, .71, 0, .25, .27], [.17, .65, .06, .14, .22], [-.18, .66, -.03, .15, .22],
      [.04, .88, -.05, .15, .22], [-.02, .68, .15, .16, .21]];
    for (const [level, [dx, dy, dz, width, depth]] of canopy.entries()) {
      const lean = .90 + rng() * .20;
      point.set(x + height * dx * lean, height * dy, z + height * dz);
      scale.set(height * width, height * depth, height * width * (1.04 + rng() * .22));
      matrix.compose(point, rotation, scale);
      branches.setMatrixAt(index * branchCount + level, matrix);
      color.setHSL(.20 + rng() * .10, .14 + rng() * .17, .41 + rng() * .23);
      branches.setColorAt(index * branchCount + level, color);
    }
  }
  group.add(trunks, branches);
}

function pad(group, x, z, width, depth, material) {
  block(group, material, x, -.028, z, width, .054, depth);
}

function road(group, start, end, z, width) {
  pad(group, (start + end) / 2, z, end - start, width, paint.road);
  for (let x = start + 1; x < end - 1; x += 3.6) block(group, paint.lane, x, .002, z, 1.6, .004, .04);
}

function fence(group, start, end, z, y = 1.75) {
  for (let x = start; x <= end; x += 2.6) {
    block(group, paint.steel, x, y / 2, z, .064, y, .064);
    block(group, paint.beige, x, .11, z, .21, .22, .19);
  }
  for (const edge of [.16, y - .03]) block(group, paint.steel, (start + end) / 2, edge, z, end - start, .045, .04);
  const positions = [];
  const height = y - .22;
  for (let x = start; x < end; x += .15) {
    const far = Math.min(end, x + height);
    const close = Math.max(start, x - height);
    positions.push(x, .19, z, far, .19 + far - x, z);
    positions.push(x, .19, z, close, .19 + x - close, z);
    if (far < x + height) positions.push(start, .19 + end - x, z, Math.min(end, start + height - (end - x)), y - .03, z);
  }
  const wire = new THREE.BufferGeometry();
  wire.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  group.add(new THREE.LineSegments(wire, new THREE.LineBasicMaterial({ color: 0x686d66, transparent: true, opacity: .4 })));
}

function building(group, x, z, w, h, depth, walls = paint.siding) {
  block(group, walls, x, h * .5, z, w, h, depth);
  const front = z + depth * .5;
  block(group, paint.bracing, x, h + .105, z, w + .37, .21, depth + .37);
  block(group, paint.seal, x, .28, front, w, .56, .1);
  for (let offset = -w / 2 + .26; offset < w / 2; offset += .46) {
    block(group, paint.steel, x + offset, h * .48, front + .024, .033, h * .89, .045);
  }
  for (let offset = -w / 2 + 2; offset < w / 2 - 1; offset += 4.6) {
    const bx = x + offset;
    block(group, paint.bracing, bx, h * .71, front + .046, 2.5, .99, .09);
    block(group, paint.pane, bx, h * .71, front + .095, 2.29, .8, .026);
    block(group, paint.steel, bx, h * .71, front + .112, .046, .78, .024);
  }
}

function lampPost(group, x, z, height = 5.9) {
  cylinder(group, paint.steel, x, height / 2, z, .039, .075, height);
  beam(group, paint.steel, [x, height - .20, z], [x, height, z + .65], .048, true);
  block(group, paint.bracing, x, height, z + .68, .21, .085, .35);
  block(group, paint.light, x, height - .048, z + .69, .16, .009, .28);
}

function pipeRack(group, start, end, z, height, material = paint.steel) {
  const length = end - start;
  cylinder(group, material, (start + end) / 2, height, z, .13, .13, length, Math.PI / 2);
  for (let x = start + .6; x < end; x += 3.25) {
    block(group, paint.bracing, x, height / 2 - .05, z, .125, height - .10, .15);
    block(group, paint.beige, x, .10, z, .29, .20, .33);
    cylinder(group, paint.bracing, x, height, z, .169, .169, .077, Math.PI / 2);
  }
}

function fuelStation(group) {
  pad(group, -10, .3, 26, 13, paint.gravel);
  road(group, -29, 1, 7.8, 3.8);
  fence(group, -26, .0, -6.6, 1.52);
  for (const x of [-21, -13, -.6]) lampPost(group, x, -6.9, 5.1);
  for (const x of [-16.5, -12.75]) {
    cylinder(group, paint.siding, x, 1.48, -9.6, 1.47, 1.48, 2.95);
    const top = new THREE.Mesh(new THREE.SphereGeometry(1.48, 24, 11, 0, Math.PI * 2, 0, Math.PI / 2), paint.steel);
    top.position.set(x, 2.95, -9.6);
    top.scale.y = .26;
    group.add(top);
    cylinder(group, paint.bracing, x, .24, -9.6, 1.54, 1.54, .46);
  }
  pipeRack(group, -23, -9.38, 2.35, .61, paint.yellow);
  pipeRack(group, -25, -.1, -4.2, .8, paint.yellow);
  pipeRack(group, -24, -1, -3.73, 1.18, paint.steel);
  foliage(group, -32, 2, -18, -26, 35, 121);
}

function turbineHall(group, start, end, floorMaterial, hydro = false) {
  const mid = (start + end) * .5;
  const width = end - start;
  const back = -6.8;
  const height = hydro ? 5.4 : 6.8;
  pad(group, mid, .05, width, 13.8, floorMaterial);
  block(group, hydro ? paint.beige : paint.wall, mid, height / 2, back, width, height, .28);
  for (let x = start + .8; x < end; x += 4.05) {
    block(group, paint.bracing, x, height / 2, back + .3, .21, height, .37);
    block(group, paint.seal, x + 1.55, height - 1.86, back + .17, 2.77, 1.13, .09);
    for (const off of [-.85, 0, .85]) {
      block(group, paint.pane, x + 1.55 + off, height - 1.86, back + .227, .76, .94, .025);
    }
    block(group, paint.bracing, x, height - .04, -3.7, .15, .25, 6.12);
    block(group, paint.light, x + 1.6, height - .43, -4.0, 1.57, .045, .135);
    block(group, paint.yellow, x, .005, 3.0, 2.25, .012, .04);
  }
  block(group, paint.yellow, mid, height - .84, back + .61, width, .24, .19);
  block(group, paint.bracing, mid, height - .48, -2.4, width * .75, .19, .14);
  const trolley = mid + width * .21;
  block(group, paint.yellow, trolley, height - .65, -3.98, .69, .32, 3.3);
  beam(group, paint.steel, [trolley, height - .79, -3.2], [trolley, height - 2.0, -3.2], .021, true);
  block(group, paint.dark, trolley, height - 2.02, -3.2, .17, .18, .15);
  pipeRack(group, start + .4, end - .4, back + .58, .48, paint.steel);
}

function solarFarm(group) {
  const panel = new THREE.InstancedMesh(unitBox, paint.glass, 55);
  const edge = new THREE.InstancedMesh(unitBox, paint.steel, 55);
  const foot = new THREE.InstancedMesh(unitBox, paint.bracing, 55);
  const matrix = new THREE.Matrix4();
  const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), .36);
  const upright = new THREE.Quaternion();
  let i = 0;
  for (let row = 0; row < 5; row++) {
    for (let bay = 0; bay < 11; bay++) {
      const x = -20 + bay * 3.8;
      const z = -6.1 - row * 3.3;
      matrix.compose(new THREE.Vector3(x, 1.02, z), tilt, new THREE.Vector3(3.54, .058, 1.22));
      panel.setMatrixAt(i, matrix);
      matrix.compose(new THREE.Vector3(x, .965, z), tilt, new THREE.Vector3(3.62, .081, 1.3));
      edge.setMatrixAt(i, matrix);
      matrix.compose(new THREE.Vector3(x, .46, z), upright, new THREE.Vector3(.09, .92, .11));
      foot.setMatrixAt(i, matrix);
      i++;
    }
  }
  group.add(foot, edge, panel);
  road(group, -22, 18, 5.4, 2.45);
  fence(group, -24, 21, -22.1);
  foliage(group, -27, 25, -27, -36, 43, 2172);
}

function windFarm(group) {
  const rotors = [];
  for (const [x, z, h, yaw] of [[-17, -15, 9.2, .2], [6, -27, 10.4, .1], [25, -35, 9.2, -.12], [-26, -41, 10.3, .23], [43, -48, 8.7, .4]]) {
    cylinder(group, paint.beige, x, h / 2, z, .16, .35, h);
    block(group, paint.siding, x, h, z, .66, .52, 1.02);
    const nacelle = new THREE.Group();
    nacelle.position.set(x, h, z + .53);
    nacelle.rotation.y = yaw;
    const rotor = new THREE.Group();
    nacelle.add(rotor);
    group.add(nacelle);
    cylinder(rotor, paint.siding, 0, 0, .08, .21, .18, .23, Math.PI / 2);
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Group();
      blade.rotation.z = i * Math.PI * 2 / 3;
      const inner = block(blade, paint.siding, -.12, h * .16, .02, .20, h * .27, .065);
      inner.rotation.z = .04;
      const outer = block(blade, paint.beige, -.18, h * .31, .02, .125, h * .11, .052);
      outer.rotation.z = -.065;
      rotor.add(blade);
    }
    rotors.push(rotor);
  }
  road(group, -27, 22, 4.7, 2.25);
  foliage(group, -34, 31, -33, -48, 34, 217);
  return rotors;
}

function reactorContext(group) {
  pad(group, -7, .6, 27, 14, paint.gravel);
  fence(group, -25, 8, -8.1, 2.2);
  building(group, 1, -14, 13.0, 6.1, 7.2, paint.beige);
  const tower = new THREE.LatheGeometry([
    new THREE.Vector2(3.1, 0), new THREE.Vector2(2.74, 1.4), new THREE.Vector2(2.15, 3.1),
    new THREE.Vector2(1.91, 5.0), new THREE.Vector2(1.9, 6.5), new THREE.Vector2(2.17, 8.2),
    new THREE.Vector2(2.31, 9.0),
  ], 40);
  const cooling = new THREE.Mesh(tower, paint.beige);
  cooling.position.set(-17, 0, -15.8);
  group.add(cooling);
  for (const x of [-18, -9, 5]) lampPost(group, x, -7.9);
  road(group, -24, 6, 6.7, 3.1);
}

function reservoir(group) {
  const water = new THREE.Mesh(new THREE.PlaneGeometry(29, 28, 1, 1), paint.water);
  water.rotation.x = -Math.PI / 2;
  water.position.set(-8.1, 1.74, -16.0);
  group.add(water);
  const tailwater = new THREE.Mesh(new THREE.PlaneGeometry(24, 8, 1, 1), paint.water);
  tailwater.rotation.x = -Math.PI / 2;
  tailwater.position.set(-7.0, .01, 6.9);
  group.add(tailwater);
  for (const [x, width] of [[-17.3, 15.5], [3.1, 12.4]]) {
    block(group, paint.beige, x, .96, -.86, width, 1.9, 1.7);
    block(group, paint.steel, x, 1.94, -.86, width, .10, 1.9);
    fence(group, x - width * .46, x + width * .46, -.03, 2.5);
  }
  foliage(group, -36, 5, -36, -51, 57, 431);
}

function switchyard(group, start, end, z) {
  pad(group, (start + end) / 2, z + 3, end - start, 13.3, paint.gravel);
  fence(group, start, end, z - 5.3, 1.95);
  for (let x = start + 1.4; x < end - 1.1; x += 4.2) {
    for (const side of [-.75, .75]) {
      beam(group, paint.steel, [x + side, 0, z], [x + side * .8, 4.0, z], .084);
      block(group, paint.beige, x + side, .12, z, .33, .24, .32);
    }
    beam(group, paint.steel, [x - .92, 3.97, z], [x + .92, 3.97, z], .105);
    beam(group, paint.steel, [x - .75, 1.1, z], [x + .72, 3.93, z], .052);
    beam(group, paint.steel, [x + .75, 1.1, z], [x - .72, 3.93, z], .052);
    for (const off of [-.58, 0, .58]) cylinder(group, paint.beige, x + off, 3.69, z, .089, .095, .45);
    block(group, paint.bracing, x, .62, z + .82, .79, 1.25, .68);
  }
  for (const height of [3.42, 3.49, 3.57]) {
    beam(group, paint.steel, [start + 1.4, height, z + .08], [end - 2.0, height, z + .08], .026, true);
  }
  road(group, start, end, z + 9.8, 3.6);
  foliage(group, start - 4, end + 4, z - 13, z - 26, 35, 321 + start);
}

function corridor(group) {
  foliage(group, 51, 83, -10, -17, 42, 323);
  foliage(group, 49, 89, -25, -45, 54, 1311);
  road(group, 52, 86, 5.8, 2.5);
  const pathWidth = 4.4;
  for (let x = 55; x < 87; x += 4.7) {
    block(group, paint.beige, x, .13, pathWidth, .14, .26, .15);
    block(group, paint.lane, x, .24, pathWidth, .17, .044, .16);
  }
}

function dataYard(group) {
  pad(group, 120.5, -2, 28.2, 25, paint.gravel);
  building(group, 124.5, -22, 34, 7.7, 8.1, paint.siding);
  for (const x of [112, 117.2, 122.8, 128.4, 133.9]) {
    block(group, paint.bracing, x, 2.02, -17.88, 2.9, 4.0, .16);
    block(group, paint.dark, x, 1.98, -17.76, 2.66, 3.83, .11);
    for (let fin = 0; fin < 10; fin++) block(group, paint.steel, x, .38 + fin * .27, -17.69, 2.6, .038, .04);
    block(group, paint.lane, x - 1.4, .48, -17.05, .09, .96, .09);
    block(group, paint.lane, x + 1.4, .48, -17.05, .09, .96, .09);
  }
  fence(group, 107, 136.0, -13.1);
  road(group, 104, 136, 6.3, 3.65);
  for (const x of [107, 119, 132]) lampPost(group, x, 4.4, 5.7);
}

function electricalRoom(group, floorMaterial) {
  pad(group, 158, -.2, 50, 21, floorMaterial);
  block(group, paint.wall, 156, 3.1, -12.1, 49, 6.2, .21);
  for (let x = 135; x < 183; x += 4.5) {
    block(group, paint.bracing, x, 2.66, -11.8, .24, 5.32, .27);
    block(group, paint.dark, x + 1.72, 1.60, -11.82, 2.4, 3.18, .28);
    block(group, paint.pane, x + 1.72, 2.46, -11.65, .59, .29, .08);
    block(group, paint.light, x + 1.45, 5.16, -3.8, 2.7, .051, .11);
  }
  for (const z of [-7.2, -5.9]) {
    block(group, paint.bracing, 158, 5.04, z, 46, .22, .27);
    for (let x = 137; x < 180; x += 2.5) block(group, paint.steel, x, 5.0, z + .22, .06, .07, .63);
  }
  block(group, paint.lane, 157, .001, 3.4, 44, .005, .072);
}

function serverHall(group, floorMaterial) {
  pad(group, 200, -.1, 33, 17.5, floorMaterial);
  block(group, paint.wall, 201, 3, -8.25, 35, 6, .24);
  const face = new THREE.InstancedMesh(unitBox, paint.dark, 20);
  const doors = new THREE.InstancedMesh(unitBox, paint.bracing, 20);
  const vents = new THREE.InstancedMesh(unitBox, paint.seal, 120);
  const lights = new THREE.InstancedMesh(unitBox, paint.green, 40);
  const matrix = new THREE.Matrix4();
  let i = 0;
  for (let x = 183; x < 215; x += 1.65) {
    matrix.makeScale(1.49, 4.34, 1.76).setPosition(x, 2.17, -6.05);
    face.setMatrixAt(i, matrix);
    matrix.makeScale(1.35, 4.0, .06).setPosition(x, 2.17, -5.13);
    doors.setMatrixAt(i, matrix);
    for (let slot = 0; slot < 6; slot++) {
      matrix.makeScale(1.16, .47, .032).setPosition(x, .55 + slot * .64, -5.084);
      vents.setMatrixAt(i * 6 + slot, matrix);
    }
    for (let led = 0; led < 2; led++) {
      matrix.makeScale(.045, .024, .022).setPosition(x + .48, 3.68 - led * .21, -5.055);
      lights.setMatrixAt(i * 2 + led, matrix);
    }
    if (i % 3 === 0) block(group, paint.light, x + .4, 5.12, -3.1, 3.25, .05, .13);
    i++;
  }
  group.add(face, doors, vents, lights);
  block(group, paint.bracing, 197.9, 4.87, -3.09, 35, .24, .26);
  for (let x = 184; x < 215; x += 3) {
    block(group, paint.steel, x, 4.64, -3.29, .07, .46, .22);
  }
}

function serverInterior(group) {
  const deck = finish(0x424d4a, .63, .52);
  const rail = finish(0x626c67, .63, .44);
  const circuit = finish(0x40544a, .24, .73);
  pad(group, 238, 0, 56, 14.2, deck);
  block(group, paint.bracing, 238, .45, -6.6, 57, .8, .25);
  block(group, circuit, 239, 2.31, -8.0, 49, 4.6, .23);
  block(group, rail, 238, 4.64, -7.82, 51, .21, .29);
  for (let x = 213; x <= 264; x += 2.6) {
    block(group, paint.steel, x, 2.22, -7.8, .085, 4.49, .14);
    block(group, paint.bracing, x + .95, 2.67, -7.79, .97, 1.51, .34);
    block(group, paint.copper, x + .95, 1.43, -7.59, 1.2, .028, .025);
  }
  for (const z of [3.57, -2.8]) {
    block(group, rail, 240, .061, z, 54, .14, .13);
    block(group, paint.seal, 240, .04, z + .17, 54, .081, .15);
  }
}

export function createJourneySettings(scene, floorMaterial) {
  addTerrain(scene);
  const sky = createSky(scene);
  const regions = [];
  const rotors = [];
  function region(from, to, populate, sources, indoor = false) {
    const group = new THREE.Group();
    populate(group);
    regions.push({ from, to, group, sources, indoor });
    scene.add(group);
  }
  region(-30, .5, fuelStation, ['gas']);
  region(1, 30, (group) => turbineHall(group, 1, 30, floorMaterial), ['gas', 'nuclear'], true);
  region(-25, 1, reactorContext, ['nuclear']);
  region(-25, 22, solarFarm, ['solar']);
  region(-30, 27, (group) => rotors.push(...windFarm(group)), ['wind']);
  region(-26, 0, reservoir, ['hydro']);
  region(1, 30, (group) => turbineHall(group, 1, 30, floorMaterial, true), ['hydro'], true);
  region(33, 52, (group) => switchyard(group, 33, 52, -4.9));
  region(51, 84, corridor);
  region(84, 104, (group) => switchyard(group, 84, 104, -4.6));
  region(105, 137, dataYard);
  region(134, 182, (group) => electricalRoom(group, floorMaterial), null, true);
  region(182, 213, (group) => serverHall(group, floorMaterial), null, true);
  region(210, 265, serverInterior, null, true);
  return {
    update(camera, source, setting, elapsed, orbitBack = false) {
      sky.position.copy(camera.position);
      const indoor = isInterior(setting);
      const target = indoor ? 1 : 0;
      sky.material.uniforms.interior.value = elapsed
        ? THREE.MathUtils.lerp(sky.material.uniforms.interior.value, target, Math.min(1, elapsed * 8))
        : target;
      for (const { from, to, group, sources, indoor } of regions) {
        group.visible = (!indoor || !orbitBack) && (!sources || sources.includes(source)) && camera.position.x > from - 65 && camera.position.x < to + 65;
      }
      if (source === 'wind') for (const rotor of rotors) rotor.rotation.z -= elapsed * .19;
    },
  };
}

export function heatModel() {
  const group = new THREE.Group();
  const spreaderGroup = new THREE.Group();
  const interfaceGroup = new THREE.Group();
  const sinkGroup = new THREE.Group();
  const fanGroup = new THREE.Group();
  const substrate = finish(0x354d40, .24, .75);
  const spreader = finish(0xac7650, .56, .35);
  const interfacePad = finish(0x46696b, .13, .52);
  const fin = finish(0x869394, .74, .33);
  group.add(spreaderGroup, interfaceGroup, sinkGroup, fanGroup);
  block(group, substrate, 0, .17, 0, 5.38, .34, 3.5);
  block(group, paint.dark, -.11, .45, -.12, 2.84, .22, 2.34);
  block(spreaderGroup, spreader, -.10, .64, -.12, 2.69, .19, 2.27);
  block(interfaceGroup, interfacePad, -.10, .76, -.12, 2.67, .048, 2.27);
  block(sinkGroup, fin, -.10, .845, -.12, 2.92, .12, 2.38);
  for (let i = 0; i < 19; i++) {
    block(sinkGroup, fin, -.10, 1.18, -.12 - .98 + i * .11, 2.71, .62, .046);
  }
  for (const x of [-1.21, 1.0]) {
    cylinder(spreaderGroup, spreader, x, .64, -.12, .075, .075, 2.34).rotation.x = Math.PI / 2;
  }
  for (const x of [-2.41, 2.41]) for (const z of [-1.51, 1.51]) {
    cylinder(group, paint.steel, x, .38, z, .084, .084, .11);
  }

  const fanX = -2.12;
  const fanY = 1.06;
  const fanZ = -.12;
  for (const z of [-1.09, .85]) block(fanGroup, paint.bracing, fanX, fanY, z, .62, 1.29, .10);
  for (const y of [.44, 1.68]) block(fanGroup, paint.bracing, fanX, y, fanZ, .62, .10, 2.04);
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(.55, .052, 10, 32), paint.steel);
  outerRing.position.set(fanX - .25, fanY, fanZ);
  outerRing.rotation.y = Math.PI / 2;
  fanGroup.add(outerRing);
  const rotor = new THREE.Group();
  rotor.position.set(fanX, fanY, fanZ);
  rotor.userData.spin = { axis: 'x', speed: 5.6 };
  fanGroup.add(rotor);
  cylinder(rotor, paint.bracing, 0, 0, 0, .13, .13, .28, Math.PI / 2);
  for (let index = 0; index < 6; index += 1) {
    const pivot = new THREE.Group();
    pivot.rotation.x = index * Math.PI / 3;
    rotor.add(pivot);
    const blade = block(pivot, paint.steel, 0, .31, 0, .059, .35, .165);
    blade.rotation.y = .54;
    blade.rotation.x = .31;
  }
  group.traverse((part) => {
    if (!part.isMesh) return;
    part.castShadow = true;
    part.receiveShadow = true;
  });
  group.userData.inspection = [
    { name: 'Integrated heat spreader', nodes: [spreaderGroup], anchor: [-.10, .64, -.12], axis: [.10, .28, .95], distance: 1.32 },
    { name: 'External thermal interface', nodes: [interfaceGroup], anchor: [-.10, .76, -.12], axis: [.40, .64, .43], distance: 1.48 },
    { name: 'Passive heat sink', nodes: [sinkGroup], anchor: [-.10, 1.19, -.12], axis: [0, 1, 0], distance: 1.15 },
    { name: 'Server fan and air duct', nodes: [fanGroup], anchor: [fanX, fanY, fanZ], axis: [-1, .16, 0], distance: 1.22 },
  ];
  return group;
}
