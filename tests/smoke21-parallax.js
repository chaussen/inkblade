// smoke21 — the world breathes (S1-D072, M2f): the motion-parallax camera.
// Claims: (1) the camera is alive (idle drift moves it, bounded) and the
// pointer pans it; (2) THE parallax contract — layers shift differentially:
// a near element's painted ink moves across the screen by CAM.px × its
// layer factor, a far element's by less, measured off the live canvas
// against the same formula the renderer uses (drift-proof: we normalize by
// the camera position actually sampled at each capture); (3) writing is
// never disturbed — the pan target freezes while a trail is active; (4)
// prefers-reduced-motion pins the camera at 0; (5) the foreground occluder
// band exists (__S1_SCENE.fg), paints visible tint in the near band, and
// stays silk under BOTH ink-probe thresholds; (6) the camera is render-only
// — el.x is bit-identical across a full pointer sweep. HTTP-served, real
// pointer events; world probed on the title screen (no veil).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { TARGET_FILE, launch, sleep } = require('./helpers');

const ROOT = '/home/zni/projects/inkblade';
const PORT = 8097;
const BASE = `http://127.0.0.1:${PORT}/${TARGET_FILE}`;
const WORLD_KEY = 'inkblade_world_v1';

const MIME = { '.html': 'text/html', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  if (req.url === '/favicon.ico') { res.writeHead(204); res.end(); return; } // keep the zero-console-error contract strict
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  try {
    const data = fs.readFileSync(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'text/plain' });
    res.end(data);
  } catch (e) { res.writeHead(404); res.end('not found'); }
});
fs.mkdirSync(path.join(ROOT, 'tests/fixtures'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'tests/fixtures/blank.html'), '<title>seed</title>');

