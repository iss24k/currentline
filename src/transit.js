import { modelLabels } from './route.js';

const corridorSource = 'https://www.bpa.gov/learn-and-participate/public-involvement-decisions/project-reviews/mcnary-roundup-transmission-line-rebuild';
const mediaBase = `${import.meta.env?.BASE_URL ?? '/'}travel/`;
const photographs = {
  archive: {
    file: 'bpa-corridor.webp',
    credit: 'U.S. Department of Energy · McNary–John Day corridor',
  },
  wooded: {
    file: 'wooded-corridor.webp',
    credit: 'Charles Devaux · Power lines',
  },
};

const shot = (title, medium, meters, kind, extra = {}) => ({
  title, medium, meters, kind, qualifier: 'Illustrative distance', ...extra,
});

const legs = {
  'gas:gas-turbine': shot('From the fuel skid to the turbine', 'Natural gas in a pipe', 120, 'gas'),
  'gas-turbine:alternator': shot('From turbine to generator', 'Rotation through a steel shaft', 6, 'shaft'),
  'nuclear:steam-turbine': shot('From the steam generator to the turbine', 'High-pressure steam in a pipe', 100, 'steam'),
  'steam-turbine:alternator': shot('From turbine to generator', 'Rotation through a steel shaft', 8, 'shaft'),
  'hydro:water-turbine': shot('Down the penstock', 'Pressurized water', 150, 'water'),
  'water-turbine:alternator': shot('Up the turbine shaft', 'Rotation through a steel shaft', 5, 'shaft'),
  'alternator:step-up': shot('Out to the plant transformer', 'Alternating current on a plant connection', 80, 'cable'),
  'solar:solar-inverter': shot('From the panel row to the inverter', 'Direct current in a cable', 120, 'dc'),
  'solar-inverter:step-up': shot('Across the solar plant', 'Alternating current on a collection circuit', 650, 'cable'),
  'wind:wind-converter': shot('Down the wind turbine tower', 'Alternating current in a cable', 90, 'cable'),
  'wind-converter:step-up': shot('Across the wind farm', 'Alternating current on a collection circuit', 2_000, 'cable'),
  'step-up:lines': shot('Out of the switchyard', '230 kV alternating current', 180, 'overhead', { photo: 'archive' }),
  'lines:substation': shot('Across the transmission corridor', '230 kV alternating current', 61_959.744, 'overhead', {
    photo: 'wooded',
    distance: '62 km · 38.5 mi',
    qualifier: 'Documented scale example · BPA McNary–Roundup',
    source: corridorSource,
  }),
  'substation:intake': shot('From substation to data center', '13.8 kV on a distribution feeder', 5_000, 'cable'),
  'intake:site-transformer': shot('From intake to site transformer', '13.8 kV in a feeder cable', 40, 'cable'),
  'site-transformer:transfer': shot('Into the electrical room', '480 V alternating current', 25, 'bus'),
  'transfer:ups': shot('From the transfer switch to the UPS', '480 V alternating current', 20, 'bus'),
  'substation:battery': shot('The utility supply drops', 'The battery bridge takes over inside the site', null, 'outage', {
    qualifier: 'Backup power begins here',
  }),
  'substation:generator': shot('The utility supply drops', 'The generator takes over once it is ready', null, 'outage', {
    qualifier: 'Standby power begins here',
  }),
  'battery:ups': shot('From batteries to the inverter', 'Direct current on the UPS battery feed', 8, 'dc'),
  'generator:transfer': shot('From generator to transfer switch', '480 V alternating current', 30, 'cable'),
  'ups:floor-pdu': shot('From UPS to floor distribution', '480 V alternating current', 30, 'bus'),
  'floor-pdu:busway': shot('Up to the overhead busway', '208Y/120 V alternating current', 10, 'bus'),
  'busway:rack-pdu': shot('From the overhead busway into the rack', '208 V rack feed', 5, 'bus'),
  'rack-pdu:cord': shot('Into the server cord', '208 V alternating current', .3, 'cable'),
  'cord:psu': shot('Through the cord to the power supply', '208 V alternating current', 2, 'cable'),
  'psu:vrm': shot('Across the server board', '12 V direct current', .3, 'board'),
  'vrm:chip': shot('From the regulator to the chip', 'Low-voltage direct current', .04, 'board'),
  'chip:heat': shot('From the chip to the heat sink', 'Heat moves through solid layers', .015, 'heat'),
};

