/* ========================= 13 MAIN LOOP + BOOT ========================= */
let lastT = 0, perfT = 0, frameCount = 0;
function frame(now) {
  const dt = Math.min(50, now - lastT || 16);
  lastT = now; perfT = now;
  frameCount++;
  // frame-time probe (S1-D031: measure before pre-render machinery)
  if (frameCount > 10) {
    METRICS.perf.avgFrameMs = +(METRICS.perf.avgFrameMs * 0.98 + dt * 0.02).toFixed(2);
    METRICS.perf.worstFrameMs = Math.max(METRICS.perf.worstFrameMs, Math.round(dt));
  }

  updateAttention(dt, now);

  ctx.save();
  if (state.shake > 0 && !reduceMotion) {
    ctx.translate((Math.random()-0.5) * state.shake, (Math.random()-0.5) * state.shake);
    state.shake = Math.max(0, state.shake - dt / 40);
  }
  ctx.drawImage(paperTex, 0, 0, W, H);
  drawWorld(dt, now);

  if (state.mode === 'title') {
    drawTitle();
  } else {
    drawVeil();
    drawGlyph(dt, now);
    drawFirstGlyphHint(dt, now);
    if (state.mode === 'play') maybeHint(now);
  }
  drawEffects(dt);
  drawParticles(dt);
  drawTrails(dt);
  if (state.mode !== 'title') drawHUD();
  ctx.restore();

  if (state.mode === 'resolve' && state.resolve) {
    state.resolve.t += dt;
    if (state.resolve.t >= state.resolve.dur) { state.resolve = null; advance(); }
  }
  requestAnimationFrame(frame);
}
async function boot() {
  loadEmbeddedPack();
  if (PACK_URL) await loadPackParam(PACK_URL);
  initWorld();
  requestAnimationFrame(frame);
  if (window.speechSynthesis) speechSynthesis.getVoices();
}
boot();
