(() => {
  'use strict';

  const SECTIONS = ['work', 'tech', 'data', 'ideas', 'about'];
  const QUEST = [
    'the run starts. the unicorn is way ahead.',
    'closing in.',
    'halfway there.',
    'almost.',
    'so close. the run loops back to 01.'
  ];
  const STEP = 72;            // degrees per section
  const AUTO_MS = 3200;       // auto-run interval
  const PAUSE_MS = 9000;      // pause after the visitor interacts
  const RUN_MS = 760;         // how long the legs keep moving after a turn

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const wheel = $('#wheel');
  const rotor = $('#rotor');
  const labels = $$('.label', rotor);
  const segs = $$('.seg', rotor);
  const panels = $$('[data-panel]');
  const nums = $$('.controls [data-go]');
  const runner = $('#runner');
  const unicorn = $('#unicorn');
  const uniTrack = $('#uniTrack');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  let pos = 0;              // total sections advanced; can grow forever, which makes the loop circular
  let lastActive = -1;
  let hovering = false;
  let pausedUntil = 0;
  let runTimer = 0;
  let drag = null;
  let justDragged = false;

  const mod = (n, m) => ((n % m) + m) % m;
  const rotFor = (p) => 180 - STEP * p;   // active section sits at the bottom, under the runner

  function paintRotation(r) {
    rotor.style.transform = `rotate(${r}deg)`;
    // labels sit inside the rotor, so cancelling the rotor's angle keeps them upright
    labels.forEach((l) => { l.style.transform = `translate(-50%, -50%) rotate(${-r}deg)`; });
  }

  function render() {
    const a = mod(pos, 5);
    const lap = Math.max(1, Math.floor(pos / 5) + 1);

    paintRotation(rotFor(pos));
    segs.forEach((s, i) => s.classList.toggle('is-active', i === a));
    labels.forEach((l, i) => l.classList.toggle('is-active', i === a));
    nums.forEach((b, i) => b.setAttribute('aria-pressed', String(i === a)));

    uniTrack.style.transform = `rotate(${180 + 74 - 11 * a}deg)`;

    const n = String(a + 1).padStart(2, '0');
    $('#hubN').textContent = `${n}/05`;
    $('#runN').textContent = n;
    $('#lap').textContent = lap;
    $('#quest').textContent = QUEST[a];
    $('#catName').textContent = SECTIONS[a];
    $('#hub').setAttribute('aria-label', `Flywheel, ${n} ${SECTIONS[a]} selected. Use arrow keys to turn.`);

    if (a !== lastActive) {
      panels.forEach((p) => {
        const on = Number(p.dataset.panel) === a;
        p.hidden = !on;
        p.classList.remove('show');
        if (on) { void p.offsetWidth; p.classList.add('show'); }
      });
      lastActive = a;
    }
  }

  function setRunning(on) {
    [runner, unicorn].forEach((el) => {
      el.classList.toggle('running', on);
      el.classList.toggle('idle', !on);
    });
  }

  function run() {
    setRunning(true);
    clearTimeout(runTimer);
    runTimer = setTimeout(() => { if (!drag) setRunning(false); }, RUN_MS);
  }

  function pause() {
    pausedUntil = Date.now() + PAUSE_MS;
    updateAutoText();
  }

  function updateAutoText() {
    const paused = hovering || Date.now() < pausedUntil || reduced.matches;
    $('#autoText').textContent = paused ? 'auto-run paused' : 'auto-run on';
  }

  function step(d) {
    if (!d) return;
    pos += d;
    render();
    run();
  }

  function select(i) {
    let d = mod(i - mod(pos, 5), 5);
    if (d > 2) d -= 5;          // shortest way round
    pause();
    step(d);
  }

  // ---- auto-run ----
  setInterval(() => {
    updateAutoText();
    if (reduced.matches || hovering || drag || Date.now() < pausedUntil) return;
    if (document.hidden) return;
    step(1);
  }, AUTO_MS);

  // ---- clicks & keys ----
  segs.forEach((s) => s.addEventListener('click', () => { if (!justDragged) select(Number(s.dataset.i)); }));
  $$('[data-go]').forEach((b) => b.addEventListener('click', () => select(Number(b.dataset.go))));
  $('#next').addEventListener('click', () => { pause(); step(1); });
  $('#prev').addEventListener('click', () => { pause(); step(-1); });

  const hub = $('#hub');
  hub.addEventListener('click', () => { if (!justDragged) { pause(); step(1); } });
  hub.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); pause(); step(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); pause(); step(-1); }
  });

  wheel.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hovering = true; updateAutoText(); } });
  wheel.addEventListener('pointerleave', () => { hovering = false; updateAutoText(); });

  // ---- drag & flick ----
  const angleAt = (e) => {
    const r = wheel.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
  };

  let raf = 0;

  wheel.addEventListener('pointerdown', (e) => {
    const base = rotFor(pos);
    drag = { id: e.pointerId, start: angleAt(e), last: 0, base, cur: base, moved: false, t: performance.now(), vel: 0 };
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
      rotor.classList.add('no-anim');
      wheel.classList.add('is-dragging');
      setRunning(true);
      pause();
    }
    if (!drag.moved) return;
    drag.cur = drag.base + delta;
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; if (drag) paintRotation(drag.cur); });
  });

  function endDrag() {
    const d = drag;
    drag = null;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (!d || !d.moved) return;
    const fling = Math.max(-STEP, Math.min(STEP, d.vel * 140));
    const target = Math.round((180 - (d.cur + fling)) / STEP);
    void rotor.offsetWidth;                    // commit the dragged position before re-enabling the snap
    rotor.classList.remove('no-anim');
    wheel.classList.remove('is-dragging');
    pos = target;
    render();
    run();
    justDragged = true;
    setTimeout(() => { justDragged = false; }, 0);
  }
  wheel.addEventListener('pointerup', endDrag);
  wheel.addEventListener('pointercancel', endDrag);

  render();
  updateAutoText();
})();
