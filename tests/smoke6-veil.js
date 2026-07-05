// smoke6 — attention choreography (S1-D019/D027) against inkblade-m1a.html.
// Asserts via exposed state (__S1_ATTN) driven by REAL dispatched pointer
// events: world alpha measurably differs between writing and bloom; the veil
// is present during play and absent during bloom; bloom holds into the next
// glyph then recedes; per-glyph instrumentation is recorded.
const { TARGET, launch, boot, slash, slashStroke, sleep } = require('./helpers');
const attn = p => p.evaluate(() => ({ ...window.__S1_ATTN }));

(async () => {
  const browser = await launch();
  const errors = [];
  const p = await boot(browser, TARGET + '?char=%E4%B8%80&reset=1', errors, { begin: false });

  const build = await p.evaluate(() => window.BUILD_ID);
  console.log('build:', build);
  if (!/^S1-M\w+-b\d+-\d{8}$/.test(build)) throw new Error('FAIL: bad BUILD_ID');

  // T1: title = idle, world owns
  let a = await attn(p);
  console.log('T1 title:', a);
  if (a.mode !== 'idle' || a.worldAlpha < 0.99) throw new Error('T1 FAIL: title must be idle/full world');

  // T2: writing — world recedes, veil up (first glyph from title: no bloom hold)
  await slash(p, 200, 500, 300, 500); // begin
  await sleep(1500);
  a = await attn(p);
  console.log('T2 writing:', a);
  if (a.mode !== 'writing') throw new Error('T2 FAIL: expected writing mode');
  if (Math.abs(a.worldAlpha - 0.35) > 0.03) throw new Error('T2 FAIL: world not receded (alpha ' + a.worldAlpha + ')');
  if (Math.abs(a.veilAlpha - 0.5) > 0.05) throw new Error('T2 FAIL: veil not present (alpha ' + a.veilAlpha + ')');
  const writingAlpha = a.worldAlpha;

  // T3: bloom — lock 一; world eases to full, veil gone
  await slashStroke(p, 0);
  await sleep(1200); // 380ms resolve delay + 400ms bloom ease + margin
  a = await attn(p);
  console.log('T3 bloom:', a);
  if (a.mode !== 'bloom') throw new Error('T3 FAIL: expected bloom mode');
  if (a.worldAlpha < 0.97) throw new Error('T3 FAIL: world not vivid in bloom (alpha ' + a.worldAlpha + ')');
  if (a.veilAlpha > 0.03) throw new Error('T3 FAIL: veil present during bloom');
  if (a.worldAlpha - writingAlpha < 0.3) throw new Error('T3 FAIL: writing/bloom alpha not measurably different');

  // T4: bloom hold — next glyph appeared (resolve ended at ~2880ms post-slash);
  // world stays vivid through ATTN_HOLD_MS while writing resumes
  await sleep(2200); // now ~3400ms post-slash: new glyph ~500ms old, inside hold
  a = await attn(p);
  console.log('T4 hold:', a);
  if (a.mode !== 'writing') throw new Error('T4 FAIL: expected writing mode after advance');
  if (a.worldAlpha < 0.97) throw new Error('T4 FAIL: bloom hold not holding (alpha ' + a.worldAlpha + ')');

  // T5: recession resumes after the hold
  await sleep(2000);
  a = await attn(p);
  console.log('T5 receded:', a);
  if (Math.abs(a.worldAlpha - 0.35) > 0.03) throw new Error('T5 FAIL: world did not recede after hold');
  if (Math.abs(a.veilAlpha - 0.5) > 0.05) throw new Error('T5 FAIL: veil not restored');

  // T6: per-glyph instrumentation recorded (S1-D027)
  const log = await p.evaluate(() => window.__S1_METRICS.glyphLog);
  console.log('T6 glyphLog:', JSON.stringify(log));
  if (!Array.isArray(log) || log.length !== 1) throw new Error('T6 FAIL: expected 1 glyphLog entry');
  const e = log[0];
  if (e.ch !== '一' || e.locked !== true || typeof e.timeToFirstCutMs !== 'number' ||
      !e.worldDensity || typeof e.worldDensity.total !== 'number' || typeof e.whiffs !== 'number')
    throw new Error('T6 FAIL: glyphLog entry malformed');
  const alias = await p.evaluate(() => window.__M0_METRICS === window.__S1_METRICS);
  if (!alias) throw new Error('T6 FAIL: __M0_METRICS must alias __S1_METRICS');

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL VEIL TESTS PASS — zero console errors — build ' + build);
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
