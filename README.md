# waldropjoe.github.io — Chip City

A portfolio built as a neon city on a computer chip. Each landmark building is a section or project: hover to inspect, click to enter, or open the Directory for a plain list.

No build step and no dependencies — plain HTML, CSS and JavaScript modules.

| File | What it is |
| --- | --- |
| `data.js` | **All content** — projects, skills, experience, the Input Log (`listening`), links. Edit this to update the site. `[Bracketed]` text is a placeholder and shows dimmed. Empty links are hidden. |
| `city.js` | The isometric canvas engine: chip, circuit traces, data pulses, buildings, landmark tags, hover/click. Landmark positions are in `LANDMARKS`. |
| `main.js` | Renders content from `data.js`, scroll-driven camera views per section (`VIEWS`), directory dialog. |
| `styles.css` | Design tokens, layout, responsive and reduced-motion rules. |

Run locally: `python3 -m http.server` in this folder, then open http://localhost:8000 (modules don't load from `file://`).

When you change CSS or JS, bump the `?v=` number in `index.html` and in the imports at the top of `main.js` so browsers pick up the new files.

## Adding to the Input Log

Add a line at the top of `listening` in `data.js`:

```js
{ type: 'podcast', status: 'done', title: 'Episode title', by: 'Show name', date: '2026-11', takeaway: 'The one thing that stuck.', link: 'https://open.spotify.com/episode/…', cover: '' },
```

A Spotify link (episode, show or audiobook) gives the entry a "Play on Spotify" button that loads Spotify's player only when clicked. Set `status: 'now'` to pin it under "On right now".

## Spotify sync (automatic podcasts and audiobooks)

A GitHub Action (`.github/workflows/update-listening.yml`) runs daily, reads your **saved** Spotify
episodes and audiobooks, and writes them to `listening.json`, which the Input Log merges with `data.js`.

- Episodes you've finished show as done; episodes you're partway through show under "On right now";
  saved-but-unplayed episodes are skipped.
- Entries are never removed once seen, so the log keeps its history.
- Add a takeaway to a synced item with an entry in `data.js` that has the same Spotify link.

One-time setup:
1. Create an app at https://developer.spotify.com/dashboard (the app owner needs Spotify Premium).
   Redirect URI: `http://127.0.0.1:8888/callback`. API: Web API.
2. On your computer: `python3 scripts/spotify_login.py` and approve access in the browser.
3. In this repo: Settings → Secrets and variables → Actions → add `SPOTIFY_CLIENT_ID`,
   `SPOTIFY_CLIENT_SECRET` and `SPOTIFY_REFRESH_TOKEN`.
4. Actions tab → "Update listening log" → Run workflow.
