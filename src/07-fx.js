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