function distanceText(meters) {
  if (meters >= 1_000) return `${(meters / 1_000).toFixed(meters < 10_000 ? 1 : 0).replace(/\.0$/, '')} km`;
  if (meters >= 1) return `${Math.round(meters)} m`;
  if (meters >= .1) return `${Math.round(meters * 100)} cm`;
  return `${Math.round(meters * 1_000)} mm`;
}

/**
 * Distances set the teaching scale of the film. The main architecture is a composite.
 * Reverse travel revisits the destination, while energy still flows in the forward direction.
 */
export function travelFor(from, to) {
  const forward = legs[`${from}:${to}`];
  const reverse = !forward && legs[`${to}:${from}`];
  const leg = forward || reverse;
  if (!leg) return null;
  return {
    ...leg,
    title: reverse ? `Back to ${modelLabels[to]}` : leg.title,
    medium: reverse ? 'Revisiting this part of the route' : leg.medium,
    distance: leg.distance ?? (leg.meters == null ? '' : distanceText(leg.meters)),
    reverse: Boolean(reverse),
  };
}

const kinds = {
  gas: { accent: '#ffbc77', light: '#a6663d', base: [77, 61, 46] },
  steam: { accent: '#ffdfbd', light: '#a79b8d', base: [69, 73, 75] },
  water: { accent: '#96e8ff', light: '#437c84', base: [33, 66, 72] },
  shaft: { accent: '#ffc486', light: '#af825b', base: [73, 73, 68] },
  cable: { accent: '#a1eaff', light: '#8bc3d4', base: [66, 47, 40] },
  dc: { accent: '#efc9ff', light: '#bd86b6', base: [67, 48, 46] },
  bus: { accent: '#a1eaff', light: '#8bb3bf', base: [66, 48, 36] },
  overhead: { accent: '#d0f5ff', light: '#b4dbdf' },
  board: { accent: '#efc9ff', light: '#bb9eb9', base: [58, 72, 55] },
  heat: { accent: '#ffd092', light: '#f2a060', base: [80, 69, 59] },
  outage: { accent: '#ffbd9a', light: '#9a5d46' },
};

const TAU = Math.PI * 2;
const clamp = (value) => Math.max(0, Math.min(1, value));
const smooth = (value) => clamp(value) ** 2 * (3 - 2 * clamp(value));
const cycle = (value, period) => ((value % period) + period) % period;

function polygon(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
  ctx.closePath();
}

function ringPoint(ring, angle, radius = 1) {
  return { x: ring.x + Math.cos(angle) * ring.rx * radius, y: ring.y + Math.sin(angle) * ring.ry * radius };
}

function line(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
}

function ellipse(ctx, ring, scale = 1) {
  ctx.beginPath();
  ctx.ellipse(ring.x, ring.y, Math.max(.4, ring.rx * scale), Math.max(.4, ring.ry * scale), 0, 0, TAU);
}

function pipeRing(w, h, z, phase, shape = 1) {
  const distance = 1 / (z + .53);
  const curve = Math.sin(phase * 2.65 + z * .26) * .15 + Math.sin(z * .14 - phase) * .09;
  return {
    x: w * .58 + h * curve * distance * 2.1,
    y: h * (.47 + Math.cos(phase * 2 + z * .3) * .07 * distance),
    rx: h * distance * 1.08 * shape,
    ry: h * distance * .94,
  };
}

function polishedMetal(ctx, ring, warm, brightness = 1) {
  const g = ctx.createLinearGradient(ring.x - ring.rx, ring.y - ring.ry, ring.x + ring.rx, ring.y + ring.ry);
  g.addColorStop(0, '#131516');
  g.addColorStop(.26, '#5b5b54');
  g.addColorStop(.42, warm);
  g.addColorStop(.54, '#bbb9ae');
  g.addColorStop(.62, '#5e625b');
  g.addColorStop(.83, '#262a2a');
  g.addColorStop(1, '#0a0e0f');
  ctx.globalAlpha = brightness;
  return g;
}

