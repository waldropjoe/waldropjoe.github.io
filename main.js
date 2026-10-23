(() => {
  'use strict';

  // The page scrolls through five sections; the wheel is a dial for that scroll.
  // Scrolling turns the wheel, and turning the wheel scrolls the page.
  const STEP = 72;     // degrees per section
  const QUEST = [
    'the run starts. the unicorn is way ahead.',
    'closing in.',
    'halfway there.',
    'almost.',
    'so close. never quite there.'
  ];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const content = $('.content');
  const blocks = $$('.block');
  const wheel = $('#wheel');
  const rotor = $('#rotor');
  const labels = $$('.label', rotor);
  const segs = $$('.seg', rotor);
  const runner = $('#runner');
  const unicorn = $('#unicorn');
  const hubN = $('#hubN');
  const quest = $('#quest');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  let anchors = [];        // scroll positions where each section is "on the dial"
  let lap = 0;             // completed runs; keeps the wheel turning forward when the run restarts
  let override = null;     // wheel position during the restart animation
  let lastActive = -1;
  let idleTimer = 0;
  let frame = 0;
  let drag = null;
  let suppressClick = false;

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  function measure() {
    const offset = window.innerHeight * 0.38;
    const max = maxScroll();
    anchors = blocks.map((b, i) => {
      if (i === 0) return 0;
      return Math.min(b.getBoundingClientRect().top + window.scrollY - offset, max);
    });
    // keep anchors strictly increasing, even when the last sections are short
    for (let i = anchors.length - 1; i > 0; i--) {
      if (i === anchors.length - 1) anchors[i] = Math.min(anchors[i], max);
      if (anchors[i - 1] >= anchors[i]) anchors[i - 1] = anchors[i] - 1;
    }
  }

  // scroll position -> 0..4 (fractional), and back
  function progressAt(y) {
    if (y <= anchors[0]) return 0;
    for (let i = 0; i < anchors.length - 1; i++) {
      if (y < anchors[i + 1]) return i + (y - anchors[i]) / (anchors[i + 1] - anchors[i]);
    }
    return anchors.length - 1;
  }
  function scrollFor(p) {
    p = clamp(p, 0, anchors.length - 1);
    const i = Math.min(Math.floor(p), anchors.length - 2);
    return anchors[i] + (p - i) * (anchors[i + 1] - anchors[i]);
  }

  function paint(p, effective) {
    const r = 180 - STEP * effective;  // the current section sits at the bottom, under the runner
    rotor.style.transform = `rotate(${r}deg)`;
    labels.forEach((l) => { l.style.transform = `translate(-50%, -50%) rotate(${-r}deg)`; });

    // the unicorn stays ahead on the floor; the gap closes from 34° to 13° across the run
    const gap = (34 - 5.25 * p) * Math.PI / 180;
    const R = 168 / 520;
    unicorn.style.left = `${(0.5 - R * Math.sin(gap)) * 100}%`;
    unicorn.style.top = `${(0.5 + R * Math.cos(gap)) * 100}%`;

    const a = clamp(Math.round(p), 0, 4);
    if (a !== lastActive) {
      segs.forEach((s, i) => s.classList.toggle('is-active', i === a));
      labels.forEach((l, i) => l.classList.toggle('is-active', i === a));
      blocks.forEach((b, i) => b.classList.toggle('is-active', i === a));
      hubN.textContent = String(a + 1).padStart(2, '0');
      lastActive = a;
    }
    const lapText = lap > 0 ? `lap ${lap + 1} · ` : '';
    quest.textContent = window.scrollY < 8 && lap === 0 ? 'scroll to start the run.' : lapText + QUEST[a];
  }

  function update() {
    frame = 0;
    if (override) return;
    const p = progressAt(window.scrollY);
    paint(p, p + 5 * lap);
  }
  const queue = () => { if (!frame) frame = requestAnimationFrame(update); };

  function setRunning(on) {
    [runner, unicorn].forEach((el) => {
      el.classList.toggle('running', on);
      el.classList.toggle('idle', !on);
    });
  }
  function nudgeRun() {
    setRunning(true);
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { if (!drag && !override) setRunning(false); }, 180);
  }

  window.addEventListener('scroll', () => { queue(); nudgeRun(); }, { passive: true });
  window.addEventListener('resize', () => { measure(); queue(); });
  window.addEventListener('load', () => { measure(); queue(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); queue(); });

  const smooth = () => (reduced.matches ? 'auto' : 'smooth');
  const goTo = (i) => window.scrollTo({ top: scrollFor(i), behavior: smooth() });

  // ---- click a segment to jump there ----
  segs.forEach((s) => s.addEventListener('click', () => {
    if (suppressClick) return;
    goTo(Number(s.dataset.i));
  }));

  // ---- drag the wheel to scroll the page ----
  const angleAt = (e) => {
    const r = wheel.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
  };

  wheel.addEventListener('pointerdown', (e) => {
    if (override) return;
    measure();
    drag = { id: e.pointerId, start: angleAt(e), last: 0, p0: progressAt(window.scrollY), moved: false, t: performance.now(), vel: 0 };
  });

  wheel.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    let delta = angleAt(e) - drag.start;
    while (delta - drag.last > 180) delta -= 360;
    while (delta - drag.last < -180) delta += 360;
    const now = performance.now();
    drag.vel = 0.7 * drag.vel + 0.3 * ((delta - drag.last) / Math.max(1, now - drag.t));
    drag.last = delta;
    drag.t = now;
    if (!drag.moved && Math.abs(delta) > 4) {
      drag.moved = true;
      try { wheel.setPointerCapture(drag.id); } catch (_) {}
      wheel.classList.add('is-dragging');
    }
    if (!drag.moved) return;
    // turning the wheel counter-clockwise moves forward through the content
    const p = clamp(drag.p0 - delta / STEP, 0, 4);
    window.scrollTo({ top: scrollFor(p), behavior: 'auto' });
  });

  function endDrag() {
    const d = drag;
    drag = null;
    if (!d) return;
    wheel.classList.remove('is-dragging');
    if (!d.moved) return;
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    const fling = clamp(-d.vel * 2, -1, 1);        // a quick flick carries one extra section
    const p = progressAt(window.scrollY);
    goTo(clamp(Math.round(p + fling), 0, 4));
  }
  wheel.addEventListener('pointerup', endDrag);
  wheel.addEventListener('pointercancel', endDrag);

  // ---- run it again: the wheel keeps turning forward into 01 ----
  $('#restart').addEventListener('click', () => {
    if (override) return;
    const fromEff = progressAt(window.scrollY) + 5 * lap;
    const toEff = 5 * (lap + 1);
    const dur = reduced.matches ? 0 : 800;
    const t0 = performance.now();
    override = true;
    setRunning(true);
    content.classList.add('is-fading');

    let jumped = false;
    const tick = (now) => {
      const t = dur ? clamp((now - t0) / dur, 0, 1) : 1;
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const eff = fromEff + (toEff - fromEff) * e;
      // the unicorn dashes back out ahead as the run restarts
      paint(4 * (1 - e), eff);
      if (!jumped && t >= 0.3) {
        jumped = true;
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
      if (t < 1) { requestAnimationFrame(tick); return; }
      lap += 1;
      override = null;
      content.classList.remove('is-fading');
      setRunning(false);
      update();
    };
    requestAnimationFrame(tick);
  });

  measure();
  update();
})();
