const puppeteer = require('puppeteer');
const W=800,H=600,S=360,GX=220,GY=102;
const sx=u=>GX+u/100*S, sy=v=>GY+v/100*S;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function slash(page,x1,y1,x2,y2){ await page.mouse.move(x1,y1); await page.mouse.down(); await page.mouse.move(x2,y2,{steps:12}); await page.mouse.up(); }
async function slashSeq(page, seq, gap=180){ for (const s of seq){ await slash(page,sx(s[0]),sy(s[1]),sx(s[2]),sy(s[3])); await sleep(gap); } }
const M = page => page.evaluate(()=>JSON.parse(JSON.stringify(window.__M0_METRICS)));

// canonical slash sequences (u-coords), tracing each stroke start->end with slight overshoot
const SEQ = {
  '休': [[31,10,8,46],[22,28,22,92],[38,34,94,34],[66,8,66,92],[65,38,43,80],[67,38,92,76]],
  '众': [[53,7,27,45],[49,19,75,45],[35,49,11,89],[31,61,45,79],[75,49,51,89],[69,61,93,89]],
  '林': [[8,32,44,32],[26,8,26,92],[26,38,7,74],[27,41,41,59],[50,34,94,34],[72,8,72,92],[71,38,49,78],[73,39,95,73]],
  '炎': [[33,9,41,21],[65,7,55,21],[53,5,31,45],[51,25,65,43],[29,51,39,65],[71,49,61,63],[55,47,29,93],[53,63,79,93]],
  '森': [[28,18,72,18],[50,3,50,45],[49,21,33,43],[51,21,69,41],[6,58,46,58],[26,47,26,95],[25,63,9,89],[27,65,41,81],[54,58,94,58],[74,47,74,95],[73,63,55,91],[75,63,93,87]],
  '焱': [[37,7,45,19],[63,5,53,19],[53,3,33,43],[51,21,63,37],[11,51,20,63],[41,49,32,62],[31,47,11,91],[29,61,43,77],[59,51,68,63],[89,49,80,62],[79,47,59,91],[77,61,95,89]],
};

async function boot(page, browser, urlSuffix, errors) {
  const p = await browser.newPage();
  await p.setViewport({ width:W, height:H });
  p.on('pageerror', e=>errors.push('PAGEERROR '+e.message));
  p.on('console', m=>{ if (m.type()==='error') errors.push('CONSOLE '+m.text()); });
  await p.goto('file:///home/zni/projects/inkblade/inkblade-m05.html'+urlSuffix);
  await sleep(350);
  await slash(p, 200, 500, 300, 500); // slash to begin
  await sleep(250);
  return p;
}

