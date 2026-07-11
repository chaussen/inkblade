/* ========================= 10 WORLD RENDER ========================= *
 * Elements draw into the offscreen world layer (`wx`), which the
 * frame composites at the attention worldAlpha — recession is an
 * exact global-alpha multiplier on the whole world plane (S1-D019).
 * Kind → draw fn is a registry; kinds without an entry render as a
 * seal/stele (C3 self-healing — old saves with unknown kinds keep
 * their marks). World-born particles (leaves, embers) live in the
 * world layer so they recede with it.
 * =================================================================== */
const ELEMENT_DRAW = {
  tree: drawTreeEl, fire: drawFireEl, walker: drawWalkerElSolo, crowd: drawCrowdEl,
  resttree: drawRestTreeEl, peak: drawPeakEl, ridge: drawRidgeEl,
  terrace: drawTerraceEl, horizon: drawHorizonEl, path: drawPathEl, seal: drawSealEl,
  sun: drawSunEl, moon: drawMoonEl, field: drawFieldEl, water: drawWaterEl,
  flora: drawFloraEl, terrain: drawTerrainEl, figure: drawFigureEl,
  // chunk C batch 1 (S1-D066): every character earns a face
  bigfig: drawBigFigEl, gate: drawGateEl, horse: drawHorseEl, heart: drawHeartEl,
  wind: drawWindEl, bolt: drawBoltEl, cart: drawCartEl,
  banner: drawBannerEl, dwelling: drawDwellingEl, skylight: drawSkylightEl,
};
/* -------- the world breathes (S1-D072): motion-parallax camera -------- *
 * Idle drift + pointer pan, eased; each depth layer shifts proportionally
 * (near slides most, sky not at all). Render-only — worldScreenX, el.x,
 * saves, and every sim distance are untouched. The pan target freezes
 * while a trail is active so writing is never disturbed; reduced-motion
 * pins the camera at 0. */
const CAM = { px: 0, target: 0 };
window.__S1_CAM = CAM; // test-readable (smoke21)
window.addEventListener('pointermove', e => {
  if (trail || reduceMotion) return; // never steer the camera mid-slash
  CAM.target = Math.max(-1, Math.min(1, (e.clientX / W - 0.5) * 2));
}, { passive: true });
function updateCamera(dt, now){
  if (reduceMotion){ CAM.px = 0; return; }
  const drift = (Math.sin(now / 4200) + 0.35 * Math.sin(now / 1530)) * CAM_DRIFT * W;
  const want = CAM.target * CAM_POINTER * W + drift;
  CAM.px += (want - CAM.px) * Math.min(1, dt / CAM_EASE_MS);
}
// Per-layer shift for a world element (0 for the exempt sky/horizon).
function camShiftFor(el){
  if (DEPTH_EXEMPT[el.k]) return 0;
  return CAM.px * (PARALLAX_FAR + depthQ(el) * (PARALLAX_NEAR - PARALLAX_FAR));
}
// The ash/sprout/sapling/base draw decision (S1-D054), factored out so the
// WebGL pilot's offscreen sprite stamp (S1-D075) can reuse the EXACT SAME
// "what does this element currently look like" logic the 2D path uses —
// one definition, two consumers, never drifting apart. No glow/particles
// here (drawBurnFx is a separate call the 2D loop makes only for live
// burning/embers/smoke phases) — a stamp texture shouldn't carry FX.
function drawGroundMatter(el, draw, now, pe){
  const bp = el.burn && el.burn.phase;
  if (bp === 'ash') { drawBurnAsh(el, now, pe); return; }
  if (bp === 'sprout') { drawBurnSprout(el, now, pe); return; }
  if (bp === 'sapling'){
    const q = ECOLOGY && ECOLOGY.regrow ? Math.min(1, el.burn.t / ECOLOGY.regrow.saplingMs) : 1;
    const young = { ...el, s: el.s * (0.35 + 0.65 * q) };
    if (draw) draw(young, now, pe); else { el.sealFallback = true; drawSealEl(el, now, pe); }
    return;
  }
  if (draw) draw(el, now, pe);
  else { el.sealFallback = true; drawSealEl(el, now, pe); } // unknown kind self-heals to a seal
}
function drawWorld(dt, now){
  // the backdrop means an empty world is still a place (S1-D063/D064) —
  // the old empty-world early-return is gone
  METRICS.perf.worldLayer = state.world.els.length > 0 || state.worldParticles.length > 0;
  updateCamera(dt, now);
  const worldCtx = wx;
  worldCtx.clearRect(0, 0, W, H);
  ex.clearRect(0, 0, W, H);
  drawBackdrop(now);
  // the WebGL pilot (S1-D075, ?r3d=1) takes over ground-matter rendering —
  // default path (r3d unset, or GL init failed) is drawGroundElements2D,
  // byte-identical to the pre-pilot build
  if (R3D_ON && r3dReady()) drawGroundR3D(now);
  else drawGroundElements2D(now);
  wx = worldCtx;
  drawMist();
  drawForeground();
  drawWorldParticles(dt);
  ctx.save();
  ctx.globalAlpha = attention.worldAlpha;
  ctx.drawImage(worldLayer, 0, 0, W, H);
  // fire is light: live events hold ≥EVENT_MIN_ALPHA under the veil
  ctx.globalAlpha = Math.max(attention.worldAlpha, EVENT_MIN_ALPHA);
  ctx.drawImage(eventLayer, 0, 0, W, H);
  ctx.restore();
}
function drawGroundElements2D(now){
  const worldCtx = wx;
  // painter's algorithm down the depth axis (S1-D041): sky first, then
  // ground far→near so near occludes far — y is depth
  const els = [...state.world.els].sort((a, b) =>
    (ZI[a.k] === 0 ? -1 : a.y) - (ZI[b.k] === 0 ? -1 : b.y));
  drawContactShadows(els, now);
  for (const el of els){
    if (el.transit) continue; // ink in flight — it hasn't landed yet (S1-D069)
    const age = el.born ? now - el.born : 1e9;
    if (age < 0) continue; // planted between frames; rAF timestamp lags performance.now()
    const p = Math.max(0, Math.min(1, age / 700));
    const pe = 1 - Math.pow(1 - p, 3);
    // live heat draws on the burn-through overlay (S1-D045); all else recedes
    wx = isLiveHeat(el) ? ex : worldCtx;
    const k = depthK(el);
    wx.save();
    // perspective convergence (S1-D061) + camera parallax (S1-D072): shift
    // the whole element to its converged, camera-shifted screen x —
    // renderers keep drawing at el.x*W and inherit both
    const cdx = (worldScreenX(el) - el.x) * W + camShiftFor(el);
    if (cdx) wx.translate(cdx, 0);
    if (k !== 1){
      // scale the whole element (line weights included) about its ground anchor
      const ax = el.x * W, ay = el.y * H;
      wx.translate(ax, ay); wx.scale(k, k); wx.translate(-ax, -ay);
    }
    const draw = ELEMENT_DRAW[el.k];
    // E2 burn walk (S1-D054): a kindled element's regrowth phases REPLACE its
    // form (ash mound → sprout → sapling of the SAME seed growing back);
    // while it burns, its matter stays on the world layer and its fire is
    // drawn as light on the burn-through overlay.
    const bp = el.burn && el.burn.phase;
    drawGroundMatter(el, draw, now, pe);
    if (bp && bp !== 'ash' && bp !== 'sprout' && bp !== 'sapling') drawBurnFx(el, now, pe);
    if (el.fresh && age < 900){
      const q = age / 900;
      wx.save();
      wx.globalAlpha = (1 - q) * 0.6;
      wx.strokeStyle = GOLD; wx.lineWidth = 2.5;
      wx.beginPath(); wx.arc(el.x * W, el.y * H - S * 0.03, 10 + q * S * 0.12, 0, Math.PI * 2); wx.stroke();
      wx.restore();
    }
    wx.restore();
  }
}
/* -------- the illustrated valley (S1-D063/D064) -------- *
 * An always-present backdrop so the world reads as a PLACE, not a void:
 * distant ridgelines, drifting clouds, ground tufts with perspective
 * density. Pure presentation furniture — no pack content, no save impact,
 * laid out from a FIXED seed (the valley is the same place every session;
 * ?seed= world randomness is untouched). It draws on the world layer, so
 * it recedes behind the veil while writing and blooms on lock like the
 * rest of the living scroll. Geometry is cached per resize; the per-frame
 * cost is a handful of path fills. Tones sit far above every ink-probe
 * threshold — silk, not ink (smoke18 T5/T6). */
