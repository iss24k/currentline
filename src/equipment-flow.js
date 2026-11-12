import * as THREE from 'three';
import { beatPath, beatPathForm } from './energy-trace.js';

const tints = {
  ac: 0xffd38a, dc: 0xd0b6ff, magnetic: 0x8ad9e8,
  light: 0xffecbc, thermal: 0xffad7a, fuel: 0xffd794, shaft: 0xd3ece5,
};

const solar = [
  ['light', [[0, 2.83, -.29], [0, 1.77, -.16], [0, 1.16, 0]]],
  ['dc', [[0, 1.12, 0], [0, .87, .52], [0, .64, .52], [2.08, .64, .52]]],
];

function polyline(points) {
  const path = new THREE.CurvePath();
  const vertices = points.map((point) => new THREE.Vector3(...point));
  for (let at = 1; at < vertices.length; at += 1) {
    path.add(new THREE.LineCurve3(vertices[at - 1], vertices[at]));
  }
  return path;
}

export function createEquipmentFlow(id, model, size) {
  const segments = id === 'solar' ? solar : Array.from({ length: 4 }, (_, segment) => [
    beatPathForm(id, 'utility', segment), beatPath(id, 'utility', segment),
  ]).filter(([form, points]) => form && points);
  const scale = Math.max(size.x, size.y, size.z);
  const group = new THREE.Group();
  group.name = 'Illustrated energy transfer';
  const geometry = new THREE.SphereGeometry(scale * .0115, 12, 8);
  const paths = segments.map(([form, points], index) => {
    const curve = polyline(points);
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getSpacedPoints(42)),
      new THREE.LineBasicMaterial({ color: tints[form], transparent: true, opacity: .78, depthTest: false, depthWrite: false, toneMapped: false }),
    );
    line.renderOrder = 9;
    const paint = new THREE.MeshBasicMaterial({ color: tints[form], depthTest: false, depthWrite: false, toneMapped: false });
    const beads = Array.from({ length: 3 }, () => {
      const bead = new THREE.Mesh(geometry, paint);
      bead.renderOrder = 10;
      group.add(bead);
      return bead;
    });
    group.add(line);
    return { curve, beads, index };
  });
  const origin = performance.now();
  model.add(group);
  return {
    update(now, { visible, quiet }) {
      group.visible = visible;
      if (!visible) return false;
      const elapsed = now - origin;
      for (const { curve, beads, index } of paths) {
        beads.forEach((bead, at) => {
          const position = quiet ? .29 + at * .21 : ((elapsed / 1770 + at * .22 + index * .17) % 1);
          curve.getPointAt(position, bead.position);
          bead.scale.setScalar(at === 0 ? 1 : .72);
        });
      }
      return !quiet && elapsed < 9000 && paths.length > 0;
    },
  };
}
