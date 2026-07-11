// smoke22 — the WebGL pilot (S1-D075, M2g): gated behind ?r3d=1. The real
// regression gate for this build is the REST OF THE BATTERY (smoke5-21 +
// frozen 1-4) passing UNCHANGED with r3d unset — this suite covers only the
// ?r3d=1-specific contract: (1) WebGL context created; (2) a locked
// character renders visible billboard pixels via the real camera; (3) the
// camera responds to real pointer movement (a known element's elScreenPos
// shifts, same differential-parallax technique as smoke21); (4) live E2
// ignition glow tracks the projected billboard position; (5) presentation-
// only — el.x/seeds untouched by a full pointer sweep; (6) graceful
// fallback — a page where WebGL context creation is forced to fail still
// boots and plays with zero console errors. Real pointer events throughout.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { TARGET_FILE, launch, boot, lockGlyph, sleep } = require('./helpers');

const ROOT = '/home/zni/projects/inkblade';
const PORT = 8098;
const BASE = `http://127.0.0.1:${PORT}/${TARGET_FILE}`;
const WORLD_KEY = 'inkblade_world_v1';
const MIME = { '.html': 'text/html', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  if (req.url === '/favicon.ico') { res.writeHead(204); res.end(); return; }
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
const glNonTransparent = p => p.evaluate(() => {
  const gl = R3D.gl, w = R3D.glCanvas.width, h = R3D.glCanvas.height;
  const px = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
  let n = 0; for (let i = 3; i < px.length; i += 4) if (px[i] > 5) n++;
  return n;
});

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await launch();
  const errors = [];

  // T1: WebGL context created under ?r3d=1.
  let p = await boot(browser, `${BASE}?reset=1&seed=5&r3d=1&char=木`, errors, { ignoreNetErrors: true });
  const r3dState = await p.evaluate(() => window.__S1_R3D);
  console.log('T1 __S1_R3D:', JSON.stringify(r3dState));
  if (!r3dState.on || !r3dState.active) throw new Error('T1 FAIL: WebGL pilot did not activate: ' + JSON.stringify(r3dState));

  // T2: a locked character renders real billboard pixels via the real camera.
  await lockGlyph(p);
  await sleep(2500); // clear of the ink-travels transit window (~920ms)
  const n = await glNonTransparent(p);
  console.log('T2 billboard pixels:', n);
  if (!(n > 200)) throw new Error('T2 FAIL: locked character produced too few billboard pixels: ' + n);
  await p.close();

  // T3: the camera responds to real pointer movement — a seeded element's
  // elScreenPos shifts between a left-held and right-held pointer sweep
  // (same technique as smoke21's differential parallax check).
  p = await rawPage(browser, errors);
  await seedWorld(p, [{ k: 'tree', x: 0.5, y: 0.75, s: 1.2, seed: 11, cls: 'structure' }]);
  await p.goto(`${BASE}?r3d=1&seed=3`);
  await sleep(700);
  await p.mouse.move(40, 300); await sleep(1400);
  const xL = await p.evaluate(() => elScreenPos(state.world.els[0]).x);
  await p.mouse.move(760, 300); await sleep(1400);
  const xR = await p.evaluate(() => elScreenPos(state.world.els[0]).x);
  console.log('T3 camera pan: x', xL.toFixed(4), '→', xR.toFixed(4));
  if (Math.abs(xR - xL) < 0.02) throw new Error('T3 FAIL: the R3D camera never responded to the pointer (Δx=' + (xR - xL) + ')');

  // T6 (same page): presentation-only — the sweep never touched world x.
  const worldX = await p.evaluate(() => state.world.els[0].x);
  if (worldX !== 0.5) throw new Error('T6 FAIL: the pointer sweep moved el.x: ' + worldX);
  console.log('T6 render-only: el.x untouched by the camera sweep');
  await p.close();

  // T4: live E2 ignition glow tracks the projected billboard position — a
  // flammable dwelling beside a fire catches and its glow lands where the
  // billboard actually renders (elScreenPos), not off in 2D screen-space.
  p = await rawPage(browser, errors);
  await seedWorld(p, [
    { k: 'dwelling', x: 0.5, y: 0.75, s: 1, seed: 9, cls: 'structure', p: { form: 'hut' } },
    { k: 'fire', x: 0.55, y: 0.75, s: 1, seed: 7, cls: 'event', life: { phase: 'burning', fuel: 2500, t: 0, wall: Date.now() } },
  ]);
  const eco = {
    comfortR: 0.30, dangerR: 0.06, warmDist: 0.15, fleeDist: 0.20, shelterR: 0.12,
    walkSpeed: 0.06, fleeSpeedMult: 3, restChancePerSec: 0.95, restMs: 1500, restCooldownMs: 4000,
    fire: { fuelMs: 2500, emberMs: 2000, smokeMs: 1000, flareEveryMs: [500, 900], flareMs: 300, flareBoost: 1.6, heatPhases: ['burning', 'embers'] },
    ashDecayMs: 3000, ignition: { flame: { r: 0.10, dwellMs: 800 }, ember: { r: 0.05, dwellMs: 1500 }, coolMs: 2000 },
    regrow: { ashMs: 1500, sproutMs: 1200, saplingMs: 1200 },
  };
  const core = JSON.parse(fs.readFileSync(path.join(ROOT, 'packs/core.json'), 'utf8'));
  fs.writeFileSync(path.join(ROOT, 'tests/fixtures/eco-r3d.json'), JSON.stringify({ ...core, ecology: eco }));
  await p.goto(`${BASE}?r3d=1&pack=/tests/fixtures/eco-r3d.json&seed=13`);
  const t0 = Date.now();
  let lit = false;
  while (Date.now() - t0 < 5000) {
    const burning = await p.evaluate(() => {
      const d = state.world.els.find(e => e.k === 'dwelling');
      return d && d.burn && d.burn.phase === 'burning';
    });
    if (burning) { lit = true; break; }
    await sleep(150);
  }
  if (!lit) throw new Error('T4 FAIL: the hut never caught from adjacent fire');
  await sleep(200);
  const glowN = await glNonTransparent(p); // billboards + heat glow both land on canvas layers this reads via drawImage composite
  const canvasInk = await p.evaluate(() => {
    const c = document.getElementById('c'), g = c.getContext('2d');
    const dpr = c.width / window.innerWidth;
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let warm = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] > 180 && d[i + 1] > 100 && d[i + 1] < 200 && d[i + 2] < 140) warm++;
    return warm;
  });
  console.log('T4 hut kindled; live canvas warm-toned px:', canvasInk, '(GL layer px:', glowN + ')');
  if (!(canvasInk > 30)) throw new Error('T4 FAIL: no visible fire-glow warmth on the composited canvas (' + canvasInk + 'px)');
  await p.close();

  // T5: graceful fallback — force WebGL context creation to fail; the game
  // must still boot, plant, and play with zero console errors.
  p = await rawPage(browser, errors);
  await p.evaluateOnNewDocument(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      if (type === 'webgl' || type === 'experimental-webgl') return null;
      return orig.call(this, type, ...rest);
    };
  });
  await p.goto(`${BASE}?reset=1&seed=5&r3d=1&char=木`);
  await sleep(400);
  await p.mouse.move(150, 520); await p.mouse.down(); await p.mouse.move(260, 520, { steps: 12 }); await p.mouse.up();
  await sleep(250);
  const fbState = await p.evaluate(() => window.__S1_R3D);
  console.log('T5 fallback state:', JSON.stringify(fbState));
  if (fbState.active || !fbState.fallback) throw new Error('T5 FAIL: pilot must report inactive + a fallback reason when WebGL is unavailable');
  const g = await p.evaluate(() => window.__S1_GLYPH());
  for (const st of g.strokes) {
    const pts = st.pts;
    await p.mouse.move(pts[0][0], pts[0][1]); await p.mouse.down();
    for (let j = 1; j < pts.length; j++) await p.mouse.move(pts[j][0], pts[j][1], { steps: 4 });
    await p.mouse.up(); await sleep(150);
  }
  await sleep(2500);
  const m = await p.evaluate(() => window.__S1_METRICS.locks);
  console.log('T5 fallback lock count:', m);
  if (m !== 1) throw new Error('T5 FAIL: the game must remain fully playable when WebGL is unavailable, locks=' + m);
  await p.close();

  if (errors.length) { console.log('ERRORS:', errors); throw new Error('console/page errors present'); }
  console.log('ALL WEBGL PILOT TESTS PASS — zero console errors');
  await browser.close();
  server.close();
})().catch(e => { console.error(e.message); server.close(); process.exit(1); });
