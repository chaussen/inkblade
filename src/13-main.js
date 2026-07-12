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
  updateWorld(dt, now);
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
  drawTransit(dt); // the ink travels above the veil (S1-D069)
  if (state.mode !== 'title') drawHUD();
  ctx.restore();

  if (state.mode === 'resolve' && state.resolve) {
    state.resolve.t += dt;
    if (state.resolve.t >= state.resolve.dur) { state.resolve = null; advance(); }
  }
  requestAnimationFrame(frame);
}
// Embedded webfont load (S1-D078): CHAR_FONT's first name only renders
// consistently if this resolves before the first frame — boot() awaits it.
// Any failure (old browser, malformed data) just leaves the CSS fallback
// stack in CHAR_FONT to do what it always did; never blocks boot.
function loadFont() {
  return new Promise(resolve => {
    if (!window.FontFace) return resolve();
    try {
      const b64 = document.getElementById('font-inkblade').textContent.trim();
      const face = new FontFace('Inkblade Kai', 'url(data:font/woff2;base64,' + b64 + ')');
      face.load().then(
        f => { document.fonts.add(f); resolve(); },
        e => { console.warn('[S1] embedded font failed to load, using fallback stack:', e.message); resolve(); }
      );
    } catch (e) { console.warn('[S1] embedded font unavailable:', e.message); resolve(); }
  });
}
async function boot() {
  await loadFont();
  loadEmbeddedPack();
  if (PACK_URL) await loadPackParam(PACK_URL);
  initWorld();
  // Ninja Fruit mandate (John): "slash anywhere to begin" used to be a
  // throwaway trigger — the swipe that dismissed the title was discarded,
  // never evaluated as a cut. Pre-creating the opening glyph here means
  // resolveSlash (06-combat.js) has real strokes to test that exact trail
  // against the instant the title is dismissed — the trigger swipe IS the
  // first attempt, whiff-or-hit, not a freebie. state.mode stays 'title'
  // (still renders the title screen) until the player actually acts.
  newGlyph(pickNext());
  requestAnimationFrame(frame);
  if (window.speechSynthesis) speechSynthesis.getVoices();
}
boot();
