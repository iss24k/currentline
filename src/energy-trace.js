import * as THREE from 'three';
import { generation, grid, server, siteEntry, siteOutput } from './route.js';
import { worldPosition } from './journey-settings.js';

const color = {
  fuel: 0xffb666, thermal: 0xff795e, shaft: 0xf6d889, ac: 0x70eaff, dc: 0xd7a5ff,
  fluid: 0x8ff0b6, light: 0xffe98f, magnetic: 0x8ab5ff,
};

const local = {
  gas: [
    ['fuel', [[-13.5, .65, 2.15], [-3.38, .64, 2.15], [-2.42, .64, 2.15], [-2.42, 1.06, 2.15],
      [-2.32, .88, 1.46], [-.91, .88, 1.46], [-.91, 1.41, 1.46], [-.91, 1.41, 2.15], [-.91, 1.06, 2.15],
      [1.83, 1.06, 2.15], [1.83, .64, 2.15], [3.35, .64, 2.15]]],
  ],
  'gas-turbine': [
    ['fuel', [[1.41, 2.93, -.25], [-.21, 2.93, -.25], [-.21, 2.2, -.25], [-.18, 1.93, .30]]],
    ['fluid', [[-2.70, 1.76, .10], [-2.25, 1.82, .46], [-1.45, 1.84, .52], [-.80, 1.82, .45], [-.38, 1.87, .32]]],
    ['thermal', [[-.18, 1.93, .30], [.36, 1.87, .48], [1.23, 1.88, .49], [2.07, 1.89, .64], [2.55, 2.24, .73]]],
    ['shaft', [[.51, 1.52, .04], [1.38, 1.52, .04], [2.72, 1.52, .04]]],
  ],
  nuclear: [
    ['thermal', [[-1.22, .85, .20], [-1.22, 1.99, .20], [-.52, 2.06, .94], [.67, 2.06, .94], [.75, 2.63, .14]]],
    ['thermal', [[.75, 2.63, .14], [.75, 3.61, .14], [2.66, 3.61, .14]]],
  ],
  'steam-turbine': [
    ['thermal', [[-2.86, 3.11, -.63], [-1.60, 3.11, -.63], [-1.60, 1.79, -.55], [-1.10, 1.90, .25], [.13, 1.96, .46], [1.87, 1.93, .46]]],
    ['shaft', [[.35, 1.52, .04], [1.55, 1.52, .04], [2.71, 1.52, .04]]],
  ],
  solar: [
    ['light', [[-2.1, 3.2, -.88], [-2.1, 1.85, -.22], [-2.1, .91, .17]]],
    ['light', [[.0, 3.2, -.88], [0, 1.85, -.22], [0, .91, .17]]],
    ['dc', [[-2.1, .91, .17], [-2.1, .42, .12], [3.22, .42, .12], [3.22, .42, 1.31]]],
  ],
  'solar-inverter': [
    ['dc', [[-2.57, .49, 1.24], [-1.36, .49, 1.24], [-1.36, .57, .76], [-.62, 1.02, .59], [-.15, 1.38, .57]]],
    ['ac', [[-.15, 1.38, .57], [.63, 1.38, .57], [1.38, 1.03, .75], [1.38, .49, 1.24], [2.57, .49, 1.24]]],
  ],
  wind: [
    ['fluid', [[-.48, 4.92, 2.72], [0, 4.66, .77]]],
    ['shaft', [[0, 4.66, .77], [0, 4.66, -.20]]],
    ['ac', [[0, 4.66, -.20], [0, 4.29, -.20], [0, .44, -.20], [.53, .42, .64], [1.39, .42, .64], [2.12, .36, .64]]],
  ],
  'wind-converter': [
    ['ac', [[-2.57, .49, 1.24], [-1.51, .49, 1.24], [-1.51, 1.13, .72], [-.55, 1.38, .51]]],
    ['dc', [[-.55, 1.38, .51], [-.42, 1.65, .52], [.39, 1.65, .52]]],
    ['ac', [[.39, 1.65, .52], [1.52, 1.14, .74], [1.52, .49, 1.24], [2.57, .49, 1.24]]],
  ],
  hydro: [
    ['fluid', [[2.42, 1.80, -2.9], [2.42, 1.58, -2.20], [2.42, 1.58, -1.54], [2.42, .91, -.32], [2.42, .91, .90], [3.25, .85, .90]]],
  ],
  'water-turbine': [
    ['fluid', [[-2.52, 1.25, -1.07], [-1.15, 1.25, -1.07], [.09, 1.25, -.90], [.66, 1.25, -.48], [.72, 1.25, .32], [0, 1.25, 0]]],
    ['shaft', [[0, 1.25, 0], [0, 2.12, 0], [0, 3.10, 0]]],
  ],
  alternator: [
    ['shaft', [[-2.72, 1.54, .04], [-1.43, 1.54, .04], [0, 1.54, .04]]],
    ['magnetic', [[0, 1.54, .04], [.23, 1.83, .29], [.43, 2.13, .58]]],
    ['ac', [[.43, 2.13, .58], [1.42, 2.15, .60], [1.80, 1.10, .97], [2.97, .48, 1.06]]],
  ],
  'step-up': [
    ['ac', [[-.0, 3.60, .64], [0, 2.14, .62], [-.74, 1.74, .57]]],
    ['magnetic', [[-.74, 1.74, .57], [-.42, 1.47, .50], [.41, 1.47, .41], [.76, 1.77, .26]]],
    ['ac', [[.76, 1.77, .26], [1.35, 2.06, -.50], [1.35, 4.49, -.56]]],
  ],
  lines: [
    ['ac', [[-2.45, 3.268, .736], [-1.3, 2.848, .736], [0, 2.698, .736], [1.3, 2.848, .736], [2.45, 3.268, .736]]],
  ],
  substation: [
    ['ac', [[-1.55, 2.51, 1.27], [-1.55, 2.26, -.22], [-1.55, 2.51, -1.57], [-1.34, 2.39, -1.18], [-.80, .88, -.68]]],
    ['magnetic', [[-.80, .88, -.68], [-.4, .77, -.44], [.62, .77, -.44], [1.34, .91, -.68]]],
    ['ac', [[1.34, .91, -.68], [1.34, 2.31, -1.17], [1.55, 2.26, -.22], [1.55, 2.51, 1.27]]],
  ],
  intake: [
    ['ac', [[-2.17, .39, 1.31], [-1.36, .39, 1.24], [-1.36, 1.78, 1.16], [1.34, 1.78, 1.16], [1.34, .41, 1.16], [2.17, .41, 1.30]]],
  ],
  'site-transformer': [
    ['ac', [[-1.43, 4.05, -.43], [-1.43, 2.05, .43], [-.69, 1.67, .51]]],
    ['magnetic', [[-.69, 1.67, .51], [-.28, 1.44, .62], [.38, 1.44, .62], [.82, 1.68, .48]]],
    ['ac', [[.82, 1.68, .48], [1.43, 2.12, .28], [1.43, 4.05, -.43]]],
  ],
  transfer: [
    ['ac', [[-1.02, 3.99, -.35], [-1.02, 3.02, .62], [-.68, 2.30, .76], [0, 1.62, .78], [0, .46, .78], [2.14, .39, 1.12]]],
  ],
  generator: [
    ['fuel', [[-2.56, .59, 1.00], [-1.83, .96, .62], [-1.21, 1.62, .55]]],
    ['shaft', [[-1.21, 1.62, .55], [-.33, 1.39, .12], [1.57, 1.39, .10]]],
    ['ac', [[1.57, 1.39, .10], [2.37, 1.62, .42], [2.92, 1.61, .60], [2.92, .51, 1.08]]],
  ],
  battery: [
    ['fuel', [[-1.45, 1.89, .52], [-1.20, 1.89, .61], [-.87, 1.89, .68]]],
    ['dc', [[-.87, 1.89, .68], [-.87, 1.89, .95], [.57, 1.89, .95], [.57, 4.12, .88], [1.74, 4.12, .52], [1.77, 3.88, -1.11]]],
  ],
  ups: [
    ['ac', [[-2.37, .41, 1.20], [-1.67, .41, 1.20], [-1.48, .80, .55], [-.79, .81, .51]]],
    ['dc', [[-.79, .81, .51], [.84, .81, .51], [1.73, 1.43, .51], [1.73, 2.48, .53], [.81, 2.72, .58]]],
    ['ac', [[.81, 2.72, .58], [1.91, 2.73, .63], [1.91, 3.62, .57], [2.32, 3.85, .56]]],
  ],
  'floor-pdu': [
    ['ac', [[-1.8, 3.69, .58], [-1.4, 2.12, .57], [-.76, 1.64, .54]]],
    ['magnetic', [[-.76, 1.64, .54], [-.18, 1.48, .57], [.50, 1.48, .59], [.98, 1.64, .58]]],
    ['ac', [[.98, 1.64, .58], [1.77, 1.66, .74], [1.77, 3.55, .77], [2.03, 3.82, .77]]],
  ],
  busway: [
    ['ac', [[-3.06, 3.89, .08], [-1.43, 3.89, .08], [1.42, 3.89, .08], [1.42, 3.12, .13], [1.65, 2.54, .29], [1.69, 1.53, .29]]],
  ],
  'rack-pdu': [
    ['ac', [[2.55, 4.18, .74], [2.55, 3.53, .85], [2.55, 2.21, .85], [2.55, 2.21, 1.05], [2.33, 2.08, 1.05], [2.02, 2.08, .67]]],
  ],
  cord: [
    ['ac', [[-1.67, 1.07, .96], [-1.52, 1.07, .38], [-1.20, 1.07, -.67], [-.99, .77, -1.28], [-.30, .57, -1.67], [.69, .56, -1.66], [1.16, .78, -1.25], [1.29, 1.1, -.94], [1.70, 1.11, .10], [1.98, 1.11, .75]]],
  ],
  psu: [
    ['ac', [[-2.02, 1.14, 1.32], [-2.02, 1.14, .91], [-1.58, 1.14, .64]]],
    ['dc', [[-1.58, 1.14, .64], [-1.25, 1.14, .42], [-.76, 1.14, .42]]],
    ['magnetic', [[-.76, 1.14, .42], [-.38, 1.10, .32], [.08, 1.14, .31]]],
    ['dc', [[.08, 1.14, .31], [1.63, 1.14, .29], [2.73, 1.13, -.35], [2.98, 1.13, -.35]]],
  ],
  vrm: [
    ['dc', [[-2.80, .515, -.33], [-1.88, .515, -.33], [-.88, .515, -.33], [.04, .515, -.33], [.84, .515, -.33], [1.08, .515, -.25], [1.68, .81, -.25], [2.65, .51, -.25]]],
  ],
  chip: [
    ['dc', [[-2.78, .509, -.51], [-2.12, .509, -.48], [-1.74, .509, -.34], [-1.27, .509, -.34], [-1.27, .69, -.31], [-.74, .76, -.31], [0, .77, -.31]]],
    ['thermal', [[0, .77, -.31], [0, 1.13, -.29], [.73, 1.13, -.27], [1.51, 1.20, -.27]]],
  ],
  heat: [
    ['thermal', [[-1.45, .45, -.12], [-.1, .45, -.12], [-.1, .63, -.12], [-.1, .88, -.12], [-.1, 1.28, -.12], [1.37, 1.30, -.12], [2.64, 1.55, -.12], [3.36, 1.84, -.12]]],
    ['thermal', [[-.1, .91, -.81], [.66, 1.25, -.81], [1.47, 1.26, -.81], [2.76, 1.48, -.81]]],
    ['thermal', [[-.1, .91, .57], [.65, 1.25, .57], [1.47, 1.28, .57], [2.78, 1.55, .57]]],
  ],
};

