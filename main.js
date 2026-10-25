import { createCity, LANDMARKS, COLORS } from './city.js?v=5';
import { person, links, about, projects, skills, experience, contact } from './data.js?v=5';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const isPhone = () => window.innerWidth < 900;

// ---------- helpers ----------
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
// anything in [brackets] is a placeholder: show it dimmed
const ph = (t) => esc(t).replace(/\[[^\]]*\]/g, (m) => `<span class="ph">${m}</span>`);
const link = (href, label) => (href ? `<a href="${esc(href)}"${/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : ''}>${esc(label)}</a>` : '');
const lmById = (id) => LANDMARKS.find((l) => l.id === id);

// ---------- pages ----------
// Each page lives at its own address (#/about, #/work …) and belongs to a building.
const PAGES = [
  { id: 'about', label: 'About', marker: '02', name: 'The Infrastructure', landmark: 'hq' },
  { id: 'work', label: 'Work', marker: '03', name: 'The Buildings', landmark: 'data-tower' },
  { id: 'skills', label: 'Skills', marker: '04', name: 'The Circuit Board', landmark: 'stack' },
  { id: 'experience', label: 'Experience', marker: '05', name: 'The Control Center', landmark: 'control' },
  { id: 'contact', label: 'Contact', marker: '06', name: 'The Launchpad', landmark: 'core' },
];

const marker = (pg) => `<p class="marker mono"><span class="marker-n">${pg.marker}</span><span class="marker-line" aria-hidden="true"></span>${pg.name}</p>`;

function pageHTML(pg) {
  switch (pg.id) {
    case 'about':
      return `
        ${marker(pg)}
        <h1 id="pageTitle" tabindex="-1">${esc(about.title)}</h1>
        ${about.body.map((p) => `<p class="body">${ph(p)}</p>`).join('')}
        <ol class="principles">
          ${about.principles.map((p) => `<li><span class="mono code">${esc(p.code)}</span><span>${ph(p.text)}</span></li>`).join('')}
        </ol>`;

    case 'work':
      return `
        ${marker(pg)}
        <h1 id="pageTitle" tabindex="-1">Selected work. Each one is a building in the city.</h1>
        <div class="projects">
          ${projects.map((p, i) => {
            const lm = lmById(p.landmark);
            const plinks = [link(p.links.caseStudy, 'Case study ↗'), link(p.links.demo, 'Live demo ↗'), link(p.links.source, 'Source ↗')].filter(Boolean).join('');
            return `
            <article class="project${i === 0 ? ' featured' : ''}" id="project-${p.id}" style="--accent:${COLORS[lm ? lm.color : 'cyan']}">
              <header class="p-head">
                <p class="mono p-meta"><span class="p-dot" aria-hidden="true"></span>${esc(lm ? lm.name : 'Building')} · ${ph(p.category)}</p>
                <h2>${ph(p.name)}</h2>
                <p class="mono p-sub">${ph(p.role)} · ${ph(p.year)}</p>
              </header>
              <dl class="p-grid">
                <div><dt class="mono">Problem</dt><dd>${ph(p.problem)}</dd></div>
                <div><dt class="mono">Approach</dt><dd>${ph(p.approach)}</dd></div>
                <div><dt class="mono">Tools</dt><dd class="chips">${p.tools.map((t) => `<span class="chip">${ph(t)}</span>`).join('')}</dd></div>
                <div><dt class="mono">Outcome</dt><dd>${ph(p.outcome)}</dd></div>
              </dl>
              ${plinks ? `<p class="p-links mono">${plinks}</p>` : ''}
            </article>`;
          }).join('')}
        </div>`;

    case 'skills':
      return `
        ${marker(pg)}
        <h1 id="pageTitle" tabindex="-1">The circuit board: what the city runs on.</h1>
        <p class="body">Select a node to see how I use it.</p>
        <div class="board">
          ${skills.map((g, gi) => `
            <div class="bus" style="--bus:${COLORS[g.color]}">
              <p class="mono bus-name">${esc(g.group)}</p>
              <ul>
                ${g.items.map((it, ii) => `<li><button type="button" class="node" data-skill="${gi}-${ii}" aria-pressed="false"><span class="pad" aria-hidden="true"></span>${esc(it.name)}</button></li>`).join('')}
              </ul>
            </div>`).join('')}
        </div>
        <div class="readout" id="readout" aria-live="polite"><p class="mono readout-k">&gt; select a node</p></div>`;

    case 'experience':
      return `
        ${marker(pg)}
        <h1 id="pageTitle" tabindex="-1">The control center.</h1>
        <ol class="timeline">
          ${experience.map((e) => `
            <li class="module">
              <p class="mono m-dates">${ph(e.dates)}</p>
              <h2>${ph(e.role)} <span class="m-org">· ${ph(e.org)}</span></h2>
              <p class="body">${ph(e.summary)}</p>
              <ul class="m-high">${e.highlights.map((h) => `<li>${ph(h)}</li>`).join('')}</ul>
            </li>`).join('')}
        </ol>
        <p class="mono resume">${links.resume ? link(links.resume, 'View the full résumé ↗') : '<span class="ph">[add your résumé PDF to show a download link]</span>'}</p>`;

    case 'contact': {
      const rows = [
        ['Email', links.email ? `mailto:${links.email}` : '', links.email || '[add your email]'],
        ['LinkedIn', links.linkedin, links.linkedin ? 'linkedin' : '[add LinkedIn URL]'],
        ['GitHub', links.github, links.github ? links.github.replace(/^https?:\/\/(www\.)?/, '') : '[add GitHub URL]'],
        ['Résumé', links.resume, links.resume ? 'download PDF' : '[add résumé PDF]'],
      ];
      return `
        ${marker(pg)}
        <h1 id="pageTitle" tabindex="-1" class="big">${esc(contact.title)}</h1>
        <p class="body">${esc(contact.body)}</p>
        <ul class="contact-list">
          ${rows.map(([k, href, label]) => `<li><span class="mono ck">${k}</span>${href ? link(href, label) : `<span class="ph">${esc(label)}</span>`}</li>`).join('')}
        </ul>`;
    }
  }
  return '';
}

