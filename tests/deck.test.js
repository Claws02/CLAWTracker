const fs = require('fs');
const { JSDOM } = require('jsdom');
const HTML = fs.readFileSync(__dirname + '/../deck/ep1.html', 'utf8');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL: ' + m); } };

const dom = new JSDOM(HTML, { runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true });
const w = dom.window, d = w.document;

setTimeout(() => {
  const api = w.__deck;
  ok(!!api, 'deck hook exposed');

  // structure
  ok(api.SLIDES.length >= 20, 'at least 20 slides');
  ok(api.EPISODE.n === 1, 'episode 1 loaded');
  const clips = api.clipIds();
  ok(clips.length === 6, 'exactly six clips: ' + clips.join(','));
  ok(JSON.stringify(clips) === JSON.stringify(['C1','C2','C3','C4','C5','C6']), 'clips are C1..C6 in order');

  // every clip is a contiguous run — a short must cut on one boundary pair
  let contiguous = true;
  clips.forEach(c => {
    const r = api.clipRange(c);
    for (let j = r.first; j <= r.last; j++) if (api.SLIDES[j].clip !== c) contiguous = false;
  });
  ok(contiguous, 'each clip is a contiguous slide run');

  // clip length sanity: 2-4 slides each
  let lenOK = true;
  clips.forEach(c => { const r = api.clipRange(c); const n = r.last - r.first + 1; if (n < 2 || n > 4) lenOK = false; });
  ok(lenOK, 'every clip is 2-4 slides long');

  // every clip opens with a hook, and hooks are context-free (no backward reference)
  const banned = /\b(as we saw|earlier|that spec|the second one|as mentioned|like i said)\b/i;
  let hooks = true, clean = true;
  clips.forEach(c => {
    const r = api.clipRange(c);
    const s = api.SLIDES[r.first];
    if (!s.hook) hooks = false;
    if (s.hook && banned.test(s.hook)) clean = false;
  });
  ok(hooks, 'every clip opens with a hook line');
  ok(clean, 'no hook contains a backward reference');

  // every slide has a script
  ok(api.SLIDES.every(s => typeof s.script === 'string' && s.script.length > 20), 'every slide has a script');
  // every slide has a known kind
  const kinds = ['title','statement','three','beats','math','table','outro'];
  ok(api.SLIDES.every(s => kinds.indexOf(s.k) >= 0), 'every slide has a known kind');
  // first and last
  ok(api.SLIDES[0].k === 'title', 'opens on a title slide');
  ok(api.SLIDES[api.SLIDES.length - 1].k === 'outro', 'closes on the outro');
  // clip slides are the ones that get the vertical column
  ok(api.SLIDES.filter(s => s.clip).length >= 15, 'most slides belong to a clip');

  // fill accounting
  const n = api.countFills();
  ok(n > 0, 'fill tokens counted: ' + n);
  ok(d.getElementById('fills').textContent.indexOf(String(n)) === 0, 'bar reports the fill count');
  // no raw token leaks into rendered text
  ok(d.getElementById('stage').textContent.indexOf('[[fill]]') === -1, 'no raw [[fill]] token rendered');

  // rendering
  ok(d.querySelector('#slide h1.big') !== null, 'title slide renders a display heading');
  ok(d.getElementById('count').textContent === '1/' + api.SLIDES.length, 'counter starts at 1');

  // navigation
  api.go(1);
  ok(api.at() === 1, 'right advances');
  api.go(-1); api.go(-1);
  ok(api.at() === 0, 'clamped at the first slide');
  for (let j = 0; j < api.SLIDES.length + 5; j++) api.go(1);
  ok(api.at() === api.SLIDES.length - 1, 'clamped at the last slide');
  ok(d.getElementById('prog').style.width === '100%', 'progress bar full at the end');

  // keyboard
  const key = k => d.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true }));
  key('Home');
  ok(api.at() === 0, 'Home returns to slide one');
  key('ArrowRight');
  ok(api.at() === 1, 'ArrowRight advances');
  key('ArrowLeft');
  ok(api.at() === 0, 'ArrowLeft goes back');
  key(' ');
  ok(api.at() === 1, 'Space advances');
  key('End');
  ok(api.at() === api.SLIDES.length - 1, 'End jumps to the last slide');
  key('Home');

  // toggles via keyboard
  key('n');
  ok(d.body.className === 'notesopen', 'N opens the script pane');
  ok(d.getElementById('bNotes').getAttribute('aria-pressed') === 'true', 'script button reflects state');
  key('n');
  ok(d.body.className === '', 'N closes the script pane');
  key('v');
  ok(d.getElementById('stage').className === 'showsafe', 'V shows the 9:16 column');
  key('v');
  ok(d.getElementById('stage').className === '', 'V hides the 9:16 column');
  key('g');
  ok(d.getElementById('grid').className === 'open', 'G opens the grid');
  ok(d.querySelectorAll('#grid .gcell').length === api.SLIDES.length, 'grid shows every slide once');
  ok(d.querySelectorAll('#grid h4').length === 7, 'grid groups long-form plus six clips');
  // jump from grid
  const cells = d.querySelectorAll('#grid .gcell');
  cells[cells.length - 1].click();
  ok(d.getElementById('grid').className === '', 'clicking a grid cell closes the grid');
  key('Escape');
  key('g'); key('Escape');
  ok(d.getElementById('grid').className === '', 'Escape closes the grid');

  // clip slides render inside the safe column class
  api.go(-99);
  let found = -1;
  for (let j = 0; j < api.SLIDES.length; j++) if (api.SLIDES[j].clip) { found = j; break; }
  for (let j = 0; j < found; j++) api.go(1);
  ok(d.getElementById('slide').className.indexOf('col') > -1, 'clip slides render in the vertical safe column');
  ok(d.querySelector('#slide .eyebrow .tag').textContent === api.SLIDES[found].clip, 'clip tag shown on slide');

  // notes reflect clip boundaries
  api.setNotes(true);
  ok(d.getElementById('notehead').textContent.indexOf('slides') > -1, 'notes name the clip cut boundaries');
  ok(d.getElementById('hookline').textContent.indexOf('Hook:') === 0, 'hook shown for a clip opener');
  api.setNotes(false);

  // timer formatting
  ok(api.fmt(0) === '0:00' && api.fmt(65) === '1:05' && api.fmt(720) === '12:00', 'timer formats correctly');

  // table slide integrity
  const tbl = api.SLIDES.filter(s => s.k === 'table')[0];
  ok(!!tbl && tbl.rows.every(r => r.length === tbl.cols.length), 'verdict table rows match column count');
  ok(tbl.rows.length >= 4, 'verdict table covers at least four situations');

  // math slide
  const mt = api.SLIDES.filter(s => s.k === 'math')[0];
  ok(!!mt && mt.rows.length >= 3 && !!mt.out, 'math slide has rows and a result');

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
}, 40);
