/* ========================= 12 RENDER ========================= *
 * Glyph, trails, particles, HUD, title. Strokes render as polylines
 * from pts; hand-authored 2-point pie/na strokes keep their legacy
 * quadratic bow via the `form` hint (dropped when real medians land
 * at M1a step 2 / M1b).
 * ============================================================= */
function strokePath(st) {
  const p = strokeScreenPts(st);
  ctx.beginPath();
  if ((st.form === 'pie' || st.form === 'na') && p.length === 2) {
    const [a, b] = p;
    const mx = (a[0]+b[0])/2, my = (a[1]+b[1])/2;
    const dx = b[0]-a[0], dy = b[1]-a[1], L = Math.hypot(dx, dy) || 1;
    const sgn = st.form === 'pie' ? 1 : -1;
    const k = L * 0.09 * sgn;
    ctx.moveTo(a[0], a[1]);
    ctx.quadraticCurveTo(mx + (dy/L)*k, my - (dx/L)*k, b[0], b[1]);
  } else {
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
  }
}
function compBBox(g, comp) {
  let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
  for (let i = comp.range[0]; i <= comp.range[1]; i++) {
    for (const pt of strokeScreenPts(g.strokes[i])) {
      x1 = Math.min(x1, pt[0]); y1 = Math.min(y1, pt[1]);
      x2 = Math.max(x2, pt[0]); y2 = Math.max(y2, pt[1]);
    }
  }
  const pad = S * 0.045;
  return [x1 - pad, y1 - pad, x2 - x1 + pad*2, y2 - y1 + pad*2];
}
function drawGlyph(dt, now) {
  const g = state.glyph; if (!g) return;
  g.appearT = Math.min(1, g.appearT + dt / 300);
  const wf = g.strokes.length > 8 ? 0.62 : (g.strokes.length > 4 ? 0.8 : 1); // width factor for dense glyphs
  ctx.save();
  ctx.globalAlpha = g.appearT;
  // component wash — segmentation via the character's own anatomy
  if (g.comps.length > 1) {
    for (const comp of g.comps) {
      const [x, y, w, h] = compBBox(g, comp);
      ctx.fillStyle = WASHES[comp.idx % WASHES.length];
      roundRect(x, y, w, h, 10); ctx.fill();
      if (comp.pulse > 0) {
        ctx.globalAlpha = g.appearT * comp.pulse * 0.7;
        ctx.strokeStyle = comp.gold ? GOLD : ASH;
        ctx.lineWidth = 3 + (1 - comp.pulse) * 6;
        roundRect(x - (1-comp.pulse)*12, y - (1-comp.pulse)*12, w + (1-comp.pulse)*24, h + (1-comp.pulse)*24, 12);
        ctx.stroke();
        ctx.globalAlpha = g.appearT;
        comp.pulse = Math.max(0, comp.pulse - dt / 600);
      }
    }
  }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const breathing = g.breathe > 0 ? (0.5 + 0.5 * Math.sin(now / 180)) : 0;
  for (const st of g.strokes) {
    if (st.hidden) continue;
    let ox = 0, oy = 0;
    if (st.shiver > 0) {
      ox = (Math.random()-0.5) * st.shiver * 9;
      oy = (Math.random()-0.5) * st.shiver * 9;
      st.shiver = Math.max(0, st.shiver - dt / 260);
    }
    ctx.save(); ctx.translate(ox, oy);
    if (!st.cut) {
      const hinted = g.breathe > 0 && st.comp === g.breatheComp;
      ctx.strokeStyle = hinted ? `rgba(70,62,48,${0.16 + 0.22 * breathing})` : GHOST;
      ctx.lineWidth = S * 0.088 * wf;
      strokePath(st); ctx.stroke();
      ctx.strokeStyle = hinted ? `rgba(70,62,48,${0.10 + 0.14 * breathing})` : 'rgba(70,62,48,0.10)';
      ctx.lineWidth = S * 0.05 * wf;
      strokePath(st); ctx.stroke();
    } else {
      st.cutT = Math.min(1, st.cutT + dt / 190);
      const L = strokeLen(st) * 1.05;
      ctx.setLineDash([L, L]); ctx.lineDashOffset = L * (1 - st.cutT);
      if (st.gold && st.cutT < 1) {
        ctx.strokeStyle = GOLD; ctx.lineWidth = S * 0.11 * wf; ctx.globalAlpha = g.appearT * 0.5;
        strokePath(st); ctx.stroke(); ctx.globalAlpha = g.appearT;
      }
      ctx.strokeStyle = st.gold ? INK : ASH; ctx.lineWidth = S * 0.078 * wf;
      strokePath(st); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
  if (state.mode === 'resolve' && state.resolve && state.resolve.kind === 'lock') {
    const p = Math.min(1, state.resolve.t / 500);
    ctx.globalAlpha = (1 - p) * 0.5;
    ctx.strokeStyle = GOLD; ctx.lineWidth = (S * 0.1 + p * S * 0.03) * wf;
    for (const st of g.strokes) { strokePath(st); ctx.stroke(); }
  }
  ctx.restore();
  if (g.breathe > 0) g.breathe -= dt;
  if (g.comet > 0) { drawComet(g, dt); g.comet -= dt; }
}
function drawComet(g, dt) {
  const st = g.strokes[g.cometStroke];
  if (!st || st.cut) { g.comet = 0; return; }
  const cyc = 1100;
  const p = ((2200 - g.comet) % cyc) / cyc;
  if (p > 0.8) return;
  const q = p / 0.8;
  const pt = pointAlong(st, q);
  const dir = pt.dir || [1, 0];
  const L = Math.hypot(dir[0], dir[1]) || 1;
  ctx.save();
  ctx.fillStyle = INK;
  for (let i = 0; i <= 4; i++) {
    ctx.globalAlpha = 0.55 * Math.sin(q * Math.PI) * (1 - i/5.5);
    ctx.beginPath(); ctx.arc(pt[0] - dir[0]/L*i*11, pt[1] - dir[1]/L*i*11, 7 - i, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}
function drawTrails(dt) {
  for (const t of state.trails) {
    t.life -= dt / 420;
    if (t.life <= 0) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, t.life) * 0.7;
    ctx.strokeStyle = t.gold ? GOLD : INK;
    ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(t.pts[0][0], t.pts[0][1]);
    for (const p of t.pts) ctx.lineTo(p[0], p[1]);
    ctx.stroke();
    ctx.restore();
  }
  state.trails = state.trails.filter(t => t.life > 0);
  if (trail && trail.length > 1) {
    ctx.save();
    ctx.globalAlpha = 0.75; ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(trail[0][0], trail[0][1]);
    for (const p of trail) ctx.lineTo(p[0], p[1]);
    ctx.stroke();
    ctx.restore();
  }
}
function drawParticles(dt) {
  for (const p of state.particles) {
    p.life -= dt / 1000;
    p.vy += p.grav * dt / 1000;
    p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000;
    if (p.life <= 0) continue;
    ctx.globalAlpha = Math.min(1, p.life * 2);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  state.particles = state.particles.filter(p => p.life > 0);
}
function drawHUD() {
  if (state.streak >= 2) {
    ctx.save();
    ctx.fillStyle = CINNABAR;
    ctx.font = '600 ' + Math.round(Math.min(W,H)*0.035) + 'px ' + CHAR_FONT;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('连 ' + state.streak, 18, 16);
    ctx.restore();
  }
  const n = CHARS.length;
  const cell = Math.min(40, (W - 32) / n - 6);
  const total = n * (cell + 6) - 6;
  let x = (W - total) / 2;
  const y = H - cell - 12;
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const c of CHARS) {
    if (state.locked[c.ch]) {
      ctx.fillStyle = CINNABAR;
      roundRect(x, y, cell, cell, 5); ctx.fill();
      ctx.fillStyle = '#f3e9d6';
      ctx.font = (cell * 0.62) + 'px ' + CHAR_FONT;
      ctx.fillText(c.ch, x + cell/2, y + cell/2 + cell*0.04);
    } else {
      ctx.strokeStyle = 'rgba(70,62,48,0.25)'; ctx.lineWidth = 1.2;
      roundRect(x, y, cell, cell, 5); ctx.stroke();
      ctx.fillStyle = 'rgba(70,62,48,0.28)';
      ctx.beginPath(); ctx.arc(x + cell/2, y + cell/2, 2, 0, Math.PI*2); ctx.fill();
    }
    x += cell + 6;
  }
  ctx.restore();
  if (state.banner) {
    state.banner.t += 16;
    const bt = state.banner.t;
    const a = bt < 300 ? bt/300 : (bt > 2100 ? Math.max(0, 1 - (bt-2100)/400) : 1);
    if (a <= 0) { state.banner = null; }
    else {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      ctx.fillStyle = INK;
      ctx.font = '600 ' + Math.round(Math.min(W,H)*0.05) + 'px ' + CHAR_FONT;
      ctx.fillText(state.banner.pinyin, W/2, GY + S + Math.min(H*0.055, 40));
      ctx.globalAlpha = a * 0.7;
      ctx.font = Math.round(Math.min(W,H)*0.026) + 'px Georgia, serif';
      ctx.fillText(state.banner.gloss, W/2, GY + S + Math.min(H*0.055, 40) + Math.min(W,H)*0.045);
      ctx.restore();
    }
  }
  ctx.save();
  ctx.globalAlpha = 0.35; ctx.fillStyle = INK;
  ctx.font = '10px monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  ctx.fillText(BUILD_ID, W - 6, H - 4);
  ctx.restore();
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.arcTo(x+w, y, x+w, y+h, r); ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r); ctx.arcTo(x, y, x+w, y, r); ctx.closePath();
}
function drawTitle() {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = Math.round(Math.min(W,H)*0.22) + 'px ' + CHAR_FONT;
  ctx.textBaseline = 'middle';
  ctx.fillText('墨刃', W/2, H*0.38);
  ctx.font = '600 ' + Math.round(Math.min(W,H)*0.028) + 'px Georgia, serif';
  ctx.globalAlpha = 0.8;
  ctx.fillText('I N K B L A D E', W/2, H*0.38 + Math.min(W,H)*0.15);
  ctx.globalAlpha = 0.65;
  ctx.font = Math.round(Math.min(W,H)*0.022) + 'px Georgia, serif';
  ctx.fillText('Slash the strokes. True order has power.', W/2, H*0.62);
  ctx.globalAlpha = 0.45 + 0.25 * Math.sin(perfT/400);
  ctx.fillText('— slash anywhere to begin —', W/2, H*0.70);
  ctx.restore();
}
// First-glyph gesture hint (S1-D007): comet on the curriculum's opening
// character before the first-ever cut. Which character opens is pack data
// (meta.intro[0]); the hint additionally requires a single stroke so it can
// teach the slash without ever leaking order.
function drawFirstGlyphHint(dt, now) {
  const g = state.glyph;
  if (!g || !INTRO.length || g.def.ch !== INTRO[0] || g.def.strokes.length !== 1) return;
  if (METRICS.cuts > 0 || state.mode !== 'play') return;
  if (now - g.lastAct < 3500) return;
  const cyc = 1600;
  const p = (now % cyc) / cyc;
  if (p > 0.75) return;
  const q = p / 0.75;
  const st = g.strokes[0];
  const a = toScreen(st.pts[0]), b = toScreen(st.pts[st.pts.length - 1]);
  const x = a[0] + (b[0]-a[0]) * q, y = a[1];
  ctx.save();
  ctx.globalAlpha = 0.5 * Math.sin(q * Math.PI);
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI*2); ctx.fill();
  for (let i = 1; i <= 4; i++) {
    ctx.globalAlpha = 0.5 * Math.sin(q * Math.PI) * (1 - i/5);
    ctx.beginPath(); ctx.arc(x - i*11, y, 7 - i, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}
