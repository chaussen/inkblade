// smoke19 — chunk C batch 1: every character earns a face (S1-D066, M2d;
// John's S1-D059(3) symbol mandate under the S1-D063 children's-eyes law).
// Claims: (1) the batch chars carry their DESIGNED worlds in pack data —
// 大 finally differs from 山, and the new kinds ship with the tags that
// plug them into E1/E2 (living horse, shelter+flammable dwelling); (2) the
// seal population actually shrank (radical families convert at scale);
// (3) batch chars lock end-to-end with real gestures and plant the right
// matter, visibly; (4) the tags WORK — a walker rests by a dwelling (R3),
// and a dwelling kindles from adjacent fire and regrows into ITSELF
// (transformed ≠ destroyed). HTTP-served; fast-clock fixture for (4).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { TARGET_FILE, launch, boot, lockGlyph, M, sleep } = require('./helpers');

const ROOT = '/home/zni/projects/inkblade';
const PORT = 8096;
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

const core = JSON.parse(fs.readFileSync(path.join(ROOT, 'packs/core.json'), 'utf8'));
const basic = JSON.parse(fs.readFileSync(path.join(ROOT, 'packs/basic.json'), 'utf8'));

// fast-clock fixture (smoke11/17 pattern) — rest is eager, fire is quick
const ECO = {
  comfortR: 0.30, dangerR: 0.06, warmDist: 0.15, fleeDist: 0.20,
  shelterR: 0.12, walkSpeed: 0.06, fleeSpeedMult: 3,
  restChancePerSec: 0.95, restMs: 1500, restCooldownMs: 4000,
  fire: { fuelMs: 2500, emberMs: 2000, smokeMs: 1000, flareEveryMs: [500, 900],
          flareMs: 300, flareBoost: 1.6, heatPhases: ['burning', 'embers'] },
  ashDecayMs: 3000,
  ignition: { flame: { r: 0.10, dwellMs: 800 }, ember: { r: 0.05, dwellMs: 1500 }, coolMs: 2000 },
  regrow: { ashMs: 1500, sproutMs: 1200, saplingMs: 1200 },
};
function makeFixtures() {
  const dir = path.join(ROOT, 'tests/fixtures');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'eco-sym.json'), JSON.stringify({ ...core, ecology: ECO }));
  fs.writeFileSync(path.join(dir, 'blank.html'), '<title>seed</title>');
}
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
  await p.goto(`http://127.0.0.1:${PORT}/tests/fixtures/blank.html`);
  await p.evaluate((key, payload) => localStorage.setItem(key, payload),
    WORLD_KEY, JSON.stringify({ version: 2, els }));
}
const els = p => p.evaluate(() => state.world.els.map(e => ({
  k: e.k, x: +e.x.toFixed(3), seed: e.seed, p: e.p || null,
  burn: e.burn ? e.burn.phase : null, beh: e.beh ? e.beh.mode : null,
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

(async () => {
  makeFixtures();
  await new Promise(r => server.listen(PORT, r));
  const browser = await launch();
  const errors = [];

  // T1: the pack contract. Batch chars carry the designed worlds; the new
  // kinds ship with the interaction tags; 大 ≠ 山 at last; both packs know
  // every new kind.
  const world = ch => {
    const c = basic.chars.find(c => c.ch === ch) || core.chars.find(c => c.ch === ch);
    return c && c.world;
  };
  const want = {
    '大': ['kind', 'bigfig'], '门': ['kind', 'gate'], '马': ['kind', 'horse'],
    '心': ['kind', 'heart'], '风': ['kind', 'wind'], '电': ['kind', 'bolt'],
    '车': ['kind', 'cart'], '家': ['class', 'dwelling'], '天': ['class', 'skylight'],
    '花': ['class', 'flora'],
  };
  for (const [ch, [field, val]] of Object.entries(want)) {
    const w = world(ch);
    if (!w || w[field] !== val) throw new Error('T1 FAIL: ' + ch + ' world must be ' + field + '=' + val + ', got ' + JSON.stringify(w));
  }
  if (world('大').kind === world('山').kind) throw new Error('T1 FAIL: 大 and 山 still share a kind');
  if (world('花').params.form !== 'flower') throw new Error('T1 FAIL: 花 must bloom');
  for (const pk of [core, basic]) {
    for (const [k, spec] of [['horse', ['agent', 'living']], ['bigfig', ['agent', 'living']],
                             ['dwelling', ['structure', 'shelter']], ['banner', ['structure', 'flammable']]]) {
      const kd = pk.kinds[k];
      if (!kd || kd.cls !== spec[0] || !kd.tags.includes(spec[1]))
        throw new Error('T1 FAIL: kind ' + k + ' must be ' + spec.join('+') + ' in ' + pk.meta.id);
    }
    if (!pk.kinds.dwelling.tags.includes('flammable')) throw new Error('T1 FAIL: dwellings must burn (and regrow)');
  }
  console.log('T1 pack contract: batch worlds + tags in place, 大 ≠ 山');

  // T2: the seal population shrank — radical families convert at scale.
  const seals = basic.chars.filter(c => !c.world).length;
  console.log('T2 basic seals:', seals, '(pre-batch: 377)');
  if (!(seals <= 300)) throw new Error('T2 FAIL: seal population must drop to ≤300, got ' + seals);

  // T3: end-to-end — batch chars lock with real gestures and plant the
  // designed matter (visible in state; kinds differ from the old dupes).
  const plant = async (ch, packParam) => {
    const p = await boot(browser, `${BASE}${packParam}&char=${encodeURIComponent(ch)}&reset=1&seed=31`, errors, { ignoreNetErrors: true });
    await lockGlyph(p);
    await sleep(3400);
    const m = await M(p);
    if (m.locks !== 1) throw new Error('T3: ' + ch + ' lock failed (locks=' + m.locks + ', deflects=' + m.deflects + ')');
    const out = await els(p);
    await p.close();
    return out;
  };
  const big1 = await plant('大', '?pack=/packs/core.json');
  if (!big1.some(e => e.k === 'bigfig')) throw new Error('T3 FAIL: 大 must plant a bigfig, got ' + JSON.stringify(big1));
  const peak1 = await plant('山', '?pack=/packs/core.json');
  if (!peak1.some(e => e.k === 'peak')) throw new Error('T3 FAIL: 山 must still plant a peak');
  const horse1 = await plant('马', '?pack=/packs/basic.json');
  if (!horse1.some(e => e.k === 'horse')) throw new Error('T3 FAIL: 马 must plant a horse, got ' + JSON.stringify(horse1));
  const home1 = await plant('家', '?pack=/packs/basic.json');
  const hut = home1.find(e => e.k === 'dwelling');
  if (!hut || hut.p.form !== 'hut') throw new Error('T3 FAIL: 家 must plant a dwelling:hut, got ' + JSON.stringify(home1));
  const flower1 = await plant('花', '?pack=/packs/basic.json');
  const fl = flower1.find(e => e.k === 'flora');
  if (!fl || fl.p.form !== 'flower') throw new Error('T3 FAIL: 花 must plant a flora:flower');
  console.log('T3 locks: 大→bigfig, 山→peak, 马→horse, 家→dwelling:hut, 花→flora:flower');

  // T4a: shelter works — a walker beside a dwelling takes a rest (R3 via the
  // shelter tag; the same rule that already rested walkers under trees).
  let p = await rawPage(browser, errors);
  await seedWorld(p, [
    { k: 'dwelling', x: 0.5, y: 0.75, s: 1, seed: 9, cls: 'structure', p: { form: 'hut' } },
    { k: 'walker', x: 0.46, y: 0.75, s: 1, seed: 5, cls: 'agent' },
  ]);
  await p.goto(`${BASE}?pack=/tests/fixtures/eco-sym.json&seed=11`);
  const rested = await pollUntil(p, async () => {
    const w = (await els(p)).find(e => e.k === 'walker');
    return w && w.beh === 'rest' ? w : null;
  }, 9000);
  console.log('T4a rest by the hut:', JSON.stringify(rested));
  if (!rested) throw new Error('T4a FAIL: the walker must rest in the dwelling\'s shelter');
  let m = await M(p);
  if (m.e1.rests < 1 || m.e1.destructions !== 0) throw new Error('T4a FAIL: rest must count, destructions must stay 0');
  await p.close();

  // T4b: dwellings burn and come back — fire beside a hut kindles it
  // (flammable + E2), the burn walks to regrowth, and the SAME hut returns.
  p = await rawPage(browser, errors);
  await seedWorld(p, [
    { k: 'dwelling', x: 0.5, y: 0.75, s: 1, seed: 9, cls: 'structure', p: { form: 'hut' } },
    { k: 'fire', x: 0.55, y: 0.75, s: 1, seed: 7, cls: 'event', life: { phase: 'burning', fuel: 2500, t: 0, wall: Date.now() } },
  ]);
  await p.goto(`${BASE}?pack=/tests/fixtures/eco-sym.json&seed=13`);
  const lit = await pollUntil(p, async () => {
    const d = (await els(p)).find(e => e.k === 'dwelling');
    return d && d.burn ? d : null;
  }, 5000);
  console.log('T4b hut kindled:', JSON.stringify(lit));
  if (!lit) throw new Error('T4b FAIL: the hut must catch from adjacent fire');
  const back = await pollUntil(p, async () => {
    const d = (await els(p)).find(e => e.k === 'dwelling');
    return d && !d.burn ? d : null;
  }, 16000);
  console.log('T4b hut regrown:', JSON.stringify(back));
  if (!back || back.seed !== 9 || back.p.form !== 'hut')
    throw new Error('T4b FAIL: the SAME hut must return (transformed ≠ destroyed)');
  m = await M(p);
  if (m.e2.ignitions < 1 || m.e2.regrowths < 1 || m.e1.destructions !== 0)
    throw new Error('T4b FAIL: e2 must record the cycle with destructions 0');
  await p.close();

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL SYMBOL TESTS PASS — zero console errors');
  await browser.close();
  server.close();
})().catch(e => { console.error(e.message); server.close(); process.exit(1); });
