/* ========================= 03 CANVAS + GEOMETRY ========================= */
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, DPR = 1, S = 0;
let GX = 0, GY = 0;
let SAFE_BOTTOM = 0; // real bottom clearance (notch/home-indicator/gesture-nav), read from CSS env()
let paperTex = null;
let worldLayer = null, wx = null; // offscreen world layer (attention recession composites it, S1-D027)
let eventLayer = null, ex = null; // live-heat overlay — composites at ≥EVENT_MIN_ALPHA (S1-D045)

const QUERY = new URLSearchParams(location.search);
// ?motion=1 override (S1-D077): a playtest lever — OS-level prefers-reduced-
// motion silently zeroes the whole camera system (S1-D072/D075), which is
// the right accessibility default but can make a motion-dependent pilot
// checkpoint look completely inert to a tester who has the OS setting on
// without either of you knowing why. ?motion=1 forces animation on.
const reduceMotion = QUERY.get('motion') === '1' ? false
  : !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const FORCED = QUERY.get('char');
const PACK_URL = QUERY.get('pack');
const SEED_PARAM = QUERY.get('seed');
// E2 gate resolution (S1-D054): build default from config, URL override —
// ?e2=1 is the pre-flip playtest switch, ?e2=0 the post-flip kill switch.
const E2_ON = QUERY.get('e2') !== null ? QUERY.get('e2') === '1' : E2_ENABLED;
window.__S1_FLAGS.e2 = E2_ON;

// window.innerWidth/innerHeight are the "large viewport" on mobile — they
// don't shrink for the browser's own address bar/toolbar, so H used to be
// reliably bigger than what's actually on screen (the mobile HUD-clip
// bug, twice: margin tuning alone couldn't fix a wrong H). visualViewport
// is the API built for exactly this — it reports the real visible area
// live, including toolbar/keyboard changes. Fall back to inner*/100vh's
// behavior only if a browser genuinely lacks it (very old mobile Chrome).
function viewportSize() {
  const vv = window.visualViewport;
  return vv ? { w: vv.width, h: vv.height } : { w: window.innerWidth, h: window.innerHeight };
}
function readSafeBottom() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom');
  const n = parseFloat(v);
  return isFinite(n) ? n : 0;
}
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  const vp = viewportSize();
  W = vp.w; H = vp.h;
  SAFE_BOTTOM = readSafeBottom();
  canvas.width = W * DPR; canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  S = Math.min(W, H) * 0.60;
  GX = (W - S) / 2;
  GY = (H - S) / 2 - Math.min(H * 0.03, 24);
  makePaper();
  worldLayer = document.createElement('canvas');
  worldLayer.width = W * DPR; worldLayer.height = H * DPR;
  wx = worldLayer.getContext('2d');
  wx.setTransform(DPR, 0, 0, DPR, 0, 0);
  eventLayer = document.createElement('canvas');
  eventLayer.width = W * DPR; eventLayer.height = H * DPR;
  ex = eventLayer.getContext('2d');
  ex.setTransform(DPR, 0, 0, DPR, 0, 0);
}
function makePaper() {
  paperTex = document.createElement('canvas');
  paperTex.width = W * DPR; paperTex.height = H * DPR;
  const p = paperTex.getContext('2d');
  p.setTransform(DPR, 0, 0, DPR, 0, 0);
  p.fillStyle = PAPER; p.fillRect(0, 0, W, H);
  for (let i = 0; i < 1300; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    const a = Math.random() * Math.PI, l = 2 + Math.random() * 9;
    p.strokeStyle = Math.random() < 0.5 ? 'rgba(126,104,70,0.045)' : 'rgba(90,80,60,0.035)';
    p.lineWidth = 0.8;
    p.beginPath(); p.moveTo(x, y); p.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); p.stroke();
  }
  // Scene furniture (S1-D061): the paper itself carries the landscape's
  // sky/ground division so the scroll reads as a SCENE even before anything
  // is written. All washes stay far above every ink-probe threshold — this
  // is tinted silk, not ink. No content is painted (no mountains, no
  // horizon line — those are the player's to write).
  const skyG = p.createLinearGradient(0, 0, 0, GROUND_FAR * H);
  skyG.addColorStop(0, 'rgba(206,216,224,0.20)');
  skyG.addColorStop(1, 'rgba(206,216,224,0)');
  p.fillStyle = skyG; p.fillRect(0, 0, W, GROUND_FAR * H);
  const gndG = p.createLinearGradient(0, GROUND_FAR * H, 0, H);
  gndG.addColorStop(0, 'rgba(196,178,140,0)');
  gndG.addColorStop(1, 'rgba(196,178,140,0.22)');
  p.fillStyle = gndG; p.fillRect(0, GROUND_FAR * H, W, H - GROUND_FAR * H);
  // Foreshortened ground grain: horizontal-leaning fibers that lengthen and
  // spread toward the near edge and converge toward the vanishing center at
  // the far line — the ground plane recedes like a real floor.
  for (let i = 0; i < 260; i++) {
    const q = Math.pow(Math.random(), 0.7); // bias strokes toward the near field
    const y = (GROUND_FAR + q * (1 - GROUND_FAR)) * H;
    const f = PERSP_FAR + q * (1 - PERSP_FAR);
    const x = W / 2 + (Math.random() - 0.5) * W * f;
    const l = (3 + Math.random() * 14) * (0.3 + q);
    p.strokeStyle = 'rgba(122,102,72,0.055)';
    p.lineWidth = 0.9;
    p.beginPath(); p.moveTo(x - l / 2, y); p.lineTo(x + l / 2, y + (Math.random() - 0.5) * 2); p.stroke();
  }
  const g = p.createRadialGradient(W/2, H/2, Math.min(W,H)*0.35, W/2, H/2, Math.max(W,H)*0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(88,68,40,0.13)');
  p.fillStyle = g; p.fillRect(0, 0, W, H);
}
window.addEventListener('resize', resize);
// visualViewport fires its OWN resize (toolbar show/hide, keyboard) and
// scroll (the visible region can shift without changing size) — window's
// resize event alone misses both on mobile, which is what let H drift
// stale in the first place.
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resize);
  window.visualViewport.addEventListener('scroll', resize);
}
resize();

