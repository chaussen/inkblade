// smoke13 — the fire burns through (S1-D045, playtest S1-D044): live heat
// events stay visible under the writing veil (pixel evidence off the live
// canvas, writing vs bloom); the heat-aura cue drives shimmer/steam/hearth;
// pack fire clocks fit one sitting; E1 invariant throughout. HTTP + seeded
// v2 payloads (smoke11 pattern); every gesture is a REAL pointer event.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { TARGET_FILE, launch, boot, slash, slashStroke, M, sleep } = require('./helpers');

const ROOT = '/home/zni/projects/inkblade';
const PORT = 8082;
const BASE = `http://127.0.0.1:${PORT}/${TARGET_FILE}`;
const WORLD_KEY = 'inkblade_world_v1';

const MIME = { '.html': 'text/html', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  try {
    const data = fs.readFileSync(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'text/plain' });
    res.end(data);
  } catch (e) { res.writeHead(404); res.end('not found'); }
});

let seedN = 300;
const mk = (k, cls, x, y, extra = {}) => ({ k, x, y, s: 1, seed: seedN++, cls, ...extra });
const burning = (x, y, fuel) => mk('fire', 'event', x, y, { life: { phase: 'burning', fuel, t: 0, wall: Date.now() } });

async function rawPage(browser, errors) {
  const p = await browser.newPage();
  p.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  p.on('console', m => {
    if (m.type() !== 'error') return;
    if (/Failed to load resource/.test(m.text())) return;
    errors.push('CONSOLE ' + m.text());
  });
  return p;
}
async function seedWorld(p, els) {
  fs.mkdirSync(path.join(ROOT, 'tests/fixtures'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'tests/fixtures/blank.html'), '<title>seed</title>');
  await p.goto(`http://127.0.0.1:${PORT}/tests/fixtures/blank.html`);
  await p.evaluate((key, payload) => localStorage.setItem(key, payload),
    WORLD_KEY, JSON.stringify({ version: 2, els }));
}
// Count fire-colored pixels (warm orange/red, well away from paper tone).
const fireInk = (p, cx, cy, half) => p.evaluate((cx, cy, half) => {
  const c = document.querySelector('canvas');
  const d = c.getContext('2d').getImageData(
    Math.round(cx * c.width - half), Math.round(cy * c.height - half), half * 2, half * 2).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 4)
    if (d[i] > 150 && d[i] - d[i + 2] > 60 && d[i + 1] < d[i]) n++;
  return n;
}, cx, cy, half);
const treeInk = (p, cx, cy, half) => p.evaluate((cx, cy, half) => {
  const c = document.querySelector('canvas');
  const d = c.getContext('2d').getImageData(
    Math.round(cx * c.width - half), Math.round(cy * c.height - half), half * 2, half * 2).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 4)
    if (d[i] < 150 && d[i + 1] < 160 && d[i + 2] < 130) n++; // trunk/foliage vs paper
  return n;
}, cx, cy, half);

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await launch();
  const errors = [];

  // T1: pack contract — one sitting holds a full cycle; the aura and wet
  // tag exist (all interaction tuning is pack data)
  let p = await boot(browser, `${BASE}?reset=1&seed=1`, errors, { begin: false, ignoreNetErrors: true });
  const eco = await p.evaluate(() => ({
    fuel: ECOLOGY.fire.fuelMs, embers: ECOLOGY.fire.emberMs, smoke: ECOLOGY.fire.smokeMs,
    ash: ECOLOGY.ashDecayMs, aura: ECOLOGY.heatAuraR, wet: kindHasTag('water', 'wet'),
  }));
  console.log('T1 pack clocks:', JSON.stringify(eco));
  const cycle = eco.fuel + eco.embers + eco.smoke;
  if (!(cycle <= 180000)) throw new Error('T1 FAIL: burn cycle ' + cycle + 'ms will not fit one sitting');
  if (!(eco.aura > 0) || !eco.wet) throw new Error('T1 FAIL: heatAuraR/wet tag missing from pack');
  await p.close();

  // T2: the veil no longer stops the show — while WRITING (world receded to
  // 0.35) the fire keeps most of its ink; a tree dims with the world.
  p = await rawPage(browser, errors);
  await seedWorld(p, [burning(0.85, 0.84, 600000), mk('tree', 'structure', 0.12, 0.84)]);
  await p.goto(`${BASE}?char=%E4%B8%80&seed=3`);
  await sleep(400);
  await slash(p, 150, 520, 260, 520); // begin (real pointer events)
  await sleep(1600);                  // writing: recession settled
  let a = await p.evaluate(() => ({ ...window.__S1_ATTN }));
  if (a.mode !== 'writing' || Math.abs(a.worldAlpha - 0.35) > 0.03)
    throw new Error('T2 FAIL: expected settled writing recession, got ' + JSON.stringify(a));
  const fireWriting = await fireInk(p, 0.85, 0.82, 70);
  const treeWriting = await treeInk(p, 0.12, 0.82, 70);
  await slashStroke(p, 0); // lock 一 → bloom
  await sleep(1300);
  a = await p.evaluate(() => ({ ...window.__S1_ATTN }));
  if (a.worldAlpha < 0.97) throw new Error('T2 FAIL: expected bloom, got ' + JSON.stringify(a));
  const fireBloom = await fireInk(p, 0.85, 0.82, 70);
  const treeBloom = await treeInk(p, 0.12, 0.82, 70);
  console.log('T2 fire ink writing/bloom:', fireWriting, fireBloom, '— tree ink writing/bloom:', treeWriting, treeBloom);
  if (!(fireBloom > 30)) throw new Error('T2 FAIL: fire barely renders at all');
  // the playtest claim, inverted: while writing, the fire stays plainly
  // visible (hundreds of fire-colored px) while the receded tree drops to
  // ~nothing. Soft glow margins shrink with alpha, so compare presences,
  // not raw ratios.
  if (!(fireWriting > 150))
    throw new Error('T2 FAIL: fire must burn through the veil (writing ink ' + fireWriting + ')');
  if (!(treeWriting < treeBloom * 0.1))
    throw new Error('T2 FAIL: figure-ground must still recede the tree (writing ' + treeWriting + ' vs bloom ' + treeBloom + ')');
  await p.close();

  // T3: the hearth — heat aura stamps neighbors: tree shimmers (hot), water
  // steams, the warming walker stands calm; nothing is ever destroyed.
  p = await rawPage(browser, errors);
  await seedWorld(p, [
    burning(0.5, 0.75, 600000),
    mk('tree', 'structure', 0.55, 0.75),
    mk('water', 'structure', 0.45, 0.75),
    mk('walker', 'agent', 0.30, 0.75),
  ]);
  await p.goto(`${BASE}?seed=5`);
  await sleep(6500); // the walker drifts at shipped walkSpeed — let it reach the hearth
  const scene = await p.evaluate(() => ({
    hot: Object.fromEntries(state.world.els.map(e => [e.k, !!e.hot])),
    walker: (() => { const w = state.world.els.find(e => e.k === 'walker'); return { x: +w.x.toFixed(3), warmed: !!(w.beh && w.beh.warmed) }; })(),
    steam: state.worldParticles.some(pt => pt.color.includes('214,218,222')),
    sparks: state.worldParticles.some(pt => pt.hot),
    n: state.world.els.length,
  }));
  const m = await M(p);
  console.log('T3 scene:', JSON.stringify(scene), 'warmings:', m.e1.warmings);
  if (!scene.hot.tree || !scene.hot.water) throw new Error('T3 FAIL: heat aura must stamp adjacent tree/water hot');
  if (!scene.hot.walker) throw new Error('T3 FAIL: the warming walker must be inside the aura (hearth-calm pose)');
  if (scene.hot.fire) throw new Error('T3 FAIL: the fire itself is never "hot" (it is the source)');
  if (!scene.steam) throw new Error('T3 FAIL: wet + heat aura must raise steam');
  if (!scene.sparks) throw new Error('T3 FAIL: burning fire must shed sparks');
  if (m.e1.warmings < 1 || !scene.walker.warmed) throw new Error('T3 FAIL: walker never gathered to warm');
  if (scene.n !== 4) throw new Error('T3 FAIL: elements were lost — E1 invariant');
  if (m.e1.destructions !== 0) throw new Error('T3 FAIL: destructions must be 0');
  await p.close();

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL FIRE TESTS PASS — zero console errors');
  await browser.close();
  server.close();
})().catch(e => { console.error(e.message); server.close(); process.exit(1); });
