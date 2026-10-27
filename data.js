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
  email: 'joewaldrop98@gmail.com',
  linkedin: 'https://www.linkedin.com/in/joseph-waldrop-44a540175',
  github: 'https://github.com/waldropjoe',
  resume: 'Joseph_Waldrop_Resume.pdf',      // the PDF sits next to index.html in the repo
};

export const about = {
  title: 'The infrastructure under the city.',
  body: [
    'I’m a project manager at HCA Healthcare’s Parallon in Nashville, coordinating AI-enabled revenue cycle initiatives built on Palantir Foundry.',
    'Before that I spent several years on the systems side: implementing tax technology integrated with SAP at KPMG and Ducharme, McMillen & Associates — mapping data, testing API integrations, and supporting go-lives — and running a revenue cycle application program at Parallon.',
    'Most of my work sits between the people who need something and the systems that have to deliver it. I like understanding how things work, finding where a process leaks time or clarity, and building the thing that fixes it.',
  ],
  principles: [
    { code: 'REQ → BUILD', text: 'Translate business requirements into technical work a team can deliver.' },
    { code: 'SYSTEMS', text: 'Map how data and tools connect before changing any one of them.' },
    { code: 'SHIP', text: 'Prefer a practical, working outcome over a perfect plan.' },
  ],
  education: [
    { school: 'Belmont University', degree: 'Master of Accountancy (MAcc), Emphasis in Data Analytics, Cum Laude', note: 'Dean’s List' },
    { school: 'Southern Illinois University Edwardsville', degree: 'Bachelor of Science in Accountancy, Cum Laude', note: '' },
  ],
};