async function rawPage(browser, errors) {
  const p = await browser.newPage();
  await p.setViewport({ width: 800, height: 600 });
  p.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
  return p;
}
async function seedWorld(p, els) {
  await p.goto(`http://127.0.0.1:${PORT}/tests/fixtures/blank.html`);
  await p.evaluate((key, payload) => localStorage.setItem(key, payload),
    WORLD_KEY, JSON.stringify({ version: 2, els }));
}
// Centroid-x of dark trunk ink inside a screen strip (live canvas pixels).
const inkCentroid = (p, x0, y0, x1, y1) => p.evaluate((x0, y0, x1, y1) => {
  const c = document.getElementById('c'), g = c.getContext('2d');
  const dpr = c.width / window.innerWidth;
  const d = g.getImageData(x0 * dpr, y0 * dpr, (x1 - x0) * dpr, (y1 - y0) * dpr);
  let n = 0, sx = 0;
  for (let i = 0; i < d.data.length; i += 4) {
    if (d.data[i] < 120 && d.data[i + 1] < 120) { n++; sx += ((i / 4) % d.width) / dpr; }
  }
  return n ? { n, cx: x0 + sx / n } : { n: 0, cx: null };
}, x0, y0, x1, y1);

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await launch();
  const errors = [];

  // Seed a far tree and a near tree on the same world x — the depth pair
  // whose differential slide IS the parallax read. x=0.18 keeps their probe
  // strips clear of the title text ink.
  let p = await rawPage(browser, errors);
  await seedWorld(p, [
    { k: 'tree', x: 0.18, y: 0.62, s: 1.1, seed: 41, cls: 'structure' },
    { k: 'tree', x: 0.18, y: 0.88, s: 1.1, seed: 42, cls: 'structure' },
  ]);
  await p.goto(`${BASE}?seed=3`);
  await sleep(600);

  // T1: the camera is alive — the idle drift moves it, inside bounds.
  const cam = () => p.evaluate(() => ({ px: window.__S1_CAM.px, target: window.__S1_CAM.target }));
  const a1 = await cam();
  await sleep(1600);
  const a2 = await cam();
  const bound = await p.evaluate(() => (CAM_POINTER + CAM_DRIFT * 1.35) * window.innerWidth + 4);
  console.log('T1 drift:', a1.px.toFixed(2), '→', a2.px.toFixed(2), '(bound ±' + bound.toFixed(0) + ')');
  if (a1.px === a2.px) throw new Error('T1 FAIL: the camera never drifts');
  if (Math.abs(a1.px) > bound || Math.abs(a2.px) > bound) throw new Error('T1 FAIL: camera out of bounds');

  // T2: the parallax contract — real pointer pan, layers slide by CAM.px ×
  // their own factor (normalized by the sampled camera, so drift can't flap).
  const factors = await p.evaluate(() => {
    const q = y => Math.max(0, Math.min(1, (y - GROUND_FAR) / (GROUND_NEAR - GROUND_FAR)));
    const f = y => PARALLAX_FAR + q(y) * (PARALLAX_NEAR - PARALLAX_FAR);
    return { far: f(0.62), near: f(0.88) };
  });
  const strips = { far: [40, 300, 312, 370], near: [40, 300, 445, 526] };
  await p.mouse.move(40, 300); await sleep(1400);
  const pxL = (await cam()).px;
  const farL = await inkCentroid(p, strips.far[0], strips.far[2], strips.far[1], strips.far[3]);
  const nearL = await inkCentroid(p, strips.near[0], strips.near[2], strips.near[1], strips.near[3]);
  await p.mouse.move(760, 300); await sleep(1400);
  const pxR = (await cam()).px;
  const farR = await inkCentroid(p, strips.far[0], strips.far[2], strips.far[1], strips.far[3]);
  const nearR = await inkCentroid(p, strips.near[0], strips.near[2], strips.near[1], strips.near[3]);
  if (farL.n < 5 || nearL.n < 20) throw new Error('T2 FAIL: trees paint too little probe ink (far ' + farL.n + ', near ' + nearL.n + ')');
  const pan = pxR - pxL;
  const dFar = farR.cx - farL.cx, dNear = nearR.cx - nearL.cx;
  console.log('T2 pan', pan.toFixed(1) + 'px — far moved', dFar.toFixed(1), '(want', (pan * factors.far).toFixed(1) + '), near moved', dNear.toFixed(1), '(want', (pan * factors.near).toFixed(1) + ')');
  if (!(pan > 18)) throw new Error('T2 FAIL: the pointer never panned the camera (' + pan + 'px)');
  if (Math.abs(dFar - pan * factors.far) > 7) throw new Error('T2 FAIL: far layer off contract');
  if (Math.abs(dNear - pan * factors.near) > 7) throw new Error('T2 FAIL: near layer off contract');
  if (!(dNear > dFar + 8)) throw new Error('T2 FAIL: near must slide visibly more than far');

  // T6 (same page): render-only — a full sweep never touched world coords.
  const xs = await p.evaluate(() => state.world.els.map(e => e.x));
  if (xs.some(x => x !== 0.18)) throw new Error('T6 FAIL: the camera moved el.x: ' + JSON.stringify(xs));
  console.log('T6 render-only: el.x untouched by the sweep');

  // T3: the writing gate — with a trail active (pointer down), moves never
  // steer the camera target.
  await p.mouse.move(400, 300);
  await sleep(300);
  const tBefore = (await cam()).target;
  await p.mouse.down();
  await p.mouse.move(60, 300, { steps: 8 });
  const tDuring = (await cam()).target;
  await p.mouse.up();
  if (tDuring !== tBefore) throw new Error('T3 FAIL: a mid-trail move steered the camera (' + tBefore + ' → ' + tDuring + ')');
  await p.mouse.move(700, 300);
  const tAfter = (await cam()).target;
  if (tAfter === tBefore) throw new Error('T3 FAIL: the camera never resumed after the trail');
  console.log('T3 writing gate: target frozen during the trail, live after');
  await p.close();

  // T4: prefers-reduced-motion pins the camera at 0, pointer or not.
  p = await rawPage(browser, errors);
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.goto(`${BASE}?reset=1&seed=3`);
  await sleep(700);
  await p.mouse.move(760, 300); await sleep(900);
  const rm = await p.evaluate(() => window.__S1_CAM.px);
  if (rm !== 0) throw new Error('T4 FAIL: reduced-motion camera must stay 0, got ' + rm);
  console.log('T4 reduced-motion: camera pinned at 0');
  await p.close();

  // T5: the foreground band exists, tints the near edge, and is silk under
  // both ink thresholds (empty world — furniture only).
  p = await rawPage(browser, errors);
  await p.goto(`${BASE}?reset=1&seed=3`);
  await sleep(700);
  const scene = await p.evaluate(() => window.__S1_SCENE);
  if (!scene || !(scene.fg >= 5)) throw new Error('T5 FAIL: __S1_SCENE.fg missing/too few: ' + JSON.stringify(scene));
  const band = await p.evaluate(() => {
    const c = document.getElementById('c'), g = c.getContext('2d');
    const dpr = c.width / window.innerWidth;
    const W2 = window.innerWidth, H2 = window.innerHeight;
    const d = g.getImageData(0, 0.955 * H2 * dpr, W2 * dpr, 0.04 * H2 * dpr);
    let tint = 0, ink = 0, tree = 0;
    for (let i = 0; i < d.data.length; i += 4) {
      const [r, g2, b] = [d.data[i], d.data[i + 1], d.data[i + 2]];
      if (Math.abs(r - 236) + Math.abs(g2 - 227) + Math.abs(b - 207) > 36) tint++;
      if (r < 110 && g2 < 110) ink++;
      if (r < 150 && g2 < 160 && b < 130) tree++;
    }
    return { tint, ink, tree };
  });
  console.log('T5 foreground band:', JSON.stringify(scene), JSON.stringify(band));
  if (!(band.tint > 200)) throw new Error('T5 FAIL: the foreground band paints no visible tint (' + band.tint + 'px)');
  if (band.ink !== 0 || band.tree !== 0) throw new Error('T5 FAIL: foreground counts as ink: ' + JSON.stringify(band));
  await p.close();

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL PARALLAX TESTS PASS — zero console errors');
  await browser.close();
  server.close();
})().catch(e => { console.error(e.message); server.close(); process.exit(1); });
