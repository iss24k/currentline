import * as THREE from 'three';

const palette = {
  steel: 0x9da9ac, dark: 0x333c40, ceramic: 0xd5d7c9, copper: 0xbc7954,
  polymer: 0x424e55, green: 0x3e6155, silicon: 0x829eab,
};
const finish = (color) => new THREE.MeshStandardMaterial({ color, metalness: .54, roughness: .36 });
const radial = (radius, height, sides = 28, top = radius) => new THREE.CylinderGeometry(top, radius, height, sides);
const block = (w, h, d) => new THREE.BoxGeometry(w, h, d);

function mesh(group, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const part = new THREE.Mesh(geometry, material);
  part.position.fromArray(position);
  part.rotation.set(...rotation);
  group.add(part);
  return part;
}

function disc(group, radius, depth, paint, x = 0, y = 0, z = 0, sides = 28) {
  return mesh(group, radial(radius, depth, sides), paint, [x, y, z], [0, 0, Math.PI / 2]);
}

function ring(group, radius, thickness, paint, x = 0, y = 0, z = 0, angle = Math.PI * 2) {
  return mesh(group, new THREE.TorusGeometry(radius, thickness, 10, 44, angle), paint, [x, y, z], [0, Math.PI / 2, 0]);
}

function wire(group, points, radius, paint) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  mesh(group, new THREE.TubeGeometry(curve, Math.max(20, points.length * 2), radius, 9, false), paint);
}

function addBlade(group, paint, scale = 1) {
  const outline = new THREE.Shape();
  outline.moveTo(-.20, -.28);
  outline.quadraticCurveTo(-.31, .31, -.04, .65);
  outline.quadraticCurveTo(.08, .77, .35, .71);
  outline.quadraticCurveTo(.14, .25, .23, -.28);
  outline.closePath();
  const geometry = new THREE.ExtrudeGeometry(outline, { depth: .12, bevelEnabled: true, bevelThickness: .045, bevelSize: .04, bevelSegments: 2 });
  const blade = mesh(group, geometry, paint);
  blade.scale.setScalar(scale);
  mesh(group, block(.53, .19, .24), paint, [0, -.33, .06]).scale.setScalar(scale);
}

function addRotor(group, paint, dark, isFan) {
  const count = isFan ? 7 : 12;
  disc(group, .27, .29, dark);
  disc(group, .12, .75, paint);
  for (let i = 0; i < count; i += 1) {
    const carrier = new THREE.Group();
    carrier.rotation.x = i / count * Math.PI * 2;
    carrier.rotateY(Math.PI / 2);
    const row = new THREE.Group();
    row.position.y = .34;
    row.rotation.y = -.38;
    addBlade(row, paint, .65);
    carrier.add(row);
    group.add(carrier);
  }
}

function addHousing(group, paint, dark) {
  for (const z of [-.48, .48]) mesh(group, block(1.42, .79, .07), paint, [0, 0, z]);
  mesh(group, block(1.42, .07, 1), paint, [0, -.39, 0]);
  mesh(group, block(.07, .79, 1), paint, [-.69, 0, 0]);
  for (const z of [-.35, .35]) mesh(group, block(1.16, .035, .035), dark, [0, -.30, z]);
}

function addBoard(group, green, dark, copper, paint, bare) {
  mesh(group, block(1.54, .075, 1.12), green);
  for (const z of [-.45, .45]) {
    for (let i = 0; i < 7; i += 1) mesh(group, block(.08, .015, .15), copper, [-.58 + i * .19, .044, z]);
  }
  if (bare) return;
  mesh(group, block(.60, .105, .46), dark, [0, .10, -.08]);
  mesh(group, block(.53, .02, .39), paint, [0, .16, -.08]);
  for (const x of [-.49, .49]) {
    for (const z of [-.22, .19]) mesh(group, block(.20, .11, .13), dark, [x, .10, z]);
  }
}

