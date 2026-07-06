// smoke11 — ecology E1 (S1-D020/D037): fire mortal lifecycle R4, startle/flee/
// return R2, comfort-radius warming R1, shelter rest R3, the E2 hard gate, and
// the E1 invariant (e1.destructions === 0 in every scenario — nothing the
// player planted is ever destroyed; lifecycle completion is burnouts, not
// destruction). Served over HTTP (smoke7 pattern) with a fixture pack whose
// ecology block is retimed to seconds — all tuning is pack data, so the test
// retunes the world without touching the engine. Deterministic scenarios come
// from seeded v2 save payloads + ?seed=; every gesture is a REAL dispatched
// pointer event (lockGlyph); reading exposed state is allowed, invoking
// handlers is not.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { TARGET_FILE, launch, boot, lockGlyph, M, sleep } = require('./helpers');

const ROOT = '/home/zni/projects/inkblade';
const PORT = 8078;
const BASE = `http://127.0.0.1:${PORT}/${TARGET_FILE}`;
const PACK = '/tests/fixtures/eco.json';
const WORLD_KEY = 'inkblade_world_v1';

// fast-clock ecology: same shape as the shipped block, seconds not minutes.
// warmDist (0.15) sits outside the flared danger radius (0.08 × 1.6 = 0.128)
// so a loitering warm walker never startles — mirroring the shipped ratios.
const ECO = {
  comfortR: 0.30, dangerR: 0.08, warmDist: 0.15, fleeDist: 0.20,
  shelterR: 0.10, walkSpeed: 0.06, fleeSpeedMult: 3,
  restChancePerSec: 0.9, restMs: 1200, restCooldownMs: 3000,
  fire: { fuelMs: 2500, emberMs: 1200, smokeMs: 1200, flareEveryMs: [500, 900],
          flareMs: 300, flareBoost: 1.6, heatPhases: ['burning', 'embers'] },
  ashDecayMs: 3000,
};

function makeFixtures() {
  const core = JSON.parse(fs.readFileSync(path.join(ROOT, 'packs/core.json'), 'utf8'));
  const dir = path.join(ROOT, 'tests/fixtures');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'eco.json'), JSON.stringify({ ...core, ecology: ECO }));
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

// element factories for seeded v2 payloads (cls matches the pack kinds block)
const fire = (x, y, fuel, life) => ({ k: 'fire', x, y, s: 1, seed: 7, cls: 'event',
  life: life || { phase: 'burning', fuel, t: 0, wall: Date.now() } });
const walker = (x, y) => ({ k: 'walker', x, y, s: 1, seed: 8, cls: 'agent' });
const tree = (x, y) => ({ k: 'tree', x, y, s: 1, seed: 9, cls: 'structure' });

// Write a v2 payload into the origin's localStorage from a blank same-origin
// page, so the game boots into an exact world (deterministic scenarios).
async function seedWorld(p, els) {
  await p.goto(`http://127.0.0.1:${PORT}/tests/fixtures/blank.html`);
  await p.evaluate((key, payload) => localStorage.setItem(key, payload),
    WORLD_KEY, JSON.stringify({ version: 2, els }));
}
const els = p => p.evaluate(() => state.world.els.map(e => ({
  k: e.k, x: +e.x.toFixed(4), life: e.life ? { phase: e.life.phase, fuel: e.life.fuel } : null,
  mode: e.beh ? e.beh.mode : null,
})));
async function pollUntil(p, fn, ms, every = 250) {
  const t0 = Date.now();
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() - t0 > ms) return null;
    await sleep(every);
  }
}