const focus = {
  gas: [-.91, 1.08, 2.12], 'gas-turbine': [0, 1.86, .50],
  nuclear: [-.93, 1.83, .48], solar: [0, .92, .47], wind: [0, 4.66, .32],
  hydro: [2.42, 1.47, -.65], 'steam-turbine': [-.90, 1.90, .25],
  'water-turbine': [.07, 1.3, .07], lines: [0, 2.71, .74],
  'step-up': [0, 1.62, .50], substation: [0, 1.58, -.35],
  'site-transformer': [0, 1.63, .59], 'solar-inverter': [-.13, 1.24, .57],
  'wind-converter': [0, 1.65, .54], transfer: [0, 1.75, .78],
  generator: [-.70, 1.53, .34], battery: [.02, 1.89, .97], ups: [1.55, 1.77, .53],
  'floor-pdu': [.20, 1.56, .55], busway: [1.42, 3.83, .10],
  'rack-pdu': [2.53, 2.21, .89], cord: [0, .73, -1.56], psu: [-.3, 1.14, .38],
  vrm: [-.88, .67, -.33], chip: [-.16, .88, -.3], heat: [-.10, .91, -.12],
};

function localPaths(id, mode) {
  const paths = local[id] ?? [];
  if (id === 'transfer' && mode === 'generator') {
    return [['ac', [[1.02, 3.99, -.35], [1.02, 3.02, .62], [.68, 2.30, .76], ...paths[0][1].slice(3)]]];
  }
  if (id === 'ups' && mode === 'battery') {
    return [
      ['dc', [[-1.76, 3.76, -.66], [-1.75, 2.46, -.66], [-1.55, 1.69, .44], [.83, 1.69, .49], [1.73, 2.48, .53], [.81, 2.72, .58]]],
      paths[2],
    ];
  }
  return paths;
}

