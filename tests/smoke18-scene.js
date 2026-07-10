// smoke18 — scene depth + roster ledger (S1-D061, M2c chunk B: John's
// checkpoint-1 verdict S1-D059(2)(4)). Three claims under test: (1) the
// perspective projection contract — ground elements' screen x converges
// toward the vanishing center with distance, near stays ~uncompressed,
// sky/horizon exempt, and el.x itself is never touched (render-only);
// (2) the roster ledger stays legible at ANY roster size — 500 chars get
// the same ≥28px windowed tiles as 23, with a locked/total counter
// (the old all-in-one-row strip shrank to ~2px cells, the exact "too
// small to see" John hit); (3) scene furniture (sky/ground washes,
// foreshortened grain) is tinted silk, not ink — it never trips the ink
// probes other suites count with. HTTP-served (?pack= needs a server).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { TARGET_FILE, launch, boot, M, sleep } = require('./helpers');

const ROOT = '/home/zni/projects/inkblade';
const PORT = 8090;
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

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await launch();
  const errors = [];

  // T1: the projection contract. Far converges toward the center, near is
  // ~uncompressed, the sky and the horizon reference line are exempt.
  let p = await boot(browser, `${BASE}?reset=1&seed=1`, errors, { begin: false, ignoreNetErrors: true });
  const proj = await p.evaluate(() => ({
    farL: worldScreenX({ k: 'tree', x: 0.10, y: 0.56 }),
    farR: worldScreenX({ k: 'tree', x: 0.90, y: 0.56 }),
    nearL: worldScreenX({ k: 'tree', x: 0.10, y: 0.96 }),
    center: worldScreenX({ k: 'tree', x: 0.50, y: 0.56 }),
    horizon: worldScreenX({ k: 'horizon', x: 0.10, y: 0.76 }),
    sun: worldScreenX({ k: 'sun', x: 0.10, y: 0.12 }),
    kFar: depthK({ k: 'tree', y: 0.56 }), kNear: depthK({ k: 'tree', y: 0.96 }),
  }));
  console.log('T1 projection:', JSON.stringify(proj));
  if (!(proj.farL > 0.10 && proj.farR < 0.90)) throw new Error('T1 FAIL: far x must converge toward the center');
  if (Math.abs(proj.nearL - 0.10) > 1e-9) throw new Error('T1 FAIL: near x must be uncompressed');
  if (Math.abs(proj.center - 0.5) > 1e-9) throw new Error('T1 FAIL: the vanishing center must not move');
  if (proj.horizon !== 0.10 || proj.sun !== 0.10) throw new Error('T1 FAIL: horizon/sky must be projection-exempt');
  if (!(proj.kFar < 1 && proj.kNear > 1 && proj.kNear / proj.kFar > 3))
    throw new Error('T1 FAIL: depth scale contrast must be strong (got ' + (proj.kNear / proj.kFar).toFixed(2) + 'x)');
  await p.close();

  // T2: convergence is render-only — after a real lock plants an element,
  // its persisted el.x is world-space (the same seed's draw regardless of
  // projection), untouched by the screen transform.
  p = await boot(browser, `${BASE}?pack=/packs/core.json&char=${encodeURIComponent('木')}&reset=1&seed=21`, errors, { ignoreNetErrors: true });
  const { lockGlyph } = require('./helpers');
  await lockGlyph(p);
  await sleep(3400);
  const m1 = await M(p);
  if (m1.locks !== 1) throw new Error('T2: 木 lock failed');
  const tree = await p.evaluate(() => {
    const t = state.world.els.find(e => e.k === 'tree');
    return { x: t.x, y: t.y, sx: worldScreenX(t) };
  });
  console.log('T2 planted tree:', JSON.stringify(tree));
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('inkblade_world_v1')).els.find(e => e.k === 'tree').x);
  if (Math.abs(saved - tree.x) > 1e-9) throw new Error('T2 FAIL: persisted x must be world-space, not screen-space');
  if (tree.x !== tree.sx && Math.abs(tree.sx - 0.5) > Math.abs(tree.x - 0.5))
    throw new Error('T2 FAIL: screen x may only move toward the center, never away');
  await p.close();

  // T3: the roster ledger at 500+ chars — tiles stay legible (≥28px), the
  // window is a handful of cells, and the counter knows the real total.
  p = await boot(browser, `${BASE}?pack=/packs/core.json,/packs/basic.json&reset=1&seed=3`, errors, { ignoreNetErrors: true });
  await sleep(400);
  const hud500 = await p.evaluate(() => window.__S1_HUD);
  console.log('T3 ledger @500:', JSON.stringify(hud500));
  if (!hud500) throw new Error('T3 FAIL: __S1_HUD missing');
  if (!(hud500.cellPx >= 28)) throw new Error('T3 FAIL: tiles must stay legible at 500 chars (got ' + hud500.cellPx + 'px)');
  if (!(hud500.win <= 13)) throw new Error('T3 FAIL: the ledger must window, not cram');
  if (hud500.total < 500) throw new Error('T3 FAIL: counter must know the merged roster total');
  await p.close();

  // T4: the same ledger at 23 chars — identical legibility, no special case.
  p = await boot(browser, `${BASE}?reset=1&seed=4`, errors, { begin: true, ignoreNetErrors: true });
  await sleep(400);
  const hud23 = await p.evaluate(() => window.__S1_HUD);
  console.log('T4 ledger @23:', JSON.stringify(hud23));
  if (!(hud23.cellPx >= 28 && hud23.total === 23)) throw new Error('T4 FAIL: core roster ledger broken');
  await p.close();

  // T5: furniture is not ink. On a bare world (no elements), the pixel
  // thresholds the other suites count with (smoke12 r<110, smoke13 tree
  // r<150) find ZERO pixels in the ground/sky zones — washes and grain stay
  // tinted silk. Boxes are clamped in-bounds (out-of-range getImageData
  // reads back transparent black, which would count as phantom ink) and
  // clear of the centered title text.
  p = await boot(browser, `${BASE}?reset=1&seed=5`, errors, { begin: false, ignoreNetErrors: true });
  await sleep(600);
  const counts = await p.evaluate(() => {
    const c = document.querySelector('canvas');
    const g = c.getContext('2d');
    const probe = (cx, cy, half) => {
      const x0 = Math.max(0, Math.min(c.width - half * 2, Math.round(cx * c.width - half)));
      const y0 = Math.max(0, Math.min(c.height - half * 2, Math.round(cy * c.height - half)));
      const d = g.getImageData(x0, y0, half * 2, half * 2).data;
      let ink = 0, tree = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] < 110 && d[i + 1] < 110) ink++;
        if (d[i] < 150 && d[i + 1] < 160 && d[i + 2] < 130) tree++;
      }
      return { ink, tree };
    };
    return {
      midGround: probe(0.12, 0.80, 60), nearGround: probe(0.5, 0.94, 35),
      farGround: probe(0.85, 0.60, 60), sky: probe(0.85, 0.30, 60),
    };
  });
  console.log('T5 furniture probes (must all be 0):', JSON.stringify(counts));
  for (const [zone, v] of Object.entries(counts))
    if (v.ink !== 0 || v.tree !== 0) throw new Error('T5 FAIL: scene furniture counts as ink in the ' + zone + ' zone: ' + JSON.stringify(v));
  await p.close();

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL SCENE TESTS PASS — zero console errors');
  await browser.close();
  server.close();
})().catch(e => { console.error(e.message); server.close(); process.exit(1); });
