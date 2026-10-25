# waldropjoe.github.io — Chip City

A portfolio built as a neon city on a computer chip. Each landmark building is a section or project: hover to inspect, click to enter, or open the Directory for a plain list.

No build step and no dependencies — plain HTML, CSS and JavaScript modules.

| File | What it is |
| --- | --- |
| `data.js` | **All content** — projects, skills, experience, links. Edit this to update the site. `[Bracketed]` text is a placeholder and shows dimmed. Empty links are hidden. |
| `city.js` | The isometric canvas engine: chip, circuit traces, data pulses, buildings, landmark tags, hover/click. Landmark positions are in `LANDMARKS`. |
| `main.js` | Renders content from `data.js`, scroll-driven camera views per section (`VIEWS`), directory dialog. |
| `styles.css` | Design tokens, layout, responsive and reduced-motion rules. |

Run locally: `python3 -m http.server` in this folder, then open http://localhost:8000 (modules don't load from `file://`).

When you change CSS or JS, bump the `?v=` number in `index.html` and in the imports at the top of `main.js` so browsers pick up the new files.