// Projects. `bucket: 'work'` (default) appears in the Work Projects building;
// `bucket: 'ideas'` in Passion Projects (the Ideas Lab). Order here = order on the site.
export const projects = [
  {
    id: 'reporting',
    name: 'Automated Project Reporting',
    category: 'Data analytics · Reporting automation',
    problem: 'Project information for a revenue cycle application program lived in manual status reports, which took time to assemble and was hard for teams to get to.',
    approach: 'Assisted with developing Power BI reporting workflows and helped teams adopt automated reporting in place of manual status updates.',
    tools: ['Power BI'],
    outcome: 'Reduced manual reporting effort and improved access to project information.',
    role: 'Project Manager · HCA Healthcare, Parallon',
    year: '2023–2025',
    links: { caseStudy: '', demo: '', source: '' },
  },
  {
    id: 'integration',
    name: 'ERP ↔ Tax Engine Integrations',
    category: 'API integrations · Data mapping · Testing',
    problem: 'Enterprise clients implementing tax technology (Vertex O-Series and others) needed their ERP systems, often SAP ECC, to exchange transaction data with the tax engine correctly.',
    approach: 'Gathered integration requirements, built data mappings, developed and tested REST API requests in Postman, ran system integration and user acceptance tests, and worked defects through with technical teams. Prepared cutover plans for go-live.',
    tools: ['Postman', 'REST APIs', 'SAP ECC', 'Vertex O-Series', 'Python', 'Alteryx'],
    outcome: 'Supported three Vertex O-Series go-lives across roughly 8–10 implementation engagements, then four more enterprise engagements at KPMG.',
    role: 'Associate Consultant → Consultant (DMA) · Senior Associate (KPMG)',
    year: '2021–2026',
    links: { caseStudy: '', demo: '', source: '' },
  },
  {
    id: 'migration',
    name: 'Legacy Tax Data Migration',
    category: 'Python · Data migration',
    problem: 'Clients moving from Vertex Q-Series to O-Series had legacy data that had to be carried over.',
    approach: 'Wrote Python scripts to help migrate the legacy Q-Series data instead of moving it by hand.',
    tools: ['Python'],
    outcome: 'Reduced client-billed project hours by 15%.',
    role: 'Associate Consultant · DMA',
    year: '2021–2023',
    links: { caseStudy: '', demo: '', source: '' },
  },
  {
    id: 'cloud-migration',
    name: 'Payment Collection System Cloud Migration',
    category: 'Program delivery · Cloud migration',
    problem: 'A payment collection system was moving to the cloud while two connected systems were being upgraded — with four downstream teams, dependent applications and facility websites relying on it.',
    approach: 'Owned the project plan and risk tracking, coordinating the vendor integration partner, the upgrading systems and every downstream team.',
    tools: ['Project planning', 'Risk tracking', 'Vendor coordination'],
    outcome: '',   // add one when you can support it; the row is hidden while empty
    role: 'Project Manager · HCA Healthcare, Parallon',
    year: '2023–2025',
    links: { caseStudy: '', demo: '', source: '' },
  },
  {
    id: 'issue-log',
    name: 'Webex Pilot Issue Log',
    category: 'AI triage · Automation · Concept build',
    problem: 'Picture an alpha pilot whose feedback all lands in one Webex space. Reading it by hand to separate real issues from chatter doesn’t scale, and issues get lost or logged twice.',
    approach: 'Built a scheduled Python pipeline: it reads new messages over the Webex API, has an LLM (Gemini, with structured output) decide what’s a real issue and assign a title, category, severity and possible duplicate, then creates Azure DevOps work items — tagged with the message ID so a retry never makes a duplicate. SQLite is the source of truth; an Excel log is regenerated from it on every run, and issues resolved in Azure DevOps are synced back.',
    tools: ['Python', 'Webex REST API', 'Google Gemini', 'Pydantic', 'SQLite', 'Azure DevOps REST API', 'openpyxl', 'launchd'],
    outcome: 'A working end-to-end prototype, tested against my own Webex space and a personal Azure DevOps sandbox (no company data). Runs every 15 minutes with no manual steps.',
    // the longer story, shown under the summary on the project page
    story: [
      { h: 'Why I built it', p: 'I wanted to learn how to wire a real, API-driven pipeline end to end — not a script that works once, but something that can run unattended. A pilot feedback channel was a good test case: lots of messages, only some of them real issues, and every issue needs to end up somewhere a developer will actually see it.' },
      { h: 'Decision 1: an integration, not a bot', p: 'Webex bots only see messages that @mention them in a group space, so a bot would miss most feedback. I registered an OAuth integration instead, which reads the whole space with read-only scopes and refreshes its own token.' },
      { h: 'Decision 2: never create the same bug twice', p: 'If the job crashed after creating a work item but before saving its progress, a retry would create a duplicate. Each work item is tagged with the Webex message ID, and the job checks for that tag before creating anything. It also checkpoints after every message, not once per run.' },
      { h: 'Decision 3: a database, not the spreadsheet', p: 'My first version read and rewrote the Excel file on every run, which breaks the moment someone has it open. SQLite became the source of truth; the Excel log is rebuilt from it each run and swapped in atomically, so nothing ever reads it back.' },
      { h: 'Decision 4: let developers close the loop', p: 'Nobody should have to update two places. Each run checks the open issues against Azure DevOps and marks them resolved when a developer closes the work item — which also gives a clean trigger for notifying the reporter later.' },
      { h: 'What I’d do next', p: 'Notify the reporter in Webex when their issue is resolved, handle screenshots attached to bug reports, and swap the 15-minute polling for a Webex webhook.' },
    ],
    images: [
      { src: 'issue-log-ado.png', alt: 'Azure DevOps bug #14, created automatically from a Webex message: the AI-written title, the original message in the description, state To Do', caption: 'A real run: a test message posted in my own Webex space became Azure DevOps bug #14, with an AI-written title and the original message attached. The message-ID tag (used to prevent duplicates) is blurred.' },
      { src: 'issue-log-real.png', alt: 'Excel issue log with two rows: ISSUE-0001 resolved as work item 13, ISSUE-0002 new as work item 14', caption: 'The Excel log from the same runs. Bug #13 was closed in Azure DevOps, so the next run marked ISSUE-0001 Resolved on its own.' },
    ],
    role: 'Personal project · design & build',   // bucketed with work projects by choice
    year: '2026',
    links: { caseStudy: '', demo: '', source: 'https://github.com/waldropjoe/webex-issue-log' },
  },
  {
    id: 'ideas',
    bucket: 'ideas',
    name: 'Waldropolis (this site)',
    category: 'Product concept · Interactive application',
    problem: 'A résumé lists what you did. It doesn’t show how you think about systems.',
    approach: 'Designed and built a city on a computer chip: a hand-written isometric canvas engine, a drivable car, and data-driven pages — plus a GitHub Action that syncs a curated Spotify playlist into the Books & Podcasts page.',
    tools: ['JavaScript', 'Canvas 2D', 'Python', 'GitHub Actions', 'Spotify Web API'],
    outcome: 'Live on GitHub Pages; the Books & Podcasts page updates itself daily.',
    role: 'Design & build',
    year: '2026',
    links: { caseStudy: '', demo: '', source: 'https://github.com/waldropjoe/waldropjoe.github.io' },
  },
];

