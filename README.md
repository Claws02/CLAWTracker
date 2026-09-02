# CLAW Lab

Static working surface for the fall 2026 build block — a schedule tracker and
The Spec Check presenter decks, served from GitHub Pages so they work on an
iPhone with no signal.

No build step. Every page is a single self-contained HTML file.

## Deploy

Create an empty repo named `claw-lab` on GitHub, then from this folder:

```bash
git init
git add .
git commit -m "CLAW Lab: fall block tracker and Spec Check ep1 deck"
git branch -M main
git remote add origin git@github.com:Claws02/claw-lab.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`**.

Live at `https://claws02.github.io/claw-lab/` about a minute later.

This is a separate repo from `Claws02/github.io` on purpose — the portfolio
rebuild is its own project with its own host, and these tools should not be
sitting in the middle of it.

## On the iPhone

1. Open `https://claws02.github.io/claw-lab/` in Safari.
2. Share → Add to Home Screen.
3. It launches without browser chrome and works offline after the first visit.

## Moving progress between devices

Ticks live in each browser's own storage, so they do not sync on their own.
In the tracker's **Data** tab, press **Copy link with progress** — that produces
a URL with your state encoded in the fragment. Open it on the other device and
the ticks come with it. The fragment is stripped after import so refreshing
cannot re-apply an old state.

The fragment never leaves the browser: URL fragments are not sent to the server.

## Tests

```bash
cd tests
npm install
npm test
```

159 assertions across three suites. They cover the failure paths deliberately —
storage that throws, corrupt payloads, malformed links, wrong-shape imports —
and they check structural rules on the decks: six contiguous clips, every clip
opening with a context-free hook, no backward references in hooks.

## Layout

```
index.html              landing page, computes the current week
tracker.html            14-week tracker, episode pipeline board, session log
deck/ep1.html           Spec Check episode 1 deck; the template for 2-6
docs/plan.md            December goal, week-by-week, contingency rules
docs/format.md          episode format, clip-harvest system, six outlines
sw.js                   network-first service worker, cache as offline fallback
manifest.webmanifest    home-screen install metadata
tests/                  jsdom suites
CLAUDE.md               conventions and constraints for a Claude Code session
```

## Adding episode 2

```bash
cp deck/ep1.html deck/ep2.html
```

Replace the `EPISODE` and `SLIDES` arrays marked `EDIT HERE`. Leave the engine
below the second banner alone. Add `./deck/ep2.html` to `SHELL` in `sw.js` and
bump `CACHE` to `claw-lab-v2`, or phones will keep serving the old shell.
