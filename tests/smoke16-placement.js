// smoke16 — placement choice (S1-D052, M2a half 1, resolves OPEN-14 per
// S1-D049b): the lock's final cutting slash ends somewhere, and that exit
// point pulls where the world-mark plants. A trail may trace the final
// stroke and continue past it — the flick-through is free expression, so
// "fire beside the dry grove" is an authored act. Pull weights are pack
// data (ecology.placement.pull): decisive for fire, subtle default,
// UNIQUE kinds exempt. HTTP-served (?pack= needs a server).
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
const FIRE_BAND = [0.60, 0.88]; // bandFor('fire') — mirrored constant, like the perf budget

// Trace stroke i along its real polyline, then (optionally) carry the same
// gesture on to an exit point before lifting — the placement flick-through.
async function slashStrokeTo(p, i, exit) {
  const g = await glyph(p);
  const pts = g.strokes[i].pts;
  await p.mouse.move(pts[0][0], pts[0][1]);
  await p.mouse.down();
  for (let j = 1; j < pts.length; j++) await p.mouse.move(pts[j][0], pts[j][1], { steps: 4 });
  if (exit) await p.mouse.move(exit[0], exit[1], { steps: 10 });
  await p.mouse.up();
}
// Expected anchor for a kind band given the recorded lockExit.
const anchorOf = (exitN, band) => [
  Math.max(0.08, Math.min(0.92, exitN.x)),
  band[0] + Math.max(0, Math.min(1, exitN.y)) * (band[1] - band[0]),
];

async function lockFireWithExit(browser, errors, seed, exit) {
  const p = await boot(browser, `${BASE}?pack=/packs/core.json&char=${encodeURIComponent('火')}&reset=1&seed=${seed}`, errors, { ignoreNetErrors: true });
  await slashStrokes(p, [0, 1, 2]);
  await slashStrokeTo(p, 3, exit);
  await sleep(3400);
  const m = await M(p);
  if (m.locks !== 1) throw new Error('fire lock failed (locks=' + m.locks + ', deflects=' + m.deflects + ')');
  const out = await p.evaluate(() => ({
    exit: state.lockExit,
    fire: state.world.els.filter(e => e.k === 'fire').map(e => ({ x: e.x, y: e.y })),
  }));
  await p.close();
  return out;
}

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await launch();
  const errors = [];

  // T1: pack contract — placement pull is data in BOTH packs, fire decisive,
  // default subtle (structures whisper, fire obeys)
  for (const [name, pk] of [['core', core], ['basic', basic]]) {
    const pull = pk.ecology && pk.ecology.placement && pk.ecology.placement.pull;
    if (!pull) throw new Error('T1 FAIL: ' + name + ' pack has no ecology.placement.pull');
    if (!(pull.fire >= 0.8)) throw new Error('T1 FAIL: fire pull must be decisive (' + pull.fire + ')');
    if (!(pull.default > 0 && pull.default < pull.fire)) throw new Error('T1 FAIL: default pull must be subtle vs fire');
  }
  console.log('T1 pack contract: pull =', JSON.stringify(core.ecology.placement.pull));

  // T2: natural exit — the trace lifts at the stroke's own end; the fire
  // plants near that anchor
  const A = await lockFireWithExit(browser, errors, 21, null);
  const aA = anchorOf(A.exit, FIRE_BAND);
  const dA = Math.hypot(A.fire[0].x - aA[0], A.fire[0].y - aA[1]);
  console.log('T2 natural exit:', JSON.stringify(A), 'anchor', aA.map(v => +v.toFixed(3)), 'dist', +dA.toFixed(3));
  if (A.fire.length !== 1) throw new Error('T2 FAIL: expected one fire');
  if (dA > 0.18) throw new Error('T2 FAIL: fire must plant near the exit anchor (dist ' + dA.toFixed(3) + ')');

  // T3: aimed exit — same seed, same strokes, but the final slash carries on
  // to the far lower-right; the fire follows the aim, not the dice
  const B = await lockFireWithExit(browser, errors, 21, [W * 0.95, H * 0.94]);
  const aB = anchorOf(B.exit, FIRE_BAND);
  const dB = Math.hypot(B.fire[0].x - aB[0], B.fire[0].y - aB[1]);
  console.log('T3 aimed exit:', JSON.stringify(B), 'anchor', aB.map(v => +v.toFixed(3)), 'dist', +dB.toFixed(3));
  if (dB > 0.18) throw new Error('T3 FAIL: fire must follow the aimed exit (dist ' + dB.toFixed(3) + ')');
  if (Math.abs(B.exit.x - A.exit.x) < 0.1) throw new Error('T3 FAIL: the two exits must actually differ');

  // T4: UNIQUE kinds are exempt — 一's horizon lands identically under the
  // same seed whether the heng stops short or flicks through to the edge
  const lockOne = async exit => {
    const p = await boot(browser, `${BASE}?pack=/packs/core.json&char=${encodeURIComponent('一')}&reset=1&seed=22`, errors, { ignoreNetErrors: true });
    await slashStrokeTo(p, 0, exit);
    await sleep(3400);
    const m = await M(p);
    if (m.locks !== 1) throw new Error('T4: 一 lock failed');
    const h = await p.evaluate(() => state.world.els.filter(e => e.k === 'horizon').map(e => [e.x, e.y])[0]);
    await p.close();
    return h;
  };
  const h1 = await lockOne(null);
  const h2 = await lockOne([W * 0.95, H * 0.5]);
  console.log('T4 horizon exempt:', JSON.stringify({ h1, h2 }));
  if (h1[0] !== h2[0] || h1[1] !== h2[1]) throw new Error('T4 FAIL: UNIQUE kind placement must ignore the exit anchor');

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL PLACEMENT TESTS PASS — zero console errors');
  await browser.close();
  server.close();
})().catch(e => { console.error(e.message); server.close(); process.exit(1); });
