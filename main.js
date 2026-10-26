import { createCity, LANDMARKS, COLORS } from './city.js?v=22';
import { person, links, about, projects, skills, experience, listening, contact } from './data.js?v=22';
import * as content from './data.js?v=22';

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
  { id: 'about', label: 'About', marker: '02', name: 'About', nick: 'Waldrop HQ', landmark: 'hq' },
  { id: 'work', label: 'Work', marker: '03', name: 'Work', nick: 'The Skyline', landmark: 'data-tower' },
  { id: 'skills', label: 'Skills', marker: '04', name: 'Skills', nick: 'The Toolbox', landmark: 'stack' },
  { id: 'experience', label: 'Experience', marker: '05', name: 'Experience', nick: 'Career Tower', landmark: 'control' },
  { id: 'listening', label: 'Books & Podcasts', marker: '06', name: 'Books & Podcasts', nick: 'The Listening Post', landmark: 'listening' },
  { id: 'contact', label: 'Contact', marker: '07', name: 'Contact', nick: 'The Front Door', landmark: 'core' },
];

const marker = (pg) => `<p class="marker mono"><span class="marker-n">${pg.marker}</span><span class="marker-line" aria-hidden="true"></span>${pg.nick}</p>`;

function pageHTML(pg, sub) {
  switch (pg.id) {
    case 'about':
      return `
        ${marker(pg)}
        <h1 id="pageTitle" tabindex="-1">${esc(about.title)}</h1>
        ${about.body.map((p) => `<p class="body">${ph(p)}</p>`).join('')}
        <ol class="principles">
          ${about.principles.map((p) => `<li><span class="mono code">${esc(p.code)}</span><span>${ph(p.text)}</span></li>`).join('')}
        </ol>
        ${about.education && about.education.length ? `
        <h2 class="sub-h">Education</h2>
        <ul class="edu">
          ${about.education.map((e) => `<li><p class="edu-school">${esc(e.school)}</p><p class="edu-degree">${esc(e.degree)}</p>${e.note ? `<p class="mono edu-note">${esc(e.note)}</p>` : ''}</li>`).join('')}
        </ul>` : ''}`;

    case 'work': {
      // a single project: its own page, reached from its building
      const p = sub ? projects.find((x) => x.id === sub) : null;
      if (p) {
        const lm = lmById(p.landmark);
        const plinks = [link(p.links.caseStudy, 'Case study ↗'), link(p.links.demo, 'Live demo ↗'), link(p.links.source, 'Source ↗')].filter(Boolean).join('');
        return `
        <p class="mono crumb"><a href="#/work">← All work</a></p>
        <article class="project featured solo" style="--accent:${COLORS[lm ? lm.color : 'cyan']}">
          <p class="mono p-meta"><span class="p-dot" aria-hidden="true"></span>${lm ? `${esc(lm.sub)} · ` : ''}${ph(p.category)}</p>
          <h1 id="pageTitle" tabindex="-1">${ph(p.name)}</h1>
          <p class="mono p-sub">${ph(p.role)} · ${ph(p.year)}</p>
          <dl class="p-grid">
            <div><dt class="mono">Problem</dt><dd>${ph(p.problem)}</dd></div>
            <div><dt class="mono">Approach</dt><dd>${ph(p.approach)}</dd></div>
            <div><dt class="mono">Tools</dt><dd class="chips">${p.tools.map((t) => `<span class="chip">${ph(t)}</span>`).join('')}</dd></div>
            ${p.outcome ? `<div><dt class="mono">Outcome</dt><dd>${ph(p.outcome)}</dd></div>` : ''}
          </dl>
          ${plinks ? `<p class="p-links mono">${plinks}</p>` : ''}
        </article>`;
      }
      // the index: one line per project
      return `
        ${marker(pg)}
        <h1 id="pageTitle" tabindex="-1">The skyline: what I’ve built.</h1>
        <p class="body">The projects with a building have their name on the map — drive over, or pick one here.</p>
        <ul class="work-index">
          ${projects.map((x) => {
            const lm = lmById(x.landmark);
            return `<li style="--accent:${COLORS[lm ? lm.color : 'cyan']}"><a href="#/work/${x.id}">
              <span class="wi-main"><span class="mono wi-meta"><span class="p-dot" aria-hidden="true"></span>${x.landmark && lm ? esc(lm.sub) + ' · ' : ''}${ph(x.year)}</span><span class="wi-name">${ph(x.name)}</span><span class="wi-cat">${ph(x.category)}</span></span>
              <span class="mono wi-go" aria-hidden="true">Open →</span>
            </a></li>`;
          }).join('')}
        </ul>`;
    }

    case 'skills':
      return `
        ${marker(pg)}
        <h1 id="pageTitle" tabindex="-1">The toolbox: what I reach for.</h1>
        <p class="body">Pick a tool to see how I actually use it.</p>
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
        <h1 id="pageTitle" tabindex="-1">Career Tower, floor by floor.</h1>
        <p class="body">Newest floor on top.</p>
        <ol class="timeline">
          ${experience.map((e) => `
            <li class="module">
              <p class="mono m-dates">${ph(e.dates)}</p>
              <h2>${ph(e.role)} <span class="m-org">· ${ph(e.org)}</span></h2>
              <p class="body">${ph(e.summary)}</p>
              ${e.highlights.length ? `<ul class="m-high">${e.highlights.map((h) => `<li>${ph(h)}</li>`).join('')}</ul>` : ''}
              ${(e.projects || []).length ? `<p class="mono m-proj">Projects: ${e.projects.map((id) => projects.find((x) => x.id === id)).filter(Boolean).map((x) => `<a href="#/work/${x.id}">${esc(x.name)} →</a>`).join('')}</p>` : ''}
            </li>`).join('')}
        </ol>
        <p class="mono resume">${links.resume ? link(links.resume, 'View the full résumé ↗') : '<span class="ph">[add your résumé PDF to show a download link]</span>'}</p>`;

    case 'listening': {
      const items = allListening();
      const isPod = (x) => x.type === 'podcast';
      const now = items.filter((x) => x.status === 'now');
      const books = items.filter((x) => x.status !== 'now' && !isPod(x));
      const pods = items.filter((x) => x.status !== 'now' && isPod(x));
      const nBooks = items.filter((x) => !isPod(x)).length;
      const nPods = items.filter(isPod).length;
      const list = (arr, empty) => arr.length
        ? `<ol class="log">${arr.map((x) => `<li>${entryHTML(x, false)}</li>`).join('')}</ol>`
        : `<p class="body log-empty">${empty}</p>`;
      return `
        ${marker(pg)}
        <h1 id="pageTitle" tabindex="-1">The Listening Post: what’s coming in.</h1>
        <p class="body">What I'm reading and listening to — the inputs behind the work. Newest first, with the one thing that stuck.</p>
        <p class="mono log-stats"><span>${nBooks} ${nBooks === 1 ? 'book' : 'books'}</span><span>${nPods} ${nPods === 1 ? 'podcast' : 'podcasts'}</span></p>
        ${now.length ? `
        <section class="log-now" aria-label="On right now">
          <p class="mono on-air"><span class="on-dot" aria-hidden="true"></span>On right now</p>
          ${now.map((x) => entryHTML(x, true)).join('')}
        </section>` : ''}
        <nav class="log-jump" aria-label="Jump to a section">
          <button type="button" class="chip-btn" data-jump="log-books">Books <span>${books.length}</span></button>
          <button type="button" class="chip-btn" data-jump="log-pods">Podcasts <span>${pods.length}</span></button>
        </nav>
        <section class="log-section" id="log-books" aria-labelledby="log-books-h">
          <h2 class="log-h" id="log-books-h"><span class="log-h-icon book" aria-hidden="true"></span>Books</h2>
          ${list(books, 'No books logged yet.')}
        </section>
        <section class="log-section" id="log-pods" aria-labelledby="log-pods-h">
          <h2 class="log-h" id="log-pods-h"><span class="log-h-icon pod" aria-hidden="true"></span>Podcasts</h2>
          ${list(pods, 'No podcasts logged yet.')}
        </section>`;
    }

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

// ---------- the Input Log ----------
// Spotify items synced by the daily GitHub Action (listening.json), merged with data.js
let liveListening = [];
function spotifyKey(link) {
  const m = /open\.spotify\.com\/(?:intl-[a-z-]+\/)?(episode|show|audiobook|album|track|playlist)\/([A-Za-z0-9]+)/.exec(link || '');
  return m ? `spotify:${m[1]}:${m[2]}` : null;
}
function allListening() {
  const notes = new Map();
  const manual = [];
  for (const x of listening) {
    const key = spotifyKey(x.link);
    if (key) notes.set(key, x); else manual.push(x);
  }
  // a data.js entry with the same Spotify link adds to (or hides) the synced item
  const filled = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v !== undefined && v !== null));
  const synced = liveListening.map((x) => {
    const n = notes.get(x.id);
    if (n) notes.delete(x.id);
    return n ? { ...x, ...filled(n) } : x;
  });
  const leftover = [...notes.values()].filter((x) => x.title);   // notes for items not synced yet
  // shows listed in data.js bookShows are books, even if Spotify called them episodes
  // (read defensively, so an older data.js without bookShows still works)
  const isBookShow = new Set((content.bookShows || []).map((n) => String(n).trim().toLowerCase()));
  const typed = (x) => (x.type === 'podcast' && isBookShow.has(String(x.by || '').trim().toLowerCase())
    ? { ...x, type: 'audiobook', title: x.by, by: '' }   // the show is the book; its episodes are chapters
    : x);
  // one entry per book: chapters collapse together, and a book written in data.js
  // wins over the same book synced from Spotify (matched on the title before any subtitle)
  const bookKey = (x) => String(x.title || '').split(/[:|]/)[0].trim().toLowerCase();
  const handWritten = new Set([...leftover, ...manual].filter((x) => x.type !== 'podcast').map(bookKey));
  const seen = new Set();
  const once = (x) => {
    if (x.type === 'podcast') return true;
    const k = bookKey(x);
    if (x.source === 'spotify' && handWritten.has(k)) return false;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  };
  return [...synced, ...leftover, ...manual].map(typed)
    // placeholder entries like '[Book title]' stay out of the live log
    .filter((x) => !x.hide && x.title && !/^\s*\[.*\]\s*$/.test(x.title))
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .filter(once);
}

