import * as THREE from 'three';
import { partModel } from './part-models.js';

const origin = new THREE.Vector3();
const size = new THREE.Vector3();
const white = new THREE.Color(0xffffff);

function visibleParts(nodes) {
  return nodes.filter((node) => node?.isObject3D);
}

function boundsFor(nodes) {
  const bounds = new THREE.Box3();
  for (const node of nodes) bounds.expandByObject(node, true);
  return bounds;
}

function positionFor(owner, entry, nodes) {
  if (entry?.anchor) return owner.localToWorld(new THREE.Vector3(...entry.anchor));
  const bounds = boundsFor(nodes);
  return bounds.isEmpty() ? owner.getWorldPosition(new THREE.Vector3()) : bounds.getCenter(new THREE.Vector3());
}

function partEntry(table, part, index) {
  const indexed = table?.[index];
  return table?.find((entry) => entry?.name === part.name) ?? (indexed?.name ? undefined : indexed);
}

function disposePart(object) {
  const paints = new Set();
  object.traverse((node) => {
    node.geometry?.dispose();
    if (node.material) paints.add(node.material);
  });
  for (const material of paints) material.dispose();
  object.removeFromParent();
}

export function createOnsiteAssembly(model) {
  const accent = new THREE.PointLight(0xffba71, 3.5, 2.4, 2);
  const diagram = new THREE.Group();
  diagram.name = 'On-site schematic details';
  diagram.add(accent);
  model.add(diagram);
  const fades = new Map();
  const revealed = new Map();
  const changes = new Map();
  const temporary = new Set();
  let hierarchy = [];
  let selected = -1;
  let current = null;
  let motion = null;
  let mix = 1;
  let housingOpen = false;

  function reveal(nodes = []) {
    for (const object of nodes) {
      if (!revealed.has(object)) revealed.set(object, object.visible);
      object.visible = true;
    }
  }

  function ghost(nodes = [], alpha = .13) {
    for (const object of nodes) {
      object.traverse((mesh) => {
        if (!mesh.isMesh || !mesh.material) return;
        let state = fades.get(mesh);
        if (!state) {
          const original = mesh.material;
          const clones = (Array.isArray(original) ? original : [original]).map((material) => {
            const clone = material.clone();
            clone.transparent = true;
            clone.depthWrite = false;
            return clone;
          });
          state = { original, clones, alpha, shadows: mesh.castShadow, order: mesh.renderOrder };
          fades.set(mesh, state);
          mesh.material = Array.isArray(original) ? clones : clones[0];
          mesh.castShadow = false;
          mesh.renderOrder = 6;
        }
        state.alpha = Math.min(state.alpha, alpha);
        setOpacity(state, mix);
      });
    }
  }

  function setOpacity(state, ratio) {
    state.clones.forEach((material, index) => {
      const original = Array.isArray(state.original) ? state.original[index] : state.original;
      material.opacity = original.opacity * THREE.MathUtils.lerp(1, state.alpha, ratio);
    });
  }

  function restore() {
    for (const [node, offset] of changes) node.position.copy(offset.original);
    for (const [mesh, state] of fades) {
      mesh.material = state.original;
      mesh.castShadow = state.shadows;
      mesh.renderOrder = state.order;
      for (const material of state.clones) material.dispose();
    }
    for (const [object, wasVisible] of revealed) object.visible = wasVisible;
    for (const object of temporary) disposePart(object);
    temporary.clear();
    changes.clear();
    fades.clear();
    revealed.clear();
    hierarchy = [];
    current = null;
    motion = null;
    mix = 1;
    housingOpen = false;
    accent.visible = false;
    model.updateWorldMatrix(true, true);
  }

  function addDetail(part, localOrigin, displayScale) {
    const item = partModel(part);
    item.position.copy(localOrigin);
    item.scale.multiplyScalar(displayScale);
    diagram.add(item);
    temporary.add(item);
    return item;
  }

  function offsetNode(node, direction) {
    const parent = node.parent;
    if (!parent) return null;
    const localOffset = new THREE.Matrix3().setFromMatrix4(parent.matrixWorld).invert();
    return { node, original: node.position.clone(), delta: direction.clone().applyMatrix3(localOffset) };
  }

  function apply(level, amount) {
    for (const item of level.items) {
      for (const { node, original, delta } of item.offsets) node.position.copy(original).addScaledVector(delta, amount);
      item.anchor.copy(item.originalAnchor).addScaledVector(item.delta, amount);
      for (const { node, originalScale } of item.births) node.scale.copy(originalScale).multiplyScalar(THREE.MathUtils.lerp(.78, 1, amount));
    }
    model.updateWorldMatrix(true, true);
  }

  function createLevel(node, owner, center, displayScale, depth) {
    const table = owner?.userData.inspection;
    if (owner) reveal(owner.userData.inspectionHidden);
    model.updateWorldMatrix(true, true);
    const isLeaf = !node.children?.length;
    const parts = node.children?.length ? node.children : [node];
    const live = parts.map((part, index) => visibleParts(partEntry(table, part, index)?.nodes ?? []));
    const isSchematic = live.some((nodes) => !nodes.length);
    const footprint = new THREE.Box3();
    for (const nodes of live) {
      for (const mesh of nodes) footprint.expandByObject(mesh, true);
    }
    const span = Math.max(displayScale * 1.25, footprint.getSize(size).length() * .19);
    const liveCenter = footprint.isEmpty() ? center : footprint.getCenter(new THREE.Vector3());
    const layout = {
      node, items: [], depth, isSchematic,
      focus: center.clone(), radius: displayScale * 1.12, extent: new THREE.Vector3(displayScale, displayScale, displayScale),
    };
    if (owner) {
      const shell = owner.userData.inspectionShell;
      if (shell?.length) ghost(shell);
      if (depth === 0 && isSchematic && live.every((nodes) => !nodes.length)) ghost(owner.children.filter((node) => node !== diagram), .17);
    }

    parts.forEach((part, index) => {
      const meta = partEntry(table, part, index);
      const genuine = live[index].length > 0;
      const offsetCenter = index - (parts.length - 1) / 2;
      const worldAnchor = genuine ? positionFor(owner, meta, live[index]) : center.clone();
      let nodes = live[index];
      if (!genuine) {
        const localCenter = model.worldToLocal(center.clone());
        const detail = addDetail(part, localCenter, displayScale);
        nodes = [detail];
        if (!depth && isSchematic && live.some((group) => group.length)) {
          worldAnchor.y += displayScale * .88;
          detail.position.copy(model.worldToLocal(worldAnchor.clone()));
        }
      }
      let direction;
      if (genuine && meta.axis) direction = new THREE.Vector3(...meta.axis).normalize();
      else if (genuine) {
        direction = worldAnchor.clone().sub(liveCenter);
        if (direction.lengthSq() < .05) direction.set(Math.sign(offsetCenter) || 0, 1, -.22);
        direction.normalize();
      } else {
        direction = new THREE.Vector3(offsetCenter, (index % 2 ? .25 : -.10), index % 2 ? -.15 : .22);
      }
      const spread = genuine
        ? (meta.distance ?? span * (parts.length > 4 ? .98 : .77))
        : displayScale * 1.31;
      const delta = direction.multiplyScalar(isLeaf ? 0 : spread);
      if (genuine && meta.axis) {
        const worldDirection = owner.localToWorld(delta.clone()).sub(owner.localToWorld(origin.clone()));
        delta.copy(worldDirection);
      }
      model.updateWorldMatrix(true, true);
      const offsets = nodes.map((node) => offsetNode(node, delta)).filter(Boolean);
      for (const change of offsets) if (!changes.has(change.node)) changes.set(change.node, change);
      const item = {
        part, nodes, delta, offsets, genuine, index,
        anchor: worldAnchor.clone(),
        originalAnchor: worldAnchor,
        births: genuine ? [] : nodes.map((node) => ({ node, originalScale: node.scale.clone() })),
        detailOwner: nodes.find((node) => node.userData.inspection?.length),
      };
      layout.items.push(item);
    });
    if (!layout.items.length) return layout;

    const explosionBounds = new THREE.Box3();
    for (const item of layout.items) {
      const itemBounds = boundsFor(item.nodes).translate(item.delta);
      if (itemBounds.isEmpty()) explosionBounds.expandByPoint(item.originalAnchor.clone().add(item.delta));
      else explosionBounds.union(itemBounds);
    }
    if (!explosionBounds.isEmpty()) {
      explosionBounds.getCenter(layout.focus);
      const extent = explosionBounds.getSize(layout.extent);
      layout.radius = Math.max(displayScale * .42, extent.x * .43, extent.y * .64, extent.z * .37);
    }
    return layout;
  }

  function configure(ancestry, index, reduced, inside) {
    const parents = ancestry ?? [];
    const sameHierarchy = hierarchy.length === parents.length && hierarchy.every((level, offset) => level.node === parents[offset]);
    selected = index;
    if (sameHierarchy && housingOpen === Boolean(inside) && !motion?.closing) return;
    restore();
    if (!parents.length) {
      if (inside) {
        reveal(model.userData.inspectionHidden);
        ghost(model.userData.inspectionShell);
        housingOpen = true;
        if (!reduced) motion = { start: performance.now(), duration: 440, closing: false, housing: true };
      }
      return;
    }
    const bounds = boundsFor([model]);
    const center = bounds.getCenter(new THREE.Vector3());
    const extent = bounds.getSize(new THREE.Vector3());
    const scale = THREE.MathUtils.clamp(Math.max(extent.x, extent.y, extent.z) * .24, .72, 1.48);
    let owner = model;
    let nextCenter = center;
    let displayScale = scale;
    for (const [depth, node] of parents.entries()) {
      const level = createLevel(node, owner, nextCenter, displayScale, depth);
      hierarchy.push(level);
      const branch = parents[depth + 1];
      if (!branch) break;
      apply(level, 1);
      const picked = level.items.find((item) => item.part === branch || item.part.name === branch.name);
      if (!picked) break;
      for (const item of level.items) {
        if (item !== picked) {
          if (item.genuine) ghost(item.nodes, .17);
          else for (const child of item.nodes) child.visible = false;
        }
      }
      nextCenter = picked.anchor.clone();
      owner = picked.detailOwner;
      const selectedBounds = boundsFor(picked.nodes);
      const selectedSize = selectedBounds.getSize(size);
      const physicalScale = Math.max(selectedSize.x, selectedSize.y, selectedSize.z) * .44;
      displayScale = Math.max(.075, Math.min(displayScale * .70, physicalScale || .1));
      if (!owner) ghost(picked.nodes, .18);
    }
    current = hierarchy.at(-1);
    housingOpen = Boolean(inside);
    mix = reduced ? 1 : 0;
    for (const state of fades.values()) setOpacity(state, mix);
    if (reduced) apply(current, 1);
    else motion = { start: performance.now(), duration: current.depth ? 600 : 780, closing: false, housing: false };
  }

  function close(reduced, inside = false) {
    if (reduced || !hierarchy.length) {
      restore();
      if (inside) configure([], -1, true, true);
    } else {
      motion = { start: performance.now(), duration: 520, startMix: mix, closing: true, inside };
    }
  }

  function settle() {
    if (!motion) return;
    if (motion.closing) {
      close(true, motion.inside);
      return;
    }
    motion = null;
    mix = 1;
    for (const state of fades.values()) setOpacity(state, mix);
    if (current) apply(current, mix);
  }

  function animate(now) {
    if (motion) {
      const elapsed = THREE.MathUtils.clamp((now - motion.start) / motion.duration, 0, 1);
      const eased = elapsed * elapsed * (3 - 2 * elapsed);
      mix = motion.closing ? motion.startMix * (1 - eased) : eased;
      for (const state of fades.values()) setOpacity(state, mix);
      if (motion.closing) {
        for (const level of hierarchy) apply(level, level === current ? mix : 1 - eased);
        if (elapsed > .34) for (const object of temporary) object.visible = false;
      } else if (current && !motion.housing) {
        apply(current, mix);
      }
      if (elapsed === 1) settle();
    }
    const selectedPart = current?.items[selected];
    accent.visible = Boolean(selectedPart);
    if (selectedPart) {
      accent.position.copy(model.worldToLocal(selectedPart.anchor.clone()));
      accent.position.y += current.radius * .22;
      accent.intensity = THREE.MathUtils.clamp(current.radius * 1.9, .16, 4.3);
      accent.distance = current.radius * 1.28;
    }
  }

  return {
    configure, close, restore, animate, settle,
    get active() { return current; },
    get animating() { return Boolean(motion); },
    get selected() { return selected; },
  };
}

