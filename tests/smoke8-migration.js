// smoke8 — save v2 migration (S1-D026) against inkblade-m1a.html.
// A live implicit-v1 payload (including an unknown element kind) must load
// with every element present, self-heal the unknown kind to a seal at render
// time, round-trip as v2 on the next save, and leave a one-time backup of the
// raw v1 payload. Q12: no old save ever loads with loss.
const { TARGET, launch, slash, lockGlyph, sleep, W, H } = require('./helpers');

const V1_PAYLOAD = JSON.stringify({ els: [
  { k: 'tree',   x: 0.5, y: 0.72, s: 1.1, seed: 12345 },
  { k: 'dragon', x: 0.3, y: 0.74, s: 1.0, seed: 999 },   // kind this build has never heard of
]});

(async () => {
  const browser = await launch();
  const errors = [];
  const { boot } = require('./helpers');
  const page = suffix => boot(browser, TARGET + suffix, errors, { begin: false });

  // T1: seed an implicit-v1 save, then load it in a fresh page
  let p = await page('?reset=1');
  await p.evaluate(v1 => {
    localStorage.removeItem('inkblade_world_v1_backup');
    localStorage.setItem('inkblade_world_v1', v1);
  }, V1_PAYLOAD);
  await p.close();
  p = await page('?char=%E6%9C%A8');
  const els = await p.evaluate(() => state.world.els.map(e => ({ k: e.k, cls: e.cls, seed: e.seed })));
  console.log('T1 migrated els:', JSON.stringify(els));
  if (els.length !== 2) throw new Error('T1 FAIL: migration lost elements');
  if (els[0].k !== 'tree' || els[0].cls !== 'structure') throw new Error('T1 FAIL: known kind not classed');
  if (els[1].k !== 'dragon' || els[1].cls !== null || els[1].seed !== 999) throw new Error('T1 FAIL: unknown kind not carried forward verbatim');

  // T2: backup written at migration time, byte-identical to the raw v1 payload
  const backup = await p.evaluate(() => localStorage.getItem('inkblade_world_v1_backup'));
  if (backup !== V1_PAYLOAD) throw new Error('T2 FAIL: v1 backup missing or altered');
  console.log('T2 backup OK');

  // T3: unknown kind renders via the seal fallback, with zero errors
  await sleep(1200); // let the world layer render
  const sealed = await p.evaluate(() => state.world.els.find(e => e.k === 'dragon').sealFallback === true);
  console.log('T3 sealFallback:', sealed);
  if (!sealed) throw new Error('T3 FAIL: unknown kind did not render as seal');

  // T4: lock 木 with real slashes → next save is v2, nothing lost
  await slash(p, 150, 520, 260, 520); await sleep(250); // begin
  await lockGlyph(p); await sleep(3400);
  const raw = await p.evaluate(() => localStorage.getItem('inkblade_world_v1'));
  const d = JSON.parse(raw);
  console.log('T4 saved:', { version: d.version, n: d.els.length, kinds: d.els.map(e => e.k) });
  if (d.version !== 2) throw new Error('T4 FAIL: save not v2');
  if (d.els.length !== 3) throw new Error('T4 FAIL: expected migrated 2 + planted 1');
  const dragon = d.els.find(e => e.k === 'dragon');
  if (!dragon || dragon.cls !== null || dragon.seed !== 999) throw new Error('T4 FAIL: unknown kind lost on v2 write');
  await p.close();

  // T5: v2 save reloads cleanly (no migration, no backup overwrite)
  p = await page('?char=%E6%9C%A8');
  const n = await p.evaluate(() => state.world.els.length);
  const backup2 = await p.evaluate(() => localStorage.getItem('inkblade_world_v1_backup'));
  console.log('T5 reload:', { n });
  if (n !== 3) throw new Error('T5 FAIL: v2 save did not reload');
  if (backup2 !== V1_PAYLOAD) throw new Error('T5 FAIL: backup must stay the original v1 payload');
  await p.close();

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL MIGRATION TESTS PASS — zero console errors');
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
