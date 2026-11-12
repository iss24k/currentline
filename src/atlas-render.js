import * as THREE from 'three';

const TAU = Math.PI * 2;
const worldScale = .001;
const routeColor = '#e4c995';
const spurColor = '#fff1ca';
const viewportRay = new THREE.Raycaster();
const hits = Array.from({ length: 4 }, () => new THREE.Vector3());
const ndc = new THREE.Vector2();
const projected = new THREE.Vector3();
const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
const ramp = (a, b, v) => THREE.MathUtils.smoothstep(v, a, b);

export function atlasProjection(bounds) {
  const [west, south, east, north] = bounds;
  const center = [(west + east) / 2, (south + north) / 2];
  function point([x, y]) {
    return new THREE.Vector3((x - center[0]) * worldScale, 0, (center[1] - y) * worldScale);
  }
  function rect([left, bottom, right, top]) {
    const a = point([left, top]);
    const b = point([right, bottom]);
    return { x: a.x, z: a.z, w: b.x - a.x, h: b.z - a.z };
  }
  return { point, rect };
}

function channels(keyframes, sample) {
  const index = keyframes.findIndex((frame) => frame.at >= sample);
  if (index <= 0) return keyframes[index === 0 ? 0 : keyframes.length - 1];
  const a = keyframes[index - 1];
  const b = keyframes[index];
  const duration = b.at - a.at;
  const t = (sample - a.at) / duration;
  const t2 = t * t;
  const t3 = t2 * t;
  const out = {};
  for (const channel of ['location', 'span', 'tilt', 'heading', 'frame']) {
    const slope = (b[channel] - a[channel]) / duration;
    const left = keyframes[index - 2];
    const right = keyframes[index + 1];
    const tangent = (other) => other * slope > 0 ? (2 * other * slope) / (other + slope) : 0;
    const before = left ? tangent((a[channel] - left[channel]) / (a.at - left.at)) : 0;
    const after = right ? tangent((right[channel] - b[channel]) / (right.at - b.at)) : 0;
    out[channel] = (2 * t3 - 3 * t2 + 1) * a[channel] + (t3 - 2 * t2 + t) * before * duration
      + (-2 * t3 + 3 * t2) * b[channel] + (t3 - t2) * after * duration;
  }
  return out;
}

/** The aerial track is deliberately geographic. It does not trace a utility's network. */
export function atlasFlight(start, end, solarSpur = []) {
  const length = start.distanceTo(end);
  const bearing = Math.atan2(start.x - end.x, start.z - end.z);
  const close = Math.max(2.4, Math.min(3.5, length * .054));
  const degrees = Math.PI / 180;
  const hasSpur = solarSpur.length > 1;
  const spurCenter = hasSpur ? solarSpur[0].clone().lerp(solarSpur.at(-1), .50) : null;
  const spurFrames = hasSpur ? [
    [.33, 0, close, 32, -22, .62],
    [.383, 0, 1.65, 25, -12, .63],
    [.422, 0, 1.65, 25, -12, .63],
  ] : [[.36, 0, close, 32, -22, .62]];
  const keys = [
    [0, .49, length * 1.73, 8, -8, .55],
    [.14, .18, length * .48, 18, -15, .56],
    [.28, 0, close, 32, -22, .62],
    ...spurFrames,
    [.475, .16, length * .36, 22, -11, .57],
    [.55, .48, length * 1.69, 9, -8, .55],
    [.63, .52, length * 1.57, 10, -7, .55],
    [.75, .82, length * .37, 22, 10, .57],
    [.89, .983, length * .102, 31, 14, .61],
    [1, 1, close * .85, 34, 11, .62],
  ].map(([at, location, span, tilt, heading, frame]) => ({
    at, location, span: Math.log(span), tilt: tilt * degrees, heading: bearing + heading * degrees, frame,
  }));
  return (progress, reduced) => {
    const clamped = THREE.MathUtils.clamp(progress, 0, 1);
    const position = reduced ? (clamped < .14 ? 0 : clamped < .45 ? .28 : clamped < .77 ? .55 : 1) : clamped;
    const state = channels(keys, position);
    const span = Math.exp(state.span);
    const point = start.clone().lerp(end, state.location);
    if (spurCenter) point.lerp(spurCenter, ramp(.323, .383, position) * (1 - ramp(.428, .515, position)));
    return { ...state, span, point, progress: position };
  };
}

