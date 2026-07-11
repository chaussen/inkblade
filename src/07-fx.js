/* ========================= 07 MEANING EFFECTS ========================= *
 * Lock-payoff effect primitives. Which character triggers which effect
 * is pack data (`fx` field, S1-D024); these are the engine's physical
 * manifestation primitives (charter §7 Q6).
 * ====================================================================== */
function spawnFx(def) {
  state.effects.push({ type: def.fx, t: 0, dur: fxDur(def.fx), def, n: def.n || 1 });
  if (def.fx === 'fire') {
    const count = 40 + (def.n || 1) * 30;
    for (let i = 0; i < count; i++) {
      addParticle(state.particles, {
        x: Math.random() * W, y: H + 10 + Math.random() * 40,
        vx: (Math.random()-0.5) * 30, vy: -80 - Math.random() * (140 + (def.n||1) * 40),
        grav: -40, life: 1.0 + Math.random() * 1.2,
        size: 2 + Math.random() * 4,
        color: Math.random() < 0.5 ? '#d96b2b' : (Math.random() < 0.5 ? '#e8a13a' : '#b2392a'),
      }, MAX_PARTICLES);
    }
  }
  if (def.fx === 'tree') {
    const count = 24 + (def.n || 1) * 14;
    for (let i = 0; i < count; i++) {
      addParticle(state.particles, {
        x: GX + S*0.5 + (Math.random()-0.5) * S*0.7, y: GY + S*0.25 + (Math.random()-0.5) * S*0.3,
        vx: (Math.random()-0.5) * 60, vy: 10 + Math.random() * 50,
        grav: 30, life: 1.2 + Math.random(),
        size: 2.5 + Math.random() * 3, color: Math.random() < 0.6 ? '#5c7a3f' : '#7f9c53',
      }, MAX_PARTICLES);
    }
  }
  if (def.fx === 'shockwave' && !reduceMotion) state.shake = 9;
  if (def.fx === 'fire' && (def.n||1) >= 3 && !reduceMotion) state.shake = 7;
}
function fxDur(fx) { return { beam: 900, cross: 900, figure: 1700, shockwave: 1000, tree: 1500, fire: 1700, calm: 1400 }[fx] || 1000; }

