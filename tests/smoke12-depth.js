// smoke12 — depth staging + capacity (S1-D041): y-as-depth projection
// contract, near-renders-bigger pixel evidence, the 300-element C4 budget
// with measured frame times, and E1 unchanged across depth-spread positions.
// Served over HTTP for seeded v2 payloads (smoke11 pattern). Pixel evidence
// reads the game's own canvas via getImageData — reading exposed state, not
// invoking handlers.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { TARGET_FILE, launch, boot, M, sleep } = require('./helpers');

const ROOT = '/home/zni/projects/inkblade';
const PORT = 8079;
const BASE = `http://127.0.0.1:${PORT}/${TARGET_FILE}`;
const WORLD_KEY = 'inkblade_world_v1';

const MIME = { '.html': 'text/html', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  try {
    const data = fs.readFileSync(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'text/plain' });
    res.end(data);
  } catch (e) { res.writeHead(404); res.end('not found'); }
});

async function rawPage(browser, errors) {
  const p = await browser.newPage();
  p.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  p.on('console', m => {
    if (m.type() !== 'error') return;
    if (/Failed to load resource/.test(m.text())) return; // favicon 404 noise
    errors.push('CONSOLE ' + m.text());
  });
  return p;
}

let seedN = 100;
const mk = (k, cls, x, y, s = 1) => ({ k, x, y, s, seed: seedN++, cls });

async function seedWorld(p, els) {
  fs.mkdirSync(path.join(ROOT, 'tests/fixtures'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'tests/fixtures/blank.html'), '<title>seed</title>');
  await p.goto(`http://127.0.0.1:${PORT}/tests/fixtures/blank.html`);
  await p.evaluate((key, payload) => localStorage.setItem(key, payload),
    WORLD_KEY, JSON.stringify({ version: 2, els }));
}
// Count near-ink pixels in a box around a world point, on the game's canvas.
const inkCount = (p, cx, cy, half) => p.evaluate((cx, cy, half) => {
  const c = document.querySelector('canvas');
  const g = c.getContext('2d');
  const x0 = Math.max(0, Math.round(cx * c.width - half)), y0 = Math.max(0, Math.round(cy * c.height - half));
  const d = g.getImageData(x0, y0, half * 2, half * 2).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] < 110 && d[i + 1] < 110) n++;
  return n;
}, cx, cy, half);

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await launch();
  const errors = [];

  // T1: the projection contract — farther (smaller y) scales smaller; the
  // sky and the horizon reference line are exempt.
  let p = await boot(browser, `${BASE}?reset=1&seed=1`, errors, { begin: false, ignoreNetErrors: true });
  const ks = await p.evaluate(() => [
    depthK({ k: 'tree', y: 0.60 }), depthK({ k: 'tree', y: 0.88 }),
    depthK({ k: 'horizon', y: 0.76 }), depthK({ k: 'sun', y: 0.12 }),
  ]);
  console.log('T1 depthK far/near/horizon/sun:', ks.map(v => +v.toFixed(3)).join(' '));
  if (!(ks[0] < 1 && ks[1] > 1 && ks[0] < ks[1])) throw new Error('T1 FAIL: depth must scale far<1<near');
  if (ks[2] !== 1 || ks[3] !== 1) throw new Error('T1 FAIL: horizon/sky must be depth-exempt');
  await p.close();

  // T2: pixel evidence — the same kind at the near edge paints more ink
  // than at the far edge (bigger + un-misted beats smaller + misted).
  p = await rawPage(browser, errors);
  await seedWorld(p, [mk('walker', 'agent', 0.25, 0.62), mk('walker', 'agent', 0.75, 0.90)]);
  await p.goto(`${BASE}?seed=3`);
  await sleep(1200); // fully grown (700ms ease)
  const farInk = await inkCount(p, 0.25, 0.62, 90);
  const nearInk = await inkCount(p, 0.75, 0.90, 90);
  console.log('T2 ink px far/near:', farInk, nearInk);
  if (!(farInk > 0 && nearInk > farInk * 1.8))
    throw new Error('T2 FAIL: near element must paint decisively more ink than far');
  await p.close();

  // T3: capacity + frame budget — 300 elements all co-exist (cap raised)
  // and the world still turns. Frame times logged as the C4 measurement.
  const big = [];
  for (let i = 0; i < 120; i++) big.push(mk('tree', 'structure', 0.05 + (i % 20) * 0.047, 0.60 + Math.floor(i / 20) * 0.045));
  for (let i = 0; i < 60; i++) big.push(mk('walker', 'agent', 0.06 + (i % 15) * 0.062, 0.64 + Math.floor(i / 15) * 0.06));
  for (let i = 0; i < 30; i++) big.push(mk('peak', 'structure', 0.05 + i * 0.031, 0.58 + (i % 3) * 0.03, 0.8));
  for (let i = 0; i < 40; i++) big.push(mk('seal', 'structure', 0.05 + (i % 20) * 0.047, 0.66 + Math.floor(i / 20) * 0.1));
  for (let i = 0; i < 30; i++) big.push(mk('water', 'structure', 0.06 + (i % 15) * 0.062, 0.68 + Math.floor(i / 15) * 0.12));
  for (let i = 0; i < 20; i++) big.push(mk('field', 'structure', 0.07 + i * 0.045, 0.63 + (i % 2) * 0.08));
  p = await rawPage(browser, errors);
  await seedWorld(p, big);
  await p.goto(`${BASE}?seed=5`);
  await sleep(6000);
  const n = await p.evaluate(() => state.world.els.length);
  const perf = (await M(p)).perf;
  console.log('T3 elements:', n, 'avgFrameMs:', perf.avgFrameMs, 'worstFrameMs:', perf.worstFrameMs);
  if (n !== 300) throw new Error('T3 FAIL: 300 elements must co-exist under the raised cap');
  if (perf.avgFrameMs > 20) throw new Error('T3 FAIL: avg frame ' + perf.avgFrameMs + 'ms breaches the 60fps budget at 300 elements');
  await p.close();

  // T4: E1 across the depth axis — danger distance is 2D, so a fire
  // separated from a walker in y alone still startles it; invariant holds.
  p = await rawPage(browser, errors);
  await seedWorld(p, [mk('walker', 'agent', 0.5, 0.70),
    { ...mk('fire', 'event', 0.5, 0.74), life: { phase: 'burning', fuel: 60000, t: 0, wall: Date.now() } }]);
  await p.goto(`${BASE}?seed=7`);
  await sleep(2000);
  const wk = await p.evaluate(() => state.world.els.find(e => e.k === 'walker').x);
  const m = await M(p);
  console.log('T4 y-adjacent fire: startles=', m.e1.startles, 'walker x=', +wk.toFixed(3));
  if (m.e1.startles < 1) throw new Error('T4 FAIL: 2D danger distance must span the depth axis');
  if (Math.abs(wk - 0.5) < 0.05) throw new Error('T4 FAIL: walker did not flee in x');
  if (m.e1.destructions !== 0) throw new Error('T4 FAIL: E1 invariant');
  await p.close();

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL DEPTH TESTS PASS — zero console errors');
  await browser.close();
  server.close();
})().catch(e => { console.error(e.message); server.close(); process.exit(1); });