function addCell(group, paint, dark, copper, pouch) {
  if (pouch) {
    mesh(group, block(.78, 1.10, .20), paint);
    for (const x of [-.22, .22]) mesh(group, block(.11, .25, .045), copper, [x, .61, 0]);
  } else {
    mesh(group, radial(.29, 1.22), paint);
    mesh(group, radial(.30, .09), dark, [0, .59, 0]);
    mesh(group, radial(.11, .08), copper, [0, .65, 0]);
  }
}

function rotorStages(group, paint, dark, compressor) {
  disc(group, .13, 1.77, dark);
  const sizes = compressor ? [.79, .69, .60, .53] : [.55, .67, .79];
  for (const [index, scale] of sizes.entries()) {
    const row = new THREE.Group();
    row.position.x = -.63 + index * (compressor ? .39 : .58);
    row.scale.setScalar(scale);
    addRotor(row, paint, dark, false);
    group.add(row);
  }
  ring(group, compressor ? .60 : .58, .037, paint, -.85);
}

function combustionCans(group, paint, dark, copper) {
  disc(group, .22, 1.2, dark);
  ring(group, .60, .07, paint, -.52);
  ring(group, .60, .07, paint, .53);
  for (let i = 0; i < 7; i += 1) {
    const angle = i * Math.PI * 2 / 7;
    const y = .46 * Math.sin(angle);
    const z = .46 * Math.cos(angle);
    disc(group, .14, .90, paint, 0, y, z);
    disc(group, .095, .14, copper, -.53, y, z);
    ring(group, .145, .017, dark, .30, y, z);
  }
}

function addFinBank(group, paint, dark) {
  mesh(group, block(1.48, .18, 1.13), dark, [0, -.28, 0]);
  for (let row = 0; row < 12; row += 1) {
    mesh(group, block(.049, .60, 1.04), paint, [-.64 + row * .115, .09, 0]);
  }
}

function addTower(group, paint, dark) {
  const base = [[-.48, -.75, -.30], [.48, -.75, -.30], [.48, -.75, .30], [-.48, -.75, .30]];
  const crown = base.map(([x, , z]) => [x * .32, .75, z * .4]);
  for (let corner = 0; corner < 4; corner += 1) {
    wire(group, [base[corner], crown[corner]], .034, paint);
    const next = (corner + 1) % 4;
    for (let level = 0; level < 4; level += 1) {
      const at = (index, t) => base[index].map((value, axis) => value + t * (crown[index][axis] - value));
      const lower = at(corner, level / 4);
      const upper = at(next, (level + 1) / 4);
      wire(group, [lower, upper], .015, dark);
      wire(group, [upper, at(corner, (level + 1) / 4)], .018, paint);
    }
  }
  for (const [y, w] of [[.25, 1.38], [.54, 1.15]]) mesh(group, block(w, .075, .13), paint, [0, y, 0]);
}

function addDie(group, paint, dark, copper) {
  mesh(group, block(1.31, .18, 1.05), dark, [0, -.07, 0]);
  mesh(group, block(1.25, .03, 1), paint, [0, .035, 0]);
  for (let x = -4; x <= 4; x += 1) {
    for (let z = -3; z <= 3; z += 1) {
      const material = (x + z) % 3 ? copper : dark;
      mesh(group, block(.088, .013, .094), material, [x * .13, .054, z * .13]);
    }
  }
}