function place(point, id, source) {
  const [x, z] = worldPosition(id, source);
  return new THREE.Vector3(x + point[0], point[1], z + point[2]);
}

export function flowTarget(id, source, mode) {
  const paths = localPaths(id, mode);
  const points = paths[0]?.[1];
  return place(focus[id] ?? points?.[Math.floor(points.length / 2)] ?? [0, 1.1, 0], id, source);
}

function routeEdges(source) {
  const route = [...generation[source].stops, ...grid, ...siteEntry, 'transfer', ...siteOutput, ...server];
  return [
    ...route.slice(1).map((end, index) => [route[index], end]),
    ['generator', 'transfer'], ['battery', 'ups'],
  ];
}

function curveThrough(points, radius = .24) {
  const curve = new THREE.CurvePath();
  let start = points[0];
  for (let i = 1; i < points.length - 1; i++) {
    const before = points[i - 1];
    const point = points[i];
    const after = points[i + 1];
    const lengthIn = point.distanceTo(before);
    const lengthOut = point.distanceTo(after);
    const bend = Math.min(lengthIn * .32, lengthOut * .32, radius);
    if (!bend) continue;
    const inPoint = point.clone().lerp(before, bend / lengthIn);
    const outPoint = point.clone().lerp(after, bend / lengthOut);
    curve.add(new THREE.LineCurve3(start, inPoint));
    curve.add(new THREE.QuadraticBezierCurve3(inPoint, point, outPoint));
    start = outPoint;
  }
  curve.add(new THREE.LineCurve3(start, points.at(-1)));
  return curve;
}

