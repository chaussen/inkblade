// smoke16 — placement is a dice roll, not an aim (S1-D059, supersedes
// S1-D052/S1-D053 amid OPEN-14's amendment). John's playtest ruling: release
// point is low priority; things should land at random and interactions
// should emerge from accidental proximity (collision), not from a targeted
// act. This suite is the gate-flip inversion of the old aim-tracking tests
// (smoke6 alias-sunset pattern): same scenarios, assertions now prove the
// OPPOSITE — the final stroke's exit point has NO influence on where a mark
// plants. HTTP-served (?pack= needs a server).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { TARGET_FILE, launch, boot, glyph, slashStrokes, M, sleep, W, H } = require('./helpers');

const ROOT = '/home/zni/projects/inkblade';
const PORT = 8085;
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

const core = JSON.parse(fs.readFileSync(path.join(ROOT, 'packs/core.json'), 'utf8'));
const basic = JSON.parse(fs.readFileSync(path.join(ROOT, 'packs/basic.json'), 'utf8'));

// Trace stroke i along its real polyline, then (optionally) carry the same
// gesture on to an exit point before lifting — proves the flick-through no
// longer does anything special.
async function slashStrokeTo(p, i, exit) {
  const g = await glyph(p);
  const pts = g.strokes[i].pts;
  await p.mouse.move(pts[0][0], pts[0][1]);
  await p.mouse.down();
  for (let j = 1; j < pts.length; j++) await p.mouse.move(pts[j][0], pts[j][1], { steps: 4 });
  if (exit) await p.mouse.move(exit[0], exit[1], { steps: 10 });
  await p.mouse.up();
}

async function lockFireWithExit(browser, errors, seed, exit) {
  const p = await boot(browser, `${BASE}?pack=/packs/core.json&char=${encodeURIComponent('火')}&reset=1&seed=${seed}`, errors, { ignoreNetErrors: true });
  await slashStrokes(p, [0, 1, 2]);
  await slashStrokeTo(p, 3, exit);
  await sleep(3400);
  const m = await M(p);
  if (m.locks !== 1) throw new Error('fire lock failed (locks=' + m.locks + ', deflects=' + m.deflects + ')');
  const out = await p.evaluate(() => ({
    fire: state.world.els.filter(e => e.k === 'fire').map(e => ({ x: e.x, y: e.y })),
  }));
  await p.close();
  return out;
}

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await launch();
  const errors = [];

  // T1: pack contract, inverted — the aim mechanic is gone; no pack carries
  // ecology.placement anymore
  for (const [name, pk] of [['core', core], ['basic', basic]]) {
    if (pk.ecology && pk.ecology.placement) throw new Error('T1 FAIL: ' + name + ' pack still carries ecology.placement (aim mechanic should be retired)');
  }
  console.log('T1 pack contract: no placement.pull in either pack (aim mechanic retired)');

  // T2/T3: same seed, same first three strokes, but the final stroke's exit
  // differs (natural lift vs flicked far into the corner) — the fire must
  // land in EXACTLY the same spot either way, because only the seeded rng
  // (not the gesture's endpoint) decides now
  const A = await lockFireWithExit(browser, errors, 21, null);
  console.log('T2 natural exit:', JSON.stringify(A));
  if (A.fire.length !== 1) throw new Error('T2 FAIL: expected one fire');

  const B = await lockFireWithExit(browser, errors, 21, [W * 0.95, H * 0.94]);
  console.log('T3 flicked-through exit:', JSON.stringify(B));
  if (B.fire.length !== 1) throw new Error('T3 FAIL: expected one fire');
  if (Math.abs(A.fire[0].x - B.fire[0].x) > 1e-9 || Math.abs(A.fire[0].y - B.fire[0].y) > 1e-9) {
    throw new Error('T3 FAIL: placement must be exit-independent — got ' + JSON.stringify(A.fire[0]) + ' vs ' + JSON.stringify(B.fire[0]));
  }

  // T4: a second, different seed must place differently — proving placement
  // is still genuinely random (seed-driven), not frozen to one fixed spot
  const C = await lockFireWithExit(browser, errors, 22, null);
  console.log('T4 different seed:', JSON.stringify(C));
  if (Math.abs(A.fire[0].x - C.fire[0].x) < 1e-9 && Math.abs(A.fire[0].y - C.fire[0].y) < 1e-9) {
    throw new Error('T4 FAIL: different seeds landed identically — placement looks frozen, not random');
  }

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL PLACEMENT TESTS PASS — zero console errors');
  await browser.close();
  server.close();
})().catch(e => { console.error(e.message); server.close(); process.exit(1); });