let BACKDROP = null;
function buildBackdrop(){
  const r = rng(42);
  const ridges = [];
  // three overlapping ridgelines above the horizon band, farther = paler
  for (let i = 0; i < 3; i++){
    const baseY = 0.555 - i * 0.035;
    const pts = [];
    const n = 7 + Math.floor(r() * 3);
    for (let j = 0; j <= n; j++){
      const px = j / n;
      pts.push([px, baseY - (0.025 + r() * 0.045) * Math.sin(px * Math.PI * (1.5 + i * 0.5) + r() * 2) - r() * 0.012]);
    }
    ridges.push({ pts, baseY, alpha: 0.20 - i * 0.055 });
  }
  const clouds = [];
  for (let i = 0; i < 4; i++){
    clouds.push({
      x: r(), y: 0.10 + r() * 0.22, s: 0.5 + r() * 0.8,
      speed: 0.000007 + r() * 0.000005, puffs: 3 + Math.floor(r() * 2), seed: Math.floor(r() * 1e6),
    });
  }
  const tufts = [];
  for (let i = 0; i < 56; i++){
    const q = Math.pow(r(), 0.75); // denser near
    const y = GROUND_FAR + 0.03 + q * (1 - GROUND_FAR - 0.06);
    const f = PERSP_FAR + q * (1 - PERSP_FAR);
    tufts.push({ x: 0.5 + (r() - 0.5) * 0.96 * f, y, q, kind: r() < 0.75 ? 'grass' : 'pebble', seed: Math.floor(r() * 1e6) });
  }
  // foreground occluder band (S1-D072): a few large near-field clumps that
  // slide FASTEST and stand in front of near matter — the depth sandwich.
  // Non-overlapping by construction; each draws as ONE single-fill path
  // (the S1-D062 batched-shadow trick), so self-overlap can never darken
  // below the ink-probe thresholds.
  const fg = [];
  for (let i = 0; i < FG_CLUMPS; i++){
    const x = (i + 0.15 + r() * 0.7) / FG_CLUMPS; // one per lane — never overlapping
    fg.push({ x, y: 0.965 + r() * 0.045, s: 0.8 + r() * 0.5,
              kind: r() < 0.7 ? 'grass' : 'stone', seed: Math.floor(r() * 1e6) });
  }
  BACKDROP = { ridges, clouds, tufts, fg };
  window.__S1_SCENE = { ridges: ridges.length, clouds: clouds.length, tufts: tufts.length, fg: fg.length };
}
function drawBackdrop(now){
  if (!BACKDROP) buildBackdrop();
  const B = BACKDROP;
  wx.save();
  // ridgelines, far to near — each slides a touch under the camera (S1-D072)
  for (let i = B.ridges.length - 1; i >= 0; i--){
    const rd = B.ridges[i];
    const shift = CAM.px * (0.10 - i * 0.03);
    wx.fillStyle = 'rgba(122,132,152,' + rd.alpha + ')';
    wx.beginPath();
    wx.moveTo(-24, GROUND_FAR * H + 6);
    for (const [px, py] of rd.pts) wx.lineTo(px * W + shift, py * H);
    wx.lineTo(W + 24, GROUND_FAR * H + 6);
    wx.closePath(); wx.fill();
  }
  // clouds — brighter than the paper, drifting slowly (a child can watch one cross)
  for (const c of B.clouds){
    const cx = ((c.x + now * c.speed) % 1.2 - 0.1) * W + CAM.px * 0.06;
    const cy = c.y * H, cs = S * 0.09 * c.s;
    wx.fillStyle = 'rgba(252,249,240,0.55)';
    for (let j = 0; j < c.puffs; j++){
      const ox = (j - (c.puffs - 1) / 2) * cs * 0.75;
      const rr = cs * (0.55 + (((c.seed >> j) % 5) / 10));
      wx.beginPath(); wx.ellipse(cx + ox, cy + (j % 2 ? cs * 0.10 : 0), rr, rr * 0.62, 0, 0, Math.PI * 2); wx.fill();
    }
  }
  // ground tufts + pebbles, perspective-scaled, camera-shifted by depth
  for (const t of B.tufts){
    const X = t.x * W + CAM.px * (PARALLAX_FAR + t.q * (PARALLAX_NEAR - PARALLAX_FAR)), Y = t.y * H;
    const k = DEPTH_SCALE_FAR + t.q * (DEPTH_SCALE_NEAR - DEPTH_SCALE_FAR);
    if (t.kind === 'grass'){
      const h = S * 0.016 * k;
      wx.strokeStyle = 'rgba(122,136,96,0.30)'; wx.lineWidth = Math.max(0.7, h * 0.12); wx.lineCap = 'round';
      for (let j = -1; j <= 1; j++){
        wx.beginPath(); wx.moveTo(X, Y);
        wx.quadraticCurveTo(X + j * h * 0.35, Y - h * 0.6, X + j * h * 0.7, Y - h * (0.8 + (j === 0 ? 0.25 : 0)));
        wx.stroke();
      }
    } else {
      const w2 = S * 0.007 * k;
      wx.fillStyle = 'rgba(150,142,126,0.32)';
      wx.beginPath(); wx.ellipse(X, Y, w2, w2 * 0.6, 0, 0, Math.PI * 2); wx.fill();
    }
  }
  wx.restore();
}
// Foreground occluder band (S1-D072): large near-field clumps drawn OVER
// the element pass, sliding fastest under the camera — matter now has
// things both behind and in front of it. Each clump is ONE single-fill
// path at low alpha (self-overlap can't double-darken, so the blended tone
// stays far above every ink-probe threshold — silk, not ink).
function drawForeground(){
  if (!BACKDROP) return;
  wx.save();
  for (const f of BACKDROP.fg){
    const X = f.x * W + CAM.px * PARALLAX_FG;
    const Y = f.y * H;
    const r = rng(f.seed);
    if (f.kind === 'grass'){
      const h = S * 0.10 * f.s;
      wx.fillStyle = 'rgba(108,122,86,0.32)';
      wx.beginPath();
      const n = 5;
      for (let i = 0; i < n; i++){
        const a = (i / (n - 1) - 0.5) * 1.3 + (r() - 0.5) * 0.25;
        const bh = h * (0.6 + r() * 0.5);
        const bx = X + a * bh * 0.9, bw = h * 0.045;
        wx.moveTo(X - bw + i * bw * 0.4, Y);
        wx.quadraticCurveTo(X + a * bh * 0.4, Y - bh * 0.65, bx, Y - bh);
        wx.quadraticCurveTo(X + a * bh * 0.5 + bw, Y - bh * 0.55, X + bw + i * bw * 0.4, Y);
        wx.closePath();
      }
      wx.fill();
    } else {
      const w2 = S * 0.05 * f.s;
      wx.fillStyle = 'rgba(138,130,114,0.34)';
      wx.beginPath();
      wx.moveTo(X - w2, Y);
      wx.quadraticCurveTo(X - w2 * 0.7, -w2 * 0.75 + Y, X - w2 * 0.1, Y - w2 * (0.8 + r() * 0.2));
      wx.quadraticCurveTo(X + w2 * 0.65, Y - w2 * 0.7, X + w2, Y);
      wx.closePath(); wx.fill();
    }
  }
  wx.restore();
}
// Contact shadows (S1-D061): a soft ground ellipse anchors matter to the
// plane — under everything except sky/horizon, heat (fire is light), and wet
// matter (a pool casts nothing). All shadows are ONE batched path filled at a
// single alpha (perf: one fill, and overlaps never double-darken); depth
// scale and convergence are applied numerically, no per-element transforms.
function drawContactShadows(els, now){
  wx.save();
  wx.globalAlpha = SHADOW_ALPHA;
  wx.fillStyle = 'rgba(60,52,40,1)';
  wx.beginPath();
  for (const el of els){
    if (el.transit || DEPTH_EXEMPT[el.k] || kindHasTag(el.k, 'heat') || kindHasTag(el.k, 'wet')) continue;
    const age = el.born ? now - el.born : 1e9;
    if (age < 0) continue;
    const pe = 1 - Math.pow(1 - Math.max(0, Math.min(1, age / 700)), 3);
    const k = depthK(el);
    const sx = worldScreenX(el) * W + camShiftFor(el), sy = el.y * H + S * 0.004 * k;
    const rx = S * 0.05 * el.s * k * pe, ry = S * 0.013 * el.s * k * pe;
    if (rx < 1) continue;
    wx.moveTo(sx + rx, sy);
    wx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
  }
  wx.fill();
  wx.restore();
}
// Atmospheric perspective (S1-D041, deepened S1-D061): a paper-tone mist
// band over the far zone, then a gentler second stage dissolving on into the
// midfield — distance reads as ink dissolving into the paper, the shan-shui
// way, and the fade is continuous instead of a single band.
function drawMist(){
  const y0 = MIST_TOP * H, y1 = MIST_BOTTOM * H;
  const g = wx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, 'rgba(236,227,207,' + MIST_ALPHA + ')');
  g.addColorStop(1, 'rgba(236,227,207,' + MIST2_ALPHA + ')');
  wx.fillStyle = g;
  wx.fillRect(0, y0, W, y1 - y0);
  const y2 = MIST2_BOTTOM * H;
  const g2 = wx.createLinearGradient(0, y1, 0, y2);
  g2.addColorStop(0, 'rgba(236,227,207,' + MIST2_ALPHA + ')');
  g2.addColorStop(1, 'rgba(236,227,207,0)');
  wx.fillStyle = g2;
  wx.fillRect(0, y1, W, y2 - y1);
}
function drawWorldParticles(dt) {
  for (const p of state.worldParticles) {
    p.life -= dt / 1000;
    p.vy += p.grav * dt / 1000;
    p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000;
    if (p.life <= 0) continue;
    const g = p.hot ? ex : wx; // sparks ride the burn-through overlay
    g.globalAlpha = Math.min(1, p.life * 2);
    g.fillStyle = p.color;
    g.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
  }
  wx.globalAlpha = 1; ex.globalAlpha = 1;
  state.worldParticles = state.worldParticles.filter(p => p.life > 0);
}
function drawTreeEl(el, now, p){
  const X = el.x * W, Y = el.y * H;
  const r = rng(el.seed);
  const h = S * 0.16 * el.s * p * (0.9 + r() * 0.3);
  // heat haze (S1-D045): a tree near live fire shimmers — faster, deeper
  // sway. Never damage; E1 touches nothing the player planted.
  const swT = el.hot ? 480 : 1400, swA = el.hot ? 0.055 : 0.03;
  const sway = Math.sin(now / swT + el.seed % 10) * swA;
  const lean = (r() - 0.5) * 0.24;
  wx.save(); wx.translate(X, Y); wx.rotate(sway * 0.6);
  wx.strokeStyle = '#4a3a26'; wx.lineCap = 'round'; wx.globalAlpha = 0.9;
  wx.lineWidth = Math.max(1.5, S * 0.013 * el.s);
  wx.beginPath(); wx.moveTo(0, 0); wx.quadraticCurveTo(h * lean, -h * 0.55, h * lean * 1.6, -h); wx.stroke();
  wx.lineWidth = Math.max(1, S * 0.007 * el.s);
  wx.beginPath(); wx.moveTo(h * lean * 0.5, -h * 0.5); wx.lineTo(h * lean * 0.5 - h * 0.28, -h * 0.72); wx.stroke();
  wx.beginPath(); wx.moveTo(h * lean * 0.8, -h * 0.7); wx.lineTo(h * lean * 0.8 + h * 0.26, -h * 0.9); wx.stroke();
  const nb = 2 + Math.floor(r() * 3);
  for (let i = 0; i < nb; i++){
    const fx = h * lean * 1.2 + (r() - 0.5) * h * 0.7, fy = -h * (0.75 + r() * 0.35), fr = h * (0.22 + r() * 0.16);
    wx.fillStyle = `rgba(${86 + Math.floor(r()*24)},${104 + Math.floor(r()*20)},${70 + Math.floor(r()*16)},0.55)`;
    wx.beginPath(); wx.ellipse(fx, fy + Math.sin(now / swT + el.seed % 10 + i) * (el.hot ? 3 : 2), fr * 1.2, fr * 0.8, 0, 0, Math.PI * 2); wx.fill();
  }
  wx.restore();
  if (Math.random() < 0.0015) addParticle(state.worldParticles, {
    x: X + (Math.random() - 0.5) * h * 0.8, y: Y - h * 0.8,
    vx: (Math.random() - 0.5) * 12, vy: 8 + Math.random() * 10,
    grav: 6, life: 2.2, size: 2, color: '#7f9c53' }, MAX_WORLD_PARTICLES);
}
function drawWalkerElSolo(el, now, p){ drawWalkerEl(el, now, p, 0, 0); }
function drawCrowdEl(el, now, p){
  for (let i = 0; i < 3; i++) drawWalkerEl({ ...el, s: el.s * (0.88 + ((el.seed >> i) % 3) * 0.09), seed: el.seed + i * 7 }, now, p, i * 2.1, (i - 1) * 0.032);
}
function drawWalkerEl(el, now, p, phase, gx){
  const B = el.beh;
  const resting = B && B.mode === 'rest';
  // hearth-calm (S1-D045): a walker warming by live fire stands nearly
  // still — a gathering around the light, not a walk-by
  const calm = !resting && el.hot && B && B.mode === 'wander';
  const span = resting ? 0 : calm ? 0.005 : 0.03 + (el.seed % 7) * 0.01;
  const T = 7000 + (el.seed % 9) * 900;
  const ph = now / T * 2 * Math.PI + el.seed % 100 + phase;
  const wxp = clamp01(el.x + gx + Math.sin(ph) * span) * W;
  const dir = Math.cos(ph) >= 0 ? 1 : -1;
  const hop = B && B.hopT > 0 ? Math.sin((1 - B.hopT / 400) * Math.PI) * 7 * el.s : 0;
  const bob = (resting ? Math.abs(Math.sin(now / 900 + el.seed)) * 1.2
             : calm    ? Math.abs(Math.sin(now / 700 + el.seed)) * 1.5
             : Math.abs(Math.sin(now / 240 + el.seed)) * 2.5) * el.s + hop;
  const size = S * 0.062 * el.s * p;
  if (size < 2) return;
  wx.save(); wx.translate(wxp, el.y * H - bob); wx.scale(dir, 1);
  wx.globalAlpha = 0.92; wx.fillStyle = '#241f18';
  wx.font = size + 'px ' + CHAR_FONT; wx.textAlign = 'center'; wx.textBaseline = 'alphabetic';
  wx.fillText('人', 0, 0);
  wx.restore();
}
function drawRestTreeEl(el, now, p){
  drawTreeEl(el, now, p);
  const size = S * 0.045 * el.s * p;
  if (size < 2) return;
  const breath = 1 + 0.02 * Math.sin(now / 900 + el.seed);
  wx.save(); wx.translate(el.x * W + S * 0.03 * el.s, el.y * H); wx.scale(breath, breath);
  wx.globalAlpha = 0.85; wx.fillStyle = '#241f18';
  wx.font = size + 'px ' + CHAR_FONT; wx.textAlign = 'center'; wx.textBaseline = 'alphabetic';
  wx.fillText('人', 0, 0);
  wx.restore();
}
function drawFireEl(el, now, p){
  const X = el.x * W, Y = el.y * H, s = el.s * p;
  if (s < 0.05) return;
  // R4 mortal lifecycle: embers → smoke → fading ash mark
  const L = el.life;
  if (L && L.phase !== 'burning'){ drawFireAftermath(el, now, s, X, Y); return; }
  const flareK = L && L.flare > 0 ? 1.35 : 1;
  wx.save();
  wx.strokeStyle = '#4a3a26'; wx.lineWidth = Math.max(1.5, S * 0.010 * s); wx.lineCap = 'round'; wx.globalAlpha = 0.85;
  wx.beginPath(); wx.moveTo(X - S*0.03*s, Y); wx.lineTo(X + S*0.03*s, Y - S*0.012*s); wx.stroke();
  wx.beginPath(); wx.moveTo(X - S*0.028*s, Y - S*0.012*s); wx.lineTo(X + S*0.03*s, Y); wx.stroke();
  const fl = (0.8 + 0.2 * Math.sin(now/95 + el.seed) + 0.1 * Math.sin(now/41 + el.seed*2)) * flareK;
  const g = wx.createRadialGradient(X, Y - S*0.02*s, 2, X, Y - S*0.02*s, Math.max(4, S*0.13*s*fl));
  g.addColorStop(0, 'rgba(232,161,58,0.55)'); g.addColorStop(1, 'rgba(232,161,58,0)');
  wx.fillStyle = g; wx.fillRect(X - S*0.14*s, Y - S*0.18*s, S*0.28*s, S*0.26*s);
  for (let i = 0; i < 3; i++){
    const fh = S * (0.05 + 0.022*i) * s * fl * (1 + 0.15 * Math.sin(now/70 + el.seed + i*2));
    const fw = S * 0.018 * s * (1.5 - i*0.35);
    wx.fillStyle = i === 2 ? 'rgba(238,178,72,0.75)' : i ? 'rgba(226,120,40,0.85)' : 'rgba(178,57,42,0.8)';
    wx.beginPath();
    wx.moveTo(X - fw, Y);
    wx.quadraticCurveTo(X - fw*0.6, Y - fh*0.55, X + Math.sin(now/110 + el.seed + i) * fw * 0.8, Y - fh);
    wx.quadraticCurveTo(X + fw*0.6, Y - fh*0.5, X + fw, Y);
    wx.closePath(); wx.fill();
  }
  wx.restore();
  // sparks — a fountain of them while flaring (S1-D045 spectacle)
  const sparkP = (L && L.flare > 0 ? 0.4 : 0.08) * s;
  if (Math.random() < sparkP) addParticle(state.worldParticles, {
    x: X + (Math.random()-0.5) * 10 * s, y: Y - S*0.05*s,
    vx: (Math.random()-0.5) * (L && L.flare > 0 ? 26 : 10), vy: -25 - Math.random()*30,
    grav: -15, life: 0.8 + Math.random()*0.6, hot: true,
    size: 1.5 + Math.random()*1.5, color: Math.random() < 0.5 ? '#e8a13a' : '#b2392a' }, MAX_WORLD_PARTICLES);
}
function drawPeakEl(el, now, p){
  const X = el.x * W, Y = el.y * H, h = S * 0.34 * el.s * p, w = h * 1.25;
  if (h < 2) return;
  wx.save();
  wx.fillStyle = 'rgba(96,102,122,0.16)';
  wx.beginPath(); wx.moveTo(X - w, Y); wx.quadraticCurveTo(X - w*0.25, Y - h*0.7, X, Y - h);
  wx.quadraticCurveTo(X + w*0.3, Y - h*0.6, X + w, Y); wx.closePath(); wx.fill();
  const mx = Math.sin(now / 5200 + el.seed) * w * 0.3;
  wx.fillStyle = 'rgba(236,227,207,0.5)';
  wx.beginPath(); wx.ellipse(X + mx, Y - h*0.42, w*0.55, h*0.09, 0, 0, Math.PI*2); wx.fill();
  wx.restore();
}
function drawRidgeEl(el, now, p){
  const X = el.x * W, Y = el.y * H, w = S * 0.3 * el.s * p;
  wx.save(); wx.strokeStyle = 'rgba(96,102,122,0.30)'; wx.lineWidth = 2;
  wx.beginPath(); wx.moveTo(X - w, Y);
  wx.quadraticCurveTo(X - w*0.3, Y - S*0.05*el.s, X, Y - S*0.02*el.s);
  wx.quadraticCurveTo(X + w*0.4, Y - S*0.06*el.s, X + w, Y);
  wx.stroke(); wx.restore();
}
function drawTerraceEl(el, now, p){
  const X = el.x * W, Y = el.y * H;
  wx.save(); wx.strokeStyle = 'rgba(70,62,48,0.28)'; wx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++){
    const w = S * (0.10 - 0.02*i) * el.s * p;
    wx.beginPath(); wx.moveTo(X - w, Y - i * S*0.018*el.s); wx.lineTo(X + w, Y - i * S*0.018*el.s); wx.stroke();
  }
  wx.restore();
}
function drawHorizonEl(el, now, p){
  wx.save(); wx.strokeStyle = 'rgba(70,62,48,0.35)'; wx.lineWidth = 2.5; wx.globalAlpha = p;
  wx.beginPath(); wx.moveTo(W * 0.03, el.y * H); wx.lineTo(W * 0.97, el.y * H); wx.stroke();
  wx.restore();
}
function drawPathEl(el, now, p){
  const X = el.x * W, Y = el.y * H, w = S * 0.09 * el.s * p;
  wx.save(); wx.strokeStyle = 'rgba(70,62,48,0.25)'; wx.lineWidth = 3; wx.lineCap = 'round';
  wx.beginPath(); wx.moveTo(X - w, Y + w*0.35); wx.lineTo(X + w, Y - w*0.35); wx.stroke();
  wx.beginPath(); wx.moveTo(X - w*0.8, Y - w*0.4); wx.lineTo(X + w*0.8, Y + w*0.4); wx.stroke();
  wx.restore();
}
function drawFireAftermath(el, now, s, X, Y){
  const L = el.life, F = ECOLOGY ? ECOLOGY.fire : null;
  wx.save();
  if (L.phase !== 'ash'){
    // charred logs remain through embers and smoke
    wx.strokeStyle = 'rgba(40,34,28,0.8)'; wx.lineWidth = Math.max(1.5, S * 0.010 * s); wx.lineCap = 'round';
    wx.beginPath(); wx.moveTo(X - S*0.03*s, Y); wx.lineTo(X + S*0.03*s, Y - S*0.012*s); wx.stroke();
    wx.beginPath(); wx.moveTo(X - S*0.028*s, Y - S*0.012*s); wx.lineTo(X + S*0.03*s, Y); wx.stroke();
  }
  if (L.phase === 'embers' && F){
    const q = 1 - L.t / F.emberMs;
    const pulse = 0.6 + 0.4 * Math.sin(now / 260 + el.seed);
    const g = wx.createRadialGradient(X, Y, 1, X, Y, Math.max(3, S * 0.05 * s));
    g.addColorStop(0, 'rgba(214,90,40,' + (0.45 * q * pulse) + ')');
    g.addColorStop(1, 'rgba(214,90,40,0)');
    wx.fillStyle = g; wx.fillRect(X - S*0.06*s, Y - S*0.06*s, S*0.12*s, S*0.12*s);
  } else if (L.phase === 'smoke' && F){
    if (Math.random() < 0.10) addParticle(state.worldParticles, {
      x: X + (Math.random()-0.5) * 8 * s, y: Y - S*0.02*s,
      vx: (Math.random()-0.5) * 6 + 3, vy: -14 - Math.random()*10,
      grav: -6, life: 1.6 + Math.random()*0.9,
      size: 2 + Math.random()*2, color: 'rgba(120,116,108,0.5)' }, MAX_WORLD_PARTICLES);
  } else if (L.phase === 'ash' && ECOLOGY){
    const q = Math.max(0, 1 - L.t / ECOLOGY.ashDecayMs); // fades as the scroll heals
    wx.globalAlpha = 0.5 * q;
    wx.fillStyle = 'rgba(52,48,44,1)';
    wx.beginPath(); wx.ellipse(X, Y, S*0.035*s, S*0.012*s, 0, 0, Math.PI*2); wx.fill();
    wx.globalAlpha = 0.3 * q;
    wx.beginPath(); wx.ellipse(X - S*0.015*s, Y - S*0.004*s, S*0.014*s, S*0.006*s, 0, 0, Math.PI*2); wx.fill();
  }
  wx.restore();
}
/* -------- E2 burn/regrowth visuals (S1-D054) -------- *
 * Burning matter is drawn by its own renderer; these add the fire ON it
 * (light → the `ex` overlay, S1-D045) and replace it through the regrowth
 * walk. Pure geometry, clocks read from pack data. */
