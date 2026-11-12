import { Vector3, MathUtils } from 'three';
import { atlas } from './atlas-data.js';
import { atlasProjection, atlasFlight, createAtlasRenderer, createAtlasTrack } from './atlas-render.js';

function createPlace(container, name, point, isAvailable = () => true) {
  const marker = document.createElement('div');
  marker.className = 'atlas-place';
  marker.setAttribute('aria-hidden', 'true');
  Object.assign(marker.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    color: '#fff8e8',
    willChange: 'transform, opacity',
  });

  const pin = document.createElement('span');
  Object.assign(pin.style, {
    boxSizing: 'content-box',
    width: '8px',
    height: '8px',
    border: '1px solid #f2dbad',
    borderRadius: '50%',
    background: '#fff0cf',
    boxShadow: '0 0 0 3px #332b1c88, 0 0 16px #f4dbb579',
  });

  const text = document.createElement('span');
  text.textContent = name;
  Object.assign(text.style, {
    padding: '6px 8px',
    borderRadius: '2px',
    background: 'rgba(19, 22, 22, .78)',
    fontSize: '11px',
    fontWeight: '500',
    lineHeight: '1.1',
    letterSpacing: '.02em',
  });

  marker.append(pin, text);
  container.append(marker);
  return { marker, point, isAvailable };
}

function area({ bounds: [west, south, east, north] }) {
  return (east - west) * (north - south);
}

