// smoke15 — the flat-撇 grace (S1-D049/S1-D050, amends S1-D032): pie carries
// a second real-form center at 180°, at derive AND match. The 8 top-frequency
// chars the gap dropped (看手系反笑爱委乎) are back in the basic tier and
// playable with REAL gestures; the grace is target-scoped — classifySlash
// keeps its nearest-center contract and heng targets still refuse a
// backwards (~170°) slash. HTTP-served (?pack= needs a server).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { TARGET_FILE, launch, boot, lockGlyph, slashThrough, M, sleep } = require('./helpers');

const ROOT = '/home/zni/projects/inkblade';
const PORT = 8084;
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

const EIGHT = [...'看手系反笑爱委乎'];
const basic = JSON.parse(fs.readFileSync(path.join(ROOT, 'packs/basic.json'), 'utf8'));

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await launch();
  const errors = [];

  // T1: pack data — all 8 restored chars emit, and each carries the flat-撇
  // that used to hard-drop it: a pie-verbed stroke whose endpoint angle sits
  // in the grace window (around 180°, outside the old 103–167° pie window)
  for (const ch of EIGHT) {
    const c = basic.chars.find(x => x.ch === ch);
    if (!c) throw new Error('T1 FAIL: ' + ch + ' missing from basic tier');
    const flat = c.strokes.some(s => {
      if (!/(^|>)pie($|>)/.test(s.verbs)) return false;
      const a = s.pts[0], b = s.pts[s.pts.length - 1];
      let deg = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
      let d = Math.abs(deg - 180); if (d > 180) d = 360 - d;
      return d <= 32;
    });
    if (!flat) throw new Error('T1 FAIL: ' + ch + ' has no flat-撇 pie stroke');
  }
  console.log('T1 pack data: all 8 restored chars carry a graced flat-撇');

  // T2: the ruling's whole payload is playable — every restored char locks
  // end-to-end with real gestures traced along its true geometry (the flat-撇
  // arrives at its honest ~170° angle), zero deflects
  for (const ch of EIGHT) {
    const p = await boot(browser, `${BASE}?pack=/packs/basic.json&char=${encodeURIComponent(ch)}&reset=1&seed=15`, errors, { ignoreNetErrors: true });
    await lockGlyph(p);
    await sleep(3400);
    const m = await M(p);
    const c = basic.chars.find(x => x.ch === ch);
    console.log('T2 lock', ch, '(' + c.strokes.length + ' strokes):', 'locks=' + m.locks, 'deflects=' + m.deflects);
    if (m.locks !== 1) throw new Error('T2 FAIL: ' + ch + ' did not lock (locks=' + m.locks + ')');
    if (m.deflects !== 0) throw new Error('T2 FAIL: ' + ch + ' deflected an honest trace (deflects=' + m.deflects + ')');
    await p.close();
  }

  // T3: the grace window matches explicitly — a fixed 170° slash through 手's
  // opening 平撇 gold-cuts it (not merely the traced polyline of T2)
  let p = await boot(browser, `${BASE}?pack=/packs/basic.json&char=${encodeURIComponent('手')}&reset=1&seed=15`, errors, { ignoreNetErrors: true });
  await slashThrough(p, 0, 170);
  await sleep(250);
  let m = await M(p);
  console.log('T3 explicit 170° on pie target:', 'goldCuts=' + m.goldCuts, 'deflects=' + m.deflects);
  if (m.goldCuts !== 1) throw new Error('T3 FAIL: 170° slash must cut the flat-撇 (goldCuts=' + m.goldCuts + ')');
  await p.close();

  // T4: the grace is pie-only — the same 170° slash along 一's heng target
  // still deflects (buckets stay directional; nothing leaked)
  p = await boot(browser, `${BASE}?pack=/packs/basic.json&char=${encodeURIComponent('一')}&reset=1&seed=15`, errors, { ignoreNetErrors: true });
  await slashThrough(p, 0, 170, 120);
  await sleep(250);
  m = await M(p);
  console.log('T4 backwards heng:', 'deflects=' + m.deflects, 'cuts=' + m.cuts);
  if (m.deflects !== 1 || m.cuts !== 0) throw new Error('T4 FAIL: 170° on a heng target must deflect (deflects=' + m.deflects + ', cuts=' + m.cuts + ')');
  await p.close();

  // T5: classifySlash keeps the S1-D032 nearest-center contract — the grace
  // lives in target matching only; a pure-left free slash still classifies null
  p = await boot(browser, `${BASE}?pack=/packs/basic.json&reset=1&seed=15`, errors, { ignoreNetErrors: true });
  const t5 = await p.evaluate(() => ({
    left: classifySlash(-100, 0, 100), flat: classifySlash(-98, 17, 100), pie: classifySlash(-70, 70, 99),
  }));
  console.log('T5 classifySlash contract:', JSON.stringify(t5));
  if (t5.left !== null || t5.flat !== null) throw new Error('T5 FAIL: classifySlash must stay nearest-center (grace must not leak into classification)');
  if (t5.pie !== 'pie') throw new Error('T5 FAIL: canonical pie classification regressed');
  await p.close();

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL FLAT-PIE TESTS PASS — zero console errors');
  await browser.close();
  server.close();
})().catch(e => { console.error(e.message); server.close(); process.exit(1); });