function drawBurnFx(el, now, p, pos){
  const B = el.burn, F = ECOLOGY ? ECOLOGY.fire : null;
  // pos override (S1-D075): lets the WebGL pilot reposition this glow onto
  // a billboard's true projected screen point — the 2D path never passes it
  const X = pos ? pos.X : el.x * W, Y = pos ? pos.Y : el.y * H, s = pos ? pos.s : el.s * p;
  const g0 = wx; wx = ex; // fire is light: it burns through the veil
  wx.save();
  if (B.phase === 'burning'){
    const flareK = B.flare > 0 ? 1.35 : 1;
    const fl = (0.8 + 0.2 * Math.sin(now/95 + el.seed) + 0.1 * Math.sin(now/43 + el.seed*2)) * flareK;
    const glow = wx.createRadialGradient(X, Y - S*0.06*s, 2, X, Y - S*0.06*s, Math.max(4, S*0.15*s*fl));
    glow.addColorStop(0, 'rgba(232,161,58,0.5)'); glow.addColorStop(1, 'rgba(232,161,58,0)');
    wx.fillStyle = glow; wx.fillRect(X - S*0.16*s, Y - S*0.22*s, S*0.32*s, S*0.30*s);
    for (let i = 0; i < 3; i++){
      const ox = (i - 1) * S * 0.022 * s;
      const fh = S * (0.06 + 0.02 * i) * s * fl * (1 + 0.18 * Math.sin(now/75 + el.seed + i*2));
      const fw = S * 0.014 * s * (1.4 - i*0.3);
      wx.fillStyle = i === 2 ? 'rgba(238,178,72,0.7)' : i ? 'rgba(226,120,40,0.8)' : 'rgba(178,57,42,0.75)';
      wx.beginPath();
      wx.moveTo(X + ox - fw, Y);
      wx.quadraticCurveTo(X + ox - fw*0.5, Y - fh*0.5, X + ox + Math.sin(now/105 + el.seed + i) * fw, Y - fh);
      wx.quadraticCurveTo(X + ox + fw*0.5, Y - fh*0.5, X + ox + fw, Y);
      wx.closePath(); wx.fill();
    }
    const sparkP = (B.flare > 0 ? 0.35 : 0.07) * s;
    if (Math.random() < sparkP) addParticle(state.worldParticles, {
      x: X + (Math.random()-0.5) * 14 * s, y: Y - S*0.07*s,
      vx: (Math.random()-0.5) * (B.flare > 0 ? 24 : 10), vy: -22 - Math.random()*26,
      grav: -14, life: 0.7 + Math.random()*0.6, hot: true,
      size: 1.5 + Math.random()*1.5, color: Math.random() < 0.5 ? '#e8a13a' : '#b2392a' }, MAX_WORLD_PARTICLES);
  } else if (B.phase === 'embers' && F){
    const q = 1 - B.t / F.emberMs;
    const pulse = 0.6 + 0.4 * Math.sin(now / 240 + el.seed);
    const g = wx.createRadialGradient(X, Y, 1, X, Y, Math.max(3, S * 0.05 * s));
    g.addColorStop(0, 'rgba(214,90,40,' + (0.4 * q * pulse) + ')');
    g.addColorStop(1, 'rgba(214,90,40,0)');
    wx.fillStyle = g; wx.fillRect(X - S*0.06*s, Y - S*0.06*s, S*0.12*s, S*0.12*s);
  } else if (B.phase === 'smoke'){
    if (Math.random() < 0.10) addParticle(state.worldParticles, {
      x: X + (Math.random()-0.5) * 8 * s, y: Y - S*0.05*s,
      vx: (Math.random()-0.5) * 6 + 3, vy: -14 - Math.random()*10,
      grav: -6, life: 1.6 + Math.random()*0.9,
      size: 2 + Math.random()*2, color: 'rgba(120,116,108,0.5)' }, MAX_WORLD_PARTICLES);
  }
  wx.restore();
  wx = g0;
}
function drawBurnAsh(el, now, p){
  const B = el.burn, R = ECOLOGY ? ECOLOGY.regrow : null;
  const X = el.x * W, Y = el.y * H, s = el.s * p;
  const q = R ? Math.max(0.35, 1 - B.t / R.ashMs) : 1; // fades toward the sprout
  wx.save();
  wx.globalAlpha = 0.5 * q;
  wx.fillStyle = 'rgba(52,48,44,1)';
  wx.beginPath(); wx.ellipse(X, Y, S*0.045*s, S*0.014*s, 0, 0, Math.PI*2); wx.fill();
  wx.globalAlpha = 0.3 * q;
  wx.beginPath(); wx.ellipse(X - S*0.018*s, Y - S*0.005*s, S*0.018*s, S*0.007*s, 0, 0, Math.PI*2); wx.fill();
  // a charred stub keeps the mark's place — nothing is erased, it waits
  wx.globalAlpha = 0.55 * q;
  wx.strokeStyle = 'rgba(40,34,28,1)'; wx.lineCap = 'round';
  wx.lineWidth = Math.max(1.2, S * 0.008 * s);
  wx.beginPath(); wx.moveTo(X, Y); wx.lineTo(X + S*0.008*s, Y - S*0.03*s); wx.stroke();
  wx.restore();
}
function drawBurnSprout(el, now, p){
  const B = el.burn, R = ECOLOGY ? ECOLOGY.regrow : null;
  const X = el.x * W, Y = el.y * H;
  const q = R ? Math.min(1, B.t / R.sproutMs) : 1;
  const h = S * 0.035 * el.s * p * (0.4 + 0.6 * q);
  if (h < 1.5) return;
  const sway = Math.sin(now / 1600 + el.seed % 10) * 1.2;
  wx.save(); wx.translate(X, Y);
  wx.strokeStyle = 'rgba(104,128,74,0.8)'; wx.lineCap = 'round';
  wx.lineWidth = Math.max(1, S * 0.004 * el.s);
  wx.beginPath(); wx.moveTo(0, 0); wx.quadraticCurveTo(sway * 0.3, -h * 0.5, sway * 0.6, -h * 0.8); wx.stroke();
  wx.fillStyle = 'rgba(104,128,74,0.6)';
  wx.beginPath(); wx.ellipse(-h * 0.2 + sway * 0.4, -h * 0.55, h * 0.24, h * 0.11, -0.5, 0, Math.PI * 2); wx.fill();
  wx.beginPath(); wx.ellipse(h * 0.24 + sway * 0.5, -h * 0.72, h * 0.24, h * 0.11, 0.5, 0, Math.PI * 2); wx.fill();
  wx.restore();
}
// The sky axis (S1-D017: "the world gains a sky when the move-set does" —
// C1 folds unlock 日/月, so it does now). Sun and moon are unique elements.
function drawSunEl(el, now, p){
  const X = el.x * W, Y = el.y * H, r = S * 0.065 * el.s * p;
  if (r < 2) return;
  const breathe = 1 + 0.03 * Math.sin(now / 2600 + el.seed);
  wx.save();
  const g = wx.createRadialGradient(X, Y, r * 0.4, X, Y, r * 2.6 * breathe);
  g.addColorStop(0, 'rgba(217,120,60,0.30)'); g.addColorStop(1, 'rgba(217,120,60,0)');
  wx.fillStyle = g; wx.fillRect(X - r * 3, Y - r * 3, r * 6, r * 6);
  wx.fillStyle = 'rgba(190,80,50,0.65)';
  wx.beginPath(); wx.arc(X, Y, r * breathe, 0, Math.PI * 2); wx.fill();
  wx.strokeStyle = 'rgba(120,50,35,0.5)'; wx.lineWidth = 1.5;
  wx.beginPath(); wx.arc(X, Y, r * breathe, 0, Math.PI * 2); wx.stroke();
  wx.restore();
}
function drawMoonEl(el, now, p){
  const X = el.x * W + Math.sin(now / 11000 + el.seed) * S * 0.01;
  const Y = el.y * H, r = S * 0.055 * el.s * p;
  if (r < 2) return;
  wx.save();
  wx.fillStyle = 'rgba(200,204,190,0.55)';
  wx.beginPath(); wx.arc(X, Y, r, 0, Math.PI * 2); wx.fill();
  wx.globalCompositeOperation = 'destination-out';
  wx.beginPath(); wx.arc(X + r * 0.45, Y - r * 0.2, r * 0.85, 0, Math.PI * 2); wx.fill();
  wx.globalCompositeOperation = 'source-over';
  wx.strokeStyle = 'rgba(110,115,105,0.4)'; wx.lineWidth = 1.2;
  wx.beginPath(); wx.arc(X, Y, r, Math.PI * 0.35, Math.PI * 1.55); wx.stroke();
  wx.restore();
}
function drawFieldEl(el, now, p){
  const X = el.x * W, Y = el.y * H, w = S * 0.10 * el.s * p, h = w * 0.45;
  if (w < 3) return;
  wx.save();
  wx.strokeStyle = 'rgba(70,62,48,0.30)'; wx.lineWidth = 1.3;
  wx.strokeRect(X - w, Y - h, w * 2, h * 2 * 0.9);
  wx.beginPath(); wx.moveTo(X - w, Y - h * 0.1); wx.lineTo(X + w, Y - h * 0.1); wx.stroke();
  wx.beginPath(); wx.moveTo(X, Y - h); wx.lineTo(X, Y + h * 0.8); wx.stroke();
  wx.fillStyle = 'rgba(118,134,84,0.12)';
  wx.fillRect(X - w, Y - h, w * 2, h * 2 * 0.9);
  wx.restore();
}
// Tier-2 class family (C3): one parametrized element, per-char skins from
// pack `world.params` (el.p). Two chars of the same class must read as
// siblings, not clones.
function drawWaterEl(el, now, p){
  const X = el.x * W, Y = el.y * H;
  const form = (el.p && el.p.form) || 'spring';
  const r = rng(el.seed);
  // wet + heat aura = steam (S1-D045): pale wisps rise where fire meets water
  if (el.hot && Math.random() < 0.08) addParticle(state.worldParticles, {
    x: X + (Math.random()-0.5) * S * 0.06 * el.s, y: Y - 2,
    vx: (Math.random()-0.5) * 5 + 2, vy: -10 - Math.random()*8,
    grav: -7, life: 1.3 + Math.random()*0.8,
    size: 2 + Math.random()*2, color: 'rgba(214,218,222,0.5)' }, MAX_WORLD_PARTICLES);
  wx.save();
  if (form === 'stream') {
    const w = S * (0.16 + r() * 0.06) * el.s * p;
    wx.strokeStyle = 'rgba(96,118,140,0.40)'; wx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      wx.lineWidth = 1.6 - i * 0.3;
      wx.beginPath();
      const yo = (i - 1) * S * 0.012 * el.s;
      const ph = now / 1600 + el.seed + i;
      wx.moveTo(X - w, Y + yo);
      for (let t = 1; t <= 8; t++) {
        const tx2 = X - w + (t / 8) * w * 2;
        wx.lineTo(tx2, Y + yo + Math.sin(ph + t * 0.9) * S * 0.006 * el.s);
      }
      wx.stroke();
    }
  } else { // spring: a still pool with slow rings
    const rw = S * (0.05 + r() * 0.02) * el.s * p;
    wx.strokeStyle = 'rgba(96,118,140,0.45)';
    wx.fillStyle = 'rgba(96,118,140,0.15)';
    wx.lineWidth = 1.4;
    wx.beginPath(); wx.ellipse(X, Y, rw, rw * 0.38, 0, 0, Math.PI * 2); wx.fill(); wx.stroke();
    const q = ((now / 2400 + el.seed % 10) % 1);
    wx.globalAlpha = (1 - q) * 0.5;
    wx.beginPath(); wx.ellipse(X, Y, rw * (0.3 + q * 0.9), rw * 0.38 * (0.3 + q * 0.9), 0, 0, Math.PI * 2); wx.stroke();
  }
  wx.restore();
}
/* -------- basic-tier class families (S1-D047): flora / terrain / figure --
 * Pure brush geometry — no characters live in the engine. Per-char `form`
 * param + seed variance make siblings, not clones. Flora shares the tree's
 * heat-shimmer answer to el.hot; figures are living agents (beh applies). */