export function createAtlasCamera(host, { onReady, onProgress } = {}) {
  const surface = document.createElement('div');
  surface.className = 'atlas-camera-surface';
  surface.tabIndex = 0;
  surface.setAttribute('role', 'region');
  surface.setAttribute('aria-label', 'Aerial map. Drag to move the map or use the arrow keys. Home resets the view.');
  Object.assign(surface.style, {
    position: 'absolute',
    inset: '0',
    overflow: 'hidden',
    touchAction: 'pan-y',
    cursor: 'grab',
    userSelect: 'none',
    outlineOffset: '-5px',
    background: '#151d21',
  });

  const projection = atlasProjection(atlas.bounds);
  const solar = projection.point(atlas.sites.solar.coords);
  const mesa = projection.point(atlas.sites.mesa.coords);
  const solarSpur = (atlas.track?.solarSpur ?? []).map(projection.point);
  const flight = atlasFlight(solar, mesa, solarSpur);
  const layers = [{ ...atlas.overview, bounds: atlas.overview.bounds ?? atlas.bounds },
    ...[...atlas.patches].sort((a, b) => area(b) - area(a))];

  let width = 0;
  let height = 0;
  let frame = 0;
  let previousTime = 0;
  let progress = 0;
  let displayed = 0;
  let velocity = 0;
  let reported;
  let panAt = 0;
  let reduced = false;
  let state = flight(progress, reduced);
  let gesture;
  let ready;
  let notified = false;
  const pan = new Vector3();
  const target = new Vector3();
  const a = new Vector3();
  const b = new Vector3();

  host.dataset.atlasState = 'loading';
  host.append(surface);
  const terrain = createAtlasRenderer(surface, projection, layers, atlas.bounds, (index, loaded) => {
    if (index === 0) ready = loaded;
    if (index === -1 && loaded) host.dataset.atlasRelief = 'ready';
    schedule();
  }, atlas.relief);
  host.dataset.atlasMode = terrain.mode;
  const track = createAtlasTrack(surface, terrain.project, solar, mesa, solarSpur, atlas.track?.solarSpurUnderground ?? 0);
  const places = [
    createPlace(surface, atlas.sites.solar.name, solar, (p) => p < .34 || p > .46),
    createPlace(surface, atlas.sites.mesa.name, mesa),
  ];
  if (solarSpur.length > 1) {
    for (const feature of [atlas.features?.solarSubstation, atlas.features?.pinalCentral]) {
      if (feature) places.push(createPlace(surface, feature.name, projection.point(feature.coords), (p) => p >= .345 && p <= .46));
    }
  }
  const mesaSubstation = atlas.features?.pricklyPear;
  if (mesaSubstation) {
    places.push(createPlace(surface, mesaSubstation.name, projection.point(mesaSubstation.coords), (p) => p > .95));
  }

  function schedule() {
    if (!frame && width && height) frame = requestAnimationFrame(draw);
  }

  function draw(now) {
    frame = 0;
    const delta = previousTime ? Math.min(40, now - previousTime) : 16;
    previousTime = now;
    const gap = displayed - progress;
    const advancing = Math.abs(gap) > .00012 || Math.abs(velocity) > .00001;
    if (!advancing || reduced) {
      displayed = progress;
      velocity = 0;
    } else {
      // Critically damped spring. Wheel steps keep their position without
      // sending the camera directly from one pose to the next.
      const spring = 1 / 40;
      const decay = Math.exp(-spring * delta);
      const impulse = (velocity + spring * gap) * delta;
      const nextGap = (gap + impulse) * decay;
      if (gap * nextGap <= 0) {
        displayed = progress;
        velocity = 0;
      } else {
        displayed = MathUtils.clamp(progress + nextGap, 0, 1);
        velocity = (velocity - spring * impulse) * decay;
      }
    }
    state = flight(displayed, reduced);
    const moving = pan.distanceToSquared(target) > .000001;
    if (!moving || reduced) pan.copy(target);
    else pan.lerp(target, 1 - Math.exp(-delta / (gesture ? 24 : 128)));
    terrain.render(state, pan);
    track.render(state);

    for (const { marker, point, isAvailable } of places) {
      const p = terrain.project(point);
      const flip = p.x + marker.offsetWidth + 12 > width;
      const pinOffset = flip ? marker.offsetWidth - 5 : 5;
      const isInside = p.visible && p.x > 12 && p.x < width - 12 && p.y > 16 && p.y < height - 16;
      marker.style.visibility = ready && isInside && isAvailable(state.progress) ? 'visible' : 'hidden';
      marker.style.flexDirection = flip ? 'row-reverse' : 'row';
      marker.style.transform = `translate3d(${p.x - pinOffset}px, ${p.y}px, 0) translateY(-50%)`;
    }

    if (ready !== undefined && !notified) {
      notified = true;
      host.dataset.atlasState = ready ? 'ready' : 'unavailable';
      onReady?.({ ok: ready, mode: terrain.mode });
    }
    if (state.progress !== reported) {
      reported = state.progress;
      onProgress?.(reported);
    }
    host.toggleAttribute('data-atlas-moving', Boolean((moving || advancing) && !reduced));
    if ((moving || advancing) && !reduced) schedule();
  }

  const resize = new ResizeObserver(([entry]) => {
    const nextWidth = Math.round(entry.contentRect.width);
    const nextHeight = Math.round(entry.contentRect.height);
    if (!nextWidth || !nextHeight || (nextWidth === width && nextHeight === height)) return;
    width = nextWidth;
    height = nextHeight;
    terrain.resize(width, height);
    track.resize(width, height);
    schedule();
  });
  resize.observe(surface);

  function resetView() {
    target.set(0, 0, 0);
    panAt = progress;
    schedule();
  }

  function moveView(fromX, fromY, toX, toY) {
    if (!terrain.ground(fromX, fromY, a) || !terrain.ground(toX, toY, b)) return;
    target.add(a.sub(b));
    target.clampLength(0, Math.min(7, state.span * .24));
    panAt = progress;
    schedule();
  }

  function pointerDown(event) {
    if (gesture || event.button !== 0) return;
    gesture = { id: event.pointerId, touch: event.pointerType === 'touch', x: event.clientX, y: event.clientY, active: false };
    if (!gesture.touch) surface.setPointerCapture(event.pointerId);
  }

  function pointerMove(event) {
    if (gesture?.id !== event.pointerId) return;
    if (!gesture.active) {
      const x = Math.abs(event.clientX - gesture.x);
      const y = Math.abs(event.clientY - gesture.y);
      if (gesture.touch && y > 8 && y >= x) {
        gesture = undefined;
        return;
      }
      if (gesture.touch ? x < 8 || x < y * 1.3 : x + y < 4) return;
      gesture.active = true;
      surface.setPointerCapture(event.pointerId);
      surface.style.cursor = 'grabbing';
    }
    const rect = surface.getBoundingClientRect();
    moveView(gesture.x - rect.left, gesture.y - rect.top, event.clientX - rect.left, event.clientY - rect.top);
    gesture.x = event.clientX;
    gesture.y = event.clientY;
  }

  function pointerUp(event) {
    if (gesture?.id !== event.pointerId) return;
    gesture = undefined;
    if (surface.hasPointerCapture(event.pointerId)) surface.releasePointerCapture(event.pointerId);
    surface.style.cursor = 'grab';
  }

  function keyDown(event) {
    const step = Math.min(width, height) * .075;
    const x = event.key === 'ArrowLeft' ? step : event.key === 'ArrowRight' ? -step : 0;
    const y = event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0;
    if (x || y) moveView(width / 2, height / 2, width / 2 + x, height / 2 + y);
    else if (event.key === 'Home' || event.key === 'Escape') resetView();
    else return;
    event.preventDefault();
  }

  surface.addEventListener('pointerdown', pointerDown);
  surface.addEventListener('pointermove', pointerMove);
  surface.addEventListener('pointerup', pointerUp);
  surface.addEventListener('pointercancel', pointerUp);
  surface.addEventListener('lostpointercapture', pointerUp);
  surface.addEventListener('keydown', keyDown);

  return {
    attribution: atlas.credits,
    get progress() { return state.progress; },
    render(value, options = {}) {
      const next = Number.isFinite(value) ? MathUtils.clamp(value, 0, 1) : 0;
      const quiet = Boolean(options.reduced);
      const changed = next !== progress || quiet !== reduced;
      progress = next;
      reduced = quiet;
      if (reduced || options.immediate || Math.abs(progress - displayed) > .56) {
        displayed = progress;
        velocity = 0;
      }
      if (!gesture?.active && Math.abs(progress - panAt) > .012 && target.lengthSq()) resetView();
      if (changed || options.immediate) {
        host.toggleAttribute('data-atlas-moving', !reduced);
        schedule();
      }
    },
    resetView,
    destroy() {
      resize.disconnect();
      if (frame) cancelAnimationFrame(frame);
      terrain.destroy();
      surface.remove();
      host.removeAttribute('data-atlas-moving');
      delete host.dataset.atlasState;
      delete host.dataset.atlasMode;
      delete host.dataset.atlasRelief;
    },
  };
}