// next / previous building, so a visitor can tour the city page by page
function pagerHTML(pg) {
  const i = PAGES.indexOf(pg);
  const prev = PAGES[i - 1];
  const next = PAGES[i + 1];
  return `
    <nav class="pager" aria-label="More pages">
      ${prev ? `<a href="#/${prev.id}" class="mono"><span>← ${prev.marker}</span>${prev.name}</a>` : '<a href="#/" class="mono"><span>← 01</span>The City</a>'}
      ${next ? `<a href="#/${next.id}" class="mono next"><span>${next.marker} →</span>${next.name}</a>` : '<a href="#/" class="mono next"><span>01 →</span>The City</a>'}
    </nav>
    <p class="mono foot">© ${new Date().getFullYear()} ${esc(person.name)} · hand-built city · no trackers</p>`;
}

// ---------- the home screen ----------
function renderHome() {
  $('#main').innerHTML = `
  <section class="hero" id="home" aria-labelledby="hero-title">
    <div class="col">
      <p class="eyebrow mono">${esc(person.eyebrow)}</p>
      <h1 id="hero-title">${person.headline.map((l) => `<span>${esc(l)}</span>`).join('')}</h1>
      <p class="intro">${esc(person.intro)}</p>
      <div class="ctas">
        <a class="btn primary" href="#/work">Explore my work <span aria-hidden="true">→</span></a>
        <a class="btn ghost" href="#/about">About me</a>
      </div>
      <p class="hint mono">click a building to enter · or open the <button type="button" class="linklike" data-open-dir>directory</button></p>
    </div>
    <div class="hero-foot mono" aria-hidden="true">
      <span class="status"><span class="status-dot"></span>System online</span>
      <span>${LANDMARKS.length} buildings · ${PAGES.length} districts</span>
    </div>
  </section>`;

  $('#navLinks').innerHTML = PAGES.map((p) => `<a href="#/${p.id}" data-nav="${p.id}">${p.label}</a>`).join('');
  $('#dirList').innerHTML = LANDMARKS.map((l) => `
    <li><a href="${l.target}" data-dir>
      <span class="d-dot" style="--dot:${COLORS[l.core ? 'cyan' : l.color]}"></span>
      <span class="d-name">${esc(l.name)}</span><span class="d-sub">${esc(l.sub)}</span><span class="d-go">Enter →</span>
    </a></li>`).join('');
}
renderHome();

// ---------- directory ----------
const dir = $('#directory');
const openDir = () => { if (typeof dir.showModal === 'function') dir.showModal(); else dir.setAttribute('open', ''); };
const closeDir = () => (typeof dir.close === 'function' ? dir.close() : dir.removeAttribute('open'));
$('#dirOpen').addEventListener('click', openDir);
$$('[data-open-dir]').forEach((b) => b.addEventListener('click', openDir));
$('#dirClose').addEventListener('click', closeDir);
dir.addEventListener('click', (e) => { if (e.target === dir) closeDir(); });
$$('[data-dir]').forEach((a) => a.addEventListener('click', closeDir));

// ---------- the city ----------
const city = createCity($('#city'), {
  labelLayer: $('#labels'),
  tooltip: $('#tooltip'),
  onEnter: (lm) => { location.hash = lm.target; },
  reducedMotion: () => reduced.matches,
});
if (!city) document.documentElement.classList.add('no-canvas');