function drawFloraEl(el, now, p){
  const X = el.x * W, Y = el.y * H;
  const r = rng(el.seed);
  const form = (el.p && el.p.form) || 'grass';
  const h = S * 0.055 * el.s * p * (0.85 + r() * 0.3);
  if (h < 2) return;
  const swT = el.hot ? 480 : 1600;
  const sway = Math.sin(now / swT + el.seed % 10) * (el.hot ? 4 : 1.6);
  wx.save(); wx.translate(X, Y);
  wx.strokeStyle = 'rgba(96,116,72,0.75)'; wx.lineCap = 'round';
  wx.lineWidth = Math.max(1, S * 0.005 * el.s);
  if (form === 'grass'){
    const n = 4 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++){
      const a = (i / (n - 1) - 0.5) * 1.2 + (r() - 0.5) * 0.2;
      const bh = h * (0.6 + r() * 0.5);
      wx.beginPath(); wx.moveTo(0, 0);
      wx.quadraticCurveTo(a * bh * 0.5, -bh * 0.6, a * bh + sway, -bh); wx.stroke();
    }
  } else if (form === 'reed'){
    const n = 2 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++){
      const ox = (i - (n - 1) / 2) * h * 0.22, bh = h * (1.3 + r() * 0.5);
      wx.beginPath(); wx.moveTo(ox, 0);
      wx.quadraticCurveTo(ox + sway * 0.4, -bh * 0.55, ox + sway, -bh); wx.stroke();
      wx.fillStyle = 'rgba(122,112,78,0.7)';
      wx.beginPath(); wx.ellipse(ox + sway, -bh, h * 0.06, h * 0.16, 0, 0, Math.PI * 2); wx.fill();
    }
  } else if (form === 'bush'){
    wx.beginPath(); wx.moveTo(0, 0); wx.lineTo(sway * 0.3, -h * 0.35); wx.stroke();
    for (let i = 0; i < 3; i++){
      const fx2 = (r() - 0.5) * h, fy = -h * (0.4 + r() * 0.4), fr = h * (0.3 + r() * 0.2);
      wx.fillStyle = `rgba(${92 + Math.floor(r()*20)},${110 + Math.floor(r()*18)},${74 + Math.floor(r()*14)},0.5)`;
      wx.beginPath(); wx.ellipse(fx2 + sway * 0.4, fy, fr * 1.15, fr * 0.75, 0, 0, Math.PI * 2); wx.fill();
    }
  } else if (form === 'flower'){ // 花 and friends: petals a child can name
    wx.beginPath(); wx.moveTo(0, 0); wx.quadraticCurveTo(sway * 0.3, -h * 0.6, sway * 0.5, -h); wx.stroke();
    wx.fillStyle = 'rgba(104,128,74,0.6)';
    wx.beginPath(); wx.ellipse(-h * 0.2 + sway * 0.3, -h * 0.45, h * 0.2, h * 0.09, -0.5, 0, Math.PI * 2); wx.fill();
    const cx2 = sway * 0.5, cy2 = -h;
    wx.fillStyle = 'rgba(206,110,120,0.65)';
    for (let i = 0; i < 5; i++){
      const a = i / 5 * Math.PI * 2 + el.seed % 7;
      wx.beginPath(); wx.ellipse(cx2 + Math.cos(a) * h * 0.16, cy2 + Math.sin(a) * h * 0.16, h * 0.13, h * 0.08, a, 0, Math.PI * 2); wx.fill();
    }
    wx.fillStyle = 'rgba(214,166,40,0.85)';
    wx.beginPath(); wx.arc(cx2, cy2, h * 0.08, 0, Math.PI * 2); wx.fill();
  } else { // sprout
    wx.beginPath(); wx.moveTo(0, 0); wx.quadraticCurveTo(sway * 0.3, -h * 0.5, sway * 0.6, -h * 0.8); wx.stroke();
    wx.fillStyle = 'rgba(104,128,74,0.65)';
    wx.beginPath(); wx.ellipse(-h * 0.18 + sway * 0.4, -h * 0.55, h * 0.22, h * 0.10, -0.5, 0, Math.PI * 2); wx.fill();
    wx.beginPath(); wx.ellipse(h * 0.22 + sway * 0.5, -h * 0.7, h * 0.22, h * 0.10, 0.5, 0, Math.PI * 2); wx.fill();
  }
  wx.restore();
}
function drawTerrainEl(el, now, p){
  const X = el.x * W, Y = el.y * H;
  const r = rng(el.seed);
  const form = (el.p && el.p.form) || 'rock';
  const w = S * (form === 'boulder' ? 0.055 : form === 'crag' ? 0.045 : 0.038) * el.s * p * (0.85 + r() * 0.3);
  if (w < 2) return;
  wx.save(); wx.translate(X, Y);
  wx.strokeStyle = 'rgba(88,84,74,0.55)'; wx.fillStyle = 'rgba(112,106,94,0.28)';
  wx.lineWidth = Math.max(1, S * 0.004 * el.s); wx.lineJoin = 'round';
  wx.beginPath();
  if (form === 'crag'){
    wx.moveTo(-w, 0); wx.lineTo(-w * 0.25, -w * (1.5 + r() * 0.5));
    wx.lineTo(w * 0.2, -w * (0.9 + r() * 0.3)); wx.lineTo(w, 0);
  } else {
    const hh = w * (form === 'boulder' ? 0.85 : 0.55);
    wx.moveTo(-w, 0); wx.quadraticCurveTo(-w * 0.7, -hh, -w * 0.1, -hh * (1 + r() * 0.15));
    wx.quadraticCurveTo(w * 0.6, -hh * 0.9, w, 0);
  }
  wx.closePath(); wx.fill(); wx.stroke();
  if (form === 'boulder'){ // one facet line gives it weight
    wx.beginPath(); wx.moveTo(-w * 0.3, -w * 0.7); wx.lineTo(w * 0.1, -w * 0.2); wx.stroke();
  }
  wx.restore();
}
function drawFigureEl(el, now, p){
  const B = el.beh;
  const resting = B && B.mode === 'rest';
  const calm = !resting && el.hot && B && B.mode === 'wander';
  const form = (el.p && el.p.form) || 'stand';
  const span = resting ? 0 : calm ? 0.005 : form === 'stroll' ? 0.03 + (el.seed % 5) * 0.01 : 0.012;
  const T = 8000 + (el.seed % 7) * 1100;
  const ph = now / T * 2 * Math.PI + el.seed % 100;
  const fx2 = clamp01(el.x + Math.sin(ph) * span) * W;
  const dir = Math.cos(ph) >= 0 ? 1 : -1;
  const hop = B && B.hopT > 0 ? Math.sin((1 - B.hopT / 400) * Math.PI) * 7 * el.s : 0;
  const bob = (resting || calm ? Math.abs(Math.sin(now / 800 + el.seed)) * 1.3
                               : Math.abs(Math.sin(now / 260 + el.seed)) * 2.2) * el.s + hop;
  const h = S * 0.052 * el.s * p;
  if (h < 2) return;
  const stoop = form === 'stoop' || resting;
  wx.save(); wx.translate(fx2, el.y * H - bob); wx.scale(dir, 1);
  wx.strokeStyle = '#241f18'; wx.fillStyle = '#241f18';
  wx.globalAlpha = 0.9; wx.lineCap = 'round';
  wx.lineWidth = Math.max(1.2, h * 0.13);
  // body: one brush stroke, bent when stooping
  wx.beginPath(); wx.moveTo(0, 0);
  if (stoop) wx.quadraticCurveTo(h * 0.28, -h * 0.55, h * 0.05, -h * 0.78);
  else wx.lineTo(0, -h * 0.8);
  wx.stroke();
  // legs
  wx.lineWidth = Math.max(1, h * 0.10);
  const step = form === 'stroll' ? h * 0.3 : h * 0.16;
  wx.beginPath(); wx.moveTo(0, -h * 0.28); wx.lineTo(-step * 0.6, 0); wx.stroke();
  wx.beginPath(); wx.moveTo(0, -h * 0.28); wx.lineTo(step, 0); wx.stroke();
  // head
  const hx = stoop ? h * 0.12 : 0;
  wx.beginPath(); wx.arc(hx, -h * (stoop ? 0.86 : 0.95), h * 0.14, 0, Math.PI * 2); wx.fill();
  wx.restore();
}
/* -------- chunk C batch 1 (S1-D066): bespoke kinds -------- *
 * Kid-readable brush figures. Living kinds (bigfig, horse) ride the same
 * beh/agent machinery as walkers — tags, not code, make them react. */