function toScreen(pt) { return [GX + pt[0] / 100 * S, GY + pt[1] / 100 * S]; }
// Strokes are polylines (pts array) from M1a on; hand-authored strokes are
// 2-point polylines, pipeline medians carry more.
function strokeScreenPts(st) { return st.pts.map(toScreen); }
function strokeLen(st) {
  const p = strokeScreenPts(st);
  let L = 0;
  for (let i = 0; i < p.length - 1; i++) L += Math.hypot(p[i+1][0]-p[i][0], p[i+1][1]-p[i][1]);
  return L;
}
function midOf(st) {
  return pointAlong(st, 0.5);
}
// Point at fraction q of the stroke's arc length; also returns local direction.
function pointAlong(st, q) {
  const p = strokeScreenPts(st);
  const total = strokeLen(st) || 1;
  let want = q * total;
  for (let i = 0; i < p.length - 1; i++) {
    const seg = Math.hypot(p[i+1][0]-p[i][0], p[i+1][1]-p[i][1]);
    if (want <= seg || i === p.length - 2) {
      const t = seg ? Math.min(1, want / seg) : 0;
      const pt = [p[i][0] + (p[i+1][0]-p[i][0]) * t, p[i][1] + (p[i+1][1]-p[i][1]) * t];
      pt.dir = [p[i+1][0]-p[i][0], p[i+1][1]-p[i][1]];
      return pt;
    }
    want -= seg;
  }
  return p[p.length - 1];
}
function glyphBBox(g, padPx) {
  let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
  for (const st of g.strokes) {
    for (const pt of strokeScreenPts(st)) {
      x1 = Math.min(x1, pt[0]); y1 = Math.min(y1, pt[1]);
      x2 = Math.max(x2, pt[0]); y2 = Math.max(y2, pt[1]);
    }
  }
  const pad = padPx || 0;
  return [x1 - pad, y1 - pad, x2 - x1 + pad*2, y2 - y1 + pad*2];
}