// Skills as nodes on a circuit. `level` is optional and shown as-is — only set it
// where it's honest (the résumé marks SQL and Git as working knowledge).
export const skills = [
  {
    group: 'Project delivery',
    color: 'orange',
    items: [
      { name: 'Planning & milestones', use: 'Schedules, milestones and dependencies across three AI-enabled revenue cycle initiatives.' },
      { name: 'Risk & issue management', use: 'Risk and issue tracking, including for a payment system cloud migration with many downstream teams.' },
      { name: 'Budget & forecasting', use: 'Tracked a $1.67M operating and $50K capital budget, with forecasts and change requests.' },
      { name: 'Governance', use: 'Co-led monthly program governance meetings with executive stakeholders; applied PMI processes.' },
      { name: 'Agile / Scrum', use: 'Iterative delivery with developers, business analysts and test analysts.' },
    ],
  },
  {
    group: 'Systems & analysis',
    color: 'magenta',
    items: [
      { name: 'Requirements', use: 'Gathered and documented integration requirements with client executives, product owners and developers.' },
      { name: 'Data mapping', use: 'ERP-to-tax-engine data mappings, workflow diagrams and validation findings.' },
      { name: 'SIT & UAT', use: 'System integration and user acceptance testing, documenting and working defects to resolution.' },
      { name: 'Technical documentation', use: 'Training materials, process documentation and technical write-ups for client and internal teams.' },
    ],
  },
  {
    group: 'Data & automation',
    color: 'cyan',
    items: [
      { name: 'Python', level: 'working knowledge', use: 'Workflows for processing and validating ERP transaction data; legacy data migration scripts.' },
      { name: 'Alteryx', use: 'Workflows for processing and validating ERP transaction data and other business data.' },
      { name: 'Power BI', use: 'Reporting workflows that replaced manual project reporting.' },
      { name: 'Tableau', use: 'Data visualization and dashboards.' },
      { name: 'SQL', level: 'working knowledge', use: 'Querying data for analysis.' },
    ],
  },
  {
    group: 'AI & platforms',
    color: 'yellow',
    items: [
      { name: 'LLMs & prompt engineering', use: 'Using large language models day to day, and writing prompts that get dependable results.' },
      { name: 'Palantir Foundry', level: 'project-level exposure', use: 'Platform for the AI-enabled revenue cycle initiatives I coordinate.' },
      { name: 'REST APIs & Postman', level: 'working knowledge', use: 'Developing and testing API requests between ERP systems and tax engines.' },
      { name: 'Git & GitHub', level: 'working knowledge', use: 'Version control — including this site.' },
    ],
  },
  {
    group: 'Delivery tools',
    color: 'orange',
    items: [
      { name: 'Microsoft Project & Smartsheet', use: 'Project plans, status, resources and forecasts.' },
      { name: 'Jira & Azure DevOps', use: 'Tracking work, defects and delivery.' },
    ],
  },
];