export function partModel(part) {
  const group = new THREE.Group();
  const material = part.material.toLowerCase();
  const color = material.includes('copper') ? palette.copper : material.includes('ceramic') || material.includes('porcelain')
    ? palette.ceramic : material.includes('silicon') ? palette.silicon
      : /polymer|polyethylene|nylon|epoxy|rubber|plastic/.test(material) ? palette.polymer : palette.steel;
  const paint = finish(color);
  const dark = finish(palette.dark);
  const copper = finish(palette.copper);
  const green = finish(palette.green);
  const name = part.name.toLowerCase();
  switch (part.shape) {
    case 'shaft':
      for (const [x, radius, length] of [[0, .20, 1.46], [-.49, .32, .26], [.48, .30, .21]]) disc(group, radius, length, paint, x);
      break;
    case 'wheel':
    case 'blades':
    case 'fan':
      if (/inlet and compressor/.test(name)) rotorStages(group, paint, dark, true);
      else if (/hot-gas turbine stages/.test(name)) rotorStages(group, copper, dark, false);
      else addRotor(group, paint, dark, part.shape === 'fan');
      break;
    case 'blade':
      addBlade(group, paint);
      break;
    case 'bearing':
      ring(group, .48, .11, paint);
      ring(group, .26, .075, paint);
      for (let i = 0; i < 9; i += 1) {
        const angle = i / 9 * 2 * Math.PI;
        mesh(group, new THREE.SphereGeometry(.075, 12, 8), dark, [0, .37 * Math.sin(angle), .37 * Math.cos(angle)]);
      }
      break;
    case 'ring':
    case 'shell':
      ring(group, .46, part.shape === 'shell' ? .16 : .07, paint, 0, 0, 0, part.shape === 'shell' ? Math.PI : Math.PI * 2);
      if (part.shape === 'shell') ring(group, .47, .12, dark, .18, 0, 0, Math.PI);
      break;
    case 'cable':
    case 'pipe':
      wire(group, [[-.71, -.24, .23], [-.29, -.24, .23], [-.09, -.16, .2], [.05, .27, 0], [.18, .39, -.05], [.7, .39, -.05]], part.shape === 'pipe' ? .13 : .09, paint);
      disc(group, .16, .10, copper, -.72, -.24, .23);
      disc(group, .16, .10, copper, .70, .39, -.05);
      break;
    case 'valve':
      disc(group, .16, 1.39, paint);
      disc(group, .24, .12, dark, -.65);
      disc(group, .24, .12, dark, .65);
      mesh(group, radial(.26, .40), paint, [0, .07, 0]);
      mesh(group, radial(.06, .31), paint, [0, .35, 0]);
      mesh(group, new THREE.TorusGeometry(.25, .034, 10, 30), copper, [0, .51, 0], [Math.PI / 2, 0, 0]);
      mesh(group, block(.45, .04, .05), copper, [0, .51, 0]);
      break;
    case 'coil':
    case 'spring': {
      const turns = part.shape === 'spring' ? 6 : 10;
      const points = Array.from({ length: turns * 12 + 1 }, (_, i) => {
        const angle = i / 12 * Math.PI * 2;
        return [i / (turns * 12) * 1.15 - .58, .32 * Math.cos(angle), .32 * Math.sin(angle)];
      });
      wire(group, points, part.shape === 'coil' ? .044 : .035, part.shape === 'coil' ? copper : paint);
      if (part.shape === 'coil') disc(group, .25, 1.2, dark);
      break;
    }
    case 'core':
      for (const side of [-1, 1]) {
        mesh(group, block(1.2, .19, .34), paint, [0, side * .43, 0]);
        mesh(group, block(.21, .91, .34), paint, [side * .47, 0, 0]);
      }
      mesh(group, block(.16, .86, .33), dark);
      break;
    case 'case':
    case 'assembly':
      addHousing(group, paint, dark);
      break;
    case 'tank':
      if (name === 'combustion section') {
        combustionCans(group, paint, dark, copper);
        break;
      }
      if (name.includes('tank and cooling')) {
        addHousing(group, paint, dark);
        for (let i = 0; i < 9; i += 1) mesh(group, block(.06, .71, .25), paint, [-.54 + i * .13, 0, .61]);
        break;
      }
      disc(group, .45, 1.25, paint);
      for (const x of [-.52, .52]) ring(group, .44, .045, dark, x);
      mesh(group, radial(.09, .19), copper, [0, .49, 0]);
      break;
    case 'bolt':
    case 'screw':
    case 'pin':
    case 'jet':
    case 'sensor':
      disc(group, .14, 1.12, paint);
      disc(group, .28, .22, dark, -.49, 0, 0, 6);
      if (part.shape === 'jet') disc(group, .11, .30, copper, .58);
      if (part.shape === 'screw' || part.shape === 'bolt') {
        const thread = Array.from({ length: 61 }, (_, i) => [i / 60 * .6, .15 * Math.sin(i / 10 * Math.PI * 2), .15 * Math.cos(i / 10 * Math.PI * 2)]);
        wire(group, thread, .025, paint);
      }
      break;
    case 'filter':
    case 'insulator':
      mesh(group, radial(.16, 1.22), paint);
      for (let i = 0; i < 9; i += 1) mesh(group, radial(.36 - i % 2 * .04, .05), paint, [0, -.46 + i * .115, 0]);
      mesh(group, radial(.21, .11), dark, [0, -.57, 0]);
      break;
    case 'cell':
      addCell(group, paint, dark, copper, /prismatic|pouch|solar/.test(name));
      break;
    case 'board':
    case 'chip':
      if (name.includes('processor die')) addDie(group, paint, dark, copper);
      else addBoard(group, green, dark, copper, paint, /substrate|printed|laminate/.test(name));
      break;
    case 'screen':
    case 'panel':
    case 'plate':
    case 'layer':
      if (name.includes('gamma-prime')) {
        mesh(group, block(1.27, .12, .92), dark, [0, -.13, 0]);
        for (let x = -2; x <= 2; x += 1) {
          for (let z = -1; z <= 1; z += 1) mesh(group, block(.14, .13, .14), paint, [x * .23, -.025, z * .24]);
        }
        break;
      }
      mesh(group, block(1.28, .07, .9), paint);
      if (part.shape === 'screen' || part.shape === 'panel') {
        for (let i = 0; i < 7; i += 1) mesh(group, block(1.19, .017, .035), dark, [0, .04, -.36 + i * .12]);
      }
      break;
    case 'stack':
      if (name.includes('transmission tower')) addTower(group, paint, dark);
      else if (name.includes('heat sink')) addFinBank(group, paint, dark);
      else if (name === 'battery module') {
        mesh(group, block(1.43, .15, .93), dark, [0, -.43, 0]);
        for (let i = 0; i < 6; i += 1) {
          mesh(group, block(.18, .73, .74), paint, [-.54 + i * .215, 0, 0]);
          for (const z of [-.25, .25]) mesh(group, block(.11, .08, .12), copper, [-.54 + i * .215, .39, z]);
        }
      } else {
        const layers = name.includes('coating') ? [dark, copper, paint, finish(palette.ceramic)] : [dark, paint, dark, paint, dark, paint];
        layers.forEach((layer, index) => mesh(group, block(1.10, .05, .80), layer, [0, index * .095 - .23, 0]));
      }
      break;
    case 'switch':
    case 'contact':
      for (const x of [-.46, .46]) {
        mesh(group, block(.29, .44, .36), dark, [x, -.22, 0]);
        disc(group, .15, .37, copper, x, .06, 0);
      }
      mesh(group, block(.75, .10, .24), paint, [0, .24, 0], [0, 0, -.44]);
      break;
    case 'magnet':
      ring(group, .46, .16, paint, -.1, 0, 0, Math.PI * 1.54);
      break;
    default:
      mesh(group, block(1.02, .58, .76), paint);
      mesh(group, block(1.07, .12, .80), dark, [0, -.29, 0]);
      for (const z of [-.27, .27]) disc(group, .059, .06, copper, .53, .10, z);
  }
  const bounds = new THREE.Box3().setFromObject(group);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const display = new THREE.Group();
  group.position.copy(center).negate();
  display.add(group);
  display.scale.setScalar(1.55 / Math.max(size.x, size.y, size.z));
  return display;
}