function loadPhoto(layer, priority) {
  const image = new Image();
  image.decoding = 'async';
  image.fetchPriority = priority;
  return new Promise((resolve, reject) => {
    image.onload = () => {
      if (image.decode) image.decode().catch(() => {}).then(() => resolve(image));
      else resolve(image);
    };
    image.onerror = () => reject(new Error(`Could not load aerial imagery ${layer.src}`));
    image.src = layer.src;
  });
}

function textureFor(image, renderer, viewportPixels) {
  const maxTexture = Math.min(renderer.capabilities.maxTextureSize, Math.max(3072, Math.ceil(viewportPixels * 1.8)));
  if (Math.max(image.naturalWidth, image.naturalHeight) > maxTexture) {
    const resample = document.createElement('canvas');
    const ratio = maxTexture / Math.max(image.naturalWidth, image.naturalHeight);
    resample.width = Math.floor(image.naturalWidth * ratio);
    resample.height = Math.floor(image.naturalHeight * ratio);
    resample.getContext('2d').drawImage(image, 0, 0, resample.width, resample.height);
    image = resample;
  }
  const texture = new THREE.Texture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(10, renderer.capabilities.getMaxAnisotropy());
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function elevationSampler(image, rect, scale) {
  const canvas = document.createElement('canvas');
  const width = canvas.width = image.naturalWidth;
  const height = canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, width, height);
  // Horizontal Web Mercator scale is about 1.19 at the Arizona latitude.
  const elevationUnit = scale * worldScale / Math.cos(33.1 * Math.PI / 180);
  const heightAt = (column, row) => {
    const offset = (row * width + column) * 4;
    return (256 * data[offset] + data[offset + 1]) * elevationUnit;
  };
  return (x, z) => {
    const column = THREE.MathUtils.clamp((x - rect.x) / rect.w * width - .5, 0, width - 1);
    const row = THREE.MathUtils.clamp((z - rect.z) / rect.h * height - .5, 0, height - 1);
    const c0 = Math.floor(column);
    const r0 = Math.floor(row);
    const c1 = Math.min(c0 + 1, width - 1);
    const r1 = Math.min(r0 + 1, height - 1);
    const above = THREE.MathUtils.lerp(heightAt(c0, r0), heightAt(c1, r0), column - c0);
    const below = THREE.MathUtils.lerp(heightAt(c0, r1), heightAt(c1, r1), column - c0);
    return THREE.MathUtils.lerp(above, below, row - r0);
  };
}

function photoGeometry(rect, elevation) {
  const segments = (dimension) => elevation ? Math.max(1, Math.ceil(dimension / .46)) : 1;
  const geometry = new THREE.PlaneGeometry(rect.w, rect.h, segments(rect.w), segments(rect.h));
  geometry.rotateX(-Math.PI / 2);
  if (elevation) {
    const positions = geometry.attributes.position;
    const centerX = rect.x + rect.w / 2;
    const centerZ = rect.z + rect.h / 2;
    for (let vertex = 0; vertex < positions.count; vertex += 1) {
      positions.setY(vertex, elevation(positions.getX(vertex) + centerX, positions.getZ(vertex) + centerZ));
    }
    positions.needsUpdate = true;
  }
  return geometry;
}