function drawEffects(dt) {
  for (const e of state.effects) {
    e.t += dt;
    const p = Math.min(1, e.t / e.dur);
    ctx.save();
    if (e.type === 'beam') {
      const ys = e.def.strokes.map(s => toScreen(s.pts[0])[1]);
      for (const y of ys) beam(y, p);
    } else if (e.type === 'cross') {
      beam(toScreen(e.def.strokes[0].pts[0])[1], p);
      beamV(toScreen(e.def.strokes[1].pts[0])[0], p);
    } else if (e.type === 'shockwave') {
      for (let i = 0; i < 3; i++) {
        const q = Math.max(0, Math.min(1, p * 1.4 - i * 0.18));
        if (q <= 0) continue;
        ctx.globalAlpha = (1 - q) * 0.55;
        ctx.strokeStyle = INK; ctx.lineWidth = 6 - i * 1.5;
        ctx.beginPath();
        ctx.arc(GX + S/2, GY + S/2, q * Math.max(W, H) * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (e.type === 'figure') {
      const n = e.n || 1;
      ctx.fillStyle = INK;
      ctx.font = (S * 0.22) + 'px ' + CHAR_FONT;
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      for (let i = 0; i < n; i++) {
        const q = Math.max(0, Math.min(1, p * 1.2 - i * 0.09));
        if (q <= 0) continue;
        const x = -60 + q * (W + 120);
        const bob = Math.sin(q * 40 + i * 2) * 6;
        ctx.globalAlpha = 0.9 - i * 0.15;
        ctx.fillText('人', x, H * 0.82 + bob);
      }
      if (Math.random() < 0.4) addParticle(state.particles, {
        x: -50 + p * 1.2 * (W + 120), y: H * 0.83, vx: -30 - Math.random()*30, vy: -20 - Math.random()*30,
        grav: 200, life: 0.4, size: 2, color: ASH }, MAX_PARTICLES);
    } else if (e.type === 'tree') {
      const n = e.n || 1;
      const xs = n === 1 ? [0.5] : n === 2 ? [0.35, 0.65] : [0.5, 0.3, 0.7];
      ctx.strokeStyle = '#4a3a26'; ctx.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const q = Math.max(0, Math.min(1, p * 1.3 - i * 0.12));
        if (q <= 0) continue;
        const cx = GX + S * xs[i], base = GY + S * 0.95;
        const h = q * S * (0.8 - i * 0.08);
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = S * 0.035;
        ctx.beginPath(); ctx.moveTo(cx, base); ctx.lineTo(cx, base - h); ctx.stroke();
        if (q > 0.4) {
          const r = (q - 0.4) / 0.6;
          ctx.lineWidth = S * 0.02;
          ctx.beginPath(); ctx.moveTo(cx, base - h*0.55); ctx.lineTo(cx - r * S*0.2, base - h*0.55 - r*S*0.16); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx, base - h*0.7);  ctx.lineTo(cx + r * S*0.18, base - h*0.7 - r*S*0.14); ctx.stroke();
        }
      }
    } else if (e.type === 'fire') {
      const glow = Math.sin(p * Math.PI) * Math.min(1, (e.n || 1) * 0.45);
      const grd = ctx.createRadialGradient(W/2, H, Math.min(W,H)*0.1, W/2, H, Math.max(W,H)*0.9);
      grd.addColorStop(0, 'rgba(217,107,43,' + (0.30 * glow + 0.12) + ')');
      grd.addColorStop(1, 'rgba(217,107,43,0)');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    } else if (e.type === 'calm') {
      for (let i = 0; i < 3; i++) {
        const q = Math.max(0, Math.min(1, p * 1.3 - i * 0.2));
        if (q <= 0) continue;
        ctx.globalAlpha = (1 - q) * 0.35;
        ctx.strokeStyle = '#7d94b0'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(GX + S/2, GY + S/2, 40 + q * S * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  state.effects = state.effects.filter(e => e.t < e.dur);
}
function beam(y, p) {
  const head = p * (W + 200) - 100;
  const grd = ctx.createLinearGradient(head - 260, 0, head, 0);
  grd.addColorStop(0, 'rgba(201,153,43,0)');
  grd.addColorStop(1, 'rgba(201,153,43,0.85)');
  ctx.globalAlpha = 1 - Math.max(0, p - 0.75) * 4;
  ctx.fillStyle = grd;
  ctx.fillRect(Math.max(0, head - 260), y - 5, Math.min(head, W) - Math.max(0, head - 260), 10);
  ctx.globalAlpha = 1;
}
/* -------- the ink travels (S1-D069) -------- *
 * Lock transition: the glyph's strokes coalesce into an ink droplet that
 * flies to the planted element and becomes it. Pure presentation — matter
 * is chosen at lock (spawnWorldFor) and hidden behind `transit` until the
 * droplet lands; coordinates are stored normalized so a mid-flight resize
 * stays sane. reduce-motion hosts reveal instantly (the pre-M2e look). */
function beginTransit(def, els){
  if (!els || !els.length || !state.glyph) return;
  finishTransit(); // defensive: never strand hidden matter
  const T = {
    def, t: 0, bannerDone: false,
    strokes: [], cx: 0, cy: 0,
    els: els.map((el, i) => ({ el, delay: i * TRANSIT_STAGGER_MS, arrived: false, trail: [] })),
  };
  let n = 0;
  for (const st of state.glyph.strokes){
    const pts = strokeScreenPts(st).map(p => [p[0] / W, p[1] / H]);
    T.strokes.push(pts);
    for (const p of pts){ T.cx += p[0]; T.cy += p[1]; n++; }
  }
  T.cx /= n; T.cy /= n;
  if (reduceMotion){ // no flight: reveal now, banner now — motion is optional
    for (const m of T.els) arriveTransit(T, m, true);
    return;
  }
  for (const st of state.glyph.strokes) st.hidden = true; // the transit owns the ink now
  state.transit = T;
}
function finishTransit(){
  const T = state.transit;
  if (!T) return;
  for (const m of T.els) if (!m.arrived) arriveTransit(T, m, true);
  state.transit = null;
}
function arriveTransit(T, m, quiet){
  m.arrived = true;
  const el = m.el;
  delete el.transit;
  el.born = performance.now(); // the grow-in + fresh gold ring start here
  // the banner names the thing WHERE it appears (first arrival of the lock);
  // kf lets the HUD ride the camera with the element's own layer (S1-D072);
  // elRef (S1-D075) lets the WebGL pilot re-project a live position every
  // frame instead of a frozen snapshot — ax/ay/kf stay exactly as before
  // (the 2D path's contract, unchanged) for when R3D isn't active.
  if (!T.bannerDone){
    T.bannerDone = true;
    state.banner = { pinyin: T.def.pinyin, gloss: T.def.gloss, t: 0,
                     ax: worldScreenX(el), ay: el.y, elRef: el,
                     kf: DEPTH_EXEMPT[el.k] ? 0 : PARALLAX_FAR + depthQ(el) * (PARALLAX_NEAR - PARALLAX_FAR) };
  }
  if (quiet) return;
  sfxArrive();
  const pos = elScreenPos(el);
  const X = pos.x * W, Y = pos.y * H, k = pos.k;
  for (let i = 0; i < 10; i++) addParticle(state.worldParticles, {
    x: X + (Math.random() - 0.5) * 10 * k, y: Y - 2,
    vx: (Math.random() - 0.5) * 60 * k, vy: -18 - Math.random() * 42,
    grav: 170, life: 0.35 + Math.random() * 0.3,
    size: 1.5 + Math.random() * 1.5,
    color: Math.random() < 0.25 ? GOLD : INK }, MAX_WORLD_PARTICLES);
}
function transitInk(e){ // gold at takeoff → ink at landing
  const r = Math.round(201 + (27 - 201) * e), g = Math.round(153 + (23 - 153) * e), b = Math.round(43 + (18 - 43) * e);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}
function drawTransit(dt){
  const T = state.transit;
  if (!T) return;
  T.t += dt;
  const cx = T.cx * W, cy = T.cy * H;
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (T.t < TRANSIT_COALESCE_MS){
    // coalesce: the strokes contract to their centroid, ink turning gold
    const q = T.t / TRANSIT_COALESCE_MS, e = q * q * (3 - 2 * q);
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = Math.max(2, S * 0.078 * (1 - e * 0.72));
    for (const pts of T.strokes){
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++){
        const x = cx + (pts[i][0] * W - cx) * (1 - e);
        const y = cy + (pts[i][1] * H - cy) * (1 - e);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
  } else {
    let live = false;
    for (const m of T.els){
      if (m.arrived) continue;
      const t = T.t - TRANSIT_COALESCE_MS - m.delay;
      if (t >= TRANSIT_FLIGHT_MS){ arriveTransit(T, m); continue; }
      live = true;
      if (t < 0){ // waiting its stagger turn: a droplet pulsing at the centroid
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = GOLD;
        ctx.beginPath(); ctx.arc(cx, cy, S * 0.028 * (1 + 0.1 * Math.sin(T.t / 60)), 0, Math.PI * 2); ctx.fill();
        continue;
      }
      const q = t / TRANSIT_FLIGHT_MS, e = q * q * (3 - 2 * q);
      const el = m.el;
      // elScreenPos (S1-D075): the 2D formula when R3D is off, the true
      // billboard projection when it's on — the drop still lands ON the object
      const tpos = elScreenPos(el);
      const tx = tpos.x * W, ty = tpos.y * H;
      // quadratic arc over the midpoint — the drop is thrown, not slid
      const lift = TRANSIT_ARC_LIFT * H * (0.5 + 0.5 * Math.min(1, Math.hypot(tx - cx, ty - cy) / (0.6 * H)));
      const mx2 = (cx + tx) / 2, my2 = Math.min(cy, ty) - lift;
      const x = (1 - e) * (1 - e) * cx + 2 * (1 - e) * e * mx2 + e * e * tx;
      const y = (1 - e) * (1 - e) * cy + 2 * (1 - e) * e * my2 + e * e * ty;
      const r = S * 0.030 * (1 - e) + S * 0.013 * tpos.k * e; // shrinks INTO the depth
      m.trail.push([x, y, r]);
      if (m.trail.length > 9) m.trail.shift();
      for (let i = 0; i < m.trail.length; i++){
        const [px, py, pr] = m.trail[i];
        ctx.globalAlpha = 0.30 * (i + 1) / m.trail.length;
        ctx.fillStyle = transitInk(e);
        ctx.beginPath(); ctx.arc(px, py, pr * (0.55 + 0.45 * (i + 1) / m.trail.length), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = transitInk(e);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    if (!live && T.els.every(m => m.arrived)) state.transit = null;
  }
  ctx.restore();
}
function beamV(x, p) {
  const head = p * (H + 200) - 100;
  const grd = ctx.createLinearGradient(0, head - 260, 0, head);
  grd.addColorStop(0, 'rgba(201,153,43,0)');
  grd.addColorStop(1, 'rgba(201,153,43,0.85)');
  ctx.globalAlpha = 1 - Math.max(0, p - 0.75) * 4;
  ctx.fillStyle = grd;
  ctx.fillRect(x - 5, Math.max(0, head - 260), 10, Math.min(head, H) - Math.max(0, head - 260));
  ctx.globalAlpha = 1;
}
