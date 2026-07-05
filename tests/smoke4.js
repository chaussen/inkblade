const puppeteer = require('puppeteer');
const W=800,H=600,S=360,GX=220,GY=102;
const sx=u=>GX+u/100*S, sy=v=>GY+v/100*S;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function slash(p,x1,y1,x2,y2){ await p.mouse.move(x1,y1); await p.mouse.down(); await p.mouse.move(x2,y2,{steps:12}); await p.mouse.up(); }
async function slashSeq(p, seq, gap=180){ for (const s of seq){ await slash(p,sx(s[0]),sy(s[1]),sx(s[2]),sy(s[3])); await sleep(gap); } }
const SEQ = {
  '一': [[12,52,88,52]],
  '木': [[12,36,88,36],[50,8,50,92],[49,40,14,82],[51,40,86,82]],
  '林': [[8,32,44,32],[26,8,26,92],[26,38,7,74],[27,41,41,59],[50,34,94,34],[72,8,72,92],[71,38,49,78],[73,39,95,73]],
  '森': [[28,18,72,18],[50,3,50,45],[49,21,33,43],[51,21,69,41],[6,58,46,58],[26,47,26,95],[25,63,9,89],[27,65,41,81],[54,58,94,58],[74,47,74,95],[73,63,55,91],[75,63,93,87]],
  '众': [[53,7,27,45],[49,19,75,45],[35,49,11,89],[31,61,45,79],[75,49,51,89],[69,61,93,89]],
};
const world = p => p.evaluate(() => ({
  n: state.world.els.length,
  kinds: state.world.els.map(e => e.k),
  seeds: state.world.els.map(e => e.seed),
  sizes: state.world.els.map(e => +e.s.toFixed(3)),
  relocks: __M0_METRICS.world.relocks,
  mElements: __M0_METRICS.world.elements,
}));

async function boot(browser, suffix, errors){
  const p = await browser.newPage();
  await p.setViewport({ width:W, height:H });
  p.on('pageerror', e=>errors.push('PAGEERROR '+e.message));
  p.on('console', m=>{ if (m.type()==='error') errors.push('CONSOLE '+m.text()); });
  await p.goto('file:///home/zni/projects/inkblade/inkblade-m075.html'+suffix);
  await sleep(350);
  await slash(p, 200, 500, 300, 500);
  await sleep(250);
  return p;
}

(async () => {
  const browser = await puppeteer.launch({ headless:'new', args:['--no-sandbox'] });
  const errors = [];

  // T1: 木 ×3 — three distinct trees, relocks=2, per-instance variance
  let p = await boot(browser, '?char=%E6%9C%A8&reset=1', errors);
  for (let i = 0; i < 3; i++){ await slashSeq(p, SEQ['木']); await sleep(3400); }
  let w = await world(p);
  console.log('T1 木×3:', w);
  if (w.n !== 3 || !w.kinds.every(k=>k==='tree')) throw new Error('T1 FAIL: expected 3 trees');
  if (w.relocks !== 2) throw new Error('T1 FAIL: relocks should be 2');
  if (new Set(w.seeds).size !== 3 || new Set(w.sizes).size < 2) throw new Error('T1 FAIL: instances not individualized');
  await p.close();

  // T2: persistence — reload without reset, world restored
  p = await boot(browser, '?char=%E6%9C%A8', errors);
  w = await world(p);
  console.log('T2 persistence:', { n: w.n, kinds: w.kinds });
  if (w.n !== 3) throw new Error('T2 FAIL: world did not persist across reload');
  await p.close();

  // T3: 一 ×2 — horizon is unique: replaced, not duplicated
  p = await boot(browser, '?char=%E4%B8%80&reset=1', errors);
  await slashSeq(p, SEQ['一']); await sleep(3400);
  await slashSeq(p, SEQ['一']); await sleep(3400);
  w = await world(p);
  console.log('T3 一×2:', { n: w.n, kinds: w.kinds, relocks: w.relocks });
  if (w.n !== 1 || w.kinds[0] !== 'horizon' || w.relocks !== 1) throw new Error('T3 FAIL: horizon uniqueness');
  await p.close();

  // T4: 森 — one lock plants three trees (vocabulary leverage)
  p = await boot(browser, '?char=%E6%A3%AE&reset=1', errors);
  await slashSeq(p, SEQ['森']); await sleep(3400);
  w = await world(p);
  console.log('T4 森:', { n: w.n, kinds: w.kinds });
  if (w.n !== 3 || !w.kinds.every(k=>k==='tree')) throw new Error('T4 FAIL: 森 should plant 3 trees');
  await p.close();

  // T5: 林 — one lock plants two trees
  p = await boot(browser, '?char=%E6%9E%97&reset=1', errors);
  await slashSeq(p, SEQ['林']); await sleep(3400);
  w = await world(p);
  console.log('T5 林:', { n: w.n });
  if (w.n !== 2) throw new Error('T5 FAIL: 林 should plant 2 trees');
  await p.close();

  // T6: 众 — crowd element; then 3s of live rendering with animation (error sweep)
  p = await boot(browser, '?char=%E4%BC%97&reset=1', errors);
  await slashSeq(p, SEQ['众']); await sleep(3400);
  w = await world(p);
  console.log('T6 众:', { n: w.n, kinds: w.kinds });
  if (w.n !== 1 || w.kinds[0] !== 'crowd') throw new Error('T6 FAIL: crowd element');
  await sleep(3000); // let walkers walk, fires flicker, leaves fall
  await p.close();

  // T7: fizzle leaves nothing in the world
  p = await boot(browser, '?char=%E4%BA%8C&reset=1', errors);
  await slash(p, sx(12), sy(68), sx(88), sy(68)); await sleep(200); // bottom first
  await slash(p, sx(16), sy(34), sx(84), sy(34)); await sleep(2400); // fizzle
  w = await world(p);
  console.log('T7 二 fizzle:', { n: w.n });
  if (w.n !== 0) throw new Error('T7 FAIL: fizzle must leave nothing');
  await p.close();

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL M0.75 TESTS PASS — zero console errors');
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
