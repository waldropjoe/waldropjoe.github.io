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
  { id: 'data-tower', name: 'Reporting', sub: 'Dashboard Tower', target: '#/work/reporting', x: -28, y: 14, w: 6.2, d: 6.2, h: 34, color: 'cyan', roof: 'spire', spot: [-21, 14] },
  { id: 'relay', name: 'Integrations', sub: 'API Exchange', target: '#/work/integration', x: 28, y: -28, w: 6.4, d: 5.4, h: 21, color: 'magenta', roof: 'antenna', spot: [21, -28] },
  { id: 'lab', name: 'This Site', sub: 'The Workshop', target: '#/work/ideas', x: 28, y: 14, w: 6.4, d: 6.4, h: 11, color: 'yellow', roof: 'step', spot: [21, 14] },
  { id: 'switchboard', name: 'Issue Log', sub: 'Bug Catcher', target: '#/work/issue-log', x: 28, y: 28, w: 6, d: 6, h: 18, color: 'violet', roof: 'antenna', spot: [21, 28], keepLayout: true },
  { id: 'hq', name: 'About', sub: 'Waldrop HQ', target: '#/about', x: -38.5, y: -38.5, w: 11, d: 11, h: 10, color: 'violet', roof: 'sign', spot: [-21, -38.5] },
  { id: 'listening', name: 'Books & Podcasts', sub: 'The Listening Post', target: '#/listening', x: -28, y: 28, w: 6, d: 6, h: 9, color: 'magenta', roof: 'mast', spot: [-21, 28] },
  { id: 'stack', name: 'Skills', sub: 'The Toolbox', target: '#/skills', x: 14, y: -28, w: 5.4, d: 5.4, h: 28, color: 'yellow', roof: 'spire', spot: [14, -21] },
  { id: 'control', name: 'Experience', sub: 'Career Tower', target: '#/experience', x: 0, y: 28, w: 6.4, d: 5.6, h: 15, color: 'orange', roof: 'antenna', spot: [0, 21] },
  { id: 'core', name: 'Contact', sub: 'The Front Door', target: '#/contact', core: true, x: 0, y: 0, h: 1.6, spot: [0, -12.6] },
];