function drawBigFigEl(el, now, p){
  // 大 IS the pictograph: a big figure, arms spread wide
  const B = el.beh;
  const resting = B && B.mode === 'rest';
  const span = resting ? 0 : 0.012 + (el.seed % 5) * 0.004;
  const T = 9000 + (el.seed % 7) * 1200;
  const ph = now / T * 2 * Math.PI + el.seed % 100;
  const X = clamp01(el.x + Math.sin(ph) * span) * W;
  const bob = Math.abs(Math.sin(now / 700 + el.seed)) * 2 * el.s;
  const h = S * 0.13 * el.s * p;
  if (h < 3) return;
  const Y = el.y * H - bob;
  wx.save();
  wx.strokeStyle = '#241f18'; wx.fillStyle = '#241f18';
  wx.globalAlpha = 0.92; wx.lineCap = 'round';
  wx.lineWidth = Math.max(1.6, h * 0.10);
  wx.beginPath(); wx.moveTo(X, Y - h * 0.30); wx.lineTo(X, Y - h * 0.72); wx.stroke(); // trunk
  const wob = Math.sin(now / 900 + el.seed) * h * 0.03;
  wx.beginPath(); wx.moveTo(X - h * 0.42, Y - h * 0.60 + wob); wx.lineTo(X + h * 0.42, Y - h * 0.60 - wob); wx.stroke(); // arms WIDE
  wx.lineWidth = Math.max(1.3, h * 0.085);
  wx.beginPath(); wx.moveTo(X, Y - h * 0.30); wx.lineTo(X - h * 0.22, Y); wx.stroke();
  wx.beginPath(); wx.moveTo(X, Y - h * 0.30); wx.lineTo(X + h * 0.22, Y); wx.stroke();
  wx.beginPath(); wx.arc(X, Y - h * 0.82, h * 0.11, 0, Math.PI * 2); wx.fill();
  wx.restore();
}
function drawGateEl(el, now, p){
  // 门: an open doorframe standing in the field — things may pass through
  const X = el.x * W, Y = el.y * H, h = S * 0.11 * el.s * p, w = h * 0.72;
  if (h < 3) return;
  wx.save();
  wx.strokeStyle = 'rgba(94,62,40,0.85)'; wx.lineCap = 'round';
  wx.lineWidth = Math.max(1.6, h * 0.09);
  wx.beginPath(); wx.moveTo(X - w / 2, Y); wx.lineTo(X - w / 2, Y - h); wx.stroke();
  wx.beginPath(); wx.moveTo(X + w / 2, Y); wx.lineTo(X + w / 2, Y - h); wx.stroke();
  wx.lineWidth = Math.max(1.8, h * 0.11);
  wx.beginPath(); wx.moveTo(X - w * 0.72, Y - h * 0.96); wx.lineTo(X + w * 0.72, Y - h * 0.96); wx.stroke(); // lintel
  wx.lineWidth = Math.max(1.2, h * 0.06);
  wx.beginPath(); wx.moveTo(X - w * 0.60, Y - h * 1.10); wx.lineTo(X + w * 0.60, Y - h * 1.10); wx.stroke(); // cap
  wx.restore();
}
function drawHorseEl(el, now, p){
  // 马: a brush horse that ambles the field (living — E1 applies via tags)
  const B = el.beh;
  const span = 0.04 + (el.seed % 6) * 0.01;
  const T = 6000 + (el.seed % 8) * 800;
  const ph = now / T * 2 * Math.PI + el.seed % 100;
  const X = clamp01(el.x + Math.sin(ph) * span) * W;
  const dir = Math.cos(ph) >= 0 ? 1 : -1;
  const hop = B && B.hopT > 0 ? Math.sin((1 - B.hopT / 400) * Math.PI) * 8 * el.s : 0;
  const trot = Math.abs(Math.sin(now / 190 + el.seed)) * 2.4 * el.s + hop;
  const L = S * 0.10 * el.s * p; // body length
  if (L < 4) return;
  const Y = el.y * H - trot;
  wx.save(); wx.translate(X, Y); wx.scale(dir, 1);
  wx.strokeStyle = '#3a2c1c'; wx.fillStyle = '#3a2c1c';
  wx.globalAlpha = 0.9; wx.lineCap = 'round';
  wx.lineWidth = Math.max(1.6, L * 0.16);
  wx.beginPath(); wx.moveTo(-L * 0.45, -L * 0.52); wx.quadraticCurveTo(0, -L * 0.66, L * 0.38, -L * 0.55); wx.stroke(); // back
  wx.lineWidth = Math.max(1.3, L * 0.11);
  wx.beginPath(); wx.moveTo(L * 0.38, -L * 0.55); wx.lineTo(L * 0.58, -L * 0.92); wx.stroke(); // neck
  wx.beginPath(); wx.moveTo(L * 0.58, -L * 0.92); wx.lineTo(L * 0.80, -L * 0.84); wx.stroke(); // head
  const kick = Math.sin(now / 190 + el.seed) * L * 0.08;
  wx.lineWidth = Math.max(1.1, L * 0.08);
  wx.beginPath(); wx.moveTo(-L * 0.40, -L * 0.50); wx.lineTo(-L * 0.46 - kick, 0); wx.stroke();
  wx.beginPath(); wx.moveTo(-L * 0.28, -L * 0.52); wx.lineTo(-L * 0.20 + kick, 0); wx.stroke();
  wx.beginPath(); wx.moveTo(L * 0.22, -L * 0.55); wx.lineTo(L * 0.16 - kick, 0); wx.stroke();
  wx.beginPath(); wx.moveTo(L * 0.36, -L * 0.55); wx.lineTo(L * 0.44 + kick, 0); wx.stroke();
  wx.beginPath(); wx.moveTo(-L * 0.45, -L * 0.52); wx.quadraticCurveTo(-L * 0.62, -L * 0.44 + kick, -L * 0.66, -L * 0.24); wx.stroke(); // tail
  wx.restore();
}
function drawHeartEl(el, now, p){
  // 心: a soft cinnabar heart, breathing — pure charm
  const X = el.x * W, Y = el.y * H;
  const beat = 1 + 0.06 * Math.sin(now / 480 + el.seed);
  const r = S * 0.032 * el.s * p * beat;
  if (r < 2) return;
  wx.save();
  wx.translate(X, Y - r * 1.6);
  wx.fillStyle = 'rgba(178,57,42,0.72)';
  wx.beginPath();
  wx.moveTo(0, r * 0.9);
  wx.bezierCurveTo(-r * 1.5, -r * 0.3, -r * 0.7, -r * 1.2, 0, -r * 0.35);
  wx.bezierCurveTo(r * 0.7, -r * 1.2, r * 1.5, -r * 0.3, 0, r * 0.9);
  wx.fill();
  wx.restore();
}
function drawWindEl(el, now, p){
  // 风: swirl strokes rolling across their spot — motion made visible
  const X = el.x * W, Y = el.y * H, w = S * 0.09 * el.s * p;
  if (w < 3) return;
  wx.save();
  wx.strokeStyle = 'rgba(120,134,148,0.55)'; wx.lineCap = 'round';
  for (let i = 0; i < 3; i++){
    const q = ((now / (2200 + i * 300) + el.seed + i * 0.33) % 1);
    const ox = (q - 0.5) * w * 1.6;
    const oy = -S * (0.02 + 0.022 * i) * el.s;
    const a = Math.sin(q * Math.PI);
    wx.globalAlpha = 0.55 * a;
    wx.lineWidth = Math.max(1, w * 0.055 * (1.2 - i * 0.25));
    wx.beginPath();
    wx.moveTo(X + ox - w * 0.5, Y + oy);
    wx.quadraticCurveTo(X + ox - w * 0.05, Y + oy - w * 0.22, X + ox + w * 0.3, Y + oy - w * 0.06);
    wx.quadraticCurveTo(X + ox + w * 0.52, Y + oy + w * 0.04, X + ox + w * 0.42, Y + oy + w * 0.14);
    wx.stroke();
  }
  wx.restore();
}
function drawBoltEl(el, now, p){
  // 电: a cloudlet with a zigzag bolt that flickers
  const X = el.x * W, Y = el.y * H, h = S * 0.10 * el.s * p;
  if (h < 3) return;
  const flick = (Math.floor(now / 340) + el.seed) % 5 !== 0; // mostly on, brief blink
  wx.save();
  wx.fillStyle = 'rgba(150,158,172,0.55)';
  for (let j = 0; j < 3; j++){
    const ox = (j - 1) * h * 0.28;
    wx.beginPath(); wx.ellipse(X + ox, Y - h * 0.95 + (j % 2 ? h * 0.05 : 0), h * 0.26, h * 0.16, 0, 0, Math.PI * 2); wx.fill();
  }
  if (flick){
    wx.strokeStyle = 'rgba(214,166,40,0.9)'; wx.lineWidth = Math.max(1.4, h * 0.07); wx.lineJoin = 'round';
    wx.beginPath();
    wx.moveTo(X + h * 0.05, Y - h * 0.82);
    wx.lineTo(X - h * 0.10, Y - h * 0.45);
    wx.lineTo(X + h * 0.08, Y - h * 0.40);
    wx.lineTo(X - h * 0.06, Y - h * 0.02);
    wx.stroke();
  }
  wx.restore();
}
function drawCartEl(el, now, p){
  // 车: two wheels and a body — waiting to be pulled somewhere someday
  const X = el.x * W, Y = el.y * H, w = S * 0.075 * el.s * p;
  if (w < 3) return;
  wx.save();
  wx.strokeStyle = 'rgba(94,62,40,0.85)'; wx.fillStyle = 'rgba(122,88,54,0.35)';
  wx.lineCap = 'round'; wx.lineWidth = Math.max(1.2, w * 0.08);
  const wr = w * 0.30;
  for (const ox of [-w * 0.42, w * 0.42]){
    wx.beginPath(); wx.arc(X + ox, Y - wr, wr, 0, Math.PI * 2); wx.stroke();
    wx.beginPath(); wx.moveTo(X + ox - wr * 0.7, Y - wr - wr * 0.7); wx.lineTo(X + ox + wr * 0.7, Y - wr + wr * 0.7); wx.stroke();
    wx.beginPath(); wx.moveTo(X + ox - wr * 0.7, Y - wr + wr * 0.7); wx.lineTo(X + ox + wr * 0.7, Y - wr - wr * 0.7); wx.stroke();
  }
  wx.beginPath(); wx.rect(X - w * 0.62, Y - wr * 2 - w * 0.34, w * 1.24, w * 0.34); wx.fill(); wx.stroke();
  wx.beginPath(); wx.moveTo(X + w * 0.62, Y - wr * 2 - w * 0.17); wx.lineTo(X + w * 1.0, Y - wr * 2 - w * 0.30); wx.stroke(); // handle
  wx.restore();
}
/* -------- chunk C batch 1 (S1-D066): tier-2 family renderers -------- *
 * One renderer per family, per-char `form` + seed variance = siblings. */
