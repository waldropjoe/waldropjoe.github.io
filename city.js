// ─────────────────────────────────────────────────────────────
// Chip City — a small 2.5D isometric engine on <canvas>.
// No WebGL, no dependencies. Everything is drawn as flat-shaded
// polygons with crisp outlines, in the style of a neon
// illustration: a city built on a computer chip.
// ─────────────────────────────────────────────────────────────

export const COLORS = {
  bg: '#070611',
  ink: '#0E0A24',
  slab: '#0D0A22',
  cyan: '#31EAF2',
  turq: '#25C8D6',
  magenta: '#FF39C8',
  yellow: '#FFD447',
  orange: '#FF8C42',
  violet: '#8B6CFF',
  text: '#F5F3FF',
};

// Landmarks are the buildings you can visit. `target` is the page anchor.
export const LANDMARKS = [
  { id: 'data-tower', name: 'Data Tower', sub: 'Work · Automated reporting', target: '#/work/reporting', x: -28, y: -14, w: 6.2, d: 6.2, h: 34, color: 'cyan', roof: 'spire' },
  { id: 'relay', name: 'Relay Station', sub: 'Work · Integrations', target: '#/work/integration', x: 28, y: -28, w: 6.4, d: 5.4, h: 21, color: 'magenta', roof: 'antenna' },
  { id: 'lab', name: 'Ideas Lab', sub: 'Work · Experiments', target: '#/work/ideas', x: 35, y: 14, w: 6.4, d: 6.4, h: 11, color: 'yellow', roof: 'step' },
  { id: 'hq', name: 'HQ', sub: 'About', target: '#/about', x: -28, y: 28, w: 6.4, d: 6.4, h: 24, color: 'turq', roof: 'step' },
  { id: 'stack', name: 'The Stack', sub: 'Skills', target: '#/skills', x: 0, y: -35, w: 5.4, d: 5.4, h: 28, color: 'yellow', roof: 'spire' },
  { id: 'control', name: 'Control Center', sub: 'Experience', target: '#/experience', x: 0, y: 35, w: 6.4, d: 5.6, h: 15, color: 'orange', roof: 'antenna' },
  { id: 'core', name: 'Launchpad', sub: 'Contact', target: '#/contact', core: true, x: 0, y: 0, h: 1.6 },
];

const HALF = 50;        // chip half-size in world units
const CORE = 11;        // core half-size
const SLAB = 6;         // chip thickness

// ---------- tiny utilities ----------
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const INK = hex(COLORS.ink);
function shade(color, f) {
  const c = hex(COLORS[color] || color);
  const mix = (i) => Math.round(f >= 1 ? c[i] + (255 - c[i]) * (f - 1) : c[i] * f + INK[i] * (1 - f));
  return `rgb(${mix(0)},${mix(1)},${mix(2)})`;
}
const lerp = (a, b, t) => a + (b - a) * t;
function lerpAngle(a, b, t) {
  let d = ((b - a + 540) % 360) - 180;
  return a + d * t;
}