(async () => {
  makeFixtures();
  await new Promise(r => server.listen(PORT, r));
  const browser = await launch();
  const errors = [];
  const finals = []; // e1 metrics at the end of every scenario, for T7

  // T1: the E2 gate is a regression surface in both directions. Flipped
  // default-ON at M2a-b3 (S1-D056, the smoke6 alias-sunset pattern), with
  // ?e2=0 the kill switch. This pack carries NO ignition data, so every E1
  // scenario below is byte-identical either way — data-gating is the fence.
  let p = await boot(browser, `${BASE}?pack=${PACK}&reset=1&seed=1`, errors, { begin: false, ignoreNetErrors: true });
  const flags = await p.evaluate(() => window.__S1_FLAGS);
  await p.close();
  p = await boot(browser, `${BASE}?pack=${PACK}&reset=1&seed=1&e2=0`, errors, { begin: false, ignoreNetErrors: true });
  const flagsKill = await p.evaluate(() => window.__S1_FLAGS);
  console.log('T1 flags:', JSON.stringify(flags), 'kill switch:', JSON.stringify(flagsKill));
  if (flags.e2 !== true) throw new Error('T1 FAIL: E2 must default ON after the S1-D056 flip');
  if (flagsKill.e2 !== false) throw new Error('T1 FAIL: ?e2=0 kill switch must force the gate off');
  await p.close();

  // T2: a REAL 火 lock plants a burning fire that lives its whole life —
  // burning → embers → smoke → ash → gone — and heals from the scroll.
  p = await boot(browser, `${BASE}?pack=${PACK}&char=火&seed=5&reset=1`, errors, { ignoreNetErrors: true });
  await lockGlyph(p);
  const lit = await pollUntil(p, async () => {
    const w = await els(p);
    return w.find(e => e.k === 'fire' && e.life && e.life.phase === 'burning') || null;
  }, 6000);
  if (!lit) throw new Error('T2 FAIL: locking 火 did not plant a burning fire');
  console.log('T2 fire lit, fuel:', Math.round(lit.life.fuel));
  const seen = new Set(['burning']);
  const healed = await pollUntil(p, async () => {
    const w = await els(p);
    const f = w.find(e => e.k === 'fire');
    if (!f) return true;
    if (f.life) seen.add(f.life.phase);
    return null;
  }, 20000, 200);
  console.log('T2 phases seen:', [...seen].join('>'), '— healed:', !!healed);
  for (const ph of ['burning', 'embers', 'smoke', 'ash'])
    if (!seen.has(ph)) throw new Error('T2 FAIL: lifecycle skipped phase ' + ph);
  if (!healed) throw new Error('T2 FAIL: ash never decayed — the scroll must heal');
  let m = await M(p);
  if (m.e1.burnouts !== 1) throw new Error('T2 FAIL: burnouts=' + m.e1.burnouts + ' (want 1)');
  finals.push(m.e1);
  await p.close();

  // T3: R2 startle/flee/return + the E2 gate in vivo — a walker inside the
  // danger radius flees away, and comes home after the fire dies; the tree
  // sitting beside the fire for its ENTIRE lifetime is untouched (E2 off).
  p = await browser.newPage();
  p.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  await seedWorld(p, [walker(0.5, 0.75), fire(0.56, 0.75, 1500), tree(0.60, 0.75)]);
  await p.goto(`${BASE}?pack=${PACK}&seed=9`);
  await sleep(1500);
  let w = await els(p);
  let wk = w.find(e => e.k === 'walker');
  m = await M(p);
  console.log('T3 after 1.5s: walker x=', wk.x, 'mode=', wk.mode, 'startles=', m.e1.startles);
  if (m.e1.startles < 1) throw new Error('T3 FAIL: walker inside dangerR did not startle');
  if (!(wk.x < 0.45)) throw new Error('T3 FAIL: walker did not flee away (x=' + wk.x + ')');
  const home = await pollUntil(p, async () => {
    const ww = (await els(p)).find(e => e.k === 'walker');
    return ww && Math.abs(ww.x - 0.5) < 0.005 && ww.mode === 'wander' ? ww : null;
  }, 12000);
  if (!home) throw new Error('T3 FAIL: walker never returned home after the fire died');
  console.log('T3 walker returned home: x=', home.x);
  const goneT3 = await pollUntil(p, async () =>
    (await els(p)).some(e => e.k === 'fire') ? null : true, 12000);
  if (!goneT3) throw new Error('T3 FAIL: fire lifecycle stalled');
  w = await els(p);
  if (!w.some(e => e.k === 'tree')) throw new Error('T3 FAIL: E1 invariant broken — tree destroyed');
  m = await M(p);
  console.log('T3 tree survived full fire lifetime; e1:', JSON.stringify(m.e1));
  finals.push(m.e1);
  await p.close();

  // T4: R1 warming — a walker in the comfort ring drifts to warmDist and
  // loiters there, warm but never startled.
  p = await browser.newPage();
  p.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  await seedWorld(p, [walker(0.30, 0.75), fire(0.55, 0.75, 60000)]);
  await p.goto(`${BASE}?pack=${PACK}&seed=11`);
  const warmX = 0.55 - ECO.warmDist;
  const warm = await pollUntil(p, async () => {
    const ww = (await els(p)).find(e => e.k === 'walker');
    return ww && Math.abs(ww.x - warmX) < 0.01 ? ww : null;
  }, 8000);
  if (!warm) throw new Error('T4 FAIL: walker never drifted to warmDist');
  await sleep(1500); // loiter — including through flares
  w = await els(p);
  wk = w.find(e => e.k === 'walker');
  m = await M(p);
  console.log('T4 warm loiter: x=', wk.x, 'warmings=', m.e1.warmings, 'startles=', m.e1.startles);
  if (Math.abs(wk.x - warmX) > 0.01) throw new Error('T4 FAIL: walker did not loiter at warmDist');
  if (m.e1.warmings < 1) throw new Error('T4 FAIL: warming episode not counted');
  if (m.e1.startles !== 0) throw new Error('T4 FAIL: warm walker startled outside dangerR');
  finals.push(m.e1);
  await p.close();

  // T5: R3 rest — a sheltered walker takes a rest beat.
  p = await browser.newPage();
  p.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  await seedWorld(p, [walker(0.5, 0.75), tree(0.55, 0.75)]);
  await p.goto(`${BASE}?pack=${PACK}&seed=13`);
  const rested = await pollUntil(p, async () => (await M(p)).e1.rests >= 1 ? true : null, 8000);
  if (!rested) throw new Error('T5 FAIL: sheltered walker never rested');
  m = await M(p);
  console.log('T5 rests:', m.e1.rests);
  finals.push(m.e1);
  await p.close();

  // T6: Q12 — a mid-burn save checkpoints remaining fuel (flare-time save)
  // and a reload restores it; the fire resumes, not restarts.
  p = await browser.newPage();
  p.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  await seedWorld(p, [fire(0.5, 0.72, 60000)]);
  await p.goto(`${BASE}?pack=${PACK}&seed=17`);
  await sleep(2500); // ≥2 flares at [500,900]ms cadence
  const savedRaw = await p.evaluate(k => localStorage.getItem(k), WORLD_KEY);
  const savedLife = JSON.parse(savedRaw).els.find(e => e.k === 'fire').life;
  console.log('T6 checkpointed fuel:', Math.round(savedLife.fuel), 'phase:', savedLife.phase);
  if (!(savedLife.phase === 'burning' && savedLife.fuel < 60000 && savedLife.fuel > 40000))
    throw new Error('T6 FAIL: mid-burn checkpoint did not persist remaining fuel');
  await p.goto(`${BASE}?pack=${PACK}&seed=17`); // reload, no reset
  await sleep(600);
  w = await els(p);
  const back = w.find(e => e.k === 'fire');
  console.log('T6 restored fuel:', back && back.life && Math.round(back.life.fuel));
  if (!back || !back.life || back.life.phase !== 'burning')
    throw new Error('T6 FAIL: mid-burn fire not restored burning');
  if (!(back.life.fuel <= savedLife.fuel && back.life.fuel > savedLife.fuel - 2500))
    throw new Error('T6 FAIL: restored fuel ' + back.life.fuel + ' does not resume from ' + savedLife.fuel);
  m = await M(p); finals.push(m.e1);
  await p.close();

  // T6b: cross-session ash decay — stale ash (wall clock elapsed past
  // ashDecayMs) heals at load; fresh ash survives. Healing is not destruction.
  p = await browser.newPage();
  p.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  await seedWorld(p, [
    fire(0.3, 0.72, 0, { phase: 'ash', fuel: 0, t: 0, wall: Date.now() - 10000 }),
    fire(0.7, 0.72, 0, { phase: 'ash', fuel: 0, t: 0, wall: Date.now() }),
  ]);
  await p.goto(`${BASE}?pack=${PACK}&seed=19`);
  await sleep(500);
  w = await els(p);
  const ashes = w.filter(e => e.k === 'fire');
  console.log('T6b ash after load:', ashes.length, ashes.map(e => e.x).join(','));
  if (ashes.length !== 1 || Math.abs(ashes[0].x - 0.7) > 0.001)
    throw new Error('T6b FAIL: stale ash must heal at load, fresh ash must survive');
  m = await M(p); finals.push(m.e1);
  await p.close();

  // T7: the E1 invariant, everywhere — zero destruction events in every
  // scenario above (burnouts are lifecycle, never destruction).
  console.log('T7 destructions per scenario:', finals.map(f => f.destructions).join(','));
  if (finals.some(f => f.destructions !== 0))
    throw new Error('T7 FAIL: e1.destructions must be 0 in every scenario');

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL ECOLOGY TESTS PASS — zero console errors');
  await browser.close();
  server.close();
})().catch(e => { console.error(e.message); server.close(); process.exit(1); });
