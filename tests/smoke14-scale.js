// smoke14 — the basic tier at scale (S1-D047): 500 chars load with zero
// quarantine, chapter-pack merge dedupes first-wins, seeded random-sample
// characters lock end-to-end with REAL gestures, radical-assigned class
// families plant their world elements, intro is frequency-ordered, and the
// pack stays inside its size budget. HTTP-served (?pack= needs a server).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { TARGET_FILE, launch, boot, lockGlyph, M, sleep } = require('./helpers');

const ROOT = '/home/zni/projects/inkblade';
const PORT = 8083;
const BASE = `http://127.0.0.1:${PORT}/${TARGET_FILE}`;

const MIME = { '.html': 'text/html', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  try {
    const data = fs.readFileSync(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'text/plain' });
    res.end(data);
  } catch (e) { res.writeHead(404); res.end('not found'); }
});

const basic = JSON.parse(fs.readFileSync(path.join(ROOT, 'packs/basic.json'), 'utf8'));
const core = JSON.parse(fs.readFileSync(path.join(ROOT, 'packs/core.json'), 'utf8'));

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await launch();
  const errors = [];

  // T1: the basic tier loads whole — 500 chars, zero quarantined, intro in
  // frequency order, size budget held
  const bytes = fs.statSync(path.join(ROOT, 'packs/basic.json')).size;
  if (basic.chars.length !== 500) throw new Error('T1 FAIL: pack file must carry 500 chars');
  if (bytes > 400000) throw new Error('T1 FAIL: basic.json ' + bytes + 'B breaches the 400KB budget');
  let p = await boot(browser, `${BASE}?pack=/packs/basic.json&reset=1&seed=1`, errors, { begin: false, ignoreNetErrors: true });
  const t1 = await p.evaluate(() => ({
    n: CHARS.length, introHead: INTRO.slice(0, 5).join(''), packId: PACK.meta.id,
  }));
  console.log('T1 basic tier:', JSON.stringify(t1), bytes + 'B');
  if (t1.n !== 500) throw new Error('T1 FAIL: 500 chars must survive validation, got ' + t1.n);
  if (t1.introHead !== '的一是不了') throw new Error('T1 FAIL: intro must be frequency-ordered');
  await p.close();

  // T2: chapter merge — core,basic dedupes by ch first-wins (core's curated
  // 火 keeps its tier-1 mortal fire; basic-only chars append)
  const coreSet = new Set(core.chars.map(c => c.ch));
  const expected = core.chars.length + basic.chars.filter(c => !coreSet.has(c.ch)).length;
  p = await boot(browser, `${BASE}?pack=/packs/core.json,/packs/basic.json&reset=1&seed=1`, errors, { begin: false, ignoreNetErrors: true });
  const t2 = await p.evaluate(() => ({
    n: CHARS.length, id: PACK.meta.id,
    dupes: CHARS.length - new Set(CHARS.map(c => c.ch)).size,
    fire: CHARS.find(c => c.ch === '火').world,
    eco: !!ECOLOGY,
  }));
  console.log('T2 merge:', JSON.stringify(t2), 'expected n:', expected);
  if (t2.n !== expected) throw new Error('T2 FAIL: merged roster must be the union, got ' + t2.n);
  if (t2.dupes !== 0) throw new Error('T2 FAIL: merge must dedupe by ch');
  if (!t2.fire || t2.fire.tier !== 1 || t2.fire.kind !== 'fire')
    throw new Error('T2 FAIL: first pack must win the dedupe (curated 火 lost)');
  if (!t2.eco) throw new Error('T2 FAIL: ecology must survive the merge');
  await p.close();

  // T3: a bad chapter never poisons the good one
  p = await boot(browser, `${BASE}?pack=/packs/basic.json,/packs/nope.json&reset=1&seed=1`, errors, { begin: false, ignoreNetErrors: true });
  const t3n = await p.evaluate(() => CHARS.length);
  console.log('T3 resilient merge:', t3n);
  if (t3n !== 500) throw new Error('T3 FAIL: missing chapter must be skipped, not fatal');
  await p.close();

  // T4: seeded random sample locks end-to-end with real gestures — the
  // 500 are playable, not just loadable
  const rng = (s => () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648)(20260706);
  const sample = [];
  while (sample.length < 6) {
    const c = basic.chars[Math.floor(rng() * basic.chars.length)];
    if (!sample.includes(c)) sample.push(c);
  }
  for (const c of sample) {
    p = await boot(browser, `${BASE}?pack=/packs/basic.json&char=${encodeURIComponent(c.ch)}&reset=1&seed=2`, errors, { ignoreNetErrors: true });
    await lockGlyph(p);
    await sleep(3400);
    const m = await M(p);
    console.log('T4 lock', c.ch, '(' + c.strokes.length + ' strokes):', 'locks=' + m.locks, 'deflects=' + m.deflects);
    if (m.locks !== 1) throw new Error('T4 FAIL: ' + c.ch + ' did not lock (locks=' + m.locks + ')');
    await p.close();
  }

  // T5: class families plant — one auto char per family locks and its world
  // element appears; a world:null char plants a seal bearing its form
  const pick = cls => basic.chars.find(c => c.world && c.world.tier === 2 && c.world.class === cls);
  const nullCh = basic.chars.find(c => !c.world);
  const cases = [['flora', pick('flora')], ['terrain', pick('terrain')], ['figure', pick('figure')], ['seal', nullCh]];
  for (const [kind, c] of cases) {
    p = await boot(browser, `${BASE}?pack=/packs/basic.json&char=${encodeURIComponent(c.ch)}&reset=1&seed=3`, errors, { ignoreNetErrors: true });
    await lockGlyph(p);
    await sleep(3400);
    const w = await p.evaluate(() => state.world.els.map(e => ({ k: e.k, ch: e.ch, form: e.p && e.p.form })));
    console.log('T5', kind, c.ch, '→', JSON.stringify(w));
    if (!w.some(e => e.k === kind)) throw new Error('T5 FAIL: ' + c.ch + ' must plant a ' + kind);
    if (kind === 'seal' && !w.some(e => e.ch === c.ch)) throw new Error('T5 FAIL: the seal must bear its char');
    await p.close();
  }

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL SCALE TESTS PASS — zero console errors');
  await browser.close();
  server.close();
})().catch(e => { console.error(e.message); server.close(); process.exit(1); });