function linkCurve(from, to, source, mode) {
  const fromPath = localPaths(from, mode).at(-1);
  const toPath = localPaths(to, mode)[0];
  let startPoint = fromPath?.[1].at(-1) ?? [0, .32, .7];
  let endPoint = toPath?.[1][0] ?? [0, .32, .7];
  if (from === 'solar' || from === 'wind' || from === 'hydro') startPoint = fromPath[1].at(-1);
  if (from === 'vrm' && to === 'chip') endPoint = local.chip[0][1][0];
  if (from === 'gas' && to === 'gas-turbine') endPoint = local['gas-turbine'][0][1][0];
  const a = place(startPoint, from, source);
  const b = place(endPoint, to, source);
  const form = fromPath?.[0] ?? 'ac';
  const overhead = to === 'lines' || from === 'lines';
  const sideWay = from === 'gas' || from === 'hydro' || from === 'nuclear' || from === 'generator' || from === 'battery';
  if (overhead) {
    const aT = a.clone().lerp(b, .29);
    const bT = a.clone().lerp(b, .71);
    const middle = a.clone().lerp(b, .5);
    aT.y -= .66;
    middle.y -= .82;
    bT.y -= .64;
    return { form, curve: new THREE.CatmullRomCurve3([a, aT, middle, bT, b]), exterior: 'overhead' };
  }
  if (sideWay) {
    const n = b.x - a.x;
    const height = form === 'fuel' ? .55 : form === 'fluid' ? Math.min(1.65, a.y) : form === 'dc' ? 3.82 : Math.min(a.y, b.y);
    const run = THREE.MathUtils.lerp(a.z, b.z, .46) + (from === 'gas' ? .1 : 0);
    return { form, curve: curveThrough([
      a, new THREE.Vector3(a.x + n * .23, height, a.z), new THREE.Vector3(a.x + n * .40, height, run),
      new THREE.Vector3(a.x + n * .71, height, run), new THREE.Vector3(a.x + n * .86, height, b.z), b,
    ], .55), exterior: form === 'ac' || form === 'dc' ? 'cable' : 'pipe' };
  }
  if (form === 'shaft') {
    return { form, curve: new THREE.CatmullRomCurve3([a, a.clone().lerp(b, .5), b]), exterior: 'shaft' };
  }
  if (from === 'busway') {
    const aT = a.clone().lerp(b, .17).setY(3.83);
    const bT = a.clone().lerp(b, .72).setY(3.83);
    return { form, curve: curveThrough([a, aT, bT, b], .64), exterior: 'cable' };
  }
  const isBoard = ['cord', 'psu', 'vrm'].includes(from);
  const offset = isBoard ? .11 : from === 'substation' ? .12 : form === 'thermal' ? .92 : .28;
  return {
    form,
    curve: curveThrough([
      a, a.clone().lerp(b, .24).setY(offset),
      a.clone().lerp(b, .76).setY(offset), b,
    ], .75),
    exterior: form === 'thermal' ? null : 'cable',
  };
}

