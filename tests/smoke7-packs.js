// smoke7 — pack loading, validation, and the ?pack= override (S1-D024/D025)
// against inkblade-m1a.html served over HTTP (fetch of a sibling pack is
// CORS-blocked on file://, which is exactly why the default pack is embedded;
// ?pack= is the dev/test path and needs a server).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { TARGET_FILE, launch, boot, lockGlyph, M, sleep } = require('./helpers');

const ROOT = '/home/zni/projects/inkblade';
const PORT = 8077;
const BASE = `http://127.0.0.1:${PORT}/${TARGET_FILE}`;

// fixtures derived from the shipped pack — self-maintaining
function makeFixtures() {
  const core = JSON.parse(fs.readFileSync(path.join(ROOT, 'packs/core.json'), 'utf8'));
  const dir = path.join(ROOT, 'tests/fixtures');
  fs.mkdirSync(dir, { recursive: true });
  const yi = core.chars.find(c => c.ch === '一');
  const er = core.chars.find(c => c.ch === '二');
  fs.writeFileSync(path.join(dir, 'mini.json'), JSON.stringify({
    version: 2, meta: { id: 'mini', intro: ['一'] }, kinds: core.kinds, chars: [yi],
  }));
  fs.writeFileSync(path.join(dir, 'bad-version.json'), JSON.stringify({
    version: 99, meta: { id: 'future' }, kinds: core.kinds, chars: [yi],
  }));
  const corruptYi = JSON.parse(JSON.stringify(yi));
  corruptYi.strokes[0].pts[0] = [999, -40]; // deliberately corrupted stroke
  fs.writeFileSync(path.join(dir, 'corrupt.json'), JSON.stringify({
    version: 2, meta: { id: 'corrupt', intro: ['二'] }, kinds: core.kinds, chars: [corruptYi, er],
  }));
}

const MIME = { '.html': 'text/html', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  try {
    const data = fs.readFileSync(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'text/plain' });
    res.end(data);
  } catch (e) { res.writeHead(404); res.end('not found'); }
});

(async () => {
  makeFixtures();
  await new Promise(r => server.listen(PORT, r));
  const browser = await launch();
  const errors = [];
  const chars = p => p.evaluate(() => CHARS.map(c => c.ch).join(''));

  // T1: default embedded pack over http
  let p = await boot(browser, BASE + '?reset=1', errors, { begin: false, ignoreNetErrors: true });
  let cs = await chars(p);
  console.log('T1 default pack:', cs.length, 'chars');
  if (cs.length !== 23) throw new Error('T1 FAIL: embedded pack');
  await p.close();

  // T2: ?pack= override loads and PLAYS (lock 一 from the mini pack)
  p = await boot(browser, BASE + '?pack=/tests/fixtures/mini.json&reset=1', errors, { ignoreNetErrors: true });
  cs = await chars(p);
  console.log('T2 mini pack:', cs);
  if (cs !== '一') throw new Error('T2 FAIL: ?pack= override not adopted');
  await lockGlyph(p);
  await sleep(3400);
  const m = await M(p);
  if (m.locks !== 1) throw new Error('T2 FAIL: mini-pack char did not lock');
  await p.close();

  // T3: unknown pack version → clean rejection, embedded pack still runs
  p = await boot(browser, BASE + '?pack=/tests/fixtures/bad-version.json&reset=1', errors, { begin: false, ignoreNetErrors: true });
  cs = await chars(p);
  console.log('T3 future version fallback:', cs.length, 'chars');
  if (cs.length !== 23) throw new Error('T3 FAIL: version rejection must fall back to embedded');
  await p.close();

  // T4: corrupted stroke → char quarantined, valid chars still load
  p = await boot(browser, BASE + '?pack=/tests/fixtures/corrupt.json&reset=1', errors, { begin: false, ignoreNetErrors: true });
  cs = await chars(p);
  console.log('T4 corrupt quarantine:', cs);
  if (cs !== '二') throw new Error('T4 FAIL: validator must quarantine the corrupted char only');
  await p.close();

  // T5: unreachable pack URL → warn + embedded fallback
  p = await boot(browser, BASE + '?pack=/tests/fixtures/nope.json&reset=1', errors, { begin: false, ignoreNetErrors: true });
  cs = await chars(p);
  console.log('T5 missing pack fallback:', cs.length, 'chars');
  if (cs.length !== 23) throw new Error('T5 FAIL: missing pack must fall back to embedded');
  await p.close();

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL PACK TESTS PASS — zero console errors');
  await browser.close();
  server.close();
})().catch(e => { console.error(e.message); server.close(); process.exit(1); });
