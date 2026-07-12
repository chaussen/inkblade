// smoke20 — the ink travels (S1-D069, M2e): the lock transition that makes
// "character → object" legible. Claims: (1) matter is CHOSEN at lock (els
// exist immediately, flagged transit) and REVEALED on arrival (~920ms later,
// born stamps then); (2) ?seed= determinism is untouched by the refactor —
// same seed, same placement, run after run; (3) group spawns arrive as a
// staggered squadron, not one blob; (4) the banner moved to arrival and to
// the OBJECT (anchored at the element's converged x), and is absent while
// the ink is still flying; (5) matter in flight is exempt from the sim —
// a fire's life clock is frozen mid-flight and ticks after landing; (6) a
// mid-flight reload completes the plant instantly (transit never persists);
// (7) after arrival the object is real INK at the anchor (pixel evidence).
// Embedded core pack only — file:// is fine; real pointer events throughout.
const { TARGET, launch, boot, lockGlyph, M, sleep } = require('./helpers');

async function pollUntil(fn, ms, every = 60) {
  const t0 = Date.now();
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() - t0 > ms) return null;
    await sleep(every);
  }
}
const snap = p => p.evaluate(() => ({
  n: state.world.els.length,
  transit: state.world.els.map(e => !!e.transit),
  born: state.world.els.map(e => e.born || 0),
  x: state.world.els.map(e => +e.x.toFixed(6)),
  y: state.world.els.map(e => +e.y.toFixed(6)),
  seeds: state.world.els.map(e => e.seed),
  hasT: !!state.transit,
  banner: state.banner ? { ax: state.banner.ax, ay: state.banner.ay } : null,
}));