function photoPlane(rect, texture, isPatch, index, elevation) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      image: { value: texture },
      blend: { value: isPatch ? 0 : 1 },
      edge: { value: isPatch ? .09 : 0 },
    },
    vertexShader: `
      varying vec2 imageUV;
      void main() {
        imageUV = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D image;
      uniform float blend;
      uniform float edge;
      varying vec2 imageUV;
      void main() {
        vec3 color = texture2D(image, imageUV).rgb;
        float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
        color = mix(vec3(luma), color, 0.91) * vec3(0.95, 0.98, 1.02);
        vec2 borders = min(imageUV, 1.0 - imageUV);
        float opacity = edge > 0.0 ? smoothstep(0.0, edge, min(borders.x, borders.y)) : 1.0;
        gl_FragColor = vec4(color, opacity * blend);
        #include <colorspace_fragment>
      }
    `,
    transparent: isPatch,
    depthWrite: !isPatch,
    depthTest: !isPatch,
    toneMapped: false,
  });
  const plane = new THREE.Mesh(photoGeometry(rect, elevation), material);
  plane.position.set(rect.x + rect.w / 2, 0, rect.z + rect.h / 2);
  plane.renderOrder = index;
  return plane;
}

function resolution(width, height) {
  return Math.min(window.devicePixelRatio || 1, 2.5, 3840 / width, 2160 / height);
}

function fitDistance(camera, focus, offset, distance, bounds, groundPlane) {
  // Keep the photograph's true extent under all four corners even while tilted.
  camera.position.copy(focus).addScaledVector(offset, distance);
  camera.lookAt(focus);
  camera.updateMatrixWorld();
  let ratio = 1;
  for (const [index, [x, y]] of corners.entries()) {
    viewportRay.setFromCamera(ndc.set(x, y), camera);
    const p = viewportRay.ray.intersectPlane(groundPlane, hits[index]);
    if (!p) continue;
    const dx = p.x - focus.x;
    const dz = p.z - focus.z;
    const roomX = dx < 0 ? focus.x - bounds.x : bounds.x + bounds.w - focus.x;
    const roomZ = dz < 0 ? focus.z - bounds.z : bounds.z + bounds.h - focus.z;
    if (dx) ratio = Math.min(ratio, roomX / Math.abs(dx));
    if (dz) ratio = Math.min(ratio, roomZ / Math.abs(dz));
  }
  if (ratio < 1) {
    camera.position.copy(focus).addScaledVector(offset, distance * Math.max(.09, ratio * .985));
    camera.lookAt(focus);
    camera.updateMatrixWorld();
  }
}

function opacityFor(patch, span) {
  const threshold = Math.max(patch.rect.w, patch.rect.h);
  return 1 - ramp(threshold * .85, threshold * 2.7, span);
}

