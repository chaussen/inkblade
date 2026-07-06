// Shared helpers for the M1a+ suites (S1-D030): slash coordinates are derived
// from the LIVE glyph geometry exposed at window.__S1_GLYPH, decoupling tests
// from authored coordinates — pipeline-generated packs move strokes, the
// suite follows. Every slash is a REAL dispatched pointer event (puppeteer
// mouse); reading exposed state is allowed, invoking handlers is not.
const puppeteer = require('puppeteer');
const W = 800, H = 600;
// The live build under test. Frozen suites (smoke1-4) keep their own frozen
// targets; suites 5+ follow the current milestone artifact.
const TARGET_FILE = process.env.INKBLADE_TARGET || 'inkblade-m1c.html';
const TARGET = 'file:///home/zni/projects/inkblade/' + TARGET_FILE;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function launch() {
  return puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
}
async function boot(browser, url, errors, { begin = true, ignoreNetErrors = false } = {}) {
  const p = await browser.newPage();
  await p.setViewport({ width: W, height: H });
  p.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  p.on('console', m => {
    if (m.type() !== 'error') return;
    if (ignoreNetErrors && /Failed to load resource/.test(m.text())) return; // network-layer noise from deliberate 404 fixtures
    errors.push('CONSOLE ' + m.text());
  });
  await p.goto(url);
  await sleep(400);
  if (begin) { await slash(p, 150, 520, 260, 520); await sleep(250); } // title → play
  return p;
}
async function slash(p, x1, y1, x2, y2) {
  await p.mouse.move(x1, y1);
  await p.mouse.down();
  await p.mouse.move(x2, y2, { steps: 12 });
  await p.mouse.up();
}
const glyph = p => p.evaluate(() => window.__S1_GLYPH());
const M = p => p.evaluate(() => JSON.parse(JSON.stringify(window.__S1_METRICS)));

// Trace stroke i of the live glyph along its real polyline.
async function slashStroke(p, i) {
  const g = await glyph(p);
  const pts = g.strokes[i].pts;
  await p.mouse.move(pts[0][0], pts[0][1]);
  await p.mouse.down();
  for (let j = 1; j < pts.length; j++) await p.mouse.move(pts[j][0], pts[j][1], { steps: 4 });
  await p.mouse.up();
}
// Slash strokes in the given index order (default: canonical array order).
async function slashStrokes(p, order, gap = 180) {
  for (const i of order) { await slashStroke(p, i); await sleep(gap); }
}
async function lockGlyph(p, gap = 180) {
  const g = await glyph(p);
  await slashStrokes(p, g.strokes.map((_, i) => i), gap);
}
// A deliberate wrong-direction slash: perpendicular through stroke i's midpoint.
async function crossSlash(p, i, len = 80) {
  const g = await glyph(p);
  const pts = g.strokes[i].pts;
  const a = pts[0], b = pts[pts.length - 1];
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  let [px, py] = [-dy / L, dx / L];
  if (py < 0 || (py === 0 && px < 0)) { px = -px; py = -py; } // keep it down/right so it classifies
  await slash(p, mx - px * len / 2, my - py * len / 2, mx + px * len / 2, my + py * len / 2);
}
// Slash through stroke i's midpoint at a fixed screen angle (degrees).
async function slashThrough(p, i, deg, len = 80) {
  const g = await glyph(p);
  const pts = g.strokes[i].pts;
  const a = pts[0], b = pts[pts.length - 1];
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const r = deg * Math.PI / 180;
  await slash(p, mx - Math.cos(r) * len / 2, my - Math.sin(r) * len / 2,
                 mx + Math.cos(r) * len / 2, my + Math.sin(r) * len / 2);
}
const comps = p => p.evaluate(() => state.glyph.comps.map(c => c.range));
const worldEls = p => p.evaluate(() => ({
  n: state.world.els.length,
  kinds: state.world.els.map(e => e.k),
  seeds: state.world.els.map(e => e.seed),
  sizes: state.world.els.map(e => +e.s.toFixed(3)),
  relocks: __S1_METRICS.world.relocks,
}));

module.exports = { TARGET, TARGET_FILE, launch, boot, slash, slashStroke, slashStrokes, lockGlyph, crossSlash, slashThrough, glyph, comps, worldEls, M, sleep, W, H };
