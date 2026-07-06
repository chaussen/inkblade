// smoke17 — ecology E2: ignition + regrowth (S1-D049c/d, S1-D054), still
// behind the gate (?e2=1 is the pre-flip playtest switch; the default stays
// off and T1 asserts it). The covenant under test: ignition TRANSFORMS,
// never destroys — a kindled element keeps its kind and seed, walks the fire
// clocks into ash, and regrows into ITSELF; e1.destructions stays 0 in every
// scenario; only player-planted live heat ignites (the lifeless sun never
// does) and chains stop at one hop. Fast-clock fixture pack (smoke11
// pattern): all tuning is pack data, the engine knows tags.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { TARGET_FILE, launch, M, sleep } = require('./helpers');

const ROOT = '/home/zni/projects/inkblade';
const PORT = 8087;
const BASE = `http://127.0.0.1:${PORT}/${TARGET_FILE}`;
const PACK = '/tests/fixtures/eco-ign.json';
const WORLD_KEY = 'inkblade_world_v1';

// smoke11's fast clocks + the E2 blocks: flame kindles in 0.8s within 0.08,
// embers kindle slower (1.5s) and closer (0.05) — the S1-D049d shape.
const ECO = {
  comfortR: 0.30, dangerR: 0.08, warmDist: 0.15, fleeDist: 0.20,
  shelterR: 0.10, walkSpeed: 0.06, fleeSpeedMult: 3,
  restChancePerSec: 0.9, restMs: 1200, restCooldownMs: 3000,
  fire: { fuelMs: 2500, emberMs: 2500, smokeMs: 1200, flareEveryMs: [500, 900],
          flareMs: 300, flareBoost: 1.6, heatPhases: ['burning', 'embers'] },
  ashDecayMs: 3000,
  ignition: { flame: { r: 0.08, dwellMs: 800 }, ember: { r: 0.05, dwellMs: 1500 }, coolMs: 2000 },
  regrow: { ashMs: 1500, sproutMs: 1200, saplingMs: 1200 },
};

function makeFixtures() {
  const core = JSON.parse(fs.readFileSync(path.join(ROOT, 'packs/core.json'), 'utf8'));
  const dir = path.join(ROOT, 'tests/fixtures');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'eco-ign.json'), JSON.stringify({ ...core, ecology: ECO }));
  fs.writeFileSync(path.join(dir, 'blank.html'), '<title>seed</title>');
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

const fire = (x, y, fuel) => ({ k: 'fire', x, y, s: 1, seed: 7, cls: 'event',
  life: { phase: 'burning', fuel, t: 0, wall: Date.now() } });
const tree = (x, y, seed = 9) => ({ k: 'tree', x, y, s: 1, seed, cls: 'structure' });
const sun = (x, y) => ({ k: 'sun', x, y, s: 1, seed: 4, cls: 'structure' });

async function page(browser, errors) {
  const p = await browser.newPage();
  p.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  p.on('console', m => {
    if (m.type() !== 'error') return;
    if (/Failed to load resource/.test(m.text())) return; // favicon 404 noise
    errors.push('CONSOLE ' + m.text());
  });
  return p;
}
async function seedWorld(p, els) {
  await p.goto(`http://127.0.0.1:${PORT}/tests/fixtures/blank.html`);
  await p.evaluate((key, payload) => localStorage.setItem(key, payload),
    WORLD_KEY, JSON.stringify({ version: 2, els }));
}
const els = p => p.evaluate(() => state.world.els.map(e => ({
  k: e.k, x: +e.x.toFixed(4), seed: e.seed,
  life: e.life ? e.life.phase : null,
  burn: e.burn ? e.burn.phase : null,
})));
async function pollUntil(p, fn, ms, every = 150) {
  const t0 = Date.now();
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() - t0 > ms) return null;
    await sleep(every);
  }
}
const invariant = async (p, label) => {
  const m = await M(p);
  if (m.e1.destructions !== 0) throw new Error(label + ' FAIL: e1.destructions must stay 0');
  return m;
};