const jacket = new THREE.MeshStandardMaterial({ color: 0x333941, roughness: .62, metalness: .33 });
const pipePaint = new THREE.MeshStandardMaterial({ color: 0x98784e, roughness: .48, metalness: .46 });
const axis = new THREE.Vector3(0, 1, 0);
const arrowGeometry = new THREE.ConeGeometry(.089, .33, 9);
const arrowPaints = new Map();
const tune = new THREE.Color();

function createCore(form, length, internal) {
  return new THREE.ShaderMaterial({
    depthTest: !internal, depthWrite: false, transparent: internal,
    uniforms: {
      tint: { value: new THREE.Color(color[form]) }, time: { value: 0 },
      count: { value: Math.max(1.6, length * .75) },
      base: { value: internal ? .77 : .87 },
    },
    vertexShader: `
      varying vec2 uvOut;
      void main() {
        uvOut = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }
    `,
    fragmentShader: `
      uniform vec3 tint;
      uniform float time;
      uniform float count;
      uniform float base;
      varying vec2 uvOut;
      void main() {
        float wave = fract(uvOut.x * count - time * 1.7);
        float tail = smoothstep(.41, .97, wave);
        float bead = smoothstep(.92, .99, wave);
        vec3 energy = mix(tint * base, vec3(1.), .14 + tail * .30 + bead * .53);
        gl_FragColor = vec4(energy, .89 + bead * .11);
        #include <colorspace_fragment>
      }
    `,
  });
}