const TYPE_LABEL = { book: 'Book', audiobook: 'Audiobook', podcast: 'Podcast' };
const TYPE_COLOR = { book: 'yellow', audiobook: 'orange', podcast: 'magenta' };
const coverCache = new Map();
function spotifyEmbed(url) {
  const m = /^https:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(episode|show|audiobook|album|track|playlist)\/([A-Za-z0-9]+)/.exec(url || '');
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : '';
}
// a generated cover tile when there's no cover image: type colour, initials and an icon
function coverHTML(x) {
  // the generated tile sits underneath; a cover image covers it, and removes itself if it fails to load
  const img = x.cover ? `<img class="cover-img" src="${esc(x.cover)}" alt="" decoding="async" onerror="this.remove()">` : '';
  const lookup = !x.cover && /open\.spotify\.com\//.test(x.link || '') ? ` data-cover-from="${esc(x.link)}"` : '';
  return `<span class="cover-wrap"${lookup}>${tileHTML(x)}${img}</span>`;
}
function tileHTML(x) {
  const initials = String(x.title).replace(/\[|\]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '··';
  const icon = x.type === 'podcast'
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  return `<span class="cover gen" style="--c:${COLORS[TYPE_COLOR[x.type] || 'cyan']}" aria-hidden="true"><b>${esc(initials)}</b>${icon}</span>`;
}
function entryHTML(x, big) {
  const embed = spotifyEmbed(x.link);
  const action = embed
    ? `<button type="button" class="mono play" data-embed="${esc(embed)}">▶ Play on Spotify</button>`
    : x.link ? `<a class="mono" href="${esc(x.link)}" target="_blank" rel="noopener">Details ↗</a>` : '';
  return `
    <article class="entry${big ? ' big' : ''}" style="--c:${COLORS[TYPE_COLOR[x.type] || 'cyan']}">
      ${coverHTML(x)}
      <div class="entry-body">
        <p class="mono entry-meta"><span class="type">${TYPE_LABEL[x.type] || 'Item'}</span>${x.source === 'spotify' ? '<span class="via">via Spotify</span>' : ''}</p>
        <h3>${ph(x.title)}</h3>
        <p class="entry-by">${ph(x.by)}</p>
        ${x.takeaway ? `<p class="takeaway">${ph(x.takeaway)}</p>` : ''}
        ${action ? `<p class="entry-act">${action}</p>` : ''}
      </div>
    </article>`;
}

// next / previous building, so a visitor can tour the city page by page
function pagerHTML(pg, project) {
  if (project) {
    const j = projects.indexOf(project);
    const pp = projects[j - 1], np = projects[j + 1];
    const after = PAGES[PAGES.indexOf(pg) + 1];
    return `
    <nav class="pager" aria-label="More projects">
      ${pp ? `<a href="#/work/${pp.id}" class="mono"><span>← Project ${j}</span>${esc(pp.name)}</a>` : `<a href="#/work" class="mono"><span>←</span>All work</a>`}
      ${np ? `<a href="#/work/${np.id}" class="mono next"><span>Project ${j + 2} →</span>${esc(np.name)}</a>` : `<a href="#/${after.id}" class="mono next"><span>${after.marker} →</span>${after.label}</a>`}
    </nav>
    <p class="mono foot">© ${new Date().getFullYear()} ${esc(person.name)} · hand-built city · no trackers</p>`;
  }
  const i = PAGES.indexOf(pg);
  const prev = PAGES[i - 1];
  const next = PAGES[i + 1];
  return `
    <nav class="pager" aria-label="More pages">
      ${prev ? `<a href="#/${prev.id}" class="mono"><span>← ${prev.marker}</span>${prev.label}</a>` : '<a href="#/" class="mono"><span>← 01</span>The City</a>'}
      ${next ? `<a href="#/${next.id}" class="mono next"><span>${next.marker} →</span>${next.label}</a>` : '<a href="#/" class="mono next"><span>01 →</span>The City</a>'}
    </nav>
    <p class="mono foot">© ${new Date().getFullYear()} ${esc(person.name)} · hand-built city · no trackers</p>`;
}

// ---------- the home screen ----------
function renderHome() {
  $('#main').innerHTML = `
  <section class="hero" id="home" aria-labelledby="hero-title">
    <h1 id="hero-title" class="sr-only">${esc(person.name)} — portfolio. Choose a building to enter.</h1>
    <div class="hero-foot mono">
      <span class="status" aria-hidden="true"><span class="status-dot"></span>System online</span>
      <span class="hint">${matchMedia('(hover: none)').matches
        ? 'Tap to drive · drag to pan · or open the <button type="button" class="linklike" data-open-dir>directory</button>'
        : 'Click to drive · drag to pan · right-drag to orbit · ⏎ to enter · or open the <button type="button" class="linklike" data-open-dir>directory</button>'}</span>
      <span class="cam-ctl">
        <button type="button" class="cam-btn" id="resetView">Reset view</button>
        <button type="button" class="cam-btn help" id="helpOpen" aria-haspopup="dialog" aria-label="Controls">?</button>
      </span>
    </div>
  </section>`;

  // the header shows only the Directory button; the menu links were removed
  if ($('#navLinks')) $('#navLinks').innerHTML = PAGES.map((p) => `<a href="#/${p.id}" data-nav="${p.id}">${p.label}</a>`).join('');
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

// ---------- "⏎ Enter" prompt when the car is parked at a building ----------
const promptEl = $('#prompt');
let promptLm = null;
function showPrompt(lm) {
  promptLm = lm;
  if (!lm || current) { promptEl.hidden = true; return; }
  $('[data-p-name]', promptEl).textContent = lm.name;
  $('[data-p-sub]', promptEl).textContent = lm.sub;
  promptEl.hidden = false;
}
promptEl.addEventListener('click', () => { if (promptLm) location.hash = promptLm.target; });

// ---------- controls card ----------
const controls = $('#controls');
const openControls = () => { if (typeof controls.showModal === 'function') controls.showModal(); else controls.setAttribute('open', ''); };
const closeControls = () => (typeof controls.close === 'function' ? controls.close() : controls.removeAttribute('open'));
$('#helpOpen').addEventListener('click', openControls);
$('#controlsClose').addEventListener('click', closeControls);
controls.addEventListener('click', (e) => { if (e.target === controls) closeControls(); });
$('#controlsBody').innerHTML = (matchMedia('(hover: none)').matches
  ? [['Tap', 'drive the car there. The camera follows it until it arrives'], ['Drag', 'pan the camera'], ['Tap the prompt', 'go into the building the car is parked at']]
  : [['Left click', 'drive the car there. The camera follows it until it arrives'], ['Left drag', 'pan the camera'], ['Right drag', 'orbit the island'], ['Shift + drag', 'orbit the island too'], ['W A S D / arrows', 'drive yourself. The camera stays where you put it'], ['Space', 'hop'], ['⏎ Enter', 'go into a building while parked outside it']]
).map(([k, v]) => `<div><dt class="mono">${k}</dt><dd>${v}</dd></div>`).join('');

// ---------- the city ----------
const city = createCity($('#city'), {
  labelLayer: $('#labels'),
  tooltip: $('#tooltip'),
  onEnter: (lm) => { location.hash = lm.target; },
  onNear: (lm) => showPrompt(lm),
  canDrive: () => !current && !dir.open && !controls.open,
  reducedMotion: () => reduced.matches,
});
if (!city) document.documentElement.classList.add('no-canvas');

// camera: the whole chip at home, or flown down to one building
function homeView() {
  return isPhone()
    ? { yaw: 45, pitch: 50, zoom: 1.28, tx: 0, ty: 0, tz: 4, ox: 0, oy: -0.01, labels: 1, glow: 0, lmx: 0 }
    : { yaw: 45, pitch: 33, zoom: 1.12, tx: 0, ty: 0, tz: 4, ox: 0, oy: 0.03, labels: 1, glow: 0, lmx: 0 };
}
// each building gets its own angle, so every dive feels like arriving somewhere different
const ANGLES = { listening: 30, hq: 45, 'data-tower': 15, relay: 70, lab: 80, stack: 30, control: 60, core: 45 };
function focusView(lm) {
  const core = !!lm.core;
  const h = core ? 0 : lm.roof === 'mast' ? lm.h + 16 : lm.roof === 'spire' ? lm.h * 1.14 : lm.roof === 'sign' ? lm.h + 8 : lm.h;
  const zoom = core ? 3.2 : lm.roof === 'sign' ? 1.9 : Math.max(2.4, Math.min(4.2, 95 / (h + 12)));
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
      document.title = 'Joe Waldrop — Waldropolis';
      if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
    }
    city && city.setFocus(null);
    city && city.restoreView();
    setTimeout(() => showPrompt(city ? city.near : null), reduced.matches ? 0 : 600);
    return;
  }

  // a project inside Work flies to that project's own building
  const project = r.sub ? projects.find((p) => p.id === r.sub) : null;
  // projects without their own building fly to the page's building
  const lm = lmById(project && project.landmark ? project.landmark : r.pg.landmark);
  if (!current) { returnFocus = document.activeElement; city && city.saveView(); }

  const key = r.pg.id + (r.sub ? '/' + r.sub : '');   // each project is its own page
  const switching = current && current !== key;
  const same = current === key;
  current = key;
  document.body.classList.add('page-open');
  document.title = `${project ? project.name : r.pg.label} — Joe Waldrop`;
  city && city.setFocus(lm.id);
  city && city.parkAt(lm.id);
  promptEl.hidden = true;
  city && city.setView(focusView(lm), false, 2.6);

  const show = () => {
    if (!same) {
      body.innerHTML = `<div class="page page-${r.pg.id}">${pageHTML(r.pg, project ? project.id : null)}${pagerHTML(r.pg, project)}</div>`;
      wirePage();
      body.scrollTop = 0;
    }
    $('#sheetWhere').textContent = project
      ? `Project ${projects.indexOf(project) + 1} / ${projects.length}${project.landmark ? ' · ' + lm.sub : ''}`
      : `${r.pg.marker} / ${String(PAGES.length + 1).padStart(2, '0')} · ${r.pg.nick}`;
    sheet.hidden = false;
    void sheet.offsetWidth;
    sheet.classList.add('open');
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
  // Input Log: jump to Books / Podcasts (scrolls inside the page panel; no URL change)
  $$('[data-jump]', body).forEach((b) => b.addEventListener('click', () => {
    const el = $('#' + b.dataset.jump, body);
    if (el) el.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
  }));
  // entries with a Spotify link but no cover: ask Spotify's public oEmbed for the artwork
  $$('[data-cover-from]', body).forEach(async (wrap) => {
    const url = wrap.dataset.coverFrom;
    try {
      let thumb = coverCache.get(url);
      if (!thumb) {
        const r = await fetch('https://open.spotify.com/oembed?url=' + encodeURIComponent(url));
        if (!r.ok) return;
        thumb = (await r.json()).thumbnail_url;
        if (!thumb) return;
        coverCache.set(url, thumb);
      }
      const img = document.createElement('img');
      img.className = 'cover-img';
      img.alt = '';
      img.src = thumb;
      img.onerror = () => img.remove();
      wrap.appendChild(img);
    } catch (_) { /* offline or blocked: keep the generated tile */ }
  });
  // Spotify players load only when asked for (no third-party requests until then)
  $$('[data-embed]', body).forEach((b) => b.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = b.dataset.embed;
    f.title = 'Spotify player';
    f.loading = 'lazy';
    f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    f.className = 'spotify';
    b.replaceWith(f);
  }));
  $$('.node', body).forEach((btn) => {
    const showSkill = () => {
      const [gi, ii] = btn.dataset.skill.split('-').map(Number);
      const it = skills[gi].items[ii];
      $$('.node', body).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      $('#readout', body).innerHTML = `<p class="mono readout-k">&gt; ${esc(it.name.toLowerCase())} ${it.level ? `<span class="readout-lvl">${ph(it.level)}</span>` : ''}</p><p class="readout-v">${ph(it.use)}</p>`;
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
  }
  city.setHome(homeView());
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && current && !dir.open) location.hash = '#/';
});

// load the synced Spotify log; if the Input Log is open, refresh it
fetch('listening.json', { cache: 'no-cache' })
  .then((r) => (r.ok ? r.json() : []))
  .then((data) => {
    if (!Array.isArray(data) || !data.length) return;
    liveListening = data;
    if (current === 'listening') {
      const pg = PAGES.find((p) => p.id === 'listening');
      body.innerHTML = `<div class="page page-listening">${pageHTML(pg)}${pagerHTML(pg)}</div>`;
      wirePage();
    }
  })
  .catch(() => { /* opened from a file, or offline: manual entries only */ });

// first load: start on the chip; deep links fly straight in
if (city) { city.setHome(homeView()); city.setView(homeView(), true); }
$('#resetView').addEventListener('click', () => city && city.resetView());
// show the controls once, on a first visit to the city
try {
  if (!location.hash.startsWith('#/') || location.hash === '#/') {
    if (!localStorage.getItem('jw-controls-seen')) { openControls(); localStorage.setItem('jw-controls-seen', '1'); }
  }
} catch (_) { /* storage unavailable: skip */ }
route();
