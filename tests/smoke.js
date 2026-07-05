const puppeteer = require('puppeteer');

// Screen-space helpers matching the game's layout math at 800x600
const W = 800, H = 600;
const S = Math.min(W, H) * 0.60;            // 360
const GX = (W - S) / 2;                      // 220
const GY = (H - S) / 2 - Math.min(H * 0.03, 24); // 102
const sx = u => GX + u / 100 * S;
const sy = v => GY + v / 100 * S;

async function slash(page, x1, y1, x2, y2) {
  await page.mouse.move(x1, y1);
  await page.mouse.down();
  await page.mouse.move(x2, y2, { steps: 12 });
  await page.mouse.up();
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const M = page => page.evaluate(() => JSON.parse(JSON.stringify(window.__M0_METRICS)));
const cur = page => page.evaluate(() => window.__M0_METRICS && document ? (window.__state_ch || null) : null);

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  await page.goto('file:///home/zni/projects/inkblade/inkblade-m0.html');
  await sleep(400);

  const build = await page.evaluate(() => window.BUILD_ID || window.__M0_METRICS.build);
  console.log('build:', build);

  // T1: slash to start (title -> play, glyph 一)
  await slash(page, 200, 500, 300, 500);
  await sleep(300);
  let mode = await page.evaluate(() => window.__M0_METRICS.glyphs);
  console.log('T1 started, glyphs completed so far:', mode);

  // T2: 一 — single heng L->R across y=52 => gold cut => LOCK
  await slash(page, sx(12), sy(52), sx(88), sy(52));
  await sleep(3400); // 380ms resolve delay + 2500ms lock + advance
  let m = await M(page);
  console.log('T2 after 一:', { locks: m.locks, goldCuts: m.goldCuts, fizzles: m.fizzles });
  if (m.locks !== 1 || m.goldCuts !== 1) throw new Error('T2 FAIL: 一 did not lock');

  // T3: 二 — cut BOTTOM stroke first (wrong order), then top => FIZZLE
  await slash(page, sx(12), sy(68), sx(88), sy(68));
  await sleep(250);
  await slash(page, sx(18), sy(34), sx(82), sy(34));
  await sleep(2400); // 380 + 1450 + advance
  m = await M(page);
  console.log('T3 after 二 wrong-order:', { locks: m.locks, fizzles: m.fizzles, cuts: m.cuts });
  if (m.fizzles !== 1) throw new Error('T3 FAIL: wrong order did not fizzle');

  // T4: 三 — first a DEFLECT (vertical slash across middle heng), then all three in order => LOCK
  await slash(page, sx(50) , sy(42), sx(50), sy(58)); // shu bucket onto a heng stroke
  await sleep(250);
  m = await M(page);
  console.log('T4 deflects:', m.deflects);
  if (m.deflects < 1) throw new Error('T4 FAIL: wrong-direction slash did not deflect');
  await slash(page, sx(20), sy(26), sx(80), sy(26));
  await sleep(200);
  await slash(page, sx(24), sy(50), sx(76), sy(50));
  await sleep(200);
  await slash(page, sx(14), sy(76), sx(86), sy(76));
  await sleep(3400);
  m = await M(page);
  console.log('T4 after 三:', { locks: m.locks, fizzles: m.fizzles });
  if (m.locks !== 2) throw new Error('T4 FAIL: 三 did not lock after deflect');

  // T5: 十 — heng then shu, correct order => LOCK
  await slash(page, sx(12), sy(46), sx(88), sy(46));
  await sleep(200);
  await slash(page, sx(50), sy(12), sx(50), sy(88));
  await sleep(3400);
  m = await M(page);
  console.log('T5 after 十:', { locks: m.locks });
  if (m.locks !== 3) throw new Error('T5 FAIL: 十 did not lock');

  // T6: 人 — pie (down-left) then na (down-right) => LOCK
  await slash(page, sx(55), sy(12), sx(16), sy(88)); // pie
  await sleep(200);
  await slash(page, sx(48), sy(40), sx(88), sy(88)); // na (long)
  await sleep(3400);
  m = await M(page);
  console.log('T6 after 人:', { locks: m.locks });
  if (m.locks !== 4) throw new Error('T6 FAIL: 人 did not lock');

  // T7: whiff — slash empty corner, nothing changes
  const before = await M(page);
  await slash(page, 30, 30, 120, 30);
  await sleep(200);
  m = await M(page);
  console.log('T7 whiffs:', m.whiffs);
  if (m.whiffs < 1 || m.cuts !== before.cuts) throw new Error('T7 FAIL: whiff affected state');

  // T8: pure-function sanity on the dian/na split (not an interaction claim)
  const cls = await page.evaluate(() => {
    const f = (dx, dy, len) => classifySlash(dx, dy, len);
    const S = Math.min(innerWidth, innerHeight) * 0.60;
    return {
      shortDR: f(40, 40, Math.hypot(40, 40)),                    // short down-right
      longDR: f(S * 0.4, S * 0.4, Math.hypot(S * 0.4, S * 0.4)), // long down-right
      left: f(-100, 0, 100), up: f(0, -100, 100),
    };
  });
  console.log('T8 classify:', cls);
  if (cls.shortDR !== 'dian' || cls.longDR !== 'na' || cls.left !== null || cls.up !== null)
    throw new Error('T8 FAIL: bucket classification wrong');

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL SMOKE TESTS PASS — zero console errors');
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