(async () => {
  const browser = await launch();
  const errors = [];

  // T1: the transit contract — matter chosen at lock (transit flagged, not
  // yet revealed), banner still silent; then the droplet lands: transit
  // clears, born stamps, the mark is of this moment.
  let p = await boot(browser, TARGET + '?reset=1&seed=5&char=木', errors);
  const tLock = Date.now();
  await lockGlyph(p);
  const inFlight = await pollUntil(async () => {
    const s = await snap(p);
    return s.n > 0 && s.hasT ? s : null;
  }, 1500);
  if (!inFlight) throw new Error('T1 FAIL: no transit began after the lock');
  if (!inFlight.transit.every(t => t)) throw new Error('T1 FAIL: chosen matter must be flagged transit, got ' + JSON.stringify(inFlight.transit));
  if (inFlight.banner) throw new Error('T1 FAIL: the banner must wait for the arrival');
  const landed = await pollUntil(async () => {
    const s = await snap(p);
    return !s.hasT && s.n > 0 && s.transit.every(t => !t) ? s : null;
  }, 3000);
  if (!landed) throw new Error('T1 FAIL: the transit never completed');
  if (!landed.born.every(b => b > 0)) throw new Error('T1 FAIL: born must stamp at arrival');
  console.log('T1 transit contract: chosen at lock, revealed on arrival (' + (Date.now() - tLock) + 'ms wall)');
  const runA = { x: landed.x, y: landed.y, seeds: landed.seeds };
  await p.close();

  // T2: ?seed= determinism holds byte-for-byte through the refactor — the
  // droplet is presentation; the dice are untouched.
  p = await boot(browser, TARGET + '?reset=1&seed=5&char=木', errors);
  await lockGlyph(p);
  await sleep(2200);
  const runB = await snap(p);
  if (JSON.stringify(runA) !== JSON.stringify({ x: runB.x, y: runB.y, seeds: runB.seeds }))
    throw new Error('T2 FAIL: same seed must plant identically — ' + JSON.stringify(runA) + ' vs ' + JSON.stringify({ x: runB.x, y: runB.y, seeds: runB.seeds }));
  console.log('T2 determinism: seed 5 plants identically across runs');
  await p.close();

  // T3: a group lock (林 = 2 trees) launches together and lands as a
  // staggered squadron — arrivals ordered by TRANSIT_STAGGER_MS.
  p = await boot(browser, TARGET + '?reset=1&seed=9&char=林', errors);
  await lockGlyph(p);
  const both = await pollUntil(async () => {
    const s = await snap(p);
    return s.n === 2 && s.transit.every(t => t) ? s : null;
  }, 1500);
  if (!both) throw new Error('T3 FAIL: both grove members must be chosen (and in flight) at lock');
  await sleep(2400);
  const grove = await snap(p);
  if (grove.hasT || !grove.born.every(b => b > 0)) throw new Error('T3 FAIL: the grove never fully landed');
  const gap = Math.abs(grove.born[1] - grove.born[0]);
  console.log('T3 grove: 2 droplets, arrival gap ' + Math.round(gap) + 'ms');
  if (!(gap >= 40 && gap <= 400)) throw new Error('T3 FAIL: arrivals must stagger ~90ms, gap=' + gap);
  await p.close();

  // T4: the name appears WHERE the thing appears — the banner fires at
  // arrival, anchored at the element's converged screen x.
  p = await boot(browser, TARGET + '?reset=1&seed=7&char=山', errors);
  await lockGlyph(p);
  await sleep(2200);
  const named = await snap(p);
  if (!named.banner || named.banner.ax == null) throw new Error('T4 FAIL: the arrival must raise an anchored banner');
  const anchorErr = await p.evaluate(ax => {
    const el = state.world.els[0];
    return Math.abs(worldScreenX(el) - ax);
  }, named.banner.ax);
  if (anchorErr > 0.001) throw new Error('T4 FAIL: banner must anchor at the element (off by ' + anchorErr + ')');
  console.log('T4 banner: raised at arrival, anchored at the element (err ' + anchorErr.toFixed(5) + ')');
  await p.close();

  // T5: ink in flight is not yet matter — a flying fire gives no heat and
  // its life clock is frozen; landing starts the burn.
  p = await boot(browser, TARGET + '?reset=1&seed=5&char=火', errors);
  await lockGlyph(p);
  const flying = await pollUntil(async () => {
    const s = await p.evaluate(() => {
      const el = state.world.els[0];
      return el && el.transit ? { t: el.life ? el.life.t : null, fuelSpent: el.life ? el.life.t > 0 : null } : null;
    });
    return s;
  }, 1500);
  if (!flying) throw new Error('T5 FAIL: the fire never flew');
  if (flying.t !== 0) throw new Error('T5 FAIL: a flying fire\'s life clock must be frozen, t=' + flying.t);
  await sleep(2000);
  const burning = await p.evaluate(() => state.world.els[0] && state.world.els[0].life ? state.world.els[0].life.t : null);
  if (!(burning > 0)) throw new Error('T5 FAIL: the landed fire must burn, life.t=' + burning);
  console.log('T5 sim exemption: life.t frozen at 0 in flight, ticking (' + Math.round(burning) + 'ms) after landing');
  await p.close();

  // T6: transit never persists — a mid-flight reload completes the plant
  // instantly (the save already holds the landed truth, fire's Q12 pattern).
  p = await boot(browser, TARGET + '?reset=1&seed=5&char=木', errors);
  await lockGlyph(p);
  await sleep(600); // mid-flight
  await p.goto(TARGET + '?seed=5&char=木'); // no reset: resume the save
  await sleep(500);
  const resumed = await snap(p);
  if (resumed.n !== 1 || resumed.transit.some(t => t) || resumed.hasT)
    throw new Error('T6 FAIL: reload must land the element with no transit, got ' + JSON.stringify(resumed));
  console.log('T6 mid-flight reload: element present, no transit — the plant completed');
  await p.close();

  // T7: pixel evidence — after arrival + grow-in, real ink stands at the
  // anchor (the droplet became the thing).
  p = await boot(browser, TARGET + '?reset=1&seed=5&char=木', errors);
  await lockGlyph(p);
  await sleep(2600);
  const inkPx = await p.evaluate(() => {
    const el = state.world.els[0];
    const c = document.getElementById('c'), g = c.getContext('2d');
    const dpr = c.width / window.innerWidth;
    const X = worldScreenX(el) * window.innerWidth * dpr, Y = el.y * window.innerHeight * dpr;
    const box = 70 * dpr;
    const d = g.getImageData(X - box, Y - box * 1.6, box * 2, box * 2).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] < 110 && d[i + 1] < 110 && d[i + 2] < 110) n++;
    return n;
  });
  console.log('T7 ink at the anchor:', inkPx, 'dark px');
  if (!(inkPx > 20)) throw new Error('T7 FAIL: the landed tree must paint ink at its anchor, got ' + inkPx + 'px');
  await p.close();

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL TRANSIT TESTS PASS — zero console errors');
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