const forms = {
  chemical: 0xffaf67, fuel: 0xffaf67, thermal: 0xff795e, mechanical: 0xffda89, shaft: 0xffda89,
  ac: 0x76e6ff, dc: 0xc29cff, fluid: 0xa7f0bb, light: 0xffe592, magnetic: 0x8ab5ff,
};

function glowMap() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(48, 48, 1, 48, 48, 47);
  gradient.addColorStop(0, 'rgba(255,255,255,0.96)');
  gradient.addColorStop(.16, 'rgba(255,255,255,0.94)');
  gradient.addColorStop(.26, 'rgba(255,255,255,0.28)');
  gradient.addColorStop(.65, 'rgba(255,255,255,0.06)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 96, 96);
  return new THREE.CanvasTexture(canvas);
}

export function createGuideParticles(scene) {
  const group = new THREE.Group();
  group.name = 'Guided energy packet';
  scene.add(group);
  const map = glowMap();
  const beads = Array.from({ length: 7 }, () => {
    const material = new THREE.SpriteMaterial({
      map, color: 0xffffff, transparent: true, depthTest: false, depthWrite: false,
      toneMapped: false, blending: THREE.AdditiveBlending,
    });
    const bead = new THREE.Sprite(material);
    bead.renderOrder = 15;
    group.add(bead);
    return bead;
  });
  const color = new THREE.Color();
  const outputTint = new THREE.Color();
  let path;
  let marker;
  let started = 0;
  let form;
  let inputForm;
  let lastBeat;
  let reduced = false;

  function set(beat, model, quiet) {
    reduced = quiet;
    if (!beat?.at || !model) {
      group.visible = false;
      lastBeat = undefined;
      return;
    }
    group.visible = true;
    if (lastBeat === beat) return;
    lastBeat = beat;
    marker = model.localToWorld(new THREE.Vector3(...beat.at));
    const points = (beat.path ?? []).map((point) => model.localToWorld(new THREE.Vector3(...point)));
    path = null;
    if (points.length > 1) {
      path = new THREE.CurvePath();
      for (let index = 1; index < points.length; index += 1) {
        if (points[index - 1].distanceToSquared(points[index]) > .00001) {
          path.add(new THREE.LineCurve3(points[index - 1], points[index]));
        }
      }
      if (!path.curves.length) path = null;
    }
    form = forms[beat.form] ?? forms.ac;
    inputForm = forms[beat.inputForm] ?? form;
    started = performance.now();
  }

  function animate(now) {
    if (!group.visible || !marker) return;
    const elapsed = (now - started) / 1000;
    const period = 2.65;
    const cycle = reduced ? period : Math.min(elapsed, period);
    const progress = THREE.MathUtils.clamp(cycle / 1.62, 0, 1);
    const waiting = cycle >= 1.62;
    for (const [index, bead] of beads.entries()) {
      const position = progress - index * (reduced ? .145 : .082);
      bead.visible = index === 0 || Boolean(path && position >= 0 && position < 1 && (reduced || !waiting));
      if (!bead.visible) continue;
      if (path) path.getPointAt(THREE.MathUtils.clamp(position, 0, 1), bead.position);
      else bead.position.copy(marker);
      const fade = index === 0 ? 1 : 1 - index * .12;
      const pulse = index === 0 && !reduced ? .93 + .08 * Math.cos(cycle * Math.PI * 2) : 1;
      bead.scale.setScalar((index === 0 ? .70 : .43) * fade * pulse);
      bead.material.opacity = index === 0 ? .96 : .85 * fade;
      const conversion = index === 0 ? THREE.MathUtils.smootherstep(progress, .84, 1) : 0;
      bead.material.color.copy(color.set(inputForm).lerp(outputTint.set(form), conversion).lerp(white, index === 0 ? .34 : .11));
    }
  }

  return { set, animate };
}