// camera: the whole chip at home, or flown down to one building
function homeView() {
  return isPhone()
    ? { yaw: 45, pitch: 33, zoom: 1.0, tx: 0, ty: 0, tz: 4, ox: 0, oy: -0.24, labels: 1, glow: 0, lmx: 0 }
    : { yaw: 45, pitch: 33, zoom: 0.94, tx: 0, ty: 0, tz: 4, ox: 0.23, oy: 0.04, labels: 1, glow: 0, lmx: 0 };
}
// each building gets its own angle, so every dive feels like arriving somewhere different
const ANGLES = { hq: 20, 'data-tower': 15, relay: 70, lab: 80, stack: 30, control: 60, core: 45 };
function focusView(lm) {
  const core = !!lm.core;
  const h = core ? 0 : lm.roof === 'spire' ? lm.h * 1.14 : lm.h;
  const zoom = core ? 3.2 : Math.max(2.4, Math.min(4.2, 95 / (h + 12)));
  const yaw = ANGLES[lm.id] ?? 45;
  return isPhone()
    ? { yaw, pitch: core ? 46 : 24, zoom: zoom * 0.8, tx: lm.x, ty: lm.y, tz: h * 0.5, ox: 0, oy: -0.33, labels: 0, glow: core ? 1 : 0, lmx: 0 }
    : { yaw, pitch: core ? 46 : 24, zoom, tx: lm.x, ty: lm.y, tz: h * 0.45, ox: 0.25, oy: 0.04, labels: 0, glow: core ? 1 : 0, lmx: 0 };
}

// ---------- router ----------
const sheet = $('#sheet');
const body = $('#sheetBody');
let current = null;        // open page id, or null at home
let openTimer = 0;
let returnFocus = null;

function parse(hash) {
  const m = /^#\/([\w-]+)(?:\/([\w-]+))?/.exec(hash || '');
  if (!m) return null;
  const pg = PAGES.find((p) => p.id === m[1]);
  return pg ? { pg, sub: m[2] || null } : null;
}

function route() {
  clearTimeout(openTimer);
  const r = parse(location.hash);
  $$('[data-nav]').forEach((n) => n.toggleAttribute('aria-current', !!r && n.dataset.nav === r.pg.id));

  if (!r) {
    // back to the city
    if (current) {
      current = null;
      sheet.classList.remove('open');
      document.body.classList.remove('page-open');
      openTimer = setTimeout(() => { sheet.hidden = true; }, reduced.matches ? 0 : 450);
      document.title = 'Joe Waldrop — Building systems, connecting ideas';
      if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
    }
    city && city.setFocus(null);
    city && city.setView(homeView(), false, 3.2);
    return;
  }

  // a project inside Work flies to that project's own building
  const project = r.sub ? projects.find((p) => p.id === r.sub) : null;
  const lm = lmById(project ? project.landmark : r.pg.landmark);
  if (!current) returnFocus = document.activeElement;

  const switching = current && current !== r.pg.id;
  const same = current === r.pg.id;
  current = r.pg.id;
  document.body.classList.add('page-open');
  document.title = `${r.pg.label} — Joe Waldrop`;
  city && city.setFocus(lm.id);
  city && city.setView(focusView(lm), false, 2.6);

  const show = () => {
    if (!same) {
      body.innerHTML = `<div class="page page-${r.pg.id}">${pageHTML(r.pg)}${pagerHTML(r.pg)}</div>`;
      wirePage();
      body.scrollTop = 0;
    }
    $('#sheetWhere').textContent = `${r.pg.marker} / 06 · ${lm.name}`;
    sheet.hidden = false;
    void sheet.offsetWidth;
    sheet.classList.add('open');
    if (project) {
      const el = $('#project-' + project.id, body);
      if (el) {
        el.scrollIntoView({ block: 'start', behavior: same && !reduced.matches ? 'smooth' : 'auto' });
        el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
      }
    }
    if (!same) { const t = $('#pageTitle', body); t && t.focus({ preventScroll: true }); }
  };

  if (reduced.matches || same) show();
  else if (switching) {
    // fade the old page out while the camera moves, then bring the new one in
    sheet.classList.add('swap');
    openTimer = setTimeout(() => { sheet.classList.remove('swap'); show(); }, 550);
  } else {
    sheet.classList.remove('open');
    openTimer = setTimeout(show, 750);   // let the camera arrive first
  }
}

function wirePage() {
  $$('.node', body).forEach((btn) => {
    const showSkill = () => {
      const [gi, ii] = btn.dataset.skill.split('-').map(Number);
      const it = skills[gi].items[ii];
      $$('.node', body).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      $('#readout', body).innerHTML = `<p class="mono readout-k">&gt; ${esc(it.name.toLowerCase())} <span class="readout-lvl">level: ${ph(it.level)}</span></p><p class="readout-v">${ph(it.use)}</p>`;
    };
    btn.addEventListener('click', showSkill);
    btn.addEventListener('mouseenter', showSkill);
  });
}

window.addEventListener('hashchange', route);
window.addEventListener('resize', () => {
  if (!city) return;
  city.resize();
  const r = parse(location.hash);
  if (r) {
    const project = r.sub ? projects.find((p) => p.id === r.sub) : null;
    city.setView(focusView(lmById(project ? project.landmark : r.pg.landmark)), true);
  } else city.setView(homeView(), true);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && current && !dir.open) location.hash = '#/';
});

// first load: start on the chip; deep links fly straight in
if (city) city.setView(homeView(), true);
route();
