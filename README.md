# CLAW Lab

Static working surface for the fall 2026 build block — a schedule tracker and
The Spec Check presenter decks, served from GitHub Pages so they work on an
iPhone with no signal.

No build step. Every page is a single self-contained HTML file.

Live at **https://claws02.github.io/CLAWTracker/**

## Deploy

The repo is `Claws02/CLAWTracker` and Pages is published by a workflow, so a
push that breaks the suites never reaches the phone.

One-time setup, on GitHub:

1. **Settings → Pages → Source: GitHub Actions.**
2. Push to `main`.

`.github/workflows/pages.yml` then runs the jsdom suites and the per-page
syntax gate, and only deploys the repo root if both are green. Watch a run
under the **Actions** tab; the deploy job prints the live URL. You can also
trigger it by hand from there with **Run workflow**.

Nothing to build, and no `gh-pages` branch — the artifact is the repo root as
it sits.

## On the iPhone

1. Open `https://claws02.github.io/CLAWTracker/` in Safari.
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

250 assertions across four suites. They cover the failure paths deliberately —
storage that throws, corrupt payloads, malformed links, wrong-shape imports,
link schemes that could execute — and they check structural rules on the decks:
six contiguous clips, every clip opening with a context-free hook, no backward
references in hooks.

## Layout

```
index.html              landing page, computes the current week
tracker.html            14-week tracker, episode pipeline board, session log
deck/ep1.html           Spec Check episode 1 deck; the template for 2-6
docs/plan.md            December goal, week-by-week, contingency rules
docs/format.md          episode format, clip-harvest system, six outlines
docs/plan.html          the same plan, rendered for the phone
docs/format.html        the same format spec, rendered for the phone
sw.js                   network-first service worker, cache as offline fallback
manifest.webmanifest    home-screen install metadata
.github/workflows/      test-then-deploy to Pages
tests/                  jsdom suites
CLAUDE.md               conventions and constraints for a Claude Code session
```

## The docs pages

GitHub Pages serves a raw `.md` as markdown, which Safari downloads instead of
rendering — so the two reference docs also exist as HTML. Each one embeds its
markdown verbatim in a `<script type="text/markdown">` block and renders it on
load with the same `el()` / `textContent` rules as the rest of the site. No
fetch, so they read with no signal.

The `.md` files stay the source of truth for Obsidian. After editing one, paste
the new text back into the matching HTML page's markdown block. `docs.test.js`
compares the two byte-for-byte and fails if you forget.

## Adding episode 2

```bash
cp deck/ep1.html deck/ep2.html
```

Replace the `EPISODE` and `SLIDES` arrays marked `EDIT HERE`. Leave the engine
below the second banner alone. Add `./deck/ep2.html` to `SHELL` in `sw.js` and
bump `CACHE` to the next `claw-lab-vN`, or phones will keep serving the old
shell.

## Why this is its own repo

The portfolio rebuild (`Claws02/github.io`, targeted at Cloudflare Pages) is a
separate project with its own host. These tools should not be sitting in the
middle of it.
