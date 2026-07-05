// smoke10 — world element classes + seal fallback (C3, S1-D021.3) against the
// live build. A char with world:null locks and plants a seal bearing its form;
// two chars of one tier-2 class render as siblings with different skin params;
// sky elements are unique; params survive persistence.
const { TARGET, launch, boot, lockGlyph, worldEls, sleep } = require('./helpers');

(async () => {
  const browser = await launch();
  const errors = [];
  const els = p => p.evaluate(() => state.world.els.map(e => ({ k: e.k, ch: e.ch || null, p: e.p || null })));

  // T1: seal fallback on lock — 口 has world:null
  {
    const p = await boot(browser, TARGET + '?char=%E5%8F%A3&reset=1', errors);
    await lockGlyph(p); await sleep(3400);
    const e = await els(p);
    console.log('T1 口 seal:', JSON.stringify(e));
    if (e.length !== 1 || e[0].k !== 'seal' || e[0].ch !== '口') throw new Error('T1 FAIL: world:null must plant a seal bearing the char');
    await p.close();
  }

  // T2: tier-2 class family — 水 and 川 both plant 'water' with different skins
  {
    let p = await boot(browser, TARGET + '?char=%E6%B0%B4&reset=1', errors);
    await lockGlyph(p); await sleep(3400);
    await p.close();
    p = await boot(browser, TARGET + '?char=%E5%B7%9D', errors); // no reset — accumulate
    await lockGlyph(p); await sleep(3400);
    const e = await els(p);
    console.log('T2 water class:', JSON.stringify(e));
    const water = e.filter(x => x.k === 'water');
    if (water.length !== 2) throw new Error('T2 FAIL: expected two water elements');
    if (!water[0].p || !water[1].p || water[0].p.form === water[1].p.form)
      throw new Error('T2 FAIL: tier-2 skins must differ per char');
    await sleep(1500); // render both skins — error sweep
    await p.close();

    // params survive persistence
    p = await boot(browser, TARGET + '?char=%E5%B7%9D', errors, { begin: false });
    const e2 = await els(p);
    const water2 = e2.filter(x => x.k === 'water');
    console.log('T2 reload:', JSON.stringify(water2));
    if (water2.length !== 2 || new Set(water2.map(w => w.p && w.p.form)).size !== 2)
      throw new Error('T2 FAIL: skin params lost on reload');
    await p.close();
  }

  // T3: 山 reuses the bespoke peak kind
  {
    const p = await boot(browser, TARGET + '?char=%E5%B1%B1&reset=1', errors);
    await lockGlyph(p); await sleep(3400);
    const w = await worldEls(p);
    console.log('T3 山:', { kinds: w.kinds });
    if (w.n !== 1 || w.kinds[0] !== 'peak') throw new Error('T3 FAIL: 山 must raise a peak');
    await p.close();
  }

  // T4: the sky gains a unique sun — 日 twice replaces, never duplicates
  {
    const p = await boot(browser, TARGET + '?char=%E6%97%A5&reset=1', errors);
    await lockGlyph(p); await sleep(3400);
    await lockGlyph(p); await sleep(3400);
    const w = await worldEls(p);
    console.log('T4 日×2:', { n: w.n, kinds: w.kinds, relocks: w.relocks });
    if (w.n !== 1 || w.kinds[0] !== 'sun' || w.relocks !== 1) throw new Error('T4 FAIL: sun uniqueness');
    await sleep(1500); // sky render error sweep
    await p.close();
  }

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL CLASS/SEAL TESTS PASS — zero console errors');
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