function drawBannerEl(el, now, p){
  // speech & thread chars: a little word-banner fluttering on a stick
  const X = el.x * W, Y = el.y * H;
  const r = rng(el.seed);
  const form = (el.p && el.p.form) || 'flag';
  const h = S * 0.085 * el.s * p * (0.9 + r() * 0.25);
  if (h < 3) return;
  const flut = Math.sin(now / 420 + el.seed) * h * 0.06;
  wx.save();
  wx.strokeStyle = 'rgba(94,62,40,0.8)'; wx.lineCap = 'round';
  wx.lineWidth = Math.max(1, h * 0.05);
  wx.beginPath(); wx.moveTo(X, Y); wx.lineTo(X, Y - h); wx.stroke(); // stick
  if (form === 'flag'){
    wx.fillStyle = 'rgba(196,120,70,0.45)';
    wx.beginPath();
    wx.moveTo(X, Y - h);
    wx.quadraticCurveTo(X + h * 0.32, Y - h + h * 0.10 + flut, X + h * 0.55, Y - h + h * 0.06 + flut * 1.4);
    wx.lineTo(X + h * 0.52, Y - h * 0.68 + flut * 1.4);
    wx.quadraticCurveTo(X + h * 0.28, Y - h * 0.72 + flut, X, Y - h * 0.70);
    wx.closePath(); wx.fill();
  } else { // scroll: a hanging strip, weighted at the foot
    wx.fillStyle = 'rgba(236,227,207,0.9)';
    wx.strokeStyle = 'rgba(120,104,80,0.55)'; wx.lineWidth = 1;
    const sw = h * 0.30;
    wx.beginPath(); wx.rect(X - sw / 2 + flut * 0.4, Y - h, sw, h * 0.62); wx.fill(); wx.stroke();
    wx.fillStyle = CINNABAR; wx.globalAlpha = 0.75;
    wx.fillRect(X - sw * 0.22 + flut * 0.4, Y - h + h * 0.08, sw * 0.44, sw * 0.44);
  }
  wx.restore();
}
function drawDwellingEl(el, now, p){
  // roof chars: a little house — shelter to rest by, and it can burn + regrow
  const X = el.x * W, Y = el.y * H;
  const r = rng(el.seed);
  const form = (el.p && el.p.form) || 'hut';
  const w = S * (form === 'pavilion' ? 0.085 : 0.075) * el.s * p * (0.9 + r() * 0.2);
  if (w < 3) return;
  const wallH = w * (form === 'pavilion' ? 0.55 : 0.62);
  wx.save();
  wx.strokeStyle = 'rgba(94,62,40,0.85)'; wx.lineJoin = 'round'; wx.lineCap = 'round';
  wx.lineWidth = Math.max(1.2, w * 0.06);
  if (form === 'hut'){
    wx.fillStyle = 'rgba(206,186,150,0.55)';
    wx.beginPath(); wx.rect(X - w * 0.55, Y - wallH, w * 1.1, wallH); wx.fill(); wx.stroke();
    wx.fillStyle = 'rgba(122,88,54,0.75)';
    wx.beginPath(); wx.moveTo(X - w * 0.75, Y - wallH); wx.lineTo(X, Y - wallH - w * 0.55); wx.lineTo(X + w * 0.75, Y - wallH); wx.closePath(); wx.fill(); wx.stroke();
    wx.fillStyle = 'rgba(70,50,34,0.8)';
    wx.beginPath(); wx.rect(X - w * 0.14, Y - wallH * 0.62, w * 0.28, wallH * 0.62); wx.fill(); // door
  } else { // pavilion: open posts under a swooping roof
    wx.beginPath(); wx.moveTo(X - w * 0.45, Y); wx.lineTo(X - w * 0.45, Y - wallH); wx.stroke();
    wx.beginPath(); wx.moveTo(X + w * 0.45, Y); wx.lineTo(X + w * 0.45, Y - wallH); wx.stroke();
    wx.fillStyle = 'rgba(122,88,54,0.75)';
    wx.beginPath();
    wx.moveTo(X - w * 0.8, Y - wallH);
    wx.quadraticCurveTo(X, Y - wallH - w * 0.5, X + w * 0.8, Y - wallH);
    wx.quadraticCurveTo(X + w * 0.3, Y - wallH - w * 0.12, X - w * 0.3, Y - wallH - w * 0.12);
    wx.closePath(); wx.fill(); wx.stroke();
  }
  wx.restore();
}
function drawSkylightEl(el, now, p){
  // sun-radical chars: a glow in the sky — light without being THE sun
  const X = el.x * W, Y = el.y * H;
  const form = (el.p && el.p.form) || 'glow';
  const r = S * 0.045 * el.s * p;
  if (r < 2) return;
  const breathe = 1 + 0.04 * Math.sin(now / 3000 + el.seed);
  wx.save();
  if (form === 'dawn'){
    const g = wx.createLinearGradient(X, Y - r, X, Y + r * 1.6);
    g.addColorStop(0, 'rgba(232,170,90,0.34)'); g.addColorStop(1, 'rgba(232,170,90,0)');
    wx.fillStyle = g;
    wx.beginPath(); wx.ellipse(X, Y + r * 0.3, r * 2.4, r * 1.3, 0, Math.PI, 0); wx.fill();
    wx.strokeStyle = 'rgba(214,140,70,0.5)'; wx.lineWidth = 1.6;
    wx.beginPath(); wx.arc(X, Y + r * 0.3, r * breathe, Math.PI, 0); wx.stroke();
  } else { // glow: soft radiance behind a cloud wisp
    const g = wx.createRadialGradient(X, Y, r * 0.3, X, Y, r * 2.2 * breathe);
    g.addColorStop(0, 'rgba(238,196,110,0.34)'); g.addColorStop(1, 'rgba(238,196,110,0)');
    wx.fillStyle = g; wx.fillRect(X - r * 2.5, Y - r * 2.5, r * 5, r * 5);
    wx.fillStyle = 'rgba(250,246,236,0.6)';
    wx.beginPath(); wx.ellipse(X, Y + r * 0.35, r * 1.15, r * 0.42, 0, 0, Math.PI * 2); wx.fill();
  }
  wx.restore();
}
// Seal / stele (C3): a small stone slab bearing a cinnabar seal impression.
// Serves char packs with world:null and self-heals unknown kinds from old
// saves. Real scrolls accumulate seals; so does this one.
function drawSealEl(el, now, p){
  const X = el.x * W, Y = el.y * H;
  const h = S * 0.085 * el.s * p, w = h * 0.62;
  if (h < 2) return;
  wx.save();
  wx.translate(X, Y);
  // stone slab
  wx.fillStyle = 'rgba(112,106,94,0.35)';
  wx.strokeStyle = 'rgba(70,62,48,0.45)';
  wx.lineWidth = 1.2;
  wx.beginPath();
  wx.moveTo(-w/2, 0); wx.lineTo(-w/2, -h*0.82);
  wx.quadraticCurveTo(0, -h*1.06, w/2, -h*0.82);
  wx.lineTo(w/2, 0); wx.closePath();
  wx.fill(); wx.stroke();
  // cinnabar impression
  const r = w * 0.62;
  wx.fillStyle = CINNABAR;
  wx.globalAlpha = 0.85;
  wx.fillRect(-r/2, -h*0.62, r, r);
  if (el.ch) {
    wx.globalAlpha = 0.95;
    wx.fillStyle = '#f3e9d6';
    wx.font = (r * 0.78) + 'px ' + CHAR_FONT;
    wx.textAlign = 'center'; wx.textBaseline = 'middle';
    wx.fillText(el.ch, 0, -h*0.62 + r/2);
  } else {
    // unknown kind: a blank carved impression, no invented content
    wx.globalAlpha = 0.6;
    wx.strokeStyle = '#f3e9d6';
    wx.lineWidth = Math.max(1, r * 0.09);
    wx.strokeRect(-r/2 + r*0.18, -h*0.62 + r*0.18, r*0.64, r*0.64);
  }
  wx.restore();
}
