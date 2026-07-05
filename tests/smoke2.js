const puppeteer = require('puppeteer');
const W=800,H=600,S=360,GX=220,GY=102;
const sx=u=>GX+u/100*S, sy=v=>GY+v/100*S;
async function slash(page,x1,y1,x2,y2){ await page.mouse.move(x1,y1); await page.mouse.down(); await page.mouse.move(x2,y2,{steps:12}); await page.mouse.up(); }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const M=page=>page.evaluate(()=>JSON.parse(JSON.stringify(window.__M0_METRICS)));
(async () => {
  const browser = await puppeteer.launch({ headless:'new', args:['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width:W, height:H });
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{ if(m.type()==='error') errors.push(m.text()); });
  await page.goto('file:///home/zni/projects/inkblade/inkblade-m0.html');
  await sleep(300);
  await slash(page,200,500,300,500); await sleep(200);                     // start
  await slash(page,sx(12),sy(52),sx(88),sy(52)); await sleep(3400);        // 一
  await slash(page,sx(16),sy(34),sx(84),sy(34)); await sleep(200);         // 二 in order this time
  await slash(page,sx(10),sy(68),sx(90),sy(68)); await sleep(3400);
  await slash(page,sx(20),sy(26),sx(80),sy(26)); await sleep(200);         // 三
  await slash(page,sx(24),sy(50),sx(76),sy(50)); await sleep(200);
  await slash(page,sx(14),sy(76),sx(86),sy(76)); await sleep(3400);
  await slash(page,sx(12),sy(46),sx(88),sy(46)); await sleep(200);         // 十
  await slash(page,sx(50),sy(12),sx(50),sy(88)); await sleep(3400);
  await slash(page,sx(55),sy(12),sx(16),sy(88)); await sleep(200);         // 人
  await slash(page,sx(48),sy(40),sx(88),sy(88)); await sleep(3400);
  let m = await M(page);
  console.log('through 人:', { locks:m.locks, fizzles:m.fizzles });
  // 大: heng, pie, na
  await slash(page,sx(12),sy(42),sx(88),sy(42)); await sleep(200);
  await slash(page,sx(52),sy(10),sx(12),sy(90)); await sleep(200);
  await slash(page,sx(51),sy(46),sx(90),sy(90)); await sleep(3400);
  m = await M(page);
  console.log('T9 after 大:', { locks:m.locks });
  if (m.locks !== 6) throw new Error('T9 FAIL: 大 did not lock');
  // 木: heng (crosses shu), shu, pie, na
  await slash(page,sx(12),sy(36),sx(88),sy(36)); await sleep(200);
  await slash(page,sx(50),sy(8),sx(50),sy(92)); await sleep(200);
  await slash(page,sx(49),sy(40),sx(14),sy(82)); await sleep(200);
  await slash(page,sx(51),sy(40),sx(86),sy(82)); await sleep(3400);
  m = await M(page);
  console.log('T10 after 木:', { locks:m.locks, deflects:m.deflects });
  if (m.locks !== 7) throw new Error('T10 FAIL: 木 did not lock');
  // 火: dian (short ↘), short pie, long pie, na
  await slash(page,sx(24),sy(22),sx(38),sy(42)); await sleep(200);
  await slash(page,sx(76),sy(18),sx(58),sy(42)); await sleep(200);
  await slash(page,sx(55),sy(10),sx(16),sy(90)); await sleep(200);
  await slash(page,sx(51),sy(44),sx(89),sy(90)); await sleep(3400);
  m = await M(page);
  console.log('T11 after 火:', { locks:m.locks, glyphs:m.glyphs, perChar:m.perChar['火'] });
  if (m.locks !== 8) throw new Error('T11 FAIL: 火 did not lock');
  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console errors'); }
  console.log('FULL ROSTER LOCKED IN ORDER — zero console errors — build', m.build);
  await browser.close();
})().catch(e=>{ console.error(e.message); process.exit(1); });