// ---------- world generation ----------
function buildWorld(lite) {
  const R = rng(20261025);
  const buildings = [];
  const palette = ['cyan', 'cyan', 'cyan', 'turq', 'turq', 'magenta', 'magenta', 'yellow', 'violet', 'orange'];
  const landmarkAt = new Map(LANDMARKS.filter((l) => !l.core).map((l) => [`${l.x},${l.y}`, l]));

  for (let i = 0; i < 13; i++) {
    for (let j = 0; j < 13; j++) {
      const cx = -42 + 7 * i;
      const cy = -42 + 7 * j;
      if (i === 3 || i === 9 || j === 3 || j === 9) continue;                    // avenues
      if (Math.abs(cx) <= 14 && Math.abs(cy) <= 14) continue;                     // core plaza
      const lm = landmarkAt.get(`${cx},${cy}`);
      if (lm) { buildings.push({ ...lm, landmark: lm.id, z: 0 }); continue; }
      if (R() < (lite ? 0.24 : 0.1)) continue;                                    // small plazas
      const w = 3 + R() * 2.6;
      const d = 3 + R() * 2.6;
      const ring = 1 - Math.min(1, Math.hypot(cx, cy) / 62);                      // taller toward the middle
      const h = 2.5 + Math.pow(R(), 1.7) * 18 * (0.55 + ring);
      const roll = R();
      const roof = h > 12 && roll < 0.22 ? 'spire' : h > 8 && roll < 0.42 ? 'step' : roll < 0.55 ? 'antenna' : 'flat';
      buildings.push({
        x: cx + (R() - 0.5) * (6.4 - w),
        y: cy + (R() - 0.5) * (6.4 - d),
        z: 0, w, d, h,
        color: palette[Math.floor(R() * palette.length)],
        roof,
        beacon: h > 14 && R() < 0.5 ? (R() < 0.5 ? 'magenta' : 'yellow') : null,
        phase: R() * 6.28,
      });
    }
  }

  // circuit traces: buses along the avenues, and branches out of the core
  const traces = [];
  const tcol = () => { const r = R(); return r < 0.58 ? 'yellow' : r < 0.84 ? 'cyan' : 'magenta'; };
  for (const a of [-21, 21]) {
    for (const off of [-1.1, 1.1]) {
      traces.push({ pts: [[a + off, -HALF + 1], [a + off, HALF - 1]], color: 'yellow' });
      traces.push({ pts: [[-HALF + 1, a + off], [HALF - 1, a + off]], color: 'yellow' });
    }
  }
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [dx, dy] of dirs) {
    for (let n = 0; n < 7; n++) {
      const t = -CORE + 2 + n * ((2 * CORE - 4) / 6);
      const sx = dx ? dx * CORE : t;
      const sy = dy ? dy * CORE : t;
      const out1 = 3 + R() * 6;
      const p1 = [sx + dx * out1, sy + dy * out1];
      const bend = (R() < 0.5 ? -1 : 1) * (2 + R() * 6);
      // 45° jog, then run to the edge of the chip
      const p2 = [p1[0] + (dx ? dx * Math.abs(bend) : bend), p1[1] + (dy ? dy * Math.abs(bend) : bend)];
      const reach = 18 + R() * 22;
      const p3 = [p2[0] + dx * reach, p2[1] + dy * reach];
      const clampPt = (p) => [Math.max(-HALF + 1.5, Math.min(HALF - 1.5, p[0])), Math.max(-HALF + 1.5, Math.min(HALF - 1.5, p[1]))];
      traces.push({ pts: [[sx, sy], p1, p2, clampPt(p3)].map(clampPt), color: tcol(), core: true });
    }
  }
  for (const tr of traces) {
    tr.len = [0];
    for (let i = 1; i < tr.pts.length; i++) {
      tr.len.push(tr.len[i - 1] + Math.hypot(tr.pts[i][0] - tr.pts[i - 1][0], tr.pts[i][1] - tr.pts[i - 1][1]));
    }
  }

  const pulses = [];
  const count = lite ? 16 : 30;
  for (let n = 0; n < count; n++) {
    const tr = traces[Math.floor(R() * traces.length)];
    pulses.push({ tr, t: R(), speed: 0.05 + R() * 0.08, dir: tr.core ? -1 : (R() < 0.5 ? 1 : -1) });
  }

  const dust = Array.from({ length: lite ? 30 : 60 }, () => ({ x: R(), y: R(), r: 0.4 + R() * 1.2, s: 0.002 + R() * 0.006, c: R() < 0.5 ? 'cyan' : 'magenta' }));

  return { buildings, traces, pulses, dust };
}