export const experience = [
  {
    org: 'HCA Healthcare · Parallon',
    role: 'Project Manager II',
    dates: 'April 2026 — Present',
    summary: 'Coordinate schedules, milestones, dependencies and risks across three AI-enabled revenue cycle initiatives built on Palantir Foundry.',
    highlights: [
      'Support the rollout of one initiative into production and across its operational user base, while advancing two others toward pilot and user acceptance testing.',
      'Lead weekly core-team meetings with executive business owners, presenting status and aligning priorities across every phase of the product lifecycle.',
      'Spearhead coordination with shared services — education, change management, communications and testing — following PMI processes.',
    ],
  },
  {
    org: 'KPMG LLP',
    role: 'Senior Associate, Indirect Tax Technology',
    dates: 'September 2025 — March 2026',
    summary: 'Worked across four enterprise client engagements implementing tax technology integrated with SAP.',
    highlights: [
      'Built and updated Python and Alteryx workflows for processing and validating ERP transaction data.',
    ],
    projects: ['integration'],
  },
  {
    org: 'HCA Healthcare · Parallon',
    role: 'Project Manager',
    dates: 'September 2023 — September 2025',
    summary: 'Coordinated planning and delivery for a program supporting five hospital revenue cycle applications, with a team of five developers, two business analysts and two test analysts.',
    highlights: [
      'Tracked a $1.67M operating budget and $50K capital budget; co-led monthly governance meetings with executive stakeholders.',
      'Established communication channels that cut project discovery and planning time by about two weeks.',
      'Identified unused capital funds and coordinated their reallocation to server-stack upgrades.',
    ],
    projects: ['reporting', 'cloud-migration'],
  },
  {
    org: 'Ducharme, McMillen & Associates',
    role: 'Consultant · Associate Consultant, Indirect Tax Technology',
    dates: 'July 2021 — August 2023',
    summary: 'Supported delivery and project management across roughly 8–10 enterprise tax technology implementations.',
    highlights: [],
    projects: ['integration', 'migration'],
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
//   date:     'YYYY-MM' (only used for ordering; not shown)
//   link:     a Spotify link shows a play button; any other link shows "Details ↗"
//   cover:    optional image URL ('' gives a generated cover tile)
//   takeaway: one line on what stuck with you
export const listening = [
  // Audiobooks from the Waldrops Portfolio playlist (Spotify lists these as shows)
  { type: 'audiobook', status: 'done', title: 'The Hype Machine', by: 'Sinan Aral', date: '2026-10', takeaway: '', link: 'https://open.spotify.com/show/1v9GAJzWb6d0fuHlXO2dHQ', cover: 'https://image-cdn-ak.spotifycdn.com/image/ab6766630000db5bf184d342ecaf72f8b8e6539b' },
  { type: 'audiobook', status: 'done', title: 'Nexus', by: 'Yuval Noah Harari', date: '2026-10', takeaway: '', link: 'https://open.spotify.com/show/0WLodsHwFezxzYSaiC7aG1', cover: 'https://image-cdn-fa.spotifycdn.com/image/ab6766630000db5b6eaa914d6b56e75792cec434' },
  { type: 'audiobook', status: 'done', title: 'The Challenger Sale', by: 'Matthew Dixon, Brent Adamson', date: '2026-10', takeaway: '', link: 'https://open.spotify.com/show/6ohFCPBRvNIIpQf9LXc3y4', cover: 'https://image-cdn-fa.spotifycdn.com/image/ab6766630000db5b5fd02c602fb348c5e0b6823c' },
  { type: 'audiobook', status: 'done', title: "It Doesn't Have to Be Crazy at Work", by: 'Jason Fried, David Heinemeier Hansson', date: '2026-10', takeaway: '', link: 'https://open.spotify.com/show/5V3d6FXxmPtWT82BkbH2Xn', cover: 'https://image-cdn-ak.spotifycdn.com/image/ab6766630000db5bb561ae33029d888b09881a9c' },
  // A print book:
  // { type: 'book', status: 'done', title: 'Book title', by: 'Author', date: '2026-10', takeaway: 'What stuck.', link: '', cover: '' },
  // A note on a synced podcast episode:
  // { link: 'https://open.spotify.com/episode/XXXXXXXX', takeaway: 'The one thing that stuck.' },
];

// Spotify sometimes serves books as if they were podcast episodes. Put the show name
// (as it appears under the title on the site) here and those items move to Books.
export const bookShows = [
  // 'The Psychology of Money',
];

export const contact = {
  title: 'Have an interesting problem to solve?',
  body: 'I’m always interested in connecting with people building useful things at the intersection of technology, data, and product.',
};