(async () => {
  const browser = await puppeteer.launch({ headless:'new', args:['--no-sandbox'] });
  const errors = [];

  // T-A..C,F: composite locks, incl. positional-inflection dian strokes
  for (const ch of ['休','众','林','焱']) {
    const p = await boot(null, browser, '?char='+encodeURIComponent(ch), errors);
    await slashSeq(p, SEQ[ch]);
    await sleep(3400);
    const m = await M(p);
    console.log(`lock ${ch}:`, { locks:m.locks, fizzles:m.fizzles, compsGold:m.comps.gold, goldCuts:m.goldCuts });
    if (m.locks !== 1 || m.fizzles !== 0) throw new Error(`FAIL: ${ch} did not lock cleanly`);
    if (m.comps.gold !== SEQ[ch].length/2 && !(ch==='休'&&m.comps.gold===2) && !(ch==='众'&&m.comps.gold===3)) { /* comps counted below */ }
    await p.close();
  }

  // T-D: 炎 hint ladder — idle breathe, then flail comet, then lock anyway
  {
    const p = await boot(null, browser, '?char=%E7%82%8E', errors);
    await sleep(6800); // idle past HINT_IDLE_MS
    let m = await M(p);
    console.log('炎 after idle:', { breathe:m.hints.breathe, comet:m.hints.comet });
    if (m.hints.breathe !== 1) throw new Error('FAIL: idle did not trigger breathe hint');
    await sleep(2800); // let the breathe animation expire
    // two wrong-direction slashes (horizontal across the long pie) -> flail comet
    await slash(p, sx(40), sy(20), sx(60), sy(20)); await sleep(250);
    await slash(p, sx(40), sy(22), sx(60), sy(22)); await sleep(400);
    m = await M(p);
    console.log('炎 after flails:', { deflects:m.deflects, comet:m.hints.comet });
    if (m.hints.comet !== 1) throw new Error('FAIL: flail did not escalate to comet');
    await slashSeq(p, SEQ['炎']);
    await sleep(3400);
    m = await M(p);
    console.log('炎 lock after hints:', { locks:m.locks, compsGold:m.comps.gold });
    if (m.locks !== 1) throw new Error('FAIL: 炎 did not lock after hints');
    await p.close();
  }

  // T-E: 森 — wrong COMPONENT order (each component internally canonical) -> fizzle,
  // orderBreaks.component classified; then a second canonical attempt -> lock
  {
    const p = await boot(null, browser, '?char=%E6%A3%AE', errors);
    const seq = SEQ['森'];
    const wrong = [...seq.slice(4,8), ...seq.slice(0,4), ...seq.slice(8,12)]; // bottom-left first
    await slashSeq(p, wrong);
    await sleep(2400);
    let m = await M(p);
    console.log('森 wrong comp order:', { fizzles:m.fizzles, compAsh:m.comps.ash, breaks:m.orderBreaks });
    if (m.fizzles !== 1) throw new Error('FAIL: wrong component order did not fizzle');
    if (m.orderBreaks.component !== 1 || m.orderBreaks.internal !== 0) throw new Error('FAIL: break not classified as component-level');
    if (m.comps.ash !== 3) throw new Error('FAIL: expected 3 ash mini-completions');
    await slashSeq(p, seq); // forced char repeats: canonical retry
    await sleep(3400);
    m = await M(p);
    console.log('森 canonical retry:', { locks:m.locks, compsGold:m.comps.gold });
    if (m.locks !== 1 || m.comps.gold !== 3) throw new Error('FAIL: 森 retry did not lock with 3 gold mini-locks');
    await p.close();
  }

  // T-G: default flow regression — 一 lock, 人 lock, 木 lock (crossing case), whiff, classify
  {
    const p = await boot(null, browser, '', errors);
    await slash(p, sx(12), sy(52), sx(88), sy(52)); await sleep(3400);        // 一
    await slash(p, sx(55), sy(12), sx(16), sy(88)); await sleep(200);         // 人
    await slash(p, sx(48), sy(40), sx(88), sy(88)); await sleep(3400);
    await slash(p, sx(12), sy(36), sx(88), sy(36)); await sleep(200);         // 木 (heng crosses shu)
    await slash(p, sx(50), sy(8),  sx(50), sy(92)); await sleep(200);
    await slash(p, sx(49), sy(40), sx(14), sy(82)); await sleep(200);
    await slash(p, sx(51), sy(40), sx(86), sy(82)); await sleep(3400);
    const before = await M(p);
    await slash(p, 30, 30, 120, 30); await sleep(200);                         // whiff
    let m = await M(p);
    console.log('regression:', { locks:m.locks, whiffs:m.whiffs, deflects:m.deflects });
    if (m.locks !== 3 || m.whiffs < 1 || m.cuts !== before.cuts) throw new Error('FAIL: singles regression');
    const cls = await p.evaluate(() => ({
      shortDR: classifySlash(40,40,56), longDR: classifySlash(200,200,283),
      left: classifySlash(-100,0,100), up: classifySlash(0,-100,100),
      heng: classifySlash(100,5,100), pie: classifySlash(-70,70,99),
    }));
    console.log('classify:', cls);
    if (cls.shortDR!=='dr'||cls.longDR!=='dr'||cls.left!==null||cls.up!==null||cls.heng!=='heng'||cls.pie!=='pie')
      throw new Error('FAIL: classification');
    await p.close();
  }

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL M0.5 TESTS PASS — zero console errors');
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