function pellet(ctx, x, y, size, tint, opacity = 1) {
  if (opacity < .015 || size < .25) return;
  const halo = ctx.createRadialGradient(x, y, 0, x, y, size * 5.3);
  halo.addColorStop(0, '#fffef4');
  halo.addColorStop(.16, tint);
  halo.addColorStop(.31, `${tint}88`);
  halo.addColorStop(.61, `${tint}23`);
  halo.addColorStop(1, `${tint}00`);
  ctx.globalAlpha = opacity;
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, size * 5.3, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawPipe(ctx, w, h, time, kind, color) {
  const curve = (z) => pipeRing(w, h, z, time);
  const [r, g, b] = color.base;
  const terminal = curve(25);
  const horizon = ctx.createRadialGradient(terminal.x, terminal.y, 0, terminal.x, terminal.y, h * .52);
  horizon.addColorStop(0, kind === 'water' ? '#255660' : kind === 'steam' ? '#4a4a45' : '#38312a');
  horizon.addColorStop(1, '#090c0d');
  ctx.fillStyle = horizon;
  ctx.fillRect(0, 0, w, h);

  // Depth strips keep the same seam topology as the camera moves around a bend.
  const depth = Array.from({ length: 18 }, (_, i) => .03 + 25 * (i / 17) ** 2.05);
  const walls = depth.map(curve);
  for (let index = walls.length - 2; index >= 0; index -= 1) {
    const near = walls[index];
    const far = walls[index + 1];
    const dark = .30 + .69 * Math.exp(-depth[index] * .137);
    for (let k = 0; k < 28; k += 1) {
      const a = k * TAU / 28;
      const bAngle = (k + 1.05) * TAU / 28;
      const surface = (angle) => {
        const lit = dark * (.50 + .92 * Math.max(0, Math.cos(angle + 1.02)) ** 4 + .26 * Math.cos(angle + .9) ** 2);
        const brushed = Math.sin(index * 2.24) * 1.4;
        return `rgb(${Math.round(r * lit + brushed)},${Math.round(g * lit + brushed)},${Math.round(b * lit + brushed)})`;
      };
      const start = ringPoint(near, a);
      const end = ringPoint(near, bAngle);
      const light = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
      light.addColorStop(0, surface(a));
      light.addColorStop(1, surface(bAngle));
      ctx.fillStyle = light;
      polygon(ctx, [start, end, ringPoint(far, bAngle), ringPoint(far, a)]);
      ctx.fill();
    }
  }

  const phase = cycle(-time * (kind === 'water' ? 18 : 21), 1.8);
  for (let index = 14; index >= 0; index -= 1) {
    const z = index * 1.8 + phase;
    const ring = curve(z);
    const tone = .28 + .7 * Math.exp(-z * .12);
    ellipse(ctx, ring);
    ctx.strokeStyle = `rgb(2 5 6 / ${.8 * tone})`;
    ctx.lineWidth = Math.max(.55, ring.ry * (index % 3 === 0 ? .055 : .023));
    ctx.stroke();
    ellipse(ctx, ring, .987);
    ctx.strokeStyle = polishedMetal(ctx, ring, color.light, .52 * tone);
    ctx.lineWidth = Math.max(.4, ring.ry * (index % 3 === 0 ? .025 : .010));
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  for (let k = 0; k < 32; k += 1) {
    const angle = k * TAU / 32 + .032;
    line(ctx, walls.map((ring) => ringPoint(ring, angle, .991)));
    ctx.strokeStyle = k % 5 === 0 ? 'rgb(239 221 198 / .12)' : 'rgb(6 10 11 / .11)';
    ctx.lineWidth = Math.max(.5, h * .0011);
    ctx.stroke();
  }

  const phaseOffset = kind === 'water' ? .19 : .085;
  for (let i = 0; i < 10; i += 1) {
    const p = cycle(time * 1.4 + i * .104, 1);
    const z = 1.18 + 19.2 * p ** 1.6;
    const ring = curve(z);
    const offset = Math.sin(i * 5.3 + time) * phaseOffset;
    pellet(ctx, ring.x + ring.rx * (.26 + offset), ring.y + ring.ry * (.17 + offset),
      Math.max(.8, h * .024 / (z + .5)), color.accent, Math.sin(p * Math.PI) ** .45 * .77);
  }
}

function drawConductor(ctx, w, h, time, kind, color) {
  const copper = kind !== 'shaft';
  const flat = kind === 'bus';
  const point = (z) => {
    if (kind !== 'shaft') return pipeRing(w, h, z, time * .76, flat ? 1.24 : 1);
    const perspective = 1 / (z + .53);
    return {
      x: w * .56 + h * (.26 * perspective + .032 * Math.sin(time * 2.4)),
      y: h * (.42 + .10 * perspective),
      rx: h * perspective * 1.08,
      ry: h * perspective * .94,
    };
  };
  const depths = [0, .09, .2, .37, .66, 1.1, 1.7, 2.5, 3.5, 4.9, 6.8, 9.2, 13, 18, 25, 32];
  const positions = depths.map((z) => {
    const ring = point(z);
    return { ...ring, y: ring.y + ring.ry * .42, rx: ring.rx * (flat ? .72 : .51), ry: ring.ry * (flat ? .16 : .46) };
  });
  const focus = positions.at(-1);
  const light = ctx.createRadialGradient(focus.x, focus.y, h * .08, focus.x, focus.y, h * 1.01);
  light.addColorStop(0, copper ? '#363737' : '#3c3a34');
  light.addColorStop(.5, '#151c1e');
  light.addColorStop(1, '#090c0e');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, w, h);
  const near = positions[0];
  const end = positions.at(-1);
  const edgeCount = flat ? 5 : 29;
  const side = (position, t, depth) => flat
    ? { x: position.x + position.rx * (-1.03 + t * 2.06), y: position.y - position.ry * (1.12 - .19 * t) }
    : ringPoint(position, Math.PI + t * Math.PI + (copper ? depth * .038 + time * .38 : .0));

  for (let i = 0; i < edgeCount; i += 1) {
    const across = (i + .5) / edgeCount;
    const specular = Math.exp(-(((across - .44) * (copper ? 5.8 : 8.8)) ** 2));
    const alternate = copper ? (i % 3 === 0 ? 8 : -4) : 0;
    const intensity = .32 + .76 * Math.sin(Math.PI * across) ** 1.3 + specular * .56;
    const rgb = color.base.map((value, channel) => Math.round(value * intensity + specular * (channel === 0 ? 69 : 53) + alternate));
    const fill = ctx.createLinearGradient(near.x, near.y, end.x, end.y);
    fill.addColorStop(0, `rgb(${rgb.join(',')})`);
    fill.addColorStop(.72, `rgb(${rgb.map((value) => Math.round(value * .78)).join(',')})`);
    fill.addColorStop(1, '#202322');
    ctx.fillStyle = fill;
    const edge = positions.map((position, index) => side(position, i / edgeCount, depths[index]));
    const otherEdge = positions.map((position, index) => side(position, (i + 1.035) / edgeCount, depths[index])).reverse();
    polygon(ctx, [...edge, ...otherEdge]);
    ctx.fill();
    if (copper || i % 3 === 0) {
      line(ctx, edge);
      ctx.strokeStyle = copper ? 'rgb(235 176 124 / .17)' : 'rgb(220 218 202 / .09)';
      ctx.lineWidth = Math.max(.55, h * .00135);
      ctx.stroke();
    }
  }

  const gap = flat ? 2.1 : copper ? 1.8 : 2.85;
  for (let n = 10; n >= 0; n -= 1) {
    const z = n * gap + cycle(-time * 20, gap);
    const p = point(z);
    const collar = { ...p, y: p.y + p.ry * .42, rx: p.rx * (flat ? .83 : .69), ry: p.ry * (flat ? .24 : .52) };
    if (copper && !flat) {
      // The jacket and insulation sit around a solid bundle of strands.
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.rx * 1.09, p.ry * 1.04, 0, 3.62, 6.16);
      ctx.strokeStyle = 'rgb(121 143 143 / .27)';
      ctx.lineWidth = Math.max(.55, p.ry * .035);
      ctx.stroke();
      continue;
    }
    if (flat) {
      const left = { x: collar.x - collar.rx, y: collar.y - collar.ry };
      const right = { x: collar.x + collar.rx, y: collar.y - collar.ry * .82 };
      line(ctx, [left, right]);
    } else {
      ctx.beginPath();
      ctx.ellipse(collar.x, collar.y, collar.rx, collar.ry, 0, Math.PI, TAU);
    }
    ctx.lineWidth = Math.max(1, collar.ry * .26);
    ctx.strokeStyle = copper ? '#676355' : '#181c1c';
    ctx.stroke();
    ctx.lineWidth = Math.max(.6, collar.ry * .09);
    ctx.strokeStyle = polishedMetal(ctx, collar, color.light, .78);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  const trace = positions.map((p, i) => side(p, flat ? .48 : .57, depths[i]));
  line(ctx, trace);
  ctx.strokeStyle = `${color.accent}62`;
  ctx.lineWidth = Math.max(1, h * .0028);
  ctx.stroke();
  for (let i = 0; i < 7; i += 1) {
    const t = cycle(time * 1.25 + i / 7, 1);
    const z = .87 + 19 * t ** 1.56;
    const p = point(z);
    const ring = { ...p, y: p.y + p.ry * .42, rx: p.rx * (flat ? .72 : .51), ry: p.ry * (flat ? .16 : .46) };
    const pulse = side(ring, flat ? .48 : .57, z);
    pellet(ctx, pulse.x, pulse.y, Math.max(.8, h * .028 / (z + .78)), color.accent,
      Math.sin(Math.PI * t) ** .42 * .92);
  }
}

function drawBoard(ctx, w, h, time, kind, color) {
  const g = ctx.createLinearGradient(0, h, w * .6, 0);
  g.addColorStop(0, kind === 'heat' ? '#33251c' : '#13221d');
  g.addColorStop(.63, '#263537');
  g.addColorStop(1, '#0b1316');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const origin = { x: w * .63, y: h * .38 };
  const rate = kind === 'heat' ? .46 : .72;
  const depth = (z, x, up = 0) => ({
    x: origin.x + (h * x + h * Math.sin(time + z * .1) * .035) / (z + .45),
    y: origin.y + h * (.74 - up) / (z + .45),
  });
  for (let i = 7; i >= -7; i -= 1) {
    const x = i * .18;
    if (kind === 'heat') {
      const fin = [depth(.04, x, .02), depth(.04, x, .55), depth(18, x, .55), depth(18, x, .02)];
      polygon(ctx, fin);
      ctx.fillStyle = i % 2 ? '#62696b' : '#434e54';
      ctx.fill();
      line(ctx, [fin[1], fin[2]]);
      ctx.strokeStyle = 'rgb(206 218 216 / .6)';
      ctx.lineWidth = Math.max(1, h * .0022);
      ctx.stroke();
    } else {
      const offset = i % 2 === 0 ? -.24 : .24;
      const points = [depth(.03, x), depth(1.5 + Math.abs(i) * .17, x), depth(2.7, x + offset), depth(13, x + offset)];
      line(ctx, points);
      ctx.strokeStyle = i % 2 ? '#906b4d' : '#70513c';
      ctx.lineWidth = Math.max(2, h * (i === 0 ? .016 : .008));
      ctx.stroke();
      line(ctx, points);
      ctx.strokeStyle = i === 0 ? color.light : '#b38762';
      ctx.lineWidth = Math.max(.6, h * .0015);
      ctx.stroke();
      for (let n = 0; n < 8; n += 1) {
        const z = .6 + cycle(time * 12 + n * 2.2 + (i % 2) * .7, 18);
        const p = depth(z, x + .39);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, h * .046 / (z + .45), h * .016 / (z + .45), 0, 0, TAU);
        ctx.fillStyle = '#9b754f';
        ctx.fill();
      }
    }
  }
  for (let i = 0; i < 13; i += 1) {
    const t = cycle(time * rate + i * .093, 1);
    const z = .21 + t ** 1.9 * 14;
    const x = kind === 'heat' ? Math.sin(i * 1.19) * .30 * t : 0;
    const p = depth(z, x, kind === 'heat' ? .52 * t + .035 : .018);
    pellet(ctx, p.x, p.y, h * .018 / (z + .5), color.accent, Math.sin(Math.PI * t) ** .6 * .85);
  }
}

