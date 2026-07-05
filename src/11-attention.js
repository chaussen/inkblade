/* ========================= 11 ATTENTION ========================= *
 * The figure-ground contract (S1-D019/D027): exactly one plane owns
 * attention, game state drives transitions. writing → glyph owns
 * (world recedes to ATTN_RECESSION behind the veil); bloom → world
 * owns (lock/fizzle through resolve, holding ATTN_HOLD_MS into the
 * next glyph); idle → title screen, world owns. Test-readable at
 * window.__S1_ATTN.
 * ================================================================ */
const attention = { mode: 'idle', worldAlpha: 1, veilAlpha: 0, holdUntil: 0 };
window.__S1_ATTN = attention;

function attentionOnGlyphAppear() {
  // bloom holds into the new glyph, then recedes (cadence-preserving
  // reading of "holds through resolve + ~1.5s after")
  if (METRICS.glyphs > 0) attention.holdUntil = performance.now() + ATTN_HOLD_MS;
}
function stepToward(cur, target, maxStep) {
  const d = target - cur;
  return Math.abs(d) <= maxStep ? target : cur + Math.sign(d) * maxStep;
}
function updateAttention(dt, now) {
  let mode;
  if (state.mode === 'play' && state.glyph && !state.glyph.done) mode = 'writing';
  else if (state.mode === 'resolve' || (state.glyph && state.glyph.done)) mode = 'bloom';
  else mode = 'idle';
  attention.mode = mode;
  const wTarget = (mode === 'writing' && now >= attention.holdUntil) ? ATTN_RECESSION : 1;
  const vTarget = mode === 'writing' ? ATTN_VEIL_ALPHA : 0;
  const wRange = 1 - ATTN_RECESSION;
  const wMs = wTarget < attention.worldAlpha ? ATTN_RECEDE_MS : ATTN_BLOOM_MS;
  attention.worldAlpha = stepToward(attention.worldAlpha, wTarget, dt / wMs * wRange);
  attention.veilAlpha = stepToward(attention.veilAlpha, vTarget, dt / ATTN_VEIL_MS * ATTN_VEIL_ALPHA);
}
// The writing veil: a fresh leaf laid over the scroll behind the glyph.
// Drawn between the world layer and the glyph.
function drawVeil() {
  if (attention.veilAlpha <= 0.005 || !state.glyph) return;
  const pad = S * ATTN_VEIL_PAD;
  const [x, y, w, h] = glyphBBox(state.glyph, pad);
  const cx = x + w/2, cy = y + h/2;
  const R = Math.hypot(w, h) * 0.62;
  const g = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R);
  const c = ATTN_VEIL_BRIGHT.slice(4, -1); // "r,g,b"
  g.addColorStop(0, 'rgba(' + c + ',' + attention.veilAlpha + ')');
  g.addColorStop(1, 'rgba(' + c + ',0)');
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  ctx.restore();
}
