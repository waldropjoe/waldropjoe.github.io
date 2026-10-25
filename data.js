// ─────────────────────────────────────────────────────────────
// All site content lives here. Edit this file to add, remove or
// update projects, skills, experience and links.
//
// Anything in [square brackets] is a placeholder and is shown
// dimmed on the site. Empty link strings ('') are not rendered
// as links, so nothing on the page points nowhere.
// ─────────────────────────────────────────────────────────────

export const person = {
  name: 'Joe Waldrop',
  initials: 'JW',
};

export const links = {
  email: '',                                  // e.g. 'you@example.com'
  linkedin: '',                               // e.g. 'https://www.linkedin.com/in/…'
  github: 'https://github.com/waldropjoe',
  resume: '',                                 // e.g. 'resume.pdf' (add the PDF to the repo)
};

export const about = {
  title: 'The infrastructure under the city.',
  body: [
    'I’m a project manager and analyst. Most of my work sits between the people who need something and the systems that have to deliver it.',
    'I like understanding how things work, finding where a process leaks time or clarity, and building the thing that fixes it — a report, an integration, a workflow, or a plan people actually follow.',
  ],
  principles: [
    { code: 'REQ → BUILD', text: 'Translate business requirements into technical work a team can deliver.' },
    { code: 'SYSTEMS', text: 'Map how data and tools connect before changing any one of them.' },
    { code: 'SHIP', text: 'Prefer a practical, working outcome over a perfect plan.' },
  ],
};

// Each project is a building in the city. `landmark` links it to a
// building on the chip (see city.js LANDMARKS).
export const projects = [
  {
    id: 'reporting',
    landmark: 'data-tower',
    name: 'Automated Reporting Workflows',
    category: 'Data analytics · Reporting automation',
    problem: 'Teams tracked project progress in different ways. Pulling a status report together was manual, inconsistent and slow.',
    approach: 'Built reporting workflows in Power BI on Planview data, so every team reported progress the same way.',
    tools: ['Power BI', 'Planview', 'Python [confirm]'],
    outcome: '[A result you can support — e.g. hours saved per reporting cycle, or teams onboarded.]',
    role: '[Your role]',
    year: '[Year]',
    links: { caseStudy: '', demo: '', source: '' },
  },
  {
    id: 'integration',
    landmark: 'relay',
    name: '[Integration project]',
    category: 'API integrations · Backend',
    problem: '[What needed to connect, and why it mattered.]',
    approach: '[How you approached it.]',
    tools: ['[tool]', '[tool]'],
    outcome: '[Outcome or current status.]',
    role: '[Your role]',
    year: '[Year]',
    links: { caseStudy: '', demo: '', source: '' },
  },
  {
    id: 'ideas',
    landmark: 'lab',
    name: 'This portfolio',
    category: 'Product concept · Interactive application',
    problem: 'A résumé lists what you did. It doesn’t show how you think about systems.',
    approach: 'Designed and built a city on a computer chip: a hand-written isometric canvas engine, scroll-driven camera and data-driven content.',
    tools: ['JavaScript', 'Canvas 2D', 'HTML/CSS'],
    outcome: 'Live on GitHub Pages.',
    role: 'Design & build',
    year: '2026',
    links: { caseStudy: '', demo: '', source: 'https://github.com/waldropjoe/waldropjoe.github.io' },
  },
];

// Skills as nodes on a circuit. `level` is shown as-is: keep it honest.
// Replace '[set]' with: 'daily', 'regular', 'working knowledge' or 'exploring'.
export const skills = [
  {
    group: 'Programming & data',
    color: 'cyan',
    items: [
      { name: 'Python', level: '[set]', use: '[How you use it — e.g. scripts that clean and reshape data before reporting.]' },
      { name: 'SQL', level: '[set]', use: '[How you use it.]' },
    ],
  },
  {
    group: 'Analytics & visualization',
    color: 'yellow',
    items: [
      { name: 'Power BI', level: '[set]', use: 'Reporting workflows and dashboards that standardized project reporting.' },
      { name: 'Alteryx', level: '[set]', use: '[How you use it.]' },
    ],
  },
  {
    group: 'APIs & integrations',
    color: 'magenta',
    items: [
      { name: 'REST APIs', level: '[set]', use: '[How you use them.]' },
      { name: 'Planview', level: '[set]', use: 'Source of project data for automated reporting.' },
    ],
  },
  {
    group: 'Tools & delivery',
    color: 'orange',
    items: [
      { name: 'Git', level: '[set]', use: '[How you use it.]' },
      { name: 'Project delivery', level: '[set]', use: 'Planning, stakeholder management and getting work over the line.' },
    ],
  },
];

export const experience = [
  {
    org: '[Organization]',
    role: '[Role]',
    dates: '[Start] — Present',
    summary: '[One or two sentences on what you were responsible for.]',
    highlights: ['[Selected accomplishment you can support.]', '[Another one.]'],
  },
  {
    org: '[Organization]',
    role: '[Role]',
    dates: '[Start] — [End]',
    summary: '[One or two sentences on what you were responsible for.]',
    highlights: ['[Selected accomplishment you can support.]'],
  },
];

// The Input Log: books and podcasts.
//
// Podcasts and audiobooks you save in Spotify arrive automatically in listening.json
// (a GitHub Action updates it daily — see README). This list is for everything else:
//   • books you read (or anything not on Spotify)
//   • notes on Spotify items: add an entry with the same Spotify link and it's merged
//     with the synced one — e.g. to add a takeaway, or to set status: 'now'
//   • hiding a synced item: { link: 'https://open.spotify.com/episode/…', hide: true }
//
// Fields
//   type:     'book' | 'audiobook' | 'podcast'
//   status:   'now' for what you're on right now, otherwise 'done'
//   date:     'YYYY-MM'
//   link:     a Spotify link shows a play button; any other link shows "Details ↗"
//   cover:    optional image URL ('' gives a generated cover tile)
//   takeaway: one line on what stuck with you
export const listening = [
  { type: 'book', status: 'now', title: '[Book you are reading now]', by: '[Author]', date: '2026-10', takeaway: '[What has stuck with you so far.]', link: '', cover: '' },
  { type: 'book', status: 'done', title: '[A book you finished]', by: '[Author]', date: '2026-09', takeaway: '[One-line takeaway.]', link: '', cover: '' },
  // Example note on a synced podcast episode:
  // { link: 'https://open.spotify.com/episode/XXXXXXXX', takeaway: 'The one thing that stuck.' },
];

export const contact = {
  title: 'Have an interesting problem to solve?',
  body: 'I’m always interested in connecting with people building useful things at the intersection of technology, data, and product.',
};