function photoFrame(ctx, w, h, image, zoom, focus) {
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight) * zoom;
  const imageW = image.naturalWidth * scale;
  const imageH = image.naturalHeight * scale;
  const x = Math.max(w - imageW, Math.min(0, w * .56 - focus.x * imageW));
  const y = Math.max(h - imageH, Math.min(0, h * .47 - focus.y * imageH));
  ctx.drawImage(image, x, y, imageW, imageH);
  return (u, v) => ({ x: x + u * imageW, y: y + v * imageH });
}

function drawOverhead(ctx, w, h, time, color, image, archive) {
  ctx.fillStyle = '#182725';
  ctx.fillRect(0, 0, w, h);
  const drift = smooth(time);
  let position = (x, y) => ({ x: x * w, y: y * h });
  if (image?.complete && image.naturalWidth) {
    position = photoFrame(ctx, w, h, image, 1.02 + .58 * drift, archive
      ? { x: .39 + .22 * drift, y: .57 }
      : { x: .39 + .35 * drift, y: .48 - .15 * drift });
  }
  if (archive) return; // The photograph shows structures under construction.
  const curve = (t) => {
    const x = .18 + t * .86;
    return position(x, .722 - .37 * x - .127 * x * x);
  };
  const trail = Array.from({ length: 28 }, (_, i) => curve(i / 27));
  const first = trail[0];
  const last = trail.at(-1);
  const trailLight = ctx.createLinearGradient(first.x, first.y, last.x, last.y);
  trailLight.addColorStop(0, '#ddf9ff00');
  trailLight.addColorStop(.17, '#ddf9ff75');
  trailLight.addColorStop(.83, '#ddf9ffc7');
  trailLight.addColorStop(1, '#ddf9ff00');
  line(ctx, trail);
  ctx.strokeStyle = '#c6f3ff27';
  ctx.lineWidth = h * .007;
  ctx.stroke();
  line(ctx, trail);
  ctx.strokeStyle = trailLight;
  ctx.lineWidth = Math.max(1.25, h * .0019);
  ctx.stroke();
  for (let i = 0; i < 8; i += 1) {
    const t = cycle(time * 1.15 + i * .133, 1);
    const point = curve(t);
    pellet(ctx, point.x, point.y, h * (.0042 + .0015 * t), color.accent, Math.sin(Math.PI * t) * .82);
  }
}