export function createAtlasRenderer(container, projection, layers, bounds, onImage, relief) {
  const footprint = projection.rect(bounds);
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const data = layers.map((layer) => ({ ...layer, rect: projection.rect(layer.bounds) }));
  const canvas = document.createElement('canvas');
  canvas.className = 'atlas-terrain';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block' });
  let renderer;
  let scene;
  let camera;
  let ctx;
  let live = true;
  let width = 1;
  let height = 1;
  let ratio = 1;
  let elevation;
  let fallbackPose;
  let fallbackCanvas = canvas;
  try {
    const context = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (context) {
      renderer = new THREE.WebGLRenderer({ canvas, context, alpha: false });
      renderer.setClearColor('#151d21');
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(36, 1, .015, 1500);
    }
  } catch {
    renderer?.dispose();
    renderer = undefined;
  }
  if (!renderer) {
    fallbackCanvas = canvas.cloneNode();
    ctx = fallbackCanvas.getContext('2d', { alpha: false });
  }
  container.prepend(renderer ? canvas : fallbackCanvas);
  function requestLayer(layer, index) {
    if (layer.requested) return;
    layer.requested = true;
    loadPhoto(layer, index === 0 ? 'high' : 'auto').then((image) => {
      if (!live) return;
      if (renderer) {
        layer.texture = textureFor(image, renderer, Math.max(width, height) * ratio);
        layer.mesh = photoPlane(layer.rect, layer.texture, index > 0, index, elevation);
        scene.add(layer.mesh);
      } else {
        layer.image = image;
      }
      onImage(index, true);
    }).catch(() => { if (live) onImage(index, false); });
  }
  requestLayer(data[0], 0);
  const solarContext = data.findIndex((layer) => layer.site === 'solar');
  if (solarContext > 0) requestLayer(data[solarContext], solarContext);
  if (renderer && relief) {
    loadPhoto(relief, 'auto').then((image) => {
      if (!live) return;
      elevation = elevationSampler(image, projection.rect(relief.bounds), relief.scale);
      for (const layer of data) {
        if (!layer.mesh) continue;
        layer.mesh.geometry.dispose();
        layer.mesh.geometry = photoGeometry(layer.rect, elevation);
      }
      onImage(-1, true);
    }).catch(() => {});
  }

  function resize(nextWidth, nextHeight) {
    width = nextWidth;
    height = nextHeight;
    ratio = resolution(width, height);
    if (renderer) {
      renderer.setPixelRatio(ratio);
      renderer.setSize(width, height, false);
    } else {
      fallbackCanvas.width = Math.round(width * ratio);
      fallbackCanvas.height = Math.round(height * ratio);
    }
  }

  function render(state, pan) {
    // The regional photograph is always available. Decode closer views ahead of
    // each approach so a first frame does not compete with every texture load.
    data.forEach((layer, index) => {
      if (layer.site === 'solar' && state.progress > .035) requestLayer(layer, index);
      if (layer.site === 'mesa' && state.progress > .40) requestLayer(layer, index);
    });
    const aspect = width / height;
    const frame = aspect < .85 ? .53 : state.frame;
    const span = state.span * Math.max(1, .68 / aspect);
    const focus = state.point.clone().add(pan);
    focus.x = THREE.MathUtils.clamp(focus.x, footprint.x + .03, footprint.x + footprint.w - .03);
    focus.z = THREE.MathUtils.clamp(focus.z, footprint.z + .03, footprint.z + footprint.h - .03);
    if (renderer) {
      focus.y = elevation?.(focus.x, focus.z) ?? 0;
      groundPlane.constant = -focus.y;
      camera.setViewOffset(width, height, -(frame - .5) * width, 0, width, height);
      const tilt = state.tilt;
      const az = state.heading;
      const offset = new THREE.Vector3(Math.sin(tilt) * Math.sin(az), Math.cos(tilt), Math.sin(tilt) * Math.cos(az));
      const range = span / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
      fitDistance(camera, focus, offset, range, footprint, groundPlane);
      for (const [index, layer] of data.entries()) {
        if (!layer.mesh || !index) continue;
        const blend = opacityFor(layer, span);
        layer.mesh.visible = blend > .002;
        layer.mesh.material.uniforms.blend.value = blend;
      }
      renderer.render(scene, camera);
    } else if (ctx) {
      let unitsPerPixel = span / height;
      unitsPerPixel = Math.min(unitsPerPixel, (focus.x - footprint.x) / (width * frame),
        (footprint.x + footprint.w - focus.x) / (width * (1 - frame)),
        (focus.z - footprint.z) / (height * .5), (footprint.z + footprint.h - focus.z) / (height * .5));
      const originX = focus.x - frame * width * unitsPerPixel;
      const originZ = focus.z - .5 * height * unitsPerPixel;
      fallbackPose = { originX, originZ, unitsPerPixel };
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.fillStyle = '#151d21';
      ctx.fillRect(0, 0, width, height);
      for (const [index, layer] of data.entries()) {
        if (!layer.image) continue;
        ctx.globalAlpha = index ? opacityFor(layer, span) : 1;
        const { x, z, w, h } = layer.rect;
        ctx.drawImage(layer.image, (x - originX) / unitsPerPixel, (z - originZ) / unitsPerPixel, w / unitsPerPixel, h / unitsPerPixel);
      }
      ctx.globalAlpha = 1;
    }
  }

  function project(point) {
    if (renderer) {
      projected.copy(point);
      projected.y = elevation?.(point.x, point.z) ?? 0;
      projected.project(camera);
      return { x: (projected.x + 1) * width / 2, y: (1 - projected.y) * height / 2, visible: projected.z > -1 && projected.z < 1 };
    }
    if (!fallbackPose) return { x: 0, y: 0, visible: false };
    const { originX, originZ, unitsPerPixel } = fallbackPose;
    return { x: (point.x - originX) / unitsPerPixel, y: (point.z - originZ) / unitsPerPixel, visible: true };
  }

  function ground(x, y, target) {
    if (renderer) {
      viewportRay.setFromCamera(ndc.set(x / width * 2 - 1, 1 - y / height * 2), camera);
      return viewportRay.ray.intersectPlane(groundPlane, target);
    }
    if (!fallbackPose) return null;
    const { originX, originZ, unitsPerPixel } = fallbackPose;
    return target.set(originX + x * unitsPerPixel, 0, originZ + y * unitsPerPixel);
  }

  function destroy() {
    live = false;
    if (renderer) {
      for (const layer of data) {
        layer.mesh?.geometry.dispose();
        layer.mesh?.material.dispose();
        layer.texture?.dispose();
      }
      renderer.dispose();
      renderer.forceContextLoss();
    }
  }

  return { resize, render, project, ground, destroy, mode: renderer ? '3d' : '2d' };
}

