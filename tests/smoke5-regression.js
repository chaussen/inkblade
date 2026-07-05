// smoke5 — the complete smoke1–4 scenario set ported to geometry-derived
// slashes (S1-D030) against inkblade-m1a.html with pipeline-generated data.
// Covers: full-roster canonical locks (smoke1/2/3), zero spurious deflects on
// crossing strokes (木/十 stress), wrong-order fizzle, deflect, whiff,
// classification contract, 森 component-order break classification, hint
// ladder, and the smoke4 world battery (planting, variance, relocks,
// persistence, uniqueness, leverage, fizzle-plants-nothing).
const { TARGET, launch, boot, slash, slashStroke, slashStrokes, lockGlyph, crossSlash, slashThrough, glyph, comps, worldEls, M, sleep } = require('./helpers');
const BASE = TARGET;
const ROSTER = [...'一二三十人大木火休众林炎森焱'];

(async () => {
  const browser = await launch();
  const errors = [];

  // T1: fingerprint
  {
    const p = await boot(browser, BASE + '?reset=1', errors, { begin: false });
    const build = await p.evaluate(() => window.BUILD_ID);
    console.log('build:', build);
    if (!/^S1-M\w+-b\d+-\d{8}$/.test(build)) throw new Error('T1 FAIL: bad BUILD_ID');
    const meta = await p.evaluate(() => ({ n: CHARS.length, src: PACK.meta.source }));
    if (meta.n !== 23 || !/makemeahanzi/.test(meta.src)) throw new Error('T1 FAIL: generated pack not loaded (' + JSON.stringify(meta) + ')');
    await p.close();
  }

  // T2: every roster char locks canonically end-to-end on generated geometry,
  // with zero deflects and zero fizzles (crossing-stroke stress included)
  for (const ch of ROSTER) {
    const p = await boot(browser, BASE + '?char=' + encodeURIComponent(ch) + '&reset=1', errors);
    await lockGlyph(p);
    await sleep(3400);
    const m = await M(p);
    console.log('T2 lock ' + ch + ':', { locks: m.locks, gold: m.goldCuts, deflects: m.deflects, fizzles: m.fizzles });
    if (m.locks !== 1 || m.fizzles !== 0) throw new Error('T2 FAIL: ' + ch + ' did not lock cleanly');
    if (m.deflects !== 0) throw new Error('T2 FAIL: ' + ch + ' spurious deflects');
    if (m.goldCuts !== m.cuts) throw new Error('T2 FAIL: ' + ch + ' had non-gold cuts in canonical order');
    await p.close();
  }

  // T3: wrong order fizzles; a fizzle plants nothing (stability rule)
  {
    const p = await boot(browser, BASE + '?char=%E4%BA%8C&reset=1', errors); // 二
    await slashStrokes(p, [1, 0]);
    await sleep(2400);
    const m = await M(p);
    const w = await worldEls(p);
    console.log('T3 二 wrong order:', { fizzles: m.fizzles, cuts: m.cuts, world: w.n });
    if (m.fizzles !== 1 || m.locks !== 0) throw new Error('T3 FAIL: wrong order did not fizzle');
    if (w.n !== 0) throw new Error('T3 FAIL: fizzle must plant nothing');
    await p.close();
  }

  // T4: deliberate wrong-direction slash deflects (stroke survives), then the
  // character still locks canonically
  {
    const p = await boot(browser, BASE + '?char=%E4%B8%89&reset=1', errors); // 三
    await crossSlash(p, 1);
    await sleep(300);
    let m = await M(p);
    console.log('T4 deflect:', { deflects: m.deflects, cuts: m.cuts });
    if (m.deflects !== 1 || m.cuts !== 0) throw new Error('T4 FAIL: perpendicular slash must deflect');
    await lockGlyph(p);
    await sleep(3400);
    m = await M(p);
    if (m.locks !== 1) throw new Error('T4 FAIL: 三 did not lock after deflect');
    await p.close();
  }

  // T5: whiff — slash over empty paper touches nothing
  {
    const p = await boot(browser, BASE + '?char=%E4%B8%80&reset=1', errors); // 一
    const before = await M(p);
    await slash(p, 20, 30, 130, 30);
    await sleep(250);
    const m = await M(p);
    console.log('T5 whiff:', { whiffs: m.whiffs });
    if (m.whiffs !== before.whiffs + 1 || m.cuts !== before.cuts) throw new Error('T5 FAIL: whiff changed state');
    await p.close();
  }

  // T6: classification contract (pure fn, same assertions as smoke1/smoke3)
  {
    const p = await boot(browser, BASE, errors, { begin: false });
    const cls = await p.evaluate(() => ({
      shortDR: classifySlash(40, 40, 56), longDR: classifySlash(200, 200, 283),
      left: classifySlash(-100, 0, 100), up: classifySlash(0, -100, 100),
      heng: classifySlash(100, 5, 100), pie: classifySlash(-70, 70, 99),
    }));
    console.log('T6 classify:', cls);
    if (cls.shortDR !== 'dr' || cls.longDR !== 'dr' || cls.left !== null || cls.up !== null ||
        cls.heng !== 'heng' || cls.pie !== 'pie') throw new Error('T6 FAIL: classification contract');
    await p.close();
  }

  // T7: 森 with wrong COMPONENT order (each internally canonical) → fizzle,
  // break classified at component level, 3 ash mini-completions; canonical
  // retry locks with 3 gold mini-locks
  {
    const p = await boot(browser, BASE + '?char=%E6%A3%AE&reset=1', errors);
    const cr = await comps(p);
    console.log('T7 森 comps:', JSON.stringify(cr));
    if (cr.length !== 3) throw new Error('T7 FAIL: 森 must chunk into 3 components');
    const idx = r => Array.from({ length: r[1] - r[0] + 1 }, (_, k) => r[0] + k);
    await slashStrokes(p, [...idx(cr[1]), ...idx(cr[0]), ...idx(cr[2])]);
    await sleep(2400);
    let m = await M(p);
    console.log('T7 wrong comp order:', { fizzles: m.fizzles, ash: m.comps.ash, breaks: m.orderBreaks });
    if (m.fizzles !== 1) throw new Error('T7 FAIL: wrong component order did not fizzle');
    if (m.orderBreaks.component !== 1 || m.orderBreaks.internal !== 0) throw new Error('T7 FAIL: break not component-level');
    if (m.comps.ash !== 3) throw new Error('T7 FAIL: expected 3 ash mini-completions');
    await lockGlyph(p);
    await sleep(3400);
    m = await M(p);
    console.log('T7 retry:', { locks: m.locks, gold: m.comps.gold });
    if (m.locks !== 1 || m.comps.gold !== 3) throw new Error('T7 FAIL: retry did not lock with 3 gold mini-locks');
    await p.close();
  }

  // T8: hint ladder on 炎 — idle → breathe, flail → comet, then lock anyway
  {
    const p = await boot(browser, BASE + '?char=%E7%82%8E&reset=1', errors);
    await sleep(6800);
    let m = await M(p);
    console.log('T8 after idle:', m.hints);
    if (m.hints.breathe !== 1) throw new Error('T8 FAIL: idle did not trigger breathe');
    await sleep(2800);
    await slashThrough(p, 2, 0); await sleep(250); // horizontal: 炎 has no heng strokes → guaranteed mismatch (mirrors smoke3 T-D)
    await slashThrough(p, 2, 0); await sleep(400);
    m = await M(p);
    console.log('T8 after flails:', { deflects: m.deflects, comet: m.hints.comet });
    if (m.hints.comet !== 1) throw new Error('T8 FAIL: flail did not escalate to comet');
    await lockGlyph(p);
    await sleep(3400);
    m = await M(p);
    if (m.locks !== 1) throw new Error('T8 FAIL: 炎 did not lock after hints');
    await p.close();
  }

  // T9: world battery (smoke4 port)
  {
    let p = await boot(browser, BASE + '?char=%E6%9C%A8&reset=1', errors); // 木×3
    for (let i = 0; i < 3; i++) { await lockGlyph(p); await sleep(3400); }
    let w = await worldEls(p);
    console.log('T9 木×3:', w);
    if (w.n !== 3 || !w.kinds.every(k => k === 'tree')) throw new Error('T9 FAIL: expected 3 trees');
    if (w.relocks !== 2) throw new Error('T9 FAIL: relocks should be 2');
    if (new Set(w.seeds).size !== 3 || new Set(w.sizes).size < 2) throw new Error('T9 FAIL: not individualized');
    await p.close();

    p = await boot(browser, BASE + '?char=%E6%9C%A8', errors); // persistence
    w = await worldEls(p);
    if (w.n !== 3) throw new Error('T9 FAIL: world did not persist across reload');
    console.log('T9 persistence OK');
    await p.close();

    p = await boot(browser, BASE + '?char=%E4%B8%80&reset=1', errors); // 一×2 horizon unique
    await lockGlyph(p); await sleep(3400);
    await lockGlyph(p); await sleep(3400);
    w = await worldEls(p);
    console.log('T9 一×2:', { n: w.n, kinds: w.kinds, relocks: w.relocks });
    if (w.n !== 1 || w.kinds[0] !== 'horizon' || w.relocks !== 1) throw new Error('T9 FAIL: horizon uniqueness');
    await p.close();

    for (const [ch, n, kind] of [['森', 3, 'tree'], ['林', 2, 'tree'], ['众', 1, 'crowd']]) {
      p = await boot(browser, BASE + '?char=' + encodeURIComponent(ch) + '&reset=1', errors);
      await lockGlyph(p); await sleep(3400);
      w = await worldEls(p);
      console.log('T9 ' + ch + ':', { n: w.n, kinds: w.kinds });
      if (w.n !== n || !w.kinds.every(k => k === kind)) throw new Error('T9 FAIL: ' + ch + ' leverage');
      if (ch === '众') await sleep(3000); // animation error sweep
      await p.close();
    }
  }

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL SMOKE5 REGRESSION TESTS PASS — zero console errors');
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