function finishFilm(ctx, w, h, time) {
  const shade = ctx.createRadialGradient(w * .59, h * .43, h * .23, w * .54, h * .5, Math.hypot(w, h) * .58);
  shade.addColorStop(0, '#080a0b00');
  shade.addColorStop(.63, '#07090a36');
  shade.addColorStop(1, '#040606e3');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
  const cut = smooth((time - .78) / .20);
  if (cut) {
    ctx.fillStyle = `rgb(4 6 7 / ${cut * .80})`;
    ctx.fillRect(0, 0, w, h);
  }
}

function makeGrain(context) {
  const grain = document.createElement('canvas');
  grain.width = 128;
  grain.height = 128;
  const texture = grain.getContext('2d');
  if (!texture) return null;
  const noise = texture.createImageData(grain.width, grain.height);
  let seed = 0xa7cb;
  for (let i = 0; i < noise.data.length; i += 4) {
    seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
    const value = seed >>> 24;
    noise.data[i] = value;
    noise.data[i + 1] = value;
    noise.data[i + 2] = value;
    noise.data[i + 3] = 26;
  }
  texture.putImageData(noise, 0, 0);
  return context.createPattern(grain, 'repeat');
}

function createImage(photo) {
  const picture = new Image();
  picture.decoding = 'async';
  picture.src = mediaBase + photo.file;
  return picture;
}