export function createAtlasTrack(container, project, start, end, solarSpur = [], undergroundCount = 0) {
  const canvas = document.createElement('canvas');
  canvas.className = 'atlas-route-overlay';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none' });
  container.append(canvas);
  const context = canvas.getContext('2d');
  const sample = new THREE.Vector3();
  let width = 0;
  let height = 0;
  let ratio = 1;

  function resize(w, h) {
    width = w;
    height = h;
    ratio = resolution(width, height);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }

  function line(points, { color, dashed, alpha, width: lineWidth }) {
    context.globalAlpha = alpha;
    context.beginPath();
    points.forEach((point, index) => {
      if (!point.visible) return;
      if (!index || !points[index - 1].visible) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.lineWidth = lineWidth + 2.4;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.setLineDash(dashed ? [4, 6] : []);
    context.strokeStyle = 'rgba(27, 22, 13, .56)';
    context.stroke();
    context.lineWidth = lineWidth;
    context.strokeStyle = color;
    context.stroke();
    context.setLineDash([]);
  }

  function bead(point, color, alpha) {
    const p = project(point);
    if (!p.visible) return;
    context.globalAlpha = alpha;
    context.shadowBlur = 14;
    context.shadowColor = color;
    context.fillStyle = '#fff0ce';
    context.beginPath();
    context.arc(p.x, p.y, 3.5, 0, TAU);
    context.fill();
    context.shadowBlur = 0;
  }

  function solarInterconnect(progress) {
    if (solarSpur.length < 2) return;
    const alpha = ramp(.336, .365, progress) * (1 - ramp(.44, .475, progress));
    if (alpha < .01) return;
    const points = solarSpur.map(project);
    const junction = Math.min(points.length, Math.max(1, undergroundCount));
    if (junction > 1) line(points.slice(0, junction), { color: spurColor, dashed: true, alpha, width: 2 });
    line(points.slice(junction - 1), { color: spurColor, dashed: false, alpha, width: 2 });
    const travel = ramp(.358, .445, progress) * (solarSpur.length - 1);
    const segment = Math.min(solarSpur.length - 2, Math.floor(travel));
    if (travel > 0 && travel < solarSpur.length - 1) {
      bead(sample.copy(solarSpur[segment]).lerp(solarSpur[segment + 1], travel - segment), spurColor, alpha);
    }
  }

  function render(state) {
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    solarInterconnect(state.progress);
    const alpha = (1 - ramp(.06, .19, state.progress)) * .59 + ramp(.468, .537, state.progress) * (1 - ramp(.85, .98, state.progress)) * .92;
    if (alpha > .015) {
      const points = Array.from({ length: 41 }, (_, index) => project(sample.copy(start).lerp(end, index / 40)));
      line(points, { color: routeColor, dashed: true, alpha, width: 1.6 });
      const t = ramp(.465, .91, state.progress);
      if (t > .001 && t < .999) bead(sample.copy(start).lerp(end, t), routeColor, alpha);
    }
    context.globalAlpha = 1;
  }

  return { resize, render };
}
