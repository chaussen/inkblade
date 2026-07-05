// smoke9 — polyline verb model (C1, S1-D021/D032/D034) against the live build.
// Real dispatched pointer gestures throughout: compound strokes (横折 shu>heng
// folds, 横折钩 with hook) cut via real two/three-segment gestures traced along
// live geometry; hooks are OPTIONAL (straight shu cuts a 竖钩); a deliberate
// wrong-turn deflects; jitter never splits a straight slash.
const { TARGET, launch, boot, slash, lockGlyph, glyph, M, sleep } = require('./helpers');
const NEW_ROSTER = [...'口日月田国土山水川'];

(async () => {
  const browser = await launch();
  const errors = [];

  // T1: every new-roster char locks canonically end-to-end — fold gestures
  // (口日田国山), hook strokes traced in full (月水), steep real forms (川)
  for (const ch of NEW_ROSTER) {
    const p = await boot(browser, TARGET + '?char=' + encodeURIComponent(ch) + '&reset=1', errors);
    await lockGlyph(p);
    await sleep(3400);
    const m = await M(p);
    console.log('T1 lock ' + ch + ':', { locks: m.locks, gold: m.goldCuts, deflects: m.deflects, fizzles: m.fizzles });
    if (m.locks !== 1 || m.fizzles !== 0) throw new Error('T1 FAIL: ' + ch + ' did not lock cleanly');
    if (m.deflects !== 0) throw new Error('T1 FAIL: ' + ch + ' spurious deflects');
    if (m.goldCuts !== m.cuts) throw new Error('T1 FAIL: ' + ch + ' non-gold cuts in canonical order');
    await p.close();
  }

  // T2: hook-optional — a STRAIGHT shu slash (no hook performed) cuts 水's 竖钩
  {
    const p = await boot(browser, TARGET + '?char=%E6%B0%B4&reset=1', errors);
    const g = await glyph(p);
    const pts = g.strokes[0].pts;
    const x0 = pts[0][0], y0 = pts[0][1];
    const yMax = Math.max(...pts.map(q => q[1]));
    await slash(p, x0, y0, x0, yMax); // straight down, hook omitted
    await sleep(300);
    const m = await M(p);
    console.log('T2 straight shu on 竖钩:', { cuts: m.cuts, gold: m.goldCuts, deflects: m.deflects });
    if (m.cuts !== 1 || m.goldCuts !== 1 || m.deflects !== 0) throw new Error('T2 FAIL: straight shu must cut the hooked stroke');
    await p.close();
  }

  // T3: deliberate wrong-turn — heng>PIE gesture on 口's 横折 (heng>shu) deflects
  {
    const p = await boot(browser, TARGET + '?char=%E5%8F%A3&reset=1', errors);
    const g = await glyph(p);
    const pts = g.strokes[1].pts; // 横折
    const [sx0, sy0] = pts[0];
    // find the corner: the point of maximum x (end of the heng segment)
    const corner = pts.reduce((a, b) => (b[0] > a[0] ? b : a));
    await p.mouse.move(sx0, sy0);
    await p.mouse.down();
    await p.mouse.move(corner[0], corner[1], { steps: 8 });
    await p.mouse.move(corner[0] - 60, corner[1] + 60, { steps: 8 }); // wrong turn: down-LEFT
    await p.mouse.up();
    await sleep(300);
    const m = await M(p);
    console.log('T3 wrong-turn:', { deflects: m.deflects, cuts: m.cuts });
    if (m.deflects !== 1 || m.cuts !== 0) throw new Error('T3 FAIL: heng>pie on 横折 must deflect');
    await p.close();
  }

  // T4: jitter tolerance — a wobbly-but-straight heng on 一 stays one segment
  {
    const p = await boot(browser, TARGET + '?char=%E4%B8%80&reset=1', errors);
    const g = await glyph(p);
    const pts = g.strokes[0].pts;
    const [x0, y0] = pts[0], [x1] = [pts[pts.length - 1][0]];
    await p.mouse.move(x0, y0);
    await p.mouse.down();
    for (let x = x0 + 8; x <= x1; x += 8) {
      await p.mouse.move(x, y0 + 5 * Math.sin((x - x0) / 60 * 2 * Math.PI), { steps: 1 });
    }
    await p.mouse.up();
    await sleep(300);
    const m = await M(p);
    console.log('T4 jitter:', { cuts: m.cuts, gold: m.goldCuts, deflects: m.deflects });
    if (m.goldCuts !== 1 || m.deflects !== 0) throw new Error('T4 FAIL: jittery straight slash must still cut gold');
    await p.close();
  }

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL FOLD/HOOK TESTS PASS — zero console errors');
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
