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
};
function drawWorld(dt, now){
  if (!state.world.els.length && !state.worldParticles.length) {
    METRICS.perf.worldLayer = false;
    return;
  }
  METRICS.perf.worldLayer = true;
  wx.clearRect(0, 0, W, H);
  const els = [...state.world.els].sort((a, b) => ((ZI[a.k] || 6) - (ZI[b.k] || 6)) || (a.y - b.y));
  for (const el of els){
    const age = el.born ? now - el.born : 1e9;
    if (age < 0) continue; // planted between frames; rAF timestamp lags performance.now()
    const p = Math.max(0, Math.min(1, age / 700));
    const pe = 1 - Math.pow(1 - p, 3);
    const draw = ELEMENT_DRAW[el.k];
    if (draw) draw(el, now, pe);
    else { el.sealFallback = true; drawSealEl(el, now, pe); } // unknown kind self-heals to a seal
    if (el.fresh && age < 900){
      const q = age / 900;
      wx.save();
      wx.globalAlpha = (1 - q) * 0.6;
      wx.strokeStyle = GOLD; wx.lineWidth = 2.5;
      wx.beginPath(); wx.arc(el.x * W, el.y * H - S * 0.03, 10 + q * S * 0.12, 0, Math.PI * 2); wx.stroke();
      wx.restore();
    }
  }
  drawWorldParticles(dt);
  ctx.save();
  ctx.globalAlpha = attention.worldAlpha;
  ctx.drawImage(worldLayer, 0, 0, W, H);
  ctx.restore();
}
function drawWorldParticles(dt) {
  for (const p of state.worldParticles) {
    p.life -= dt / 1000;
    p.vy += p.grav * dt / 1000;
    p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000;
    if (p.life <= 0) continue;
    wx.globalAlpha = Math.min(1, p.life * 2);
    wx.fillStyle = p.color;
    wx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
  }
  wx.globalAlpha = 1;
  state.worldParticles = state.worldParticles.filter(p => p.life > 0);
}
function drawTreeEl(el, now, p){
  const X = el.x * W, Y = el.y * H;
  const r = rng(el.seed);
  const h = S * 0.16 * el.s * p * (0.9 + r() * 0.3);
  const sway = Math.sin(now / 1400 + el.seed % 10) * 0.03;
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
    wx.beginPath(); wx.ellipse(fx, fy + Math.sin(now / 1400 + el.seed % 10 + i) * 2, fr * 1.2, fr * 0.8, 0, 0, Math.PI * 2); wx.fill();
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
  const span = 0.03 + (el.seed % 7) * 0.01;
  const T = 7000 + (el.seed % 9) * 900;
  const ph = now / T * 2 * Math.PI + el.seed % 100 + phase;
  const wxp = clamp01(el.x + gx + Math.sin(ph) * span) * W;
  const dir = Math.cos(ph) >= 0 ? 1 : -1;
  const bob = Math.abs(Math.sin(now / 240 + el.seed)) * 2.5 * el.s;
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
  wx.save();
  wx.strokeStyle = '#4a3a26'; wx.lineWidth = Math.max(1.5, S * 0.010 * s); wx.lineCap = 'round'; wx.globalAlpha = 0.85;
  wx.beginPath(); wx.moveTo(X - S*0.03*s, Y); wx.lineTo(X + S*0.03*s, Y - S*0.012*s); wx.stroke();
  wx.beginPath(); wx.moveTo(X - S*0.028*s, Y - S*0.012*s); wx.lineTo(X + S*0.03*s, Y); wx.stroke();
  const fl = 0.8 + 0.2 * Math.sin(now/95 + el.seed) + 0.1 * Math.sin(now/41 + el.seed*2);
  const g = wx.createRadialGradient(X, Y - S*0.02*s, 2, X, Y - S*0.02*s, Math.max(4, S*0.09*s*fl));
  g.addColorStop(0, 'rgba(232,161,58,0.5)'); g.addColorStop(1, 'rgba(232,161,58,0)');
  wx.fillStyle = g; wx.fillRect(X - S*0.1*s, Y - S*0.14*s, S*0.2*s, S*0.2*s);
  for (let i = 0; i < 2; i++){
    const fh = S * (0.05 + 0.02*i) * s * fl * (1 + 0.15 * Math.sin(now/70 + el.seed + i*2));
    const fw = S * 0.018 * s * (1.4 - i*0.4);
    wx.fillStyle = i ? 'rgba(226,120,40,0.85)' : 'rgba(178,57,42,0.8)';
    wx.beginPath();
    wx.moveTo(X - fw, Y);
    wx.quadraticCurveTo(X - fw*0.6, Y - fh*0.55, X + Math.sin(now/110 + el.seed + i) * fw * 0.8, Y - fh);
    wx.quadraticCurveTo(X + fw*0.6, Y - fh*0.5, X + fw, Y);
    wx.closePath(); wx.fill();
  }
  wx.restore();
  if (Math.random() < 0.05 * s) addParticle(state.worldParticles, {
    x: X + (Math.random()-0.5) * 10 * s, y: Y - S*0.05*s,
    vx: (Math.random()-0.5) * 10, vy: -25 - Math.random()*25,
    grav: -15, life: 0.8 + Math.random()*0.6,
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