// The road network: four avenues and four short spokes into the core.
// Each road is an axis-aligned line: { axis: 'v', at: x, from: y0, to: y1 } or { axis: 'h', at: y, from: x0, to: x1 }.
const ROADS = [
  { axis: 'v', at: -21, from: -46, to: 46 },
  { axis: 'v', at: 21, from: -46, to: 46 },
  { axis: 'h', at: -21, from: -46, to: 46 },
  { axis: 'h', at: 21, from: -46, to: 46 },
  { axis: 'v', at: 0, from: -21, to: -12.6 },
  { axis: 'v', at: 0, from: 12.6, to: 21 },
  { axis: 'h', at: 0, from: -21, to: -12.6 },
  { axis: 'h', at: 0, from: 12.6, to: 21 },
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
const shadeCache = new Map();
function shade(color, f) {
  const key = color + '|' + f.toFixed(2);
  let v = shadeCache.get(key);
  if (v) return v;
  const c = hex(COLORS[color] || color);
  const mix = (i) => Math.round(f >= 1 ? c[i] + (255 - c[i]) * Math.min(1, f - 1) : c[i] * f + INK[i] * (1 - f));
  v = `rgb(${mix(0)},${mix(1)},${mix(2)})`;
  shadeCache.set(key, v);
  return v;
}
// cheap deterministic hash -> 0..1, used to decide which windows are lit
function hash01(a, b, c, d) {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2246822519) ^ Math.imul(d | 0, 3266489917);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
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

  const comps = [];
  const accent = { cyan: 'magenta', turq: 'yellow', magenta: 'cyan', yellow: 'magenta', violet: 'cyan', orange: 'yellow' };
  let seed = 1;

  function makeBuilding(x, y, w, d, h, small) {
    const color = palette[Math.floor(R() * palette.length)];
    const roll = R();
    let roof = 'flat';
    if (!small && h > 15 && roll < 0.34) roof = 'setback';          // Empire-State-style tiers
    else if (!small && h > 12 && roll < 0.5) roof = 'spire';
    else if (h > 8 && roll < 0.62) roof = 'step';
    else if (roll < 0.74) roof = 'antenna';
    const units = [];
    if (roof === 'flat' || roof === 'step') {
      // rooftop machinery: AC boxes and the odd water tank
      const n = small ? (R() < 0.5 ? 1 : 0) : 1 + Math.floor(R() * 2);
      for (let u = 0; u < n; u++) {
        const tank = R() < 0.3;
        units.push({ dx: (R() - 0.5) * 0.45, dy: (R() - 0.5) * 0.45, w: tank ? 0.9 : 0.6 + R() * 0.7, d: tank ? 0.9 : 0.5 + R() * 0.6, h: tank ? 1.1 : 0.5 + R() * 0.5, tank });
      }
    }
    return {
      x, y, z: 0, w, d, h, color, roof, units,
      band: h > 9 && R() < 0.55 ? accent[color] : null,               // coloured floor bands
      sign: !small && h > 7 && R() < 0.22 ? { side: Math.floor(R() * 4), color: R() < 0.5 ? 'magenta' : 'yellow' } : null,
      warm: R() < 0.5,                                                  // warm or cool window light
      beacon: h > 14 && R() < 0.5 ? (R() < 0.5 ? 'magenta' : 'yellow') : null,
      phase: R() * 6.28,
      seed: seed++,
    };
  }

  const hqLm = LANDMARKS.find((l) => l.id === 'hq');
  buildings.push({ ...hqLm, landmark: 'hq', z: 0, units: [], band: 'cyan', warm: true, seed: seed++, phase: 0 });
  for (let i = 0; i < 13; i++) {
    for (let j = 0; j < 13; j++) {
      const cx = -42 + 7 * i;
      const cy = -42 + 7 * j;
      if (i === 3 || i === 9 || j === 3 || j === 9) continue;                    // avenues
      if (Math.abs(cx) <= 14 && Math.abs(cy) <= 14) continue;                     // core plaza
      if (cx <= -35 && cy <= -35) continue;                                       // Waldrop HQ block
      const lm = landmarkAt.get(`${cx},${cy}`);
      if (lm) {
        buildings.push({ ...lm, landmark: lm.id, z: 0, units: [], band: accent[lm.color], warm: true, seed: seed++, phase: 0 });
        if (!lm.keepLayout) continue;
      }
      // a landmark added later sits on a lot that used to be generated: still roll that lot's dice
      // (into a scratch list) so every other building in the city stays exactly where it was
      const nb = buildings.length, nc = comps.length, seed0 = seed;
      try {
      const ring = 1 - Math.min(1, Math.hypot(cx, cy) / 62);                      // taller toward the middle
      if (R() < (lite ? 0.2 : 0.08)) {
        // a small plaza: chip components sit here instead of a building
        for (let n = 0; n < 2; n++) comps.push({ x: cx + (R() - 0.5) * 3.5, y: cy + (n - 0.5) * 2.6, kind: R() < 0.5 ? 'res' : 'cap', rot: R() < 0.5 });
        continue;
      }
      if (!lite && R() < 0.3) {
        // a block of four smaller buildings
        for (const [ox, oy] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) {
          if (R() < 0.15) continue;
          const w = 2 + R() * 0.9, d = 2 + R() * 0.9;
          const hh = 2.2 + Math.pow(R(), 1.5) * 9 * (0.6 + ring);
          buildings.push(makeBuilding(cx + ox, cy + oy, w, d, cx < -14 && cy < -14 ? Math.min(hh, 6) : hh, true));
        }
        continue;
      }
      const w = 3 + R() * 2.6;
      const d = 3 + R() * 2.6;
      let h = 2.5 + Math.pow(R(), 1.7) * 18 * (0.55 + ring);
      const nearSign = cx < -14 && cy < -14;
      if (nearSign) h = Math.min(h, 7);
      buildings.push(makeBuilding(cx + (R() - 0.5) * (6.4 - w), cy + (R() - 0.5) * (6.4 - d), w, d, h, nearSign));
      } finally {
        if (lm) { buildings.length = nb; comps.length = nc; seed = seed0; }
      }
    }
  }
  // components ringing the die, like the parts around a real chip package
  for (let t = -12; t <= 12; t += 4) {
    for (const [x, y, rot] of [[t, -14.5, false], [t, 14.5, false], [-14.5, t, true], [14.5, t, true]]) {
      if (t === 0 || R() < 0.35) continue;
      comps.push({ x, y, kind: R() < 0.55 ? 'res' : 'cap', rot });
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
  for (const off of [-1.1, 1.1]) {
    traces.push({ pts: [[off, -21], [off, -CORE]], color: 'yellow' });
    traces.push({ pts: [[off, CORE], [off, 21]], color: 'yellow' });
    traces.push({ pts: [[-21, off], [-CORE, off]], color: 'yellow' });
    traces.push({ pts: [[CORE, off], [21, off]], color: 'yellow' });
  }
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [dx, dy] of dirs) {
    for (let n = 0; n < 7; n++) {
      let t = -CORE + 2 + n * ((2 * CORE - 4) / 6);
      if (Math.abs(t) < 2) t = t < 0 ? -2.4 : 2.4;
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

  return { buildings, comps, traces, pulses, dust };
}

// ---------- the road graph ----------
const key = (p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
function buildGraph() {
  const pts = ROADS.map(() => []);
  const add = (ri, p) => { if (!pts[ri].some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.01)) pts[ri].push(p); };
  ROADS.forEach((r, i) => {
    add(i, r.axis === 'v' ? [r.at, r.from] : [r.from, r.at]);
    add(i, r.axis === 'v' ? [r.at, r.to] : [r.to, r.at]);
  });
  ROADS.forEach((a, i) => ROADS.forEach((b, j) => {
    if (a.axis === b.axis || i >= j) return;
    const v = a.axis === 'v' ? a : b, h = a.axis === 'v' ? b : a;
    const x = v.at, y = h.at;
    if (y >= v.from - 0.01 && y <= v.to + 0.01 && x >= h.from - 0.01 && x <= h.to + 0.01) { add(i, [x, y]); add(j, [x, y]); }
  }));
  for (const lm of LANDMARKS) {
    ROADS.forEach((r, i) => { if (onRoad(r, lm.spot)) add(i, lm.spot); });
  }
  const nodes = new Map();
  const node = (p) => { const kk = key(p); if (!nodes.has(kk)) nodes.set(kk, { p, edges: [] }); return nodes.get(kk); };
  ROADS.forEach((r, i) => {
    const list = pts[i].sort((a, b) => (r.axis === 'v' ? a[1] - b[1] : a[0] - b[0]));
    for (let n = 1; n < list.length; n++) {
      const A = node(list[n - 1]), B = node(list[n]);
      const d = Math.hypot(A.p[0] - B.p[0], A.p[1] - B.p[1]);
      A.edges.push({ to: B, d }); B.edges.push({ to: A, d });
    }
  });
  return nodes;
}
function onRoad(r, p, eps = 0.05) {
  return r.axis === 'v'
    ? Math.abs(p[0] - r.at) < eps && p[1] >= r.from - eps && p[1] <= r.to + eps
    : Math.abs(p[1] - r.at) < eps && p[0] >= r.from - eps && p[0] <= r.to + eps;
}
// nearest point on any road to a world position
function snapToRoad(p) {
  let best = null, bd = Infinity;
  for (const r of ROADS) {
    const q = r.axis === 'v' ? [r.at, Math.max(r.from, Math.min(r.to, p[1]))] : [Math.max(r.from, Math.min(r.to, p[0])), r.at];
    const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d < bd) { bd = d; best = q; }
  }
  return { p: best, d: bd };
}

// ---------- the renderer ----------
export function createCity(canvas, { labelLayer, tooltip, onEnter, onNear = () => {}, canDrive = () => true, reducedMotion }) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  let W = 0, H = 0, DPR = 1;
  let lite = window.innerWidth < 700;
  let world = buildWorld(lite);

  // camera: current values ease toward targets
  const cam = { yaw: 45, pitch: 33, zoom: 1, tx: 0, ty: 0, tz: 4, ox: 0.2, oy: 0, labels: 1, glow: 0, lmx: 0 };
  const goal = { ...cam };
  let hovered = null;
  let focused = null;   // the landmark whose page is open
  let speed = 5;
  let polys = new Map();   // landmark id -> projected polygons (for hit testing)
  let last = performance.now();
  let raf = 0;
  let running = true;
  let dirty = true;
  let time = 0;

  // ---- the car: the way you get around the island ----
  const graph = buildGraph();
  const CAR_SPEED = 24;                 // world units per second
  const CS = 1.7;                       // car scale
  const car = { x: -21, y: 0, h: Math.PI / 2, th: Math.PI / 2, path: null, i: 0, arrive: null, driving: false, trail: [], follow: false, hopT: -1 };
  const keys = new Set();
  let near = null;
  let home = null;          // the overview camera, set by the page
  let saved = null;         // the visitor's own camera, kept while a page is open

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
    b.addEventListener('click', () => {
      // first press drives there; pressing again once parked goes in
      if (!canDrive()) onEnter(lm);
      else if (near === lm && !car.driving) onEnter(lm);
      else visit(lm);
    });
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

  // the corner nearest the viewer gets a neon edge line
  function nearCorner(x0, x1, y0, y1) {
    let best = null, bd = -Infinity;
    for (const [cx_, cy_] of [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]) {
      const dd = (cx_ - cam.tx) * s + (cy_ - cam.ty) * c;
      if (dd > bd) { bd = dd; best = [cx_, cy_]; }
    }
    return best;
  }

  // window grid on one face: every window is a small parallelogram; lit and dark ones are batched into two fills
  function windows(b, sideIdx, a, bq, z, h, color, warm) {
    const A = proj(a[0], a[1], z);
    const B = proj(bq[0], bq[1], z);
    const Zp = proj(a[0], a[1], z + 1);
    const Ux = B[0] - A[0], Uy = B[1] - A[1];
    const Vx = Zp[0] - A[0], Vy = Zp[1] - A[1];
    const len = Math.hypot(bq[0] - a[0], bq[1] - a[1]);
    const cols = Math.max(1, Math.round(len / 1.2));
    const rows = Math.floor((h - 0.7) / 1.4);
    if (rows < 1) return;
    const cellPx = Math.hypot(Ux, Uy) / cols;
    if (cellPx < 3 || Math.hypot(Vx, Vy) < 2.2) return;             // too small to read: skip
    const lit = new Path2D(), dark = new Path2D();
    const u0 = 0.2, u1 = 0.8, vh = 0.78;
    for (let r = 0; r < rows; r++) {
      if (b.band && r % 5 === 4) continue;                          // band rows carry no windows
      const zb = 0.55 + r * 1.4;
      for (let j = 0; j < cols; j++) {
        const ua = (j + u0) / cols, ub = (j + u1) / cols;
        const path = hash01(b.seed, sideIdx, r, j) < 0.34 ? lit : dark;
        const x1 = A[0] + Ux * ua + Vx * zb, y1 = A[1] + Uy * ua + Vy * zb;
        path.moveTo(x1, y1);
        path.lineTo(A[0] + Ux * ub + Vx * zb, A[1] + Uy * ub + Vy * zb);
        path.lineTo(A[0] + Ux * ub + Vx * (zb + vh), A[1] + Uy * ub + Vy * (zb + vh));
        path.lineTo(A[0] + Ux * ua + Vx * (zb + vh), A[1] + Uy * ua + Vy * (zb + vh));
        path.closePath();
      }
    }
    ctx.fillStyle = shade(color, 0.3);
    ctx.fill(dark);
    ctx.fillStyle = warm ? '#FFE6A6' : shade(color, 1.55);
    ctx.globalAlpha = 0.92;
    ctx.fill(lit);
    ctx.globalAlpha = 1;
    // coloured floor bands, every fifth floor
    if (b.band) {
      ctx.fillStyle = shade(b.band, 0.95);
      for (let r = 4; r < rows; r += 5) {
        const zb = 0.55 + r * 1.4 + 0.15;
        ctx.beginPath();
        ctx.moveTo(A[0] + Vx * zb, A[1] + Vy * zb);
        ctx.lineTo(B[0] + Vx * zb, B[1] + Vy * zb);
        ctx.lineTo(B[0] + Vx * (zb + 0.5), B[1] + Vy * (zb + 0.5));
        ctx.lineTo(A[0] + Vx * (zb + 0.5), A[1] + Vy * (zb + 0.5));
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // a glowing sign on one side of the building
  function sign(b, a, bq, z, h) {
    const zc = z + h * 0.55;
    const p = (u, zz) => proj(lerp(a[0], bq[0], u), lerp(a[1], bq[1], u), zz);
    const col = COLORS[b.sign.color];
    ctx.globalAlpha = 0.22;
    poly([p(0.08, zc - 0.5), p(0.92, zc - 0.5), p(0.92, zc + 2.6), p(0.08, zc + 2.6)], col);
    ctx.globalAlpha = 1;
    poly([p(0.16, zc), p(0.84, zc), p(0.84, zc + 2.1), p(0.16, zc + 2.1)], col, COLORS.ink, Math.max(1, k * 0.1));
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = Math.max(1, k * 0.16);
    for (const [ua, ub, zz] of [[0.26, 0.74, zc + 1.45], [0.26, 0.6, zc + 0.75]]) {
      const q1 = p(ua, zz), q2 = p(ub, zz);
      ctx.beginPath(); ctx.moveTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]); ctx.stroke();
    }
  }

  // a box with flat-shaded sides, window grids and a neon-rimmed top
  function box(b, x, y, z, w, d, h, color, opts = {}) {
    const x0 = x - w / 2, x1 = x + w / 2, y0 = y - d / 2, y1 = y + d / 2, z1 = z + h;
    const hot = opts.hot;
    const edge = hot ? '#FFFFFF' : COLORS.ink;
    const lw = Math.max(1, k * (hot ? 0.22 : 0.12));
    SIDES.forEach((side, si) => {
      if (facing(side.n) <= 0.001) return;
      const [a, bq] = side.corners(x0, x1, y0, y1);
      const pts = [proj(a[0], a[1], z), proj(bq[0], bq[1], z), proj(bq[0], bq[1], z1), proj(a[0], a[1], z1)];
      const f = 0.5 + 0.22 * lightOf(side.n) + (hot ? 0.15 : 0);
      poly(pts, shade(color, f), null, 0);
      if (b && opts.windows !== false && !(lite && k < 6)) windows(b, si + (opts.tier || 0) * 4, a, bq, z, h, color, b.warm);
      if (b && b.sign && opts.tier === 0 && b.sign.side === si && h > 6) sign(b, a, bq, z, h);
      poly(pts, null, edge, lw);
      opts.out && opts.out.push(pts);
    });
    // neon edge on the corner nearest the viewer
    if (!opts.noEdge) {
      const nc = nearCorner(x0, x1, y0, y1);
      const p = proj(nc[0], nc[1], z), q = proj(nc[0], nc[1], z1);
      ctx.strokeStyle = shade(color, 1.4);
      ctx.lineWidth = Math.max(1, k * 0.1);
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
    }
    if (opts.noTop) return;
    const top = [proj(x0, y0, z1), proj(x1, y0, z1), proj(x1, y1, z1), proj(x0, y1, z1)];
    poly(top, shade(opts.topColor || color, hot ? 1.35 : 1.12), edge, lw);
    // bright rim just inside the roof edge
    if (k > 2.5) {
      const ins = Math.min(w, d) * 0.12;
      const rim = [proj(x0 + ins, y0 + ins, z1), proj(x1 - ins, y0 + ins, z1), proj(x1 - ins, y1 - ins, z1), proj(x0 + ins, y1 - ins, z1)];
      poly(rim, null, shade(opts.topColor || color, 0.72), Math.max(1, k * 0.08));
    }
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
      // a centre rib on each face catches the light
      const mid = proj((a[0] + bq[0]) / 2, (a[1] + bq[1]) / 2, z);
      ctx.strokeStyle = shade(color, 1.35);
      ctx.lineWidth = Math.max(1, k * 0.08);
      ctx.beginPath(); ctx.moveTo(mid[0], mid[1]); ctx.lineTo(apex[0], apex[1]); ctx.stroke();
      out && out.push(pts);
    }
  }

  function needle(x, y, zFrom, len, color, phase) {
    const p = proj(x, y, zFrom), q = proj(x, y, zFrom + len);
    ctx.strokeStyle = shade(color, 1.2);
    ctx.lineWidth = Math.max(1, k * 0.16);
    ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
    dot(q, color === 'magenta' ? 'magenta' : 'yellow', 0.5 + 0.5 * Math.sin(time * 3 + (phase || 0)));
  }

  function roofUnits(b, zTop, scale) {
    if (!b.units || !b.units.length || k < 2.5) return;
    const list = b.units.map((u) => ({ u, d: depth(b.x + u.dx * b.w * scale, b.y + u.dy * b.d * scale) })).sort((p, q) => p.d - q.d);
    for (const { u } of list) {
      const ux = b.x + u.dx * b.w * scale, uy = b.y + u.dy * b.d * scale;
      if (u.tank) {
        box(null, ux, uy, zTop, u.w, u.d, u.h, 'orange', { windows: false, noEdge: true, topColor: '#3B2A2A' });
        spire(ux, uy, zTop + u.h, u.w * 1.05, u.d * 1.05, 0.55, 'orange', false, null);
      } else {
        box(null, ux, uy, zTop, u.w, u.d, u.h, '#5B5486', { windows: false, noEdge: true });
      }
    }
  }

  // ---- the WALDROPOLIS sign ----
  const SIGN = { half: 20, z0: 2.2, z1: 14.5, W: 1400, H: 430 };
  let signArt = null;
  function paintSign() {
    const cv = document.createElement('canvas');
    cv.width = SIGN.W; cv.height = SIGN.H;
    const g = cv.getContext('2d');
    g.fillStyle = 'rgba(12,9,32,0.94)';
    g.fillRect(0, 0, SIGN.W, SIGN.H);
    g.strokeStyle = COLORS.magenta; g.lineWidth = 10;
    g.strokeRect(14, 14, SIGN.W - 28, SIGN.H - 28);
    g.strokeStyle = COLORS.cyan; g.lineWidth = 3;
    g.strokeRect(34, 34, SIGN.W - 68, SIGN.H - 68);
    // corner circuit ticks
    g.fillStyle = COLORS.yellow;
    for (const [x, y] of [[34, 34], [SIGN.W - 34, 34], [34, SIGN.H - 34], [SIGN.W - 34, SIGN.H - 34]]) { g.beginPath(); g.arc(x, y, 9, 0, 6.283); g.fill(); }
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.font = "700 250px 'Bricolage Grotesque', 'IBM Plex Sans', system-ui, sans-serif";
    g.shadowColor = COLORS.cyan; g.shadowBlur = 38;
    g.fillStyle = '#F5F3FF';
    g.fillText('WALDROPOLIS', SIGN.W / 2, 305, SIGN.W - 110);
    g.shadowBlur = 0;
    g.strokeStyle = 'rgba(49,234,242,0.9)'; g.lineWidth = 3;
    g.strokeText('WALDROPOLIS', SIGN.W / 2, 305, SIGN.W - 110);
    signArt = cv;
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { paintSign(); kick(); });

  function billboard(b, hot, out) {
    if (!signArt) paintSign();
    // the sign runs along the (1,-1) diagonal and faces the default view; from behind it flips so it still reads
    let hx = Math.SQRT1_2, hy = -Math.SQRT1_2;
    if (facing([Math.SQRT1_2, Math.SQRT1_2]) < 0) { hx = -hx; hy = -hy; }
    const z0 = b.h + SIGN.z0, z1 = b.h + SIGN.z1, H2 = SIGN.half;
    // pylons
    ctx.strokeStyle = '#2A2350';
    ctx.lineWidth = Math.max(2, k * 0.5);
    for (const t of [-0.62, 0.62]) {
      const p = proj(b.x + hx * H2 * t, b.y + hy * H2 * t, b.h), q = proj(b.x + hx * H2 * t, b.y + hy * H2 * t, z0 + 0.4);
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
    }
    const TL = proj(b.x - hx * H2, b.y - hy * H2, z1);
    const TR = proj(b.x + hx * H2, b.y + hy * H2, z1);
    const BL = proj(b.x - hx * H2, b.y - hy * H2, z0);
    const BR = proj(b.x + hx * H2, b.y + hy * H2, z0);
    // soft glow behind the sign
    ctx.globalAlpha = 0.18;
    poly([TL, TR, BR, BL], COLORS.magenta);
    ctx.globalAlpha = 1;
    ctx.setTransform(
      DPR * (TR[0] - TL[0]) / SIGN.W, DPR * (TR[1] - TL[1]) / SIGN.W,
      DPR * (BL[0] - TL[0]) / SIGN.H, DPR * (BL[1] - TL[1]) / SIGN.H,
      DPR * TL[0], DPR * TL[1]);
    ctx.drawImage(signArt, 0, 0);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    poly([TL, TR, BR, BL], null, hot ? '#FFFFFF' : COLORS.ink, Math.max(1, k * (hot ? 0.25 : 0.12)));
    out && out.push([TL, TR, BR, BL]);
  }

  // ---- the Listening Post: a lattice radio mast that broadcasts ----
  const MAST = 19;
  function mast(b, hot, out) {
    const z0 = b.h, z1 = b.h + MAST, r0 = 1.5, r1 = 0.3;
    const at = (t, sx, sy) => { const r = lerp(r0, r1, t); return proj(b.x + sx * r, b.y + sy * r, lerp(z0, z1, t)); };
    const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    // legs nearest the viewer drawn last
    legs.sort((p, q) => depth(b.x + p[0], b.y + p[1]) - depth(b.x + q[0], b.y + q[1]));
    ctx.lineCap = 'round';
    for (const [sx, sy] of legs) {
      const a = at(0, sx, sy), q = at(1, sx, sy);
      ctx.strokeStyle = COLORS.ink; ctx.lineWidth = Math.max(1.5, k * 0.34);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
      ctx.strokeStyle = hot ? '#FFFFFF' : shade('cyan', 1.1); ctx.lineWidth = Math.max(1, k * 0.16);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
    }
    // zig-zag bracing, alternating magenta and white like a real mast
    for (let i = 0; i < 7; i++) {
      const t0 = i / 7, t1 = (i + 1) / 7;
      ctx.strokeStyle = i % 2 ? '#F5F3FF' : COLORS.magenta;
      ctx.lineWidth = Math.max(1, k * 0.1);
      for (let L = 0; L < 4; L++) {
        const A = legs[L], B = legs[(L + 1) % 4];
        const p1 = at(t0, A[0], A[1]), p2 = at(t1, B[0], B[1]);
        ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
      }
    }
    const tip = proj(b.x, b.y, z1 + 1.2);
    // broadcast rings drifting out from the tip
    for (let i = 0; i < 3; i++) {
      const f = (time * 0.45 + i / 3) % 1;
      ctx.globalAlpha = (1 - f) * 0.65;
      ctx.strokeStyle = i % 2 ? COLORS.cyan : COLORS.magenta;
      ctx.lineWidth = Math.max(1, k * 0.12);
      ctx.beginPath(); ctx.ellipse(tip[0], tip[1], k * (1 + f * 7), k * (1 + f * 7) * 0.55, 0, 0, 6.283); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    dot(tip, 'magenta', 0.55 + 0.45 * Math.sin(time * 4));
    if (out) {
      out.push([at(0, -1, 1), at(0, 1, -1), at(1, 1, -1), at(1, -1, 1)]);
      out.push([at(0, -1, -1), at(0, 1, 1), at(1, 1, 1), at(1, -1, -1)]);
    }
  }

  function building(b) {
    const hot = b.landmark && (hovered === b.landmark || focused === b.landmark);
    const out = b.landmark ? [] : null;
    const topColor = b.color === 'cyan' || b.color === 'turq' ? (b.landmark ? 'yellow' : null) : null;
    const base = { hot, out };
    if (b.roof === 'sign') {
      box(b, b.x, b.y, 0, b.w, b.d, b.h * 0.6, b.color, { ...base, tier: 0, topColor: 'cyan' });
      box(b, b.x, b.y, b.h * 0.6, b.w * 0.8, b.d * 0.8, b.h * 0.4, b.color, { ...base, tier: 1, topColor: '#2A2260' });
      billboard(b, hot, out);
    } else if (b.roof === 'mast') {
      box(b, b.x, b.y, 0, b.w, b.d, b.h, b.color, { ...base, tier: 0, topColor: '#2A2260' });
      mast(b, hot, out);
    } else if (b.roof === 'setback') {
      // three tiers that step in, then a needle — like a 1930s skyscraper
      box(b, b.x, b.y, 0, b.w, b.d, b.h * 0.5, b.color, { ...base, tier: 0, topColor: b.band || 'magenta' });
      box(b, b.x, b.y, b.h * 0.5, b.w * 0.76, b.d * 0.76, b.h * 0.3, b.color, { ...base, tier: 1, topColor: b.band || 'magenta' });
      box(b, b.x, b.y, b.h * 0.8, b.w * 0.5, b.d * 0.5, b.h * 0.2, b.color, { ...base, tier: 2, topColor: 'yellow' });
      needle(b.x, b.y, b.h, 4.5, 'yellow', b.phase);
    } else if (b.roof === 'step') {
      box(b, b.x, b.y, 0, b.w, b.d, b.h * 0.62, b.color, { ...base, tier: 0, topColor: 'magenta' });
      box(b, b.x, b.y, b.h * 0.62, b.w * 0.66, b.d * 0.66, b.h * 0.38, b.color, { ...base, tier: 1, topColor });
      roofUnits(b, b.h, 0.66);
    } else if (b.roof === 'spire') {
      box(b, b.x, b.y, 0, b.w, b.d, b.h * 0.78, b.color, { ...base, tier: 0, topColor: 'yellow' });
      spire(b.x, b.y, b.h * 0.78, b.w * 0.82, b.d * 0.82, b.h * 0.36, b.landmark ? 'yellow' : 'magenta', hot, out);
    } else {
      box(b, b.x, b.y, 0, b.w, b.d, b.h, b.color, { ...base, tier: 0, topColor });
      if (b.roof === 'antenna') needle(b.x, b.y, b.h, 4, b.landmark ? 'magenta' : b.color, b.phase);
      else roofUnits(b, b.h, 1);
    }
    if (b.beacon) {
      const top = b.roof === 'spire' ? b.h * 1.14 : b.roof === 'setback' ? b.h + 4.5 : b.h;
      dot(proj(b.x, b.y, top + 0.4), b.beacon, 0.35 + 0.65 * Math.max(0, Math.sin(time * 2 + b.phase)));
    }
    if (out) polys.set(b.landmark, out);
  }

  // surface-mount parts: resistors (dark with metal ends) and capacitors (tan)
  function component(cp) {
    const L = 2.2, Wd = 1.0;
    const w = cp.rot ? Wd : L, d = cp.rot ? L : Wd;
    if (cp.kind === 'res') {
      box(null, cp.x, cp.y, 0, w, d, 0.7, '#25213A', { windows: false, noEdge: true });
      const e = 0.42;
      for (const sgn of [-1, 1]) {
        const ex = cp.rot ? cp.x : cp.x + sgn * (L / 2 - e / 2);
        const ey = cp.rot ? cp.y + sgn * (L / 2 - e / 2) : cp.y;
        box(null, ex, ey, 0, cp.rot ? Wd + 0.05 : e, cp.rot ? e : Wd + 0.05, 0.75, '#C9C6D8', { windows: false, noEdge: true });
      }
    } else {
      box(null, cp.x, cp.y, 0, w, d, 0.9, '#C79A62', { windows: false, noEdge: true, topColor: '#D8B07A' });
    }
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

    // The camera only moves when the visitor moves it. One exception: a click that sends
    // the car somewhere makes the camera follow it until it arrives. Panning takes over again.
    if (car.follow && canDrive()) {
      goal.tx = car.x; goal.ty = car.y; goal.tz = 1;
      if (home && goal.zoom < home.zoom * 1.7) goal.zoom = home.zoom * 1.7;
      goal.ox = 0; goal.oy = 0.06; goal.lmx = 0;
      speed = 3;
      if (!car.driving) car.follow = false;
    }

    const ease = reducedMotion() ? 1 : 1 - Math.exp(-dt * speed);
    let moving = false;
    for (const key of ['pitch', 'zoom', 'tx', 'ty', 'tz', 'ox', 'oy', 'labels', 'glow', 'lmx']) {
      const before = cam[key];
      cam[key] = lerp(cam[key], goal[key], ease);
      if (Math.abs(cam[key] - before) > 1e-4) moving = true;
    }
    const before = cam.yaw;
    cam.yaw = lerpAngle(cam.yaw, goal.yaw, ease);
    if (Math.abs(cam.yaw - before) > 1e-4) moving = true;

    const yaw = cam.yaw * Math.PI / 180;
    const pitch = Math.min(89, Math.max(12, cam.pitch)) * Math.PI / 180;
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

    const carMoving = updateCar(dt);
    chip();
    traces();
    pulses(dt);
    carRing();
    polys = new Map();

    // painter's algorithm: far buildings first; the core sits at depth 0
    const items = world.buildings.map((b) => ({ b, d: depth(b.x, b.y) }));
    for (const cp of world.comps) items.push({ cp, d: depth(cp.x, cp.y) });
    items.push({ core: true, d: depth(0, 0) - CORE * 0.9 });
    items.push({ car: true, d: depth(car.x, car.y) + 0.5 });
    items.sort((a, b) => a.d - b.d);
    for (const it of items) it.core ? core() : it.car ? drawCar() : it.cp ? component(it.cp) : building(it.b);
    carMarker();

    // labels follow their buildings; where two would overlap, the one further back moves up
    const placed = [];
    const spots = LANDMARKS.map((lm) => {
      const t = tags.get(lm.id);
      const top = lm.core ? 2.5 : lm.roof === 'mast' ? lm.h + MAST + 2.5 : lm.roof === 'sign' ? lm.h + SIGN.z1 + 2.5 : lm.roof === 'spire' ? lm.h * 1.16 + 2 : lm.roof === 'antenna' ? lm.h + 5.5 : lm.h + 2;
      if (!t._w) { t._w = t.offsetWidth; t._h = t.offsetHeight; }   // label text never changes: measure once
      return { lm, t, p: proj(lm.x, lm.y, top), d: depth(lm.x, lm.y) };
    }).sort((a, b) => b.d - a.d);                                       // nearest the viewer first
    for (const { t, p } of spots) {
      const w = t._w + 6, h = t._h + 4;
      for (let guard = 0; guard < LANDMARKS.length; guard++) {
        const hit = placed.find((q) => Math.abs(q.x - p[0]) < (q.w + w) / 2 && p[1] > q.y - q.h && p[1] - h < q.y);
        if (!hit) break;
        p[1] = hit.y - hit.h;                                            // sit just above the label it hit
      }
      placed.push({ x: p[0], y: p[1], w, h });
    }
    for (const { lm, t, p } of spots) {
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
    if (running && (ambient || moving || dirty || carMoving || keys.size)) raf = requestAnimationFrame(frame);
    dirty = false;
  }

  function kick() {
    dirty = true;
    if (!raf && running) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }

  // ---- routing on the road graph ----
  function roadOf(p) { return ROADS.find((r) => onRoad(r, p)); }
  function along(r, p) { return r.axis === 'v' ? p[1] : p[0]; }
  function nodesOn(r) { return [...graph.values()].filter((n) => onRoad(r, n.p)).sort((a, b) => along(r, a.p) - along(r, b.p)); }
  function attach(p) {
    const r = roadOf(p);
    const list = nodesOn(r);
    const t = along(r, p);
    let lo = list[0], hi = list[list.length - 1];
    for (const n of list) { const u = along(r, n.p); if (u <= t + 1e-6) lo = n; if (u >= t - 1e-6) { hi = n; break; } }
    return { r, lo, hi };
  }
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  function findPath(from, to) {
    const A = attach(from), B = attach(to);
    let best = null;
    if (A.r === B.r) best = { len: dist(from, to), pts: [from, to] };     // same road: straight along it
    const D = new Map(), prev = new Map(), open = new Set();
    for (const n of [A.lo, A.hi]) { const d = dist(from, n.p); if (!D.has(n) || d < D.get(n)) { D.set(n, d); prev.set(n, null); } open.add(n); }
    while (open.size) {
      let u = null;
      for (const n of open) if (!u || D.get(n) < D.get(u)) u = n;
      open.delete(u);
      for (const e of u.edges) {
        const nd = D.get(u) + e.d;
        if (!D.has(e.to) || nd < D.get(e.to)) { D.set(e.to, nd); prev.set(e.to, u); open.add(e.to); }
      }
    }
    for (const n of [B.lo, B.hi]) {
      if (!D.has(n)) continue;
      const len = D.get(n) + dist(n.p, to);
      if (!best || len < best.len - 1e-6) {
        const pts = [to];
        for (let m = n; m; m = prev.get(m)) pts.unshift(m.p);
        pts.unshift(from);
        best = { len, pts };
      }
    }
    // drop zero-length hops
    return best.pts.filter((q, i, arr) => i === 0 || dist(q, arr[i - 1]) > 0.01);
  }

  function driveTo(point, arrive, follow) {
    car.follow = !!follow;
    const from = [car.x, car.y];
    if (!roadOf(from)) { const sn = snapToRoad(from); car.x = sn.p[0]; car.y = sn.p[1]; }
    const path = findPath([car.x, car.y], point);
    car.arrive = arrive || null;
    setNear(null);
    if (reducedMotion() || path.length < 2) {
      if (path.length >= 2) { const a = path[path.length - 2], b = path[path.length - 1]; car.h = car.th = Math.atan2(b[1] - a[1], b[0] - a[0]); }
      car.x = point[0]; car.y = point[1];
      car.path = null;
      finishDrive();
      return;
    }
    car.path = path; car.i = 1; car.driving = true;
    kick();
  }
  function finishDrive() {
    car.driving = false;
    car.path = null;
    const cb = car.arrive;
    car.arrive = null;
    if (cb) cb(); else checkNear();
    kick();
  }
  function setNear(lm) {
    if (near === lm) return;
    near = lm;
    onNear(lm);
  }
  function checkNear() {
    const lm = LANDMARKS.find((l) => dist(l.spot, [car.x, car.y]) < 0.8) || null;
    setNear(lm);
  }

  // free driving with the keyboard: pick the road direction closest to the arrow on screen
  function keyDrive(dt) {
    let sx = 0, sy = 0;
    if (keys.has('up')) sy -= 1;
    if (keys.has('down')) sy += 1;
    if (keys.has('left')) sx -= 1;
    if (keys.has('right')) sx += 1;
    if (!sx && !sy) return false;
    const m = Math.hypot(sx, sy); sx /= m; sy /= m;
    const here = [car.x, car.y];
    const roads = ROADS.filter((r) => onRoad(r, here));
    if (!roads.length) { const sn = snapToRoad(here); car.x = sn.p[0]; car.y = sn.p[1]; return true; }
    const P = proj(car.x, car.y, 0);
    let best = null, bestDot = 0.3;
    for (const r of roads) {
      for (const sgn of [-1, 1]) {
        const dir = r.axis === 'v' ? [0, sgn] : [sgn, 0];
        const t = along(r, here);
        if ((sgn < 0 && t <= r.from + 1e-6) || (sgn > 0 && t >= r.to - 1e-6)) continue;
        const Q = proj(car.x + dir[0], car.y + dir[1], 0);
        const vx = Q[0] - P[0], vy = Q[1] - P[1], vm = Math.hypot(vx, vy) || 1;
        const dot = (vx / vm) * sx + (vy / vm) * sy;
        if (dot > bestDot) { bestDot = dot; best = { r, sgn, dir }; }
      }
    }
    if (!best) return false;
    const { r, sgn, dir } = best;
    const t = along(r, here);
    // stop exactly at the next junction so a turn can be taken there
    const stops = nodesOn(r).map((n) => along(r, n.p));
    const next = sgn > 0 ? Math.min(...stops.filter((u) => u > t + 1e-6), r.to) : Math.max(...stops.filter((u) => u < t - 1e-6), r.from);
    const step = Math.min(CAR_SPEED * dt, Math.abs(next - t));
    if (r.axis === 'v') car.y += sgn * step; else car.x += sgn * step;
    if (Math.abs(along(r, [car.x, car.y]) - next) < 1e-4) { if (r.axis === 'v') car.y = next; else car.x = next; }
    car.th = Math.atan2(dir[1], dir[0]);
    return true;
  }

  function updateCar(dt) {
    let moved = false;
    if (car.path) {
      let left = CAR_SPEED * dt;
      while (left > 0 && car.path) {
        const tgt = car.path[car.i];
        const dx = tgt[0] - car.x, dy = tgt[1] - car.y, d = Math.hypot(dx, dy);
        if (d > 1e-6) car.th = Math.atan2(dy, dx);
        if (d <= left) {
          car.x = tgt[0]; car.y = tgt[1]; left -= d; car.i++;
          if (car.i >= car.path.length) { finishDrive(); break; }
        } else { car.x += (dx / d) * left; car.y += (dy / d) * left; left = 0; }
      }
      moved = true;
    } else if (canDrive() && keys.size) {
      moved = keyDrive(dt);
      if (moved) checkNear();
    }
    // Space: a little hop
    if (car.hopT >= 0) { car.hopT += dt; moved = true; if (car.hopT > 0.55) car.hopT = -1; }
    // ease the heading round corners
    let dh = ((car.th - car.h + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    car.h += dh * Math.min(1, dt * 14);
    car.moving = moved || Math.abs(dh) > 0.01;
    // light trail: record recent positions while moving; let it fade out when stopped
    const back = [car.x - Math.cos(car.h) * 1.5 * CS, car.y - Math.sin(car.h) * 1.5 * CS, -Math.sin(car.h), Math.cos(car.h)];
    if (moved) { car.trail.push(back); if (car.trail.length > 22) car.trail.shift(); }
    else if (car.trail.length) { car.trail.shift(); car.moving = true; }
    return car.moving;
  }

  // an oriented box (the car can face any way)
  function orientedBox(cx0, cy0, z, len, wid, hgt, fill, opts = {}) {
    const fx = Math.cos(car.h), fy = Math.sin(car.h), rx = -fy, ry = fx;
    const P = (sf, sr, zz) => proj(cx0 + fx * sf * len / 2 + rx * sr * wid / 2, cy0 + fy * sf * len / 2 + ry * sr * wid / 2, zz);
    const faces = [
      { n: [fx, fy], a: [1, -1], b: [1, 1] },
      { n: [-fx, -fy], a: [-1, 1], b: [-1, -1] },
      { n: [rx, ry], a: [1, 1], b: [-1, 1] },
      { n: [-rx, -ry], a: [-1, -1], b: [1, -1] },
    ];
    const lw = Math.max(1, k * 0.08);
    for (const f of faces) {
      if (facing(f.n) <= 0.001) continue;
      const pts = [P(f.a[0], f.a[1], z), P(f.b[0], f.b[1], z), P(f.b[0], f.b[1], z + hgt), P(f.a[0], f.a[1], z + hgt)];
      poly(pts, shade(fill, 0.55 + 0.25 * lightOf(f.n)), opts.edge || COLORS.ink, lw);
    }
    poly([P(-1, -1, z + hgt), P(1, -1, z + hgt), P(1, 1, z + hgt), P(-1, 1, z + hgt)], shade(opts.top || fill, 1.1), opts.edge || COLORS.ink, lw);
    return P;
  }

  // an original low-slung synthwave racer: violet body, neon stripes, rear wing, underglow and light trails
  function drawCar() {
    // lift everything the car draws while it hops (proj measures height from cam.tz)
    const hop = car.hopT >= 0 ? Math.sin((car.hopT / 0.55) * Math.PI) * 2.4 : 0;
    cam.tz -= hop;
    try { drawCarBody(); } finally { cam.tz += hop; }
  }
  function drawCarBody() {
    const fx = Math.cos(car.h), fy = Math.sin(car.h), rx = -fy, ry = fx;
    const W = (f, r) => [car.x + fx * f * CS + rx * r * CS, car.y + fy * f * CS + ry * r * CS];
    const G = (f, r, z = 0.03) => { const w = W(f, r); return proj(w[0], w[1], z); };
    const line = (a, b, color, wpx, alpha = 1) => {
      ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = wpx;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.globalAlpha = 1;
    };

    // light trails from the tail lights
    if (car.trail.length > 1) {
      ctx.lineCap = 'round';
      for (const [r, col] of [[-0.55, COLORS.magenta], [0.55, COLORS.cyan]]) {
        for (let i = 1; i < car.trail.length; i++) {
          const a = car.trail[i - 1], b = car.trail[i];
          const pa = proj(a[0] + a[2] * r * CS, a[1] + a[3] * r * CS, 0.45 * CS);
          const pb = proj(b[0] + b[2] * r * CS, b[1] + b[3] * r * CS, 0.45 * CS);
          line(pa, pb, col, Math.max(1, k * 0.22), (i / car.trail.length) * 0.55);
        }
      }
    }
    // headlight beams and cyan underglow
    ctx.globalAlpha = 0.18;
    poly([G(1.5, -0.5), G(1.5, 0.5), G(5.6, 1.8), G(5.6, -1.8)], COLORS.yellow);
    ctx.globalAlpha = 0.4;
    poly([G(-1.75, -1.0), G(1.75, -1.0), G(1.75, 1.0), G(-1.75, 1.0)], COLORS.cyan);
    ctx.globalAlpha = 0.55;
    poly([G(-1.5, -0.78), G(1.5, -0.78), G(1.5, 0.78), G(-1.5, 0.78)], '#000000');
    ctx.globalAlpha = 1;

    // wheels
    for (const [f, r] of [[0.92, 0.68], [0.92, -0.68], [-0.92, 0.68], [-0.92, -0.68]]) {
      const w = W(f, r);
      orientedBox(w[0], w[1], 0, 0.6 * CS, 0.28 * CS, 0.38 * CS, '#120E24');
    }
    // low wide body
    orientedBox(car.x, car.y, 0.2 * CS, 3.0 * CS, 1.5 * CS, 0.4 * CS, '#3B2C86', { top: '#4A38A6', edge: shade('magenta', 0.8) });
    // glass canopy, set back
    const cab = W(-0.25, 0);
    orientedBox(cab[0], cab[1], 0.6 * CS, 1.35 * CS, 1.16 * CS, 0.34 * CS, '#0F2A3A', { top: '#163D52', edge: COLORS.cyan });
    // rear wing on two posts
    for (const r of [-0.5, 0.5]) { const pst = W(-1.32, r); line(proj(pst[0], pst[1], 0.6 * CS), proj(pst[0], pst[1], 0.92 * CS), '#1A1440', Math.max(1, k * 0.14)); }
    const wing = W(-1.32, 0);
    orientedBox(wing[0], wing[1], 0.92 * CS, 0.38 * CS, 1.62 * CS, 0.09 * CS, 'magenta', { top: 'magenta' });

    // neon side stripes, full-width tail light, headlights
    for (const r of [-0.76, 0.76]) line(G(-1.5, r, 0.42 * CS), G(1.5, r, 0.42 * CS), COLORS.magenta, Math.max(1, k * 0.12));
    line(G(-1.51, -0.62, 0.48 * CS), G(-1.51, 0.62, 0.48 * CS), COLORS.magenta, Math.max(1.5, k * 0.2));
    for (const r of [-0.5, 0.5]) { const hl = W(1.51, r); dot(proj(hl[0], hl[1], 0.45 * CS), 'yellow', 1); }
  }

  function carRing() {
    const pts = [];
    const R = 2.6 + 0.25 * Math.sin(time * 4);
    for (let a = 0; a < 24; a++) { const t = (a / 24) * Math.PI * 2; pts.push(proj(car.x + Math.cos(t) * R, car.y + Math.sin(t) * R, 0.04)); }
    ctx.globalAlpha = 0.5;
    poly(pts, null, COLORS.magenta, Math.max(1, k * 0.14));
    ctx.globalAlpha = 1;
  }
  // a small bobbing chevron above the car, drawn over everything
  function carMarker() {
    if (cam.labels < 0.3) return;
    const bob = Math.sin(time * 3) * 0.5;
    const p = proj(car.x, car.y, 7 + bob);
    const sz = Math.max(6, Math.min(12, k * 0.9));
    ctx.globalAlpha = cam.labels;
    ctx.fillStyle = COLORS.magenta;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p[0] - sz, p[1] - sz * 1.1);
    ctx.lineTo(p[0] + sz, p[1] - sz * 1.1);
    ctx.lineTo(p[0], p[1]);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // screen -> ground (z = 0)
  function unproject(sx, sy) {
    const rx = (sx - cx) / k;
    const ryy = ((sy - cy) / k - cam.tz * cp) / sp;
    return [rx * c + ryy * s + cam.tx, -rx * s + ryy * c + cam.ty];
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

  // ---- camera controls ----
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function takeOver() {
    car.follow = false;
    for (const kk of ['yaw', 'pitch', 'zoom', 'tx', 'ty', 'tz', 'ox', 'oy']) goal[kk] = cam[kk];
  }
  function pan(dx, dy) {
    const rx = -dx / k, ry = -dy / (k * sp);
    cam.tx = goal.tx = clamp(cam.tx + rx * c + ry * s, -70, 70);
    cam.ty = goal.ty = clamp(cam.ty - rx * s + ry * c, -70, 70);
    kick();
  }
  function orbit(dx, dy) {
    cam.yaw = goal.yaw = cam.yaw - dx * 0.35;
    cam.pitch = goal.pitch = clamp(cam.pitch + dy * 0.25, 14, 85);
    kick();
  }

  let drag = null;
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('pointerdown', (e) => {
    if (!canDrive()) return;
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, orbit: e.button === 2 || e.shiftKey, button: e.button, moved: false };
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  });
  canvas.addEventListener('pointermove', (e) => {
    if (drag && e.pointerId === drag.id) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
      if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6) {
        drag.moved = true;
        takeOver();
        setHover(null);
        canvas.style.cursor = drag.orbit ? 'grabbing' : 'move';
      }
      if (drag.moved) (drag.orbit ? orbit : pan)(dx, dy);
      return;
    }
    const r = canvas.getBoundingClientRect();
    if (e.pointerType === 'mouse') setHover(pick(e.clientX - r.left, e.clientY - r.top));
  });
  function endDrag(e) {
    const d = drag;
    if (!d || e.pointerId !== d.id) return;
    drag = null;
    canvas.style.cursor = '';
    if (e.type === 'pointerup' && !d.moved && d.button === 0) {
      const r = canvas.getBoundingClientRect();
      clickAt(e.clientX - r.left, e.clientY - r.top);
    }
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', () => { if (!drag) setHover(null); });

  // a click sends the car: to a building (and shows its Enter prompt), or to any road
  function clickAt(x, y) {
    if (!canDrive()) return;
    const id = pick(x, y);
    if (id) { visit(LANDMARKS.find((l) => l.id === id)); return; }
    const g = unproject(x, y);
    if (Math.abs(g[0]) > HALF || Math.abs(g[1]) > HALF) return;
    const sn = snapToRoad(g);
    if (sn.d < 5) driveTo(sn.p, null, true);
  }
  function visit(lm) { driveTo(lm.spot, null, true); setNear(lm); }

  const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
  window.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (!canDrive()) return;
    const kk = KEYMAP[e.code];
    if (kk) {
      e.preventDefault();
      if (car.path) { car.path = null; car.arrive = null; car.driving = false; car.follow = false; }   // take the wheel back
      keys.add(kk);
      kick();
    } else if (e.code === 'Space' && !(t && /^(A|BUTTON)$/.test(t.tagName))) {
      e.preventDefault();
      if (car.hopT < 0) { car.hopT = 0; kick(); }
    } else if (e.key === 'Enter' && near && !(t && /^(A|BUTTON)$/.test(t.tagName))) {
      e.preventDefault();
      onEnter(near);
    }
  });
  window.addEventListener('keyup', (e) => { const kk = KEYMAP[e.code]; if (kk) { keys.delete(kk); checkNear(); } });
  window.addEventListener('blur', () => keys.clear());

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
    // put the car outside a building (used when a page is opened from the menu)
    parkAt(id) {
      const lm = LANDMARKS.find((l) => l.id === id);
      if (!lm) return;
      car.path = null; car.arrive = null; car.driving = false;
      const before = [car.x, car.y];
      car.x = lm.spot[0]; car.y = lm.spot[1];
      if (dist(before, lm.spot) > 0.01) {
        const r = roadOf(lm.spot);
        car.h = car.th = r.axis === 'v' ? Math.PI / 2 : 0;
      }
      setNear(lm);
      kick();
    },
    visit(id) { const lm = LANDMARKS.find((l) => l.id === id); if (lm) visit(lm); },
    get near() { return near; },
    setHome(v) { home = { ...v }; },
    resetView() { car.follow = false; if (home) { Object.assign(goal, home); speed = 3; kick(); } },
    saveView() { car.follow = false; saved = { ...goal }; },
    restoreView() { Object.assign(goal, saved || home); saved = null; speed = 3.2; kick(); },
    kick,
  };
}
