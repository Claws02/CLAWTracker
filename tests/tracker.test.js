const fs = require('fs');
const { JSDOM } = require('jsdom');
const HTML = fs.readFileSync(__dirname + '/../tracker.html', 'utf8');

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } }

function memStore() {
  const m = {};
  return {
    getItem: k => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: k => { delete m[k]; },
    _raw: m
  };
}

function boot(opts) {
  opts = opts || {};
  const dom = new JSDOM(HTML, { runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true });
  const w = dom.window;
  return { dom, w };
}

// jsdom's default localStorage works; to test failure we pre-patch via a beforeParse hook
function bootWith(storage) {
  const dom = new JSDOM(HTML, {
    runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true,
    beforeParse(win) {
      Object.defineProperty(win, 'localStorage', { value: storage, configurable: true });
    }
  });
  return dom.window;
}

function settle(w) { return new Promise(r => setTimeout(r, 30)); }

(async () => {
  console.log('--- happy path ---');
  let w = bootWith(memStore());
  await settle(w);
  const d = w.document;
  const api = w.__claw;

  ok(!!api, 'test hook exposed');
  ok(api.WEEKS.length === 14, 'fourteen weeks defined');
  ok(api.EPS.length === 6, 'six episodes defined');
  ok(api.STAGES.length === 5, 'five pipeline stages');

  // dates: every week is a Wednesday, seven days apart, Sep 2 -> Dec 2
  let allWed = true, spacing = true;
  for (let i = 0; i < api.WEEKS.length; i++) {
    const dt = new Date(api.WEEKS[i].d + 'T12:00:00Z');
    if (dt.getUTCDay() !== 3) allWed = false;
    if (i > 0) {
      const prev = new Date(api.WEEKS[i - 1].d + 'T12:00:00Z');
      if ((dt - prev) / 86400000 !== 7) spacing = false;
    }
  }
  ok(allWed, 'every scheduled date is a Wednesday');
  ok(spacing, 'weeks are exactly seven days apart');
  ok(api.WEEKS[0].d === '2026-09-02', 'starts Sep 2 2026');
  ok(api.WEEKS[13].d === '2026-12-02', 'ends Dec 2 2026');
  ok(api.WEEKS[12].buffer === true, 'Nov 25 is the buffer week');
  ok(api.WEEKS[12].tasks.length === 0, 'buffer week has no tasks');

  // unique task ids
  const ids = [];
  api.WEEKS.forEach(x => x.tasks.forEach(t => ids.push(t.id)));
  ok(new Set(ids).size === ids.length, 'task ids are unique');
  ok(ids.every(i => /^w\d+[a-z]$/.test(i)), 'task ids well formed');
  ok(api.WEEKS.every(x => x.tasks.every(t => t.w === 'wed' || t.w === 'sat')), 'every task has a valid lane');

  // render
  ok(d.querySelectorAll('#strip .cell').length === 14, 'strip renders 14 cells');
  ok(d.querySelectorAll('#weeks .week').length === 14, 'plan renders 14 week cards');
  ok(d.querySelectorAll('#eps .ep').length === 6, 'episode board renders 6 cards');
  ok(d.querySelectorAll('#eps .rail button').length === 30, 'episode board renders 30 stage buttons');
  ok(d.querySelectorAll('#logs textarea').length === 14, 'log renders 14 note boxes');
  ok(d.querySelectorAll('#weeks .task').length === ids.length, 'every task rendered exactly once');

  // totals math
  const t0 = api.allTotals();
  ok(t0.total === ids.length + 30, 'total = tasks + stages');
  ok(t0.done === 0, 'first run starts at zero');
  ok(d.getElementById('pct').textContent === '0%', 'meter shows 0% on first run');

  // tick one task
  const first = d.getElementById('chk-' + ids[0]);
  first.checked = true;
  first.dispatchEvent(new w.Event('change'));
  ok(api.allTotals().done === 1, 'ticking a task increments the count');
  ok(d.getElementById('pct').textContent !== '0%', 'meter updates after a tick');
  // re-query: refresh() rebuilds the DOM
  const first2 = d.getElementById('chk-' + ids[0]);
  ok(first2 && first2.checked === true, 'tick survives the re-render');

  // untick
  first2.checked = false;
  first2.dispatchEvent(new w.Event('change'));
  ok(api.allTotals().done === 0, 'unticking decrements');

  // episode stage toggle + clause 1
  const c1 = api.CLAUSES[0];
  ok(c1.test(api.state) === false, 'six-published clause starts unmet');
  api.EPS.forEach(e => { api.state.ticks[e.id + ':publish'] = true; });
  ok(c1.test(api.state) === true, 'six-published clause fires at six');
  ok(c1.prog(api.state) === '6 of 6', 'clause progress string correct');
  api.EPS.forEach(e => { delete api.state.ticks[e.id + ':publish']; });

  // stage button click
  const stageBtn = d.querySelector('#eps .rail button');
  stageBtn.click();
  ok(d.querySelector('#eps .rail button').getAttribute('aria-pressed') === 'true', 'stage button toggles on');
  d.querySelector('#eps .rail button').click();
  ok(d.querySelector('#eps .rail button').getAttribute('aria-pressed') === 'false', 'stage button toggles off');

  // clause 2/3/4 wiring points to real task ids
  ok(ids.indexOf('w1b') >= 0 && ids.indexOf('w1c') >= 0 && ids.indexOf('w4d') >= 0, 'pipeline clause ids exist');
  ok(ids.indexOf('w2a') >= 0 && ids.indexOf('w2b') >= 0, 'domain clause ids exist');
  ok(ids.indexOf('w14c') >= 0, 'BOM clause id exists');

  // currentWeek boundaries
  ok(api.currentWeek(new Date('2026-08-15T12:00:00')) === -1, 'before the block: no current week');
  ok(api.currentWeek(new Date('2026-09-02T18:00:00')) === 0, 'on Sep 2 the current week is week 1');
  ok(api.currentWeek(new Date('2026-09-08T23:00:00')) === 0, 'Sep 8 is still week 1');
  ok(api.currentWeek(new Date('2026-09-09T00:01:00')) === 1, 'Sep 9 rolls to week 2');
  ok(api.currentWeek(new Date('2026-11-27T12:00:00')) === 12, 'Thanksgiving Friday sits in the buffer week');
  ok(api.currentWeek(new Date('2027-03-01T12:00:00')) === 13, 'after the block: clamps to the last week');

  // tabs
  api.showTab('eps');
  ok(d.getElementById('s-eps').hasAttribute('hidden') === false, 'episodes panel shows');
  ok(d.getElementById('s-plan').hasAttribute('hidden') === true, 'plan panel hides');
  ok(d.getElementById('t-eps').getAttribute('aria-selected') === 'true', 'tab aria-selected tracks');
  d.getElementById('t-ref').click();
  ok(d.getElementById('s-ref').hasAttribute('hidden') === false, 'rules tab opens by click');
  d.getElementById('t-plan').click();

  // week header keyboard toggle
  const head = d.querySelector('#weeks .week .head');
  const before = d.querySelector('#weeks .week').className.indexOf('open') >= 0;
  const ev = new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
  head.dispatchEvent(ev);
  const after = d.querySelector('#weeks .week').className.indexOf('open') >= 0;
  ok(before !== after, 'Enter on a week header toggles it');

  // notes persist to state
  const ta = d.querySelector('#logs textarea');
  ta.value = 'shipped the deck template';
  ta.dispatchEvent(new w.Event('input'));
  ok(api.state.notes['1'] === 'shipped the deck template' || api.state.notes[1] === 'shipped the deck template', 'note lands in state');

  // export / import round trip
  api.state.ticks['w1a'] = true;
  d.getElementById('exp').click();
  const blob = d.getElementById('io').value;
  ok(blob.indexOf('w1a') > -1, 'export contains ticked task');
  api.state.ticks = {}; api.state.notes = {};
  d.getElementById('io').value = blob;
  d.getElementById('imp').click();
  ok(api.state.ticks['w1a'] === true, 'import restores ticks');

  // import failure path
  d.getElementById('io').value = 'not json {{{';
  d.getElementById('imp').click();
  ok(d.getElementById('toast').textContent.indexOf("isn't a valid") > -1, 'bad import is rejected with a message');
  ok(api.state.ticks['w1a'] === true, 'bad import leaves state untouched');

  // reset with confirm declined then accepted
  w.confirm = () => false;
  d.getElementById('reset').click();
  ok(api.state.ticks['w1a'] === true, 'declining the confirm keeps data');
  w.confirm = () => true;
  d.getElementById('reset').click();
  ok(Object.keys(api.state.ticks).length === 0, 'accepting the confirm clears data');

  // persistence across reload
  const store = memStore();
  let w2 = bootWith(store);
  await settle(w2);
  w2.__claw.state.ticks['w2a'] = true;
  w2.document.getElementById('chk-w2b').checked = true;
  w2.document.getElementById('chk-w2b').dispatchEvent(new w2.Event('change'));
  ok(Object.keys(store._raw).some(k => k.indexOf('claw.fallblock') === 0), 'state written to storage');
  const w3 = bootWith(store);
  await settle(w3);
  ok(w3.__claw.state.ticks['w2b'] === true, 'ticks survive a reload');
  ok(w3.document.getElementById('chk-w2b').checked === true, 'reloaded tick renders checked');
  ok(w3.document.getElementById('banner').className !== 'show', 'no storage banner when storage works');

  console.log('--- storage failure path ---');
  const hostile = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); }
  };
  const w4 = bootWith(hostile);
  await settle(w4);
  ok(!!w4.__claw, 'app still boots when storage throws');
  ok(w4.document.querySelectorAll('#weeks .week').length === 14, 'weeks still render without storage');
  ok(w4.document.getElementById('banner').className === 'show', 'degradation banner is shown');
  ok(w4.document.getElementById('storagestate').textContent.indexOf('off') > -1, 'data tab reports storage off');
  const chk = w4.document.getElementById('chk-w1a');
  chk.checked = true;
  chk.dispatchEvent(new w4.Event('change'));
  ok(w4.__claw.allTotals().done === 1, 'ticking still works in memory with storage dead');

  // corrupt stored payload
  const corrupt = memStore();
  corrupt.setItem('claw.fallblock.v1', '{ this is not json');
  const w5 = bootWith(corrupt);
  await settle(w5);
  ok(!!w5.__claw, 'app boots past a corrupt saved payload');
  ok(w5.document.querySelectorAll('#weeks .week').length === 14, 'renders past corrupt payload');
  ok(w5.document.getElementById('banner').className !== 'show', 'corrupt payload does not disable saving');

  // wrong-shape payload
  const weird = memStore();
  weird.setItem('claw.fallblock.v1', '"just a string"');
  const w6 = bootWith(weird);
  await settle(w6);
  ok(w6.__claw.allTotals().done === 0, 'wrong-shape payload ignored, not crashed');

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