function createTrack(parent, curve, form, options = {}) {
  const { internal = false, exterior } = options;
  const length = curve.getLength();
  const segments = Math.min(110, Math.max(16, Math.ceil(length * 7)));
  const radius = internal ? .041 : exterior === 'overhead' ? .046 : .054;
  const group = new THREE.Group();
  const materials = [];
  const coreMaterial = createCore(form, length, internal);
  const core = new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, 12, false), coreMaterial);
  core.renderOrder = internal ? 12 : 4;
  group.add(core);
  materials.push(coreMaterial);

  const veil = new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending, transparent: true,
    depthTest: !internal, depthWrite: false, toneMapped: false,
    uniforms: { tint: { value: new THREE.Color(color[form]) } },
    vertexShader: `
      varying vec3 normalView;
      varying vec3 directionView;
      void main() {
        normalView = normalize(normalMatrix * normal);
        vec4 point = modelViewMatrix * vec4(position, 1.);
        directionView = -point.xyz;
        gl_Position = projectionMatrix * point;
      }
    `,
    fragmentShader: `
      uniform vec3 tint;
      varying vec3 normalView;
      varying vec3 directionView;
      void main() {
        float front = max(0., dot(normalize(normalView), normalize(directionView)));
        gl_FragColor = vec4(tint, pow(front, 3.4) * .28);
        #include <colorspace_fragment>
      }
    `,
  });
  const shell = new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius * 2.9, 16, false), veil);
  shell.renderOrder = internal ? 11 : 3;
  group.add(shell);
  materials.push(veil);

  if (exterior) {
    // The offset conduit lets the annotation read clearly alongside its physical housing.
    const physical = new THREE.Mesh(new THREE.TubeGeometry(curve, segments, exterior === 'pipe' || exterior === 'shaft' ? .104 : .055, 8, false),
      exterior === 'pipe' ? pipePaint : jacket);
    physical.position.y = exterior === 'overhead' ? -.018 : -.073;
    group.add(physical);
  }
  if (!internal && length > 2) {
    if (!arrowPaints.has(form)) {
      tune.set(color[form]).lerp(new THREE.Color(0xffffff), .19);
      arrowPaints.set(form, new THREE.MeshBasicMaterial({ color: tune.clone(), depthWrite: false, toneMapped: false }));
    }
    const count = Math.min(5, Math.max(1, Math.floor(length / 4.6)));
    for (let i = 0; i < count; i++) {
      const t = (i + .55) / count;
      const arrow = new THREE.Mesh(arrowGeometry, arrowPaints.get(form));
      arrow.position.copy(curve.getPointAt(t));
      arrow.quaternion.setFromUnitVectors(axis, curve.getTangentAt(t));
      arrow.renderOrder = 5;
      group.add(arrow);
    }
  }
  parent.add(group);
  return { group, materials, curve };
}

function disposeTrack({ group, materials }) {
  group.removeFromParent();
  group.traverse((item) => {
    if (item.geometry && item.geometry !== arrowGeometry) item.geometry.dispose();
  });
  for (const material of materials) material.dispose();
}

export function createEnergyTrace(scene) {
  const root = new THREE.Group();
  const localRoot = new THREE.Group();
  root.add(localRoot);
  scene.add(root);
  let links = [];
  let internals = [];
  let previous;
  let liveTracks = [];

  function build(source, mode) {
    for (const track of links) disposeTrack(track);
    links = routeEdges(source).map(([from, to]) => {
      const { curve, form, exterior } = linkCurve(from, to, source, mode);
      const track = createTrack(root, curve, form, { exterior });
      return { ...track, from, to };
    });
  }

  function select(settings, route) {
    if (!previous || previous.source !== settings.source || previous.mode !== settings.mode
      || previous.routeLength !== route.length) build(settings.source, settings.mode);
    const firstLive = settings.mode === 'battery' ? route.indexOf('battery')
      : settings.mode === 'generator' ? route.indexOf('generator') : 0;
    const selectedIndex = route.indexOf(settings.active);
    for (const track of links) {
      const index = route.indexOf(track.from);
      track.group.visible = index >= firstLive && route[index + 1] === track.to;
    }
    if (!previous || previous.active !== settings.active || previous.source !== settings.source || previous.mode !== settings.mode) {
      for (const track of internals) disposeTrack(track);
      internals = localPaths(settings.active, settings.mode).map(([form, points]) =>
        createTrack(localRoot, curveThrough(points.map((point) => place(point, settings.active, settings.source)), .14), form, { internal: true }));
    }
    localRoot.visible = selectedIndex >= firstLive;
    liveTracks = links.filter(({ group }) => group.visible);
    if (localRoot.visible) liveTracks = [...liveTracks, ...internals];
    previous = { ...settings, routeLength: route.length };
  }

  function flightPath(from, to) {
    const forward = links.find((link) => link.from === from && link.to === to);
    if (forward) return { curve: forward.curve, reversed: false };
    const reverse = links.find((link) => link.from === to && link.to === from);
    return reverse ? { curve: reverse.curve, reversed: true } : null;
  }

  return {
    select,
    flightPath,
    animate(time, flying) {
      localRoot.visible = !flying && liveTracks.some((track) => internals.includes(track));
      for (const track of liveTracks) track.materials[0].uniforms.time.value = time;
    },
  };
}
