# CLAW Lab — context for Claude Code

This repo is the working surface for Caleb's fall 2026 build block. It is
static, single-file, and hosted on GitHub Pages so it works on an iPhone.

## What lives here

| Path | What it is |
|---|---|
| `index.html` | Landing page. Computes which week of the block it is |
| `tracker.html` | The 14-week schedule tracker. All state in `localStorage` |
| `deck/ep1.html` | Spec Check presenter deck, episode 1. Also the template for 2–6 |
| `docs/plan.md` | The December goal, week-by-week schedule, contingency rules |
| `docs/format.md` | Episode format spec, clip-harvest system, six episode outlines |
| `sw.js` | Service worker. Network-first for pages, cache as offline fallback |
| `manifest.webmanifest` | Home-screen install metadata |

## Hard rules for this repo

- **Single-file pages.** Every page is self-contained: inline CSS, inline JS,
  no build step, no bundler, no npm at runtime. Fonts are the only external
  request. This is deliberate — a broken build must never cost a Wednesday.
- **No framework.** Plain ES5-compatible JS, no JSX, no TypeScript. It has to
  run in mobile Safari with no transpile.
- **Palette is white, black, and `#0B57D0`.** No warm neutrals, no cream, no
  low-contrast greys on white. Type is IBM Plex Sans and IBM Plex Mono. This
  was settled after two rounds of contrast complaints; do not redecorate.
- **Never build DOM from data with `innerHTML`.** The decks and tracker use a
  `el()` helper and `textContent`. Keep it that way.
- **Bump `CACHE` in `sw.js`** whenever the shell file list changes, or phones
  will serve a stale page.

## Verification before anything ships

From `tests/`:

```
npm install          # jsdom only
node tracker.test.js # 65+ assertions
node deck.test.js    # 46+ assertions
```

Both must be green. The suites cover failure paths on purpose — storage that
throws, corrupt saved payloads, malformed imports — because a storage bug has
shipped here before. Add to them rather than replacing them.

Also run a syntax gate on any page you touch:

```
node -e "const fs=require('fs');const h=fs.readFileSync('tracker.html','utf8');fs.writeFileSync('/tmp/x.js',h.match(/<script>([\s\S]*?)<\/script>/)[1])" && node --check /tmp/x.js
```

## Building episodes 2 through 6

`deck/ep1.html` is the template. Copy it to `deck/ep2.html` and replace the two
arrays marked `EDIT HERE` — `EPISODE` and `SLIDES`. Everything below the second
banner comment is the engine and should not change per episode.

Slide kinds: `title`, `statement`, `three`, `beats`, `math`, `table`, `outro`.

Rules the deck tests enforce, so keep them true:

- Exactly six clips, `C1`–`C6`, each a **contiguous** run of 2–4 slides.
- Every clip's first slide has a `hook` that works with zero prior context.
- No hook contains a backward reference ("as we saw", "earlier", "that spec").
- Every slide has a `script` of more than 20 characters.
- Write `[[fill]]` anywhere a number must come off a datasheet. The header
  counts them. **Do not invent specs to clear the counter** — the whole channel
  premise is that the numbers are read off a real datasheet with a revision
  number. This matters more than any other rule in this file.

## Things a session should know

- Channel name is **CLAWSEngineering**; the series is **The Spec Check**.
- The block runs Sep 2 – Dec 2 2026. Nov 25 is an intentionally empty buffer week.
- Episodes 4, 5 and 6 double as BOM selection for a Q1 LQR motor-node board.
- There is a live IP constraint: the BQ21040 and ESP32-C3 appear in a
  patent-pending design of Caleb's. Discuss the parts generically; never in the
  context of a handheld filtration device. See `docs/plan.md` §5.
- Caleb's separate portfolio site is a different project (`Claws02/github.io`,
  rebuild targeted at Cloudflare Pages). Don't merge them.

## Deploying

Push to `main`. GitHub Pages serves from the repo root. `.nojekyll` is present
so paths beginning with underscores are not eaten. Nothing to build.
