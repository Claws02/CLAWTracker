const fs = require('fs');
const { JSDOM } = require('jsdom');
const HTML = fs.readFileSync(__dirname + '/../tracker.html', 'utf8');
const INDEX = fs.readFileSync(__dirname + '/../index.html', 'utf8');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL: ' + m); } };

function memStore() {
  const m = {};
  return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); },
           removeItem: k => { delete m[k]; }, _raw: m };
}
function boot(url, storage) {
  return new JSDOM(HTML, {
    runScripts: 'dangerously', url, pretendToBeVisual: true,
    beforeParse(win) {
      if (storage) Object.defineProperty(win, 'localStorage', { value: storage, configurable: true });
      if (!win.TextEncoder) { win.TextEncoder = require('util').TextEncoder; }
      if (!win.TextDecoder) { win.TextDecoder = require('util').TextDecoder; }
    }
  }).window;
}
const settle = () => new Promise(r => setTimeout(r, 40));

(async () => {
  // ---- base64url round trip, including non-ASCII notes ----
  let w = boot('https://claws02.github.io/claw-lab/tracker.html', memStore());
  await settle();
  const api = w.__claw;

  const sample = JSON.stringify({ v: 1, ticks: { w1a: true }, notes: { 3: 'deck template — 90 % done ✓' }, open: {} });
  const enc = api.b64enc(sample);
  ok(typeof enc === 'string' && enc.length > 0, 'encoder returns a string');
  ok(!/[+/=]/.test(enc), 'encoding is url-safe (no + / =)');
  ok(api.b64dec(enc) === sample, 'round trip survives em dashes, % and a check mark');
  ok(api.b64dec('!!!not base64!!!') === null, 'decoder returns null on garbage rather than throwing');

  // ---- share link shape ----
  api.state.ticks['w2b'] = true;
  const link = api.shareLink();
  ok(link.indexOf('https://claws02.github.io/claw-lab/tracker.html#s=') === 0, 'link keeps the page path and adds #s=');
  const payload = JSON.parse(api.b64dec(link.split('#s=')[1]));
  ok(payload.ticks.w2b === true, 'link payload carries the ticks');

  // ---- opening that link on a clean device ----
  const fresh = memStore();
  const w2 = boot(link, fresh);
  await settle();
  ok(w2.__claw.state.ticks['w2b'] === true, 'a fresh device picks the state up from the link');
  ok(w2.document.getElementById('chk-w2b').checked === true, 'imported tick renders checked');
  ok(Object.keys(fresh._raw).some(k => k.indexOf('claw.fallblock') === 0), 'link state is persisted locally');
  ok(w2.location.hash === '', 'hash is stripped after import so a refresh cannot re-apply it');

  // ---- link import must not wipe work already on the phone ----
  const busy = memStore();
  busy.setItem('claw.fallblock.v1', JSON.stringify({ v: 1, ticks: { w9a: true }, notes: {}, open: {} }));
  const w3 = boot(link, busy);
  await settle();
  ok(w3.__claw.state.ticks['w2b'] === true, 'link state applies over existing local state');

  // ---- malformed hashes are ignored, not fatal ----
  for (const bad of ['#s=%%%%', '#s=', '#nonsense', '#s=eyJicm9rZW4i']) {
    const wb = boot('https://claws02.github.io/claw-lab/tracker.html' + bad, memStore());
    await settle();
    ok(!!wb.__claw && wb.document.querySelectorAll('#weeks .week').length === 14,
       'app still boots with hash ' + bad);
  }

  // ---- a hash that decodes to valid JSON of the wrong shape ----
  const wrong = Buffer.from('[1,2,3]').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const w4 = boot('https://claws02.github.io/claw-lab/tracker.html#s=' + wrong, memStore());
  await settle();
  ok(w4.__claw.allTotals().done === 0, 'wrong-shape link payload is ignored');

  // ---- link button is wired ----
  const w5 = boot('https://claws02.github.io/claw-lab/tracker.html', memStore());
  await settle();
  w5.document.execCommand = () => true;
  const btn = w5.document.getElementById('link');
  ok(!!btn, 'the link button exists');
  btn.click();
  ok(w5.document.getElementById('io').value.indexOf('#s=') > -1, 'pressing it puts a link in the box');

  // ---- PWA wiring on every page ----
  const pages = { 'tracker.html': HTML, 'index.html': INDEX,
                  'deck/ep1.html': fs.readFileSync(__dirname + '/../deck/ep1.html', 'utf8') };
  Object.keys(pages).forEach(name => {
    const h = pages[name];
    ok(h.indexOf('rel="manifest"') > -1, name + ' links the manifest');
    ok(h.indexOf('apple-touch-icon') > -1, name + ' has an apple touch icon');
    ok(h.indexOf('apple-mobile-web-app-capable') > -1, name + ' is home-screen capable');
    ok(h.indexOf('viewport-fit=cover') > -1, name + ' handles the notch');
  });
  // relative depth is correct for the nested deck page
  ok(pages['deck/ep1.html'].indexOf('href="../manifest.webmanifest"') > -1, 'deck page walks up one level for the manifest');
  ok(pages['index.html'].indexOf('href="./manifest.webmanifest"') > -1, 'index uses a root-relative manifest path');

  // ---- manifest and service worker sanity ----
  const man = JSON.parse(fs.readFileSync(__dirname + '/../manifest.webmanifest', 'utf8'));
  ok(man.display === 'standalone', 'manifest opens standalone');
  ok(man.start_url.indexOf('./') === 0 && man.scope === './', 'manifest paths are relative so a project page works');
  ok(man.icons.length >= 3, 'manifest declares three icon sizes');
  man.icons.forEach(ic => {
    ok(fs.existsSync(__dirname + '/../' + ic.src.replace('./', '')), 'icon exists: ' + ic.src);
  });

  const sw = fs.readFileSync(__dirname + '/../sw.js', 'utf8');
  ok(/const CACHE\s*=\s*"claw-lab-v\d+"/.test(sw), 'service worker has a versioned cache name');
  const shell = sw.match(/const SHELL = \[([\s\S]*?)\]/)[1]
    .split(',').map(s => s.trim().replace(/"/g, '')).filter(s => s && s !== './');
  shell.forEach(f => ok(fs.existsSync(__dirname + '/../' + f.replace('./', '')), 'shell file exists: ' + f));
  ok(sw.indexOf('url.origin !== self.location.origin') > -1, 'service worker leaves cross-origin fonts alone');
  ok(sw.indexOf('fetch(req)') < sw.indexOf('caches.match(req)'), 'network-first, cache as fallback');

  ok(fs.existsSync(__dirname + '/../.nojekyll'), '.nojekyll present so Pages does not run Jekyll');

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