export function createTransit(host) {
  host.classList.add('currentline-transit');
  host.hidden = true;
  host.innerHTML = `
    <canvas aria-hidden="true"></canvas>
    <div class="transit-wash" aria-hidden="true"></div>
    <div class="transit-head" aria-hidden="true"><span></span><span>Time compressed</span></div>
    <div class="transit-caption" aria-hidden="true">
      <div class="transit-story"><p></p><h2></h2></div>
      <div class="transit-distance"><strong></strong><small></small></div>
    </div>
    <div class="transit-credit" aria-hidden="true"></div>
    <div class="transit-progress" aria-hidden="true"><span></span></div>
    <p class="transit-announcement" role="status"></p>
  `;
  const canvas = host.querySelector('canvas');
  const context = canvas.getContext('2d', { alpha: false });
  const grain = context ? makeGrain(context) : null;
  const heading = host.querySelector('.transit-story h2');
  const medium = host.querySelector('.transit-story p');
  const label = host.querySelector('.transit-head span');
  const distance = host.querySelector('.transit-distance strong');
  const qualifier = host.querySelector('.transit-distance small');
  const credit = host.querySelector('.transit-credit');
  const progress = host.querySelector('.transit-progress span');
  const announcement = host.querySelector('.transit-announcement');
  let active = null;
  const images = {};
  const archive = () => (images.archive ??= createImage(photographs.archive));
  const wooded = () => (images.wooded ??= createImage(photographs.wooded));

  function settle(record, completed, error) {
    if (active !== record) return;
    active = null;
    cancelAnimationFrame(record.frame);
    host.hidden = true;
    host.style.removeProperty('opacity');
    announcement.textContent = '';
    if (error) record.reject(error);
    else record.resolve(completed);
  }

  function cancel() {
    if (active) settle(active, false);
  }

  function play(leg, { reduced = false, onReveal = () => {} } = {}) {
    cancel();
    if (!leg || reduced || !host.isConnected) {
      try {
        onReveal();
        return Promise.resolve(true);
      } catch (error) {
        return Promise.reject(error);
      }
    }

    host.hidden = false;
    heading.textContent = leg.title;
    medium.textContent = leg.medium;
    label.textContent = leg.kind === 'overhead' ? 'Transmission' : leg.kind === 'outage' ? 'Backup supply' : 'Following the energy';
    distance.textContent = leg.distance;
    qualifier.textContent = leg.qualifier;
    credit.textContent = leg.photo ? photographs[leg.photo].credit : '';
    progress.style.transform = 'scaleX(0)';
    host.style.opacity = '0';
    announcement.textContent = [leg.title, leg.medium, leg.distance, leg.qualifier].filter(Boolean).join('. ');

    const color = kinds[leg.kind];
    host.style.setProperty('--transit-accent', color.accent);
    const image = leg.photo === 'archive' ? archive() : null;
    const corridor = leg.kind === 'overhead' ? wooded() : null;
    const duration = leg.kind === 'overhead' ? 2660 : leg.kind === 'outage' ? 1380 : 1970;

    return new Promise((resolve, reject) => {
      const record = { frame: 0, resolve, reject, revealed: false };
      active = record;
      let start;
      function tick(now) {
        if (active !== record) return;
        start ??= now;
        const p = clamp((now - start) / duration);
        const pathProgress = smooth(p);
        const phase = leg.reverse ? 1 - pathProgress : pathProgress;
        host.style.opacity = String(smooth(p / .10) * smooth((1 - p) / .19));
        progress.style.transform = `scaleX(${p})`;
        if (context) {
          const w = Math.max(1, host.clientWidth);
          const h = Math.max(1, host.clientHeight);
          const scale = Math.min(window.devicePixelRatio || 1, 3840 / w, 2160 / h);
          const width = Math.round(w * scale);
          const height = Math.round(h * scale);
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }
          context.setTransform(scale, 0, 0, scale, 0, 0);
          if (leg.kind === 'overhead') {
            const archiveShot = leg.photo === 'archive' && phase < .27 && image?.complete && image.naturalWidth;
            const imageCredit = archiveShot ? photographs.archive.credit : photographs.wooded.credit;
            if (credit.textContent !== imageCredit) credit.textContent = imageCredit;
            drawOverhead(context, w, h, archiveShot ? phase * 2 : phase, color, archiveShot ? image : corridor, archiveShot);
          }
          else if (leg.kind === 'board' || leg.kind === 'heat') drawBoard(context, w, h, phase, leg.kind, color);
          else if (leg.kind === 'shaft' || leg.kind === 'bus' || leg.kind === 'cable' || leg.kind === 'dc') {
            drawConductor(context, w, h, phase, leg.kind, color);
          } else if (leg.kind === 'outage') {
            context.fillStyle = '#171713';
            context.fillRect(0, 0, w, h);
            pellet(context, w * .63, h * .46, h * .008, color.accent, smooth((p - .28) / .46));
          } else drawPipe(context, w, h, phase, leg.kind, color);
          if (grain && leg.kind !== 'overhead') {
            context.globalCompositeOperation = 'soft-light';
            context.fillStyle = grain;
            context.fillRect(0, 0, w, h);
            context.globalCompositeOperation = 'source-over';
          }
          finishFilm(context, w, h, p);
        }

        if (p > .53 && !record.revealed) {
          record.revealed = true;
          try {
            onReveal();
          } catch (error) {
            settle(record, false, error);
            return;
          }
        }
        if (p === 1) settle(record, true);
        else if (active === record) record.frame = requestAnimationFrame(tick);
      }
      record.frame = requestAnimationFrame(tick);
    });
  }

  return { play, cancel };
}
