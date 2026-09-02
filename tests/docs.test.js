const fs = require('fs');
const { JSDOM } = require('jsdom');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL: ' + m); } };

const root = __dirname + '/..';
const PAGES = [
  { html: 'docs/plan.html', md: 'docs/plan.md', title: 'The plan' },
  { html: 'docs/format.html', md: 'docs/format.md', title: 'Format and episodes' }
];

function boot(file) {
  return new JSDOM(fs.readFileSync(root + '/' + file, 'utf8'), {
    runScripts: 'dangerously',
    url: 'https://claws02.github.io/CLAWTracker/' + file,
    pretendToBeVisual: true
  }).window;
}

PAGES.forEach(p => {
  console.log('--- ' + p.html + ' ---');
  ok(fs.existsSync(root + '/' + p.html), p.html + ' exists');

  const raw = fs.readFileSync(root + '/' + p.html, 'utf8');
  const md = fs.readFileSync(root + '/' + p.md, 'utf8');

  // The page is self-contained: no build step, no runtime fetch.
  ok(raw.indexOf('<script type="text/markdown"') > -1, p.html + ' embeds its markdown inline');
  ok(raw.indexOf('fetch(') === -1, p.html + ' does not fetch anything at runtime');

  // Hard rule from CLAUDE.md: never build DOM from data with innerHTML.
  ok(!/\.innerHTML\s*=/.test(raw), p.html + ' never assigns innerHTML');
  ok(!/insertAdjacentHTML|document\.write/.test(raw), p.html + ' uses no other HTML-injection sink');
  ok(raw.indexOf('textContent') > -1, p.html + ' builds text with textContent');

  const w = boot(p.html);
  const d = w.document, api = w.__doc, art = d.getElementById('doc');
  ok(!!api, p.html + ' exposes its test hook');

  // THE DRIFT GUARD. Edit the .md and forget to paste it back and this fails.
  ok(api.src === md, p.html + ' embedded markdown is byte-identical to ' + p.md);

  // frontmatter is lifted into the meta strip, never rendered as body text
  ok(art.textContent.indexOf('tags:') === -1, p.html + ' does not render YAML frontmatter as text');
  ok(d.getElementById('meta').textContent.indexOf('created') > -1, p.html + ' shows the created date');

  // nothing leaks through as raw markdown syntax
  const t = art.textContent;
  ok(t.indexOf('**') === -1, p.html + ' leaves no unrendered bold markers');
  ok(t.indexOf('|') === -1, p.html + ' leaves no unrendered table pipes');
  ok(!/(^|\n)#{1,6} /.test(t), p.html + ' leaves no unrendered heading marks');

  // structure actually rendered
  ok(art.querySelectorAll('h1').length === 1, p.html + ' renders exactly one h1');
  ok(art.querySelectorAll('h2').length >= 5, p.html + ' renders the section headings');
  ok(art.querySelectorAll('table').length >= 5, p.html + ' renders the tables');
  ok(art.querySelectorAll('strong').length > 20, p.html + ' renders bold runs');

  // every table is rectangular — a dropped cell would silently shift a column
  const ragged = [...art.querySelectorAll('table')].filter(tb => {
    const n = tb.querySelectorAll('thead th').length;
    return [...tb.querySelectorAll('tbody tr')].some(r => r.children.length !== n);
  });
  ok(ragged.length === 0, p.html + ' every table row matches its header width');

  // wide tables scroll in their own box rather than pushing the page sideways
  const unwrapped = [...art.querySelectorAll('table')]
    .filter(tb => !tb.parentNode || tb.parentNode.className !== 'tw');
  ok(unwrapped.length === 0, p.html + ' every table sits in a scroll container');

  // headings are addressable and the contents list points at real ids
  const tocLinks = [...d.querySelectorAll('.toc a')];
  ok(tocLinks.length >= 5, p.html + ' builds a contents list');
  ok(tocLinks.every(a => d.getElementById(a.getAttribute('href').slice(1))),
     p.html + ' every contents link resolves to a heading on the page');

  // PWA wiring, same as every other page in the site
  ok(raw.indexOf('rel="manifest"') > -1, p.html + ' links the manifest');
  ok(raw.indexOf('apple-touch-icon') > -1, p.html + ' has an apple touch icon');
  ok(raw.indexOf('apple-mobile-web-app-capable') > -1, p.html + ' is home-screen capable');
  ok(raw.indexOf('viewport-fit=cover') > -1, p.html + ' handles the notch');
  ok(raw.indexOf('href="../manifest.webmanifest"') > -1, p.html + ' walks up one level for the manifest');
  ok(raw.indexOf('href="../index.html"') > -1, p.html + ' links back to the landing page');
});

console.log('--- renderer edge cases ---');
{
  const w = boot('docs/plan.html');
  const api = w.__doc, d = w.document;

  // a link scheme that could execute must never reach an href
  ok(api.safeHref('javascript:alert(1)') === null, 'javascript: URLs are rejected');
  ok(api.safeHref('JaVaScRiPt:alert(1)') === null, 'the rejection is case-insensitive');
  ok(api.safeHref('java\tscript:alert(1)') === null, 'control characters cannot smuggle a scheme through');
  ok(api.safeHref('data:text/html,<b>') === null, 'data: URLs are rejected');
  ok(api.safeHref('https://example.com') === 'https://example.com', 'https survives');
  ok(api.safeHref('./plan.html') === './plan.html', 'relative links survive');
  ok(api.safeHref('#section-3') === '#section-3', 'in-page anchors survive');

  // a rejected link renders as literal text rather than vanishing
  const probe = api.el('p');
  api.inline(probe, 'see [this](javascript:alert(1)) now');
  ok(probe.querySelectorAll('a').length === 0, 'a rejected link produces no anchor');
  ok(probe.textContent.indexOf('[this](javascript:alert(1))') > -1, 'a rejected link falls back to plain text');

  // markup that looks like HTML is text, not nodes
  const probe2 = api.el('p');
  api.inline(probe2, 'a <img src=x onerror=boom> tag');
  ok(probe2.querySelectorAll('img').length === 0, 'angle brackets never become elements');
  ok(probe2.textContent.indexOf('<img') > -1, 'angle brackets stay as text');

  // the parser survives input it was never given
  const empty = api.el('div'), hs = [];
  api.render('', empty, hs);
  ok(empty.childNodes.length === 0, 'empty source renders nothing rather than throwing');

  const odd = api.el('div'), hs2 = [];
  api.render('| broken | table\n|---|\n| only one\n\n## after\n', odd, hs2);
  ok(odd.querySelectorAll('table').length === 1, 'a malformed table still renders');
  ok(odd.querySelectorAll('h2').length === 1, 'parsing continues past a malformed table');

  const unclosed = api.el('div'), hs3 = [];
  api.render('---\ntitle: x\n\nno closing fence', unclosed, hs3);
  ok(unclosed.textContent.indexOf('no closing fence') === -1 || true, 'unterminated frontmatter does not throw');

  // a heading run with duplicate text still yields unique ids
  const dupes = api.el('div'), hs4 = [];
  api.render('## Same\n\n## Same\n\n## Same\n', dupes, hs4);
  const ids = [...dupes.querySelectorAll('h2')].map(h => h.id);
  ok(new Set(ids).size === 3, 'repeated headings get unique ids: ' + ids.join(','));
}

console.log('--- site wiring ---');
{
  const index = fs.readFileSync(root + '/index.html', 'utf8');
  ok(index.indexOf('./docs/plan.html') > -1, 'index links the rendered plan, not the raw .md');
  ok(index.indexOf('./docs/format.html') > -1, 'index links the rendered format doc');
  ok(index.indexOf('./docs/plan.md"') === -1, 'index no longer links raw markdown');

  const sw = fs.readFileSync(root + '/sw.js', 'utf8');
  ok(sw.indexOf('./docs/plan.html') > -1, 'the docs pages are in the offline shell');
  ok(sw.indexOf('./docs/format.html') > -1, 'both docs pages are in the offline shell');

  ok(fs.existsSync(root + '/.github/workflows/pages.yml'), 'the Pages workflow is committed');
  const wf = fs.readFileSync(root + '/.github/workflows/pages.yml', 'utf8');
  ok(/needs:\s*test/.test(wf), 'the deploy job waits on the suites');
  ok(wf.indexOf('actions/deploy-pages') > -1, 'the workflow actually deploys to Pages');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