// ---------- the renderer ----------
export function createCity(canvas, { labelLayer, tooltip, onEnter, reducedMotion }) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  let W = 0, H = 0, DPR = 1;
  let lite = window.innerWidth < 700;
  let world = buildWorld(lite);

  // camera: current values ease toward targets
  const cam = { yaw: 45, pitch: 33, zoom: 1, tx: 0, ty: 0, tz: 4, ox: 0.2, oy: 0, labels: 1, glow: 0, lmx: 0 };
  const goal = { ...cam };
  const pointer = { x: 0, y: 0, px: 0, py: 0, inside: false };
  let hovered = null;
  let focused = null;   // the landmark whose page is open
  let speed = 5;
  let polys = new Map();   // landmark id -> projected polygons (for hit testing)
  let last = performance.now();
  let raf = 0;
  let running = true;
  let dirty = true;
  let time = 0;

  // projection state, refreshed each frame
  let c = 1, s = 0, sp = 1, cp = 0, k = 1, cx = 0, cy = 0;
  function proj(x, y, z) {
    const dx = x - cam.tx, dy = y - cam.ty, dz = z - cam.tz;
    const rx = dx * c - dy * s;
    const ry = dx * s + dy * c;
    return [cx + k * rx, cy + k * (ry * sp - dz * cp)];
  }
  const depth = (x, y) => (x - cam.tx) * s + (y - cam.ty) * c;

  // ---- labels (HTML, for crisp text and keyboard access) ----
  const tags = new Map();
  for (const lm of LANDMARKS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tag';
    b.dataset.id = lm.id;
    b.style.setProperty('--dot', COLORS[lm.core ? 'cyan' : lm.color]);
    b.innerHTML = `<span class="tag-dot" aria-hidden="true"></span><span class="tag-name">${lm.name}</span>`;
    b.setAttribute('aria-label', `${lm.name} — ${lm.sub}`);
    b.addEventListener('mouseenter', () => setHover(lm.id));
    b.addEventListener('mouseleave', () => setHover(null));
    b.addEventListener('focus', () => setHover(lm.id));
    b.addEventListener('blur', () => setHover(null));
    b.addEventListener('click', () => onEnter(lm));
    labelLayer.appendChild(b);
    tags.set(lm.id, b);
  }

  function setHover(id) {
    if (hovered === id) return;
    hovered = id;
    dirty = true;
    canvas.style.cursor = id ? 'pointer' : '';
    tags.forEach((t, tid) => t.classList.toggle('is-hot', tid === id));
    if (id) {
      const lm = LANDMARKS.find((l) => l.id === id);
      tooltip.querySelector('[data-tt-name]').textContent = lm.name;
      tooltip.querySelector('[data-tt-sub]').textContent = lm.sub;
      tooltip.hidden = false;
    } else {
      tooltip.hidden = true;
    }
  }

  // ---- sizing ----
  function resize() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    const nowLite = W < 700;
    DPR = Math.min(window.devicePixelRatio || 1, nowLite ? 1.5 : 2);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    if (nowLite !== lite) { lite = nowLite; world = buildWorld(lite); }
    dirty = true;
  }

  // ---- drawing helpers ----
  function poly(pts, fill, stroke, lw) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }

  const SIDES = [
    { n: [1, 0], corners: (x0, x1, y0, y1) => [[x1, y0], [x1, y1]] },
    { n: [-1, 0], corners: (x0, x1, y0, y1) => [[x0, y1], [x0, y0]] },
    { n: [0, 1], corners: (x0, x1, y0, y1) => [[x1, y1], [x0, y1]] },
    { n: [0, -1], corners: (x0, x1, y0, y1) => [[x0, y0], [x1, y0]] },
  ];
  const facing = (n) => n[0] * s + n[1] * c;         // > 0 means toward the viewer
  const lightOf = (n) => n[0] * c - n[1] * s;        // -1 left … +1 right

  // a box with flat-shaded sides, windows and a lighter top
  function box(b, x, y, z, w, d, h, color, opts = {}) {
    const x0 = x - w / 2, x1 = x + w / 2, y0 = y - d / 2, y1 = y + d / 2, z1 = z + h;
    const hot = opts.hot;
    const edge = hot ? '#FFFFFF' : COLORS.ink;
    const lw = Math.max(1, k * (hot ? 0.22 : 0.12));
    for (const side of SIDES) {
      if (facing(side.n) <= 0.001) continue;
      const [a, bq] = side.corners(x0, x1, y0, y1);
      const pts = [proj(a[0], a[1], z), proj(bq[0], bq[1], z), proj(bq[0], bq[1], z1), proj(a[0], a[1], z1)];
      const f = 0.5 + 0.22 * lightOf(side.n) + (hot ? 0.15 : 0);
      poly(pts, shade(color, f), edge, lw);
      opts.out && opts.out.push(pts);
      // window rows: dashed lines across the face, one per floor
      const faceW = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
      if (!lite && k > 3.2 && faceW > 10 && h > 3) {
        ctx.save();
        ctx.strokeStyle = shade(color, 1.25);
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = Math.max(1, k * 0.32);
        ctx.setLineDash([k * 0.45, k * 0.55]);
        for (let fz = z + 1.6; fz < z1 - 0.9; fz += 1.9) {
          const p = proj(lerp(a[0], bq[0], 0.12), lerp(a[1], bq[1], 0.12), fz);
          const q = proj(lerp(a[0], bq[0], 0.88), lerp(a[1], bq[1], 0.88), fz);
          ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
        }
        ctx.restore();
      }
    }
    if (opts.noTop) return;
    const top = [proj(x0, y0, z1), proj(x1, y0, z1), proj(x1, y1, z1), proj(x0, y1, z1)];
    poly(top, shade(opts.topColor || color, hot ? 1.35 : 1.12), edge, lw);
    opts.out && opts.out.push(top);
  }

  function spire(x, y, z, w, d, h, color, hot, out) {
    const x0 = x - w / 2, x1 = x + w / 2, y0 = y - d / 2, y1 = y + d / 2;
    const apex = proj(x, y, z + h);
    const lw = Math.max(1, k * (hot ? 0.22 : 0.12));
    for (const side of SIDES) {
      if (facing(side.n) <= 0.001) continue;
      const [a, bq] = side.corners(x0, x1, y0, y1);
      const pts = [proj(a[0], a[1], z), proj(bq[0], bq[1], z), apex];
      poly(pts, shade(color, 0.72 + 0.28 * lightOf(side.n) + (hot ? 0.2 : 0)), hot ? '#FFFFFF' : COLORS.ink, lw);
      out && out.push(pts);
    }
  }

  function building(b) {
    const hot = b.landmark && (hovered === b.landmark || focused === b.landmark);
    const out = b.landmark ? [] : null;
    const topColor = b.color === 'cyan' || b.color === 'turq' ? (b.landmark ? 'yellow' : null) : null;
    if (b.roof === 'step') {
      box(b, b.x, b.y, 0, b.w, b.d, b.h * 0.62, b.color, { hot, out, topColor: 'magenta' });
      box(b, b.x, b.y, b.h * 0.62, b.w * 0.66, b.d * 0.66, b.h * 0.38, b.color, { hot, out, topColor });
    } else if (b.roof === 'spire') {
      box(b, b.x, b.y, 0, b.w, b.d, b.h * 0.78, b.color, { hot, out, topColor: 'yellow' });
      spire(b.x, b.y, b.h * 0.78, b.w * 0.82, b.d * 0.82, b.h * 0.36, b.landmark ? 'yellow' : 'magenta', hot, out);
    } else {
      box(b, b.x, b.y, 0, b.w, b.d, b.h, b.color, { hot, out, topColor });
      if (b.roof === 'antenna') {
        const p = proj(b.x, b.y, b.h);
        const q = proj(b.x, b.y, b.h + 4);
        ctx.strokeStyle = b.landmark ? COLORS.magenta : shade(b.color, 1.2);
        ctx.lineWidth = Math.max(1, k * 0.18);
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
        dot(q, b.landmark ? 'magenta' : 'yellow', 0.5 + 0.5 * Math.sin(time * 3 + (b.phase || 0)));
      }
    }
    if (b.beacon) {
      const top = b.roof === 'spire' ? b.h * 1.14 : b.h;
      dot(proj(b.x, b.y, top + 0.4), b.beacon, 0.35 + 0.65 * Math.max(0, Math.sin(time * 2 + b.phase)));
    }
    if (out) polys.set(b.landmark, out);
  }

  function dot(p, color, a) {
    ctx.globalAlpha = 0.25 * a;
    ctx.fillStyle = COLORS[color];
    ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(2, k * 0.9), 0, 6.283); ctx.fill();
    ctx.globalAlpha = a;
    ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(1, k * 0.3), 0, 6.283); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function chip() {
    // the board below the chip: a thin violet outline, like a PCB edge
    const bz = -SLAB - 3, B = HALF + 9;
    const board = [proj(-B, -B, bz), proj(B, -B, bz), proj(B, B, bz), proj(-B, B, bz)];
    poly(board, 'rgba(139,108,255,0.05)', 'rgba(139,108,255,0.55)', Math.max(1, k * 0.14));

    // slab sides: yellow on the x faces, magenta on the y faces, with pins
    for (const side of SIDES) {
      if (facing(side.n) <= 0.001) continue;
      const [a, bq] = side.corners(-HALF, HALF, -HALF, HALF);
      const col = side.n[0] ? 'yellow' : 'magenta';
      const pts = [proj(a[0], a[1], -SLAB), proj(bq[0], bq[1], -SLAB), proj(bq[0], bq[1], 0), proj(a[0], a[1], 0)];
      poly(pts, shade(col, 0.78 + 0.18 * lightOf(side.n)), COLORS.ink, Math.max(1, k * 0.14));
      ctx.strokeStyle = shade(col, 0.45);
      ctx.lineWidth = Math.max(1, k * 0.7);
      for (let t = 0.06; t < 0.95; t += 0.055) {
        const p = proj(lerp(a[0], bq[0], t), lerp(a[1], bq[1], t), -SLAB * 0.78);
        const q = proj(lerp(a[0], bq[0], t), lerp(a[1], bq[1], t), -SLAB * 0.3);
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
      }
    }
    const top = [proj(-HALF, -HALF, 0), proj(HALF, -HALF, 0), proj(HALF, HALF, 0), proj(-HALF, HALF, 0)];
    poly(top, COLORS.slab, shade('cyan', 0.6), Math.max(1, k * 0.16));
  }

  function traces() {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const tr of world.traces) {
      ctx.strokeStyle = shade(tr.color, 0.62);
      ctx.lineWidth = Math.max(1, k * 0.42);
      ctx.beginPath();
      tr.pts.forEach((p, i) => { const q = proj(p[0], p[1], 0.02); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
      ctx.stroke();
      const end = proj(tr.pts[tr.pts.length - 1][0], tr.pts[tr.pts.length - 1][1], 0.02);
      ctx.fillStyle = shade(tr.color, 0.9);
      ctx.beginPath(); ctx.arc(end[0], end[1], Math.max(1.5, k * 0.55), 0, 6.283); ctx.fill();
    }
  }

  function pulses(dt) {
    for (const pu of world.pulses) {
      const tr = pu.tr;
      if (!reducedMotion()) pu.t = (pu.t + pu.dir * pu.speed * dt * (1 + cam.glow * 1.5) + 1) % 1;
      const L = tr.len[tr.len.length - 1] * pu.t;
      let i = 1;
      while (i < tr.len.length - 1 && tr.len[i] < L) i++;
      const f = (L - tr.len[i - 1]) / Math.max(0.001, tr.len[i] - tr.len[i - 1]);
      const x = lerp(tr.pts[i - 1][0], tr.pts[i][0], f);
      const y = lerp(tr.pts[i - 1][1], tr.pts[i][1], f);
      const p = proj(x, y, 0.1);
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = COLORS[tr.color];
      ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(3, k * 1.3), 0, 6.283); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(1.2, k * 0.4), 0, 6.283); ctx.fill();
    }
  }

  function core() {
    const hot = hovered === 'core' || focused === 'core';
    const out = [];
    box(null, 0, 0, 0, CORE * 2, CORE * 2, 1.6, 'violet', { hot, out, topColor: '#141033' });
    // launchpad rings on the die
    const g = 0.35 + cam.glow * 0.65 + (hot ? 0.3 : 0);
    for (let r = 3; r <= 9; r += 3) {
      const ring = [proj(-r, -r, 1.62), proj(r, -r, 1.62), proj(r, r, 1.62), proj(-r, r, 1.62)];
      ctx.globalAlpha = Math.min(1, g * (1.15 - r / 12));
      poly(ring, null, COLORS.cyan, Math.max(1, k * 0.18));
    }
    ctx.globalAlpha = 1;
    // a soft beam when the launchpad is the destination
    if (cam.glow > 0.02) {
      const base = proj(0, 0, 1.6), topP = proj(0, 0, 46);
      for (const [wf, a] of [[9, 0.08], [5.5, 0.12], [2.4, 0.22]]) {
        const grad = ctx.createLinearGradient(0, base[1], 0, topP[1]);
        grad.addColorStop(0, `rgba(49,234,242,${a * cam.glow})`);
        grad.addColorStop(1, 'rgba(49,234,242,0)');
        ctx.fillStyle = grad;
        const wpx = k * wf;
        ctx.fillRect(base[0] - wpx / 2, topP[1], wpx, base[1] - topP[1]);
      }
    }
    polys.set('core', out);
  }

  // ---- frame ----
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += reducedMotion() ? 0 : dt;

    // ease the camera; follow the pointer a little (parallax)
    const ease = reducedMotion() ? 1 : 1 - Math.exp(-dt * speed);
    const px = reducedMotion() ? 0 : pointer.px;
    const py = reducedMotion() ? 0 : pointer.py;
    const drift = reducedMotion() ? 0 : Math.sin(time * 0.15) * 1.5;
    let moving = false;
    for (const key of ['pitch', 'zoom', 'tx', 'ty', 'tz', 'ox', 'oy', 'labels', 'glow', 'lmx']) {
      const before = cam[key];
      cam[key] = lerp(cam[key], goal[key], ease);
      if (Math.abs(cam[key] - before) > 1e-4) moving = true;
    }
    const before = cam.yaw;
    cam.yaw = lerpAngle(cam.yaw, goal.yaw, ease);
    if (Math.abs(cam.yaw - before) > 1e-4) moving = true;

    const yaw = (cam.yaw + px * 5 + drift) * Math.PI / 180;
    const pitch = Math.min(89, Math.max(12, cam.pitch - py * 3)) * Math.PI / 180;
    c = Math.cos(yaw); s = Math.sin(yaw); sp = Math.sin(pitch); cp = Math.cos(pitch);
    const fit = Math.min(W / 150, H / (150 * sp + 60 * cp));
    k = fit * cam.zoom;
    cx = W * (0.5 + cam.ox);
    cy = H * (0.5 + cam.oy);

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    // ambient glow behind the chip
    const center = proj(0, 0, 0);
    const R = k * 90;
    const glow = ctx.createRadialGradient(center[0], center[1], 0, center[0], center[1], R);
    glow.addColorStop(0, 'rgba(76,40,160,0.32)');
    glow.addColorStop(1, 'rgba(7,6,17,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // drifting dust
    for (const p of world.dust) {
      if (!reducedMotion()) p.y = (p.y - p.s * dt + 1) % 1;
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = COLORS[p.c];
      ctx.fillRect(p.x * W, p.y * H, p.r, p.r);
    }
    ctx.globalAlpha = 1;

    chip();
    traces();
    pulses(dt);
    polys = new Map();

    // painter's algorithm: far buildings first; the core sits at depth 0
    const items = world.buildings.map((b) => ({ b, d: depth(b.x, b.y) }));
    items.push({ core: true, d: depth(0, 0) - CORE * 0.9 });
    items.sort((a, b) => a.d - b.d);
    for (const it of items) it.core ? core() : building(it.b);

    // labels follow their buildings
    for (const lm of LANDMARKS) {
      const t = tags.get(lm.id);
      const top = lm.core ? 2.5 : lm.roof === 'spire' ? lm.h * 1.16 + 2 : lm.roof === 'antenna' ? lm.h + 5.5 : lm.h + 2;
      const p = proj(lm.x, lm.y, top);
      t.style.transform = `translate(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px) translate(-50%, -100%)`;
      // tags that would sit behind the text column are hidden (lmx = left edge of the clear area)
      const visible = cam.labels > 0.05 && p[0] > W * cam.lmx + 40 && p[0] < W - 20 && p[1] > 70 && p[1] < H - 10;
      t.style.opacity = visible ? cam.labels.toFixed(2) : '0';
      t.tabIndex = visible && cam.labels > 0.5 ? 0 : -1;
      t.style.pointerEvents = visible && cam.labels > 0.5 ? 'auto' : 'none';
    }
    if (hovered && !tooltip.hidden) {
      const lm = LANDMARKS.find((l) => l.id === hovered);
      const p = proj(lm.x, lm.y, 0);
      tooltip.style.transform = `translate(${p[0].toFixed(1)}px, ${(p[1] + 18).toFixed(1)}px) translate(-50%, 0)`;
    }

    // keep animating while anything moves; otherwise stop until something changes
    const ambient = !reducedMotion();
    if (running && (ambient || moving || dirty)) raf = requestAnimationFrame(frame);
    dirty = false;
  }

  function kick() {
    dirty = true;
    if (!raf && running) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }

  // ---- hit testing ----
  function inside(pt, pts) {
    let hit = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  }
  function pick(x, y) {
    if (cam.labels < 0.5) return null;
    let best = null, bestD = -Infinity;
    for (const lm of LANDMARKS) {
      const ps = polys.get(lm.id);
      if (!ps) continue;
      if (ps.some((p) => inside([x, y], p))) {
        const d = depth(lm.x, lm.y);
        if (d > bestD) { bestD = d; best = lm.id; }
      }
    }
    return best;
  }

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (e.pointerType === 'mouse') setHover(pick(x, y));
  });
  canvas.addEventListener('pointerleave', () => setHover(null));
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const id = pick(e.clientX - r.left, e.clientY - r.top);
    if (id) onEnter(LANDMARKS.find((l) => l.id === id));
  });
  window.addEventListener('pointermove', (e) => {
    pointer.px = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.py = (e.clientY / window.innerHeight - 0.5) * 2;
    kick();
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) kick();
  });

  resize();
  kick();

  return {
    resize() { resize(); kick(); },
    setView(view, instant, rate = 5) {
      speed = rate;
      Object.assign(goal, view);
      if (instant) Object.assign(cam, view);
      kick();
    },
    lerpViews: (a, b, t) => {
      const v = {};
      for (const key of Object.keys(a)) v[key] = key === 'yaw' ? lerpAngle(a.yaw, b.yaw, t) : lerp(a[key], b[key], t);
      return v;
    },
    setFocus(id) { focused = id; setHover(null); kick(); },
    kick,
  };
}
