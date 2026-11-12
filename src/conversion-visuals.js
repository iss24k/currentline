const ink = '#a8afa9';
const steel = '#7a8584';
const amber = '#ffc078';
const hot = '#ff9279';
const ac = '#7be3f3';
const dc = '#d5aaff';
const fluid = '#92d6b1';
const field = '#93abff';
const light = '#e9d488';

const W = 340;
const H = 124;
const E = 62;
const TAU = Math.PI * 2;

function line(ctx, points, color = ink, width = 1.6) {
  ctx.beginPath();
  for (const [index, [x, y]] of points.entries()) {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function dot(ctx, x, y, color, radius = 3) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fillStyle = color;
  ctx.shadowBlur = 9;
  ctx.shadowColor = color;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function box(ctx, x, y, w, h, stroke = steel, fill = '#202623') {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.1;
  ctx.strokeRect(x, y, w, h);
}

function beads(ctx, from, to, color, time, count = 3) {
  for (let i = 0; i < count; i += 1) {
    const s = (time * .42 + i / count) % 1;
    dot(ctx, from[0] + (to[0] - from[0]) * s, from[1] + (to[1] - from[1]) * s, color, 2.65);
  }
}

function flow(ctx, x1, x2, color, time, y = E) {
  line(ctx, [[x1, y], [x2, y]], color + '7a', 2);
  beads(ctx, [x1, y], [x2, y], color, time);
}

function ring(ctx, x, y, r, color, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function wheel(ctx, x, y, time, r = 28, color = steel) {
  ring(ctx, x, y, r, color, '#202522');
  ring(ctx, x, y, r * .28, ink, '#202522');
  for (let i = 0; i < 6; i += 1) {
    const a = i / 6 * TAU + time * 1.65;
    line(ctx, [[x + Math.cos(a) * r * .23, y + Math.sin(a) * r * .23],
      [x + Math.cos(a + .52) * r * .78, y + Math.sin(a + .52) * r * .78]], color, 4);
  }
}

function waveform(ctx, x, end, shape, color, time) {
  const points = [];
  for (let ix = x; ix <= end; ix += 2) {
    const phase = (ix - x) * .093 - time * 3;
    const value = shape === 'ac' ? Math.sin(phase)
      : shape === 'pulse' ? Math.abs(Math.sin(phase)) : shape === 'square' ? (Math.sin(phase) > 0 ? 1 : 0) : .36;
    points.push([ix, E - value * 15]);
  }
  line(ctx, points, color, 2.3);
}

function winding(ctx, x, y, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.65;
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.ellipse(x, y + i * 6.5, 12, 4.3, 0, 0, TAU);
    ctx.stroke();
  }
}

function transformer(ctx, time, rotor = false, active) {
  if (rotor) {
    flow(ctx, 18, 133, light, time);
    wheel(ctx, 152, E, time, 25);
    winding(ctx, 207, 46, amber);
    flow(ctx, 219, 319, ac, time + .32);
    ctx.beginPath();
    ctx.ellipse(174, E, 43, 29, 0, Math.PI * 1.13, Math.PI * 1.91);
    ctx.strokeStyle = field;
    ctx.stroke();
    return;
  }
  ctx.strokeStyle = '#58625e';
  ctx.lineWidth = 9;
  ctx.strokeRect(129, 33, 82, 56);
  if (active !== 1 && active !== 2) flow(ctx, 19, 118, ac, time);
  else line(ctx, [[19, E], [118, E]], steel);
  if (active !== 0 && active !== 1) flow(ctx, 223, 320, ac, time + .4);
  else line(ctx, [[223, E], [320, E]], steel);
  winding(ctx, 130, 45, active === 2 ? steel : amber);
  winding(ctx, 210, 45, active === 0 ? steel : amber);
  line(ctx, [[142, 34], [198, 34]], field, 1.9);
  line(ctx, [[198, 88], [142, 88]], field, 1.9);
  if (active === 1 || active === undefined) {
    beads(ctx, [143, 34], [197, 34], field, time, 1);
    beads(ctx, [197, 88], [143, 88], field, time, 1);
  }
}

function electronics(ctx, time, kind) {
  const smoothing = kind === 'smooth' || kind === 'capacitor';
  const from = kind === 'invert' || kind === 'pulse' ? 'dc' : kind === 'smooth' ? 'square' : kind === 'capacitor' ? 'pulse' : 'ac';
  const to = kind === 'invert' ? 'ac' : smoothing ? 'dc' : kind === 'pulse' ? 'square' : 'pulse';
  waveform(ctx, 20, 123, from, from === 'ac' ? ac : dc, time);
  box(ctx, 130, 39, 80, 46);
  if (smoothing) {
    line(ctx, [[143, E], [163, E]], dc);
    line(ctx, [[164, 50], [164, 74]], ink, 2.4);
    line(ctx, [[176, 50], [176, 74]], ink, 2.4);
    line(ctx, [[177, E], [197, E]], dc);
  } else {
    line(ctx, [[144, E], [170, 46], [195, E], [170, 78], [144, E]], ink, 1.3);
    dot(ctx, 170, E, kind === 'invert' ? ac : dc, 2.8);
  }
  waveform(ctx, 218, 320, to, to === 'ac' ? ac : dc, time);
}

function pipe(ctx, time, color, kind) {
  line(ctx, [[20, 46], [320, 46]], steel);
  line(ctx, [[20, 78], [320, 78]], steel);
  flow(ctx, 21, 319, color, time);
  if (kind === 'filter') {
    box(ctx, 122, 34, 30, 56, ink, '#252d28');
    for (let x = 127; x < 152; x += 5) line(ctx, [[x, 37], [x, 87]], steel, .8);
    for (let y = 42; y < 89; y += 6) line(ctx, [[123, y], [151, y]], steel, .8);
    box(ctx, 185, 47, 32, 30, steel);
    line(ctx, [[188, 74], [202, 52], [214, 73]], ink, 1.9);
    dot(ctx, 103, 53, '#9e8e66', 2);
    dot(ctx, 109, 72, '#9e8e66', 2);
  }
}

function mechanical(ctx, time, compress, inputForm) {
  const first = compress ? fluid : forms[inputForm] ?? hot;
  flow(ctx, 19, 141, first, time);
  if (compress) {
    for (const [x, r] of [[134, 31], [166, 25], [192, 18]]) wheel(ctx, x, E, time, r);
    flow(ctx, 211, 320, fluid, time + .2);
    line(ctx, [[99, 29], [225, 46]], steel, 1.2);
    line(ctx, [[99, 95], [225, 78]], steel, 1.2);
  } else {
    wheel(ctx, 169, E, time, 30, '#c4a47f');
    box(ctx, 189, 57, 92, 10, steel);
    flow(ctx, 205, 320, light, time + .2);
  }
}

function burn(ctx, time) {
  box(ctx, 121, 30, 105, 64, steel);
  flow(ctx, 20, 143, amber, time);
  flow(ctx, 222, 320, hot, time + .2);
  line(ctx, [[92, 29], [131, 29], [148, 48]], fluid, 1.5);
  beads(ctx, [128, 30], [149, 49], fluid, time, 2);
  const point = 207 + Math.sin(time * 4) * 7;
  ctx.beginPath();
  ctx.moveTo(147, E);
  ctx.quadraticCurveTo(159, 32, point, 51);
  ctx.quadraticCurveTo(192, 59, 212, 70);
  ctx.quadraticCurveTo(171, 91, 147, E);
  const glow = ctx.createLinearGradient(147, E, 216, E);
  glow.addColorStop(0, '#ffe7b5');
  glow.addColorStop(.47, '#ff9b65');
  glow.addColorStop(1, '#c04b3f55');
  ctx.fillStyle = glow;
  ctx.fill();
}

function exchange(ctx, time, simple) {
  flow(ctx, 20, 146, hot, time);
  for (let x = 147; x < 198; x += 8) box(ctx, x, 37, 4, 50, steel, '#424b47');
  flow(ctx, 202, 320, hot, time + .24);
  if (!simple) {
    line(ctx, [[147, 100], [219, 100], [219, 83]], field, 1.3);
    line(ctx, [[122, 39], [122, 23], [195, 23]], hot, 1.3);
  }
}

function cell(ctx, time) {
  box(ctx, 111, 28, 118, 68);
  box(ctx, 129, 37, 17, 50, '#ab845c', '#654730');
  box(ctx, 194, 37, 17, 50, '#a1aeb0', '#465257');
  ctx.setLineDash([3, 4]);
  line(ctx, [[170, 32], [170, 91]], ink);
  ctx.setLineDash([]);
  beads(ctx, [147, E], [191, E], fluid, time, 3);
  flow(ctx, 228, 321, dc, time);
}

function panel(ctx, time) {
  box(ctx, 100, 64, 133, 16, '#7890a9', '#304653');
  line(ctx, [[101, 70], [232, 70]], '#9fb8cc', 2.0);
  for (const [start, end] of [[[108, 29], [129, 63]], [[144, 29], [165, 63]], [[181, 29], [202, 63]]]) {
    line(ctx, [start, end], light, 1.2);
    beads(ctx, start, end, light, time, 1);
  }
  flow(ctx, 235, 320, dc, time, 73);
}

function contacts(ctx, time, color = ac) {
  flow(ctx, 20, 138, color, time);
  flow(ctx, 202, 320, color, time + .2);
  box(ctx, 137, 56, 24, 12, steel);
  box(ctx, 181, 56, 24, 12, steel);
  line(ctx, [[156, E], [184, E]], amber, 4);
  dot(ctx, 170, E, color, 2.8);
}

function logic(ctx, time) {
  flow(ctx, 20, 121, dc, time);
  box(ctx, 121, 34, 98, 56);
  for (const x of [145, 170, 195]) {
    line(ctx, [[x, 48], [x, 78]], ink, 2);
    line(ctx, [[x - 10, 61], [x - 3, 61]], dc, 1.7);
    dot(ctx, x + 4, 62, time % 1 < .5 ? dc : hot, 2);
  }
  flow(ctx, 219, 320, hot, time + .21);
}

const forms = {
  chemical: amber, thermal: hot, mechanical: light, ac, dc, magnetic: field,
  fluid, light, nuclear: hot,
};

function draw(ctx, frame, time) {
  ctx.clearRect(0, 0, W, H);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  switch (frame.visual) {
    case 'transform': transformer(ctx, time, false, frame.segment); break;
    case 'induce': transformer(ctx, time, true); break;
    case 'rectify':
    case 'invert':
    case 'pulse':
    case 'capacitor':
    case 'smooth': electronics(ctx, time, frame.visual); break;
    case 'burn': burn(ctx, time); break;
    case 'rotate':
    case 'compress': mechanical(ctx, time, frame.visual === 'compress', frame.inputForm); break;
    case 'filter':
    case 'pipe': pipe(ctx, time, forms[frame.form], frame.visual); break;
    case 'exchange':
    case 'heat': exchange(ctx, time, frame.visual === 'heat'); break;
    case 'cell': cell(ctx, time); break;
    case 'solar': panel(ctx, time); break;
    case 'contact': contacts(ctx, time, frame.form === 'dc' ? dc : ac); break;
    case 'logic': logic(ctx, time); break;
    case 'reservoir':
      box(ctx, 43, 30, 122, 58, steel);
      box(ctx, 46, 53, 115, 32, fluid, '#334e42');
      line(ctx, [[165, 69], [215, 69], [250, 96], [316, 96]], fluid, 2.7);
      beads(ctx, [250, 96], [316, 96], fluid, time);
      break;
    case 'layer':
      for (let i = 0; i < 4; i += 1) {
        const c = [field, dc, amber, steel][i];
        box(ctx, 93 + i * 7, 30 + i * 16, 153, 10, c, c + '3a');
      }
      break;
    case 'airfoil':
      ctx.beginPath();
      ctx.moveTo(106, 68);
      ctx.bezierCurveTo(119, 29, 181, 36, 237, 57);
      ctx.bezierCurveTo(200, 59, 148, 83, 106, 68);
      ctx.fillStyle = '#536360';
      ctx.fill();
      ctx.strokeStyle = '#b2beb4';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      line(ctx, [[23, 41], [86, 41], [120, 31], [202, 32], [315, 54]], fluid, 1.25);
      line(ctx, [[23, 88], [90, 88], [140, 94], [208, 81], [315, 61]], fluid, 1.25);
      break;
    case 'coil':
      box(ctx, 155, 22, 30, 82, steel, '#363e3a');
      winding(ctx, 170, 43, amber);
      break;
    case 'shaft':
      box(ctx, 66, 55, 205, 14, steel, '#505b58');
      for (const x of [109, 231]) box(ctx, x, 42, 15, 40, ink, '#414947');
      break;
    case 'bearing':
      ring(ctx, 170, E, 37, ink);
      ring(ctx, 170, E, 21, steel);
      for (let i = 0; i < 8; i += 1) {
        const a = i / 8 * TAU + time * .85;
        ring(ctx, 170 + Math.cos(a) * 29, E + Math.sin(a) * 29, 5, ink, '#363e37');
      }
      break;
    default:
      box(ctx, 22, 47, 42, 30, steel);
      flow(ctx, 65, 277, forms[frame.form] ?? ac, time);
      box(ctx, 277, 47, 41, 30, steel);
  }
}

const diagramsByShape = {
  blade: 'airfoil', blades: 'rotate', wheel: 'rotate', fan: 'rotate', shaft: 'shaft',
  pipe: 'pipe', valve: 'filter', filter: 'filter', screen: 'filter', cable: 'wire',
  cell: 'cell', magnet: 'coil', core: 'coil', coil: 'coil',
  layer: 'layer', plate: 'layer', panel: 'layer', stack: 'layer', board: 'logic', chip: 'logic',
  contact: 'contact', switch: 'contact', bearing: 'bearing',
};

export function partDiagram(part) {
  return { visual: diagramsByShape[part.shape] ?? 'layer', form: 'mechanical', inputForm: 'mechanical' };
}

export function createConversionVisual(canvas) {
  const ctx = canvas.getContext('2d');
  let frame;
  let animation;
  let width = 0;
  let height = 0;
  let reduced = false;
  let lastDraw = -1000;

  function paint(time) {
    if (!frame || !width || !height || !canvas.getClientRects().length) return;
    if (time - lastDraw >= 26 || reduced) {
      ctx.setTransform(width / W, 0, 0, height / H, 0, 0);
      draw(ctx, frame, reduced ? .1 : time / 1000);
      lastDraw = time;
    }
    if (!reduced) animation = requestAnimationFrame(paint);
  }

  function refresh() {
    if (animation) cancelAnimationFrame(animation);
    if (!canvas.clientWidth || !canvas.clientHeight) return;
    const ratio = Math.min(devicePixelRatio || 1, 2.5);
    width = Math.round(canvas.clientWidth * ratio);
    height = Math.round(canvas.clientHeight * ratio);
    if (width !== canvas.width) canvas.width = width;
    if (height !== canvas.height) canvas.height = height;
    lastDraw = -1000;
    paint(performance.now());
  }

  const resize = new ResizeObserver(refresh);
  resize.observe(canvas);
  return {
    show(next, noMotion) {
      frame = next;
      reduced = noMotion;
      refresh();
    },
  };
}