(async () => {
  makeFixtures();
  await new Promise(r => server.listen(PORT, r));
  const browser = await launch();
  const errors = [];

  // T1: the gate holds — no ?e2 param means default OFF: a tree parked inside
  // flame radius for many dwells never kindles; flags read false
  let p = await page(browser, errors);
  await seedWorld(p, [fire(0.56, 0.75, 2500), tree(0.60, 0.75)]);
  await p.goto(`${BASE}?pack=${PACK}&seed=17`);
  await sleep(2600);
  let w = await els(p);
  const flags = await p.evaluate(() => window.__S1_FLAGS);
  console.log('T1 gate off:', JSON.stringify({ e2: flags.e2, tree: w.find(e => e.k === 'tree') }));
  if (flags.e2 !== false) throw new Error('T1 FAIL: E2 must default off in b2');
  if (w.find(e => e.k === 'tree').burn) throw new Error('T1 FAIL: gated build must not ignite');
  let m = await invariant(p, 'T1');
  if (m.e2.ignitions !== 0) throw new Error('T1 FAIL: e2.ignitions must be 0 behind the gate');
  await p.close();

  // T2: ?e2=1 — flame ignition transforms: the tree gains a burn sub-state,
  // keeps its kind+seed, the roster loses nothing
  p = await page(browser, errors);
  await seedWorld(p, [fire(0.56, 0.75, 6000), tree(0.60, 0.75)]);
  await p.goto(`${BASE}?pack=${PACK}&seed=18&e2=1`);
  const lit = await pollUntil(p, async () => {
    const ww = await els(p);
    const t = ww.find(e => e.k === 'tree');
    return t && t.burn ? { t, n: ww.length } : null;
  }, 4000);
  console.log('T2 flame ignition:', JSON.stringify(lit));
  if (!lit) throw new Error('T2 FAIL: tree inside flame radius never kindled');
  if (lit.t.k !== 'tree' || lit.t.seed !== 9) throw new Error('T2 FAIL: transform must keep kind+seed');
  if (lit.n !== 2) throw new Error('T2 FAIL: ignition must not add or remove elements');
  m = await invariant(p, 'T2');
  if (m.e2.ignitions !== 1) throw new Error('T2 FAIL: e2.ignitions must count 1');

  // T3: the full walk on the same page — burning → embers → smoke → ash →
  // sprout → sapling → ITSELF (burn gone, same seed), e2.regrowths counts
  const seen = new Set();
  const regrown = await pollUntil(p, async () => {
    const t = (await els(p)).find(e => e.k === 'tree');
    if (t.burn) seen.add(t.burn);
    return seen.size >= 3 && !t.burn ? t : null;
  }, 16000);
  console.log('T3 regrowth:', JSON.stringify(regrown), 'phases seen:', [...seen].join('→'));
  if (!regrown) throw new Error('T3 FAIL: the burn walk never completed');
  if (regrown.seed !== 9) throw new Error('T3 FAIL: the SAME tree must return');
  if (!seen.has('ash') || !seen.has('sprout')) throw new Error('T3 FAIL: regrowth must pass through ash and sprout (saw ' + [...seen] + ')');
  m = await invariant(p, 'T3');
  if (m.e2.regrowths !== 1) throw new Error('T3 FAIL: e2.regrowths must count 1');
  await p.close();

  // T4: embers ignite too (S1-D049d) — a short-fuel fire spends its flame
  // phase far below the flame dwell, then its embers finish the kindling;
  // a second tree inside flame-r but OUTSIDE ember-r never catches
  p = await page(browser, errors);
  await seedWorld(p, [fire(0.50, 0.75, 300), tree(0.545, 0.75, 9), tree(0.565, 0.75, 11)]);
  await p.goto(`${BASE}?pack=${PACK}&seed=19&e2=1`);
  const emberLit = await pollUntil(p, async () => {
    const ww = await els(p);
    const near = ww.find(e => e.seed === 9);
    return near && near.burn ? { near, fire: ww.find(e => e.k === 'fire'), far: ww.find(e => e.seed === 11) } : null;
  }, 5000);
  console.log('T4 ember ignition:', JSON.stringify(emberLit));
  if (!emberLit) throw new Error('T4 FAIL: embers must be able to kindle (S1-D049d)');
  if (emberLit.fire.life !== 'embers') throw new Error('T4 FAIL: the kindle must land during the ember stage (fire was ' + emberLit.fire.life + ')');
  if (emberLit.far.burn) throw new Error('T4 FAIL: outside ember-r must not kindle from embers');
  await sleep(2500); // embers end at 2.8s; give the far tree every chance
  const far = (await els(p)).find(e => e.seed === 11);
  if (far.burn) throw new Error('T4 FAIL: per-stage radius breached — far tree kindled');
  await invariant(p, 'T4');
  await p.close();

  // T5: the sun never ignites (heat tag, no life — not a heat source), and a
  // burning tree never chains to its neighbor (one hop, S1-D049c)
  p = await page(browser, errors);
  await seedWorld(p, [sun(0.50, 0.12), tree(0.50, 0.75, 9)]);
  await p.goto(`${BASE}?pack=${PACK}&seed=20&e2=1`);
  await sleep(2600);
  w = await els(p);
  console.log('T5a sun adjacency:', JSON.stringify(w.find(e => e.k === 'tree')));
  if (w.find(e => e.k === 'tree').burn) throw new Error('T5 FAIL: the sun must never ignite');
  await p.close();
  p = await page(browser, errors);
  // A burns from the fire; B sits within flame-r OF A but outside the fire's
  // own radii — if B ever kindles, heat chained through burning matter
  await seedWorld(p, [fire(0.50, 0.75, 2500), tree(0.55, 0.75, 9), tree(0.60, 0.75, 11)]);
  await p.goto(`${BASE}?pack=${PACK}&seed=21&e2=1`);
  const aLit = await pollUntil(p, async () => {
    const ww = await els(p);
    return ww.find(e => e.seed === 9 && e.burn) ? true : null;
  }, 4000);
  if (!aLit) throw new Error('T5 FAIL: near tree never kindled');
  const chained = await pollUntil(p, async () => {
    const ww = await els(p);
    return ww.find(e => e.seed === 11 && e.burn) ? true : null;
  }, 9000); // A's entire burn+ember window passes in this budget
  console.log('T5b one hop: near burned, far chained =', !!chained);
  if (chained) throw new Error('T5 FAIL: fire must stop at one hop (no chaining, S1-D049c)');
  m = await invariant(p, 'T5');
  if (m.e2.ignitions !== 1) throw new Error('T5 FAIL: exactly one ignition (the near tree)');
  await p.close();

  // T6: mid-burn persistence — reload while burning; the burn walk resumes
  // from the checkpoint (fire's Q12 pattern) and still completes to regrowth
  p = await page(browser, errors);
  await seedWorld(p, [fire(0.56, 0.75, 6000), tree(0.60, 0.75, 9)]);
  await p.goto(`${BASE}?pack=${PACK}&seed=22&e2=1`);
  const preReload = await pollUntil(p, async () => {
    const t = (await els(p)).find(e => e.k === 'tree');
    return t && t.burn === 'burning' ? t : null;
  }, 4000);
  if (!preReload) throw new Error('T6 FAIL: tree never started burning');
  await sleep(400); // let a flare checkpoint write the burn state
  await p.goto(`${BASE}?pack=${PACK}&seed=22&e2=1`); // reload, no reset
  const resumed = await pollUntil(p, async () => {
    const t = (await els(p)).find(e => e.k === 'tree');
    return t && t.burn ? t : null;
  }, 2000);
  console.log('T6 reload mid-burn:', JSON.stringify(resumed));
  if (!resumed) throw new Error('T6 FAIL: burn state must survive a reload');
  const healed = await pollUntil(p, async () => {
    const t = (await els(p)).find(e => e.k === 'tree');
    return t && !t.burn ? t : null;
  }, 16000);
  if (!healed || healed.seed !== 9) throw new Error('T6 FAIL: reloaded burn must still complete to the same tree');
  await invariant(p, 'T6');
  await p.close();

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL IGNITION TESTS PASS — zero console errors');
  await browser.close();
  server.close();
})().catch(e => { console.error(e.message); server.close(); process.exit(1); });
