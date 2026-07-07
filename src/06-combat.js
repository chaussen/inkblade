/* ========================= 06 GLYPH COMBAT ========================= *
 * Glyph lifecycle, alignment-priority targeting (S1-D008), cut /
 * deflect / lock / fizzle (S1-D002), fractal-combo mini-locks
 * (S1-D011), breathing hints (S1-D012). Per-glyph instrumentation
 * (worldDensity, timeToFirstCut, whiffs) per S1-D027.
 * =================================================================== */
function worldDensityFor(g) {
  const [bx, by, bw, bh] = glyphBBox(g, S * ATTN_VEIL_PAD);
  let over = 0;
  for (const el of state.world.els) {
    const ex = el.x * W, ey = el.y * H;
    if (ex >= bx && ex <= bx + bw && ey >= by && ey <= by + bh) over++;
  }
  return { total: state.world.els.length, overGlyph: over };
}
function newGlyph(def) {
  const comps = def.comps.map((r, ci) => ({
    range: r, idx: ci, done: false, gold: false, pulse: 0,
  }));
  state.glyph = {
    def, comps,
    strokes: def.strokes.map((s, i) => ({ ...s, idx: i, comp: def.comps.findIndex(r => i >= r[0] && i <= r[1]), cut: false, gold: false, cutT: 0, shiver: 0 })),
    nextIdx: 0, intact: true, done: false, appearT: 0, brokeLogged: false,
    // hint machinery
    lastAct: performance.now(), flail: 0, hintLevel: 0,
    breathe: 0, breatheComp: -1, comet: 0, cometStroke: -1,
    // instrumentation (S1-D027)
    bornWall: performance.now(), ttfcMs: null, whiffs: 0, density: null,
  };
  state.glyph.density = worldDensityFor(state.glyph);
  METRICS.world.density = state.glyph.density;
  METRICS.perChar[def.ch] = METRICS.perChar[def.ch] || { seen: 0, locks: 0, fizzles: 0 };
  METRICS.perChar[def.ch].seen++;
}
function pickNext() {
  if (FORCED) { const f = CHARS.find(c => c.ch === FORCED); if (f) return f; }
  if (state.introIdx < INTRO.length) {
    const ch = INTRO[state.introIdx++];
    const c = CHARS.find(c => c.ch === ch);
    if (c) return c;
  }
  const pool = [];
  for (const c of CHARS) {
    // avoid immediate repeats — unless the pack has only one char to give
    if (CHARS.length > 1 && c.ch === state.prevCh) continue;
    const w = state.locked[c.ch] ? 1 : 3;
    for (let i = 0; i < w; i++) pool.push(c);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
function advance() {
  const def = pickNext();
  state.prevCh = def.ch;
  newGlyph(def);
  state.mode = 'play';
  attentionOnGlyphAppear();
}

function resolveSlash(tr) {
  state.trails.push({ pts: tr, life: 1, gold: false });
  if (state.mode === 'title') { advance(); return; }
  if (state.mode !== 'play' || !state.glyph || state.glyph.done) return;

  const g = state.glyph;
  const dx = tr[tr.length-1][0] - tr[0][0], dy = tr[tr.length-1][1] - tr[0][1];
  const len = Math.hypot(dx, dy);
  if (len < 10) return;
  const segs = classifyTrail(tr);
  // dense glyphs need a tighter tolerance to keep neighbors separable
  const dense = g.strokes.length > 8;
  const tol = Math.max(14, S * 0.075 * (dense ? 0.7 : 1));

  // Alignment-priority targeting (S1-D008): a slash cuts the stroke it runs
  // ALONG, not the stroke it crosses. Bucket-matching hits win; distance
  // breaks ties.
  const hits = [];
  for (const st of g.strokes) {
    if (st.cut) continue;
    const d = trailStrokeDist(tr, st);
    if (d < tol) hits.push({ st, d, match: strokeMatches(segs, st) ? 1 : 0 });
  }
  if (!hits.length) { METRICS.whiffs++; g.whiffs++; return; }
  hits.sort((a, b) => (b.match - a.match) || (a.d - b.d));
  const target = hits[0].st;

  g.lastAct = performance.now();

  if (strokeMatches(segs, target)) {
    target.cut = true; target.cutT = 0;
    METRICS.cuts++;
    if (g.ttfcMs === null) g.ttfcMs = Math.round(performance.now() - g.bornWall);
    if (g.intact && target.idx === g.nextIdx) {
      target.gold = true; g.nextIdx++; state.trails[state.trails.length-1].gold = true;
      METRICS.goldCuts++;
      g.flail = 0;
      sfxGoldCut(g.nextIdx);
      sparks(midOf(target), GOLD, 10);
    } else {
      if (g.intact && !g.brokeLogged) {
        // classify the first break: same component as the canonical-next
        // stroke = internal-order error; different component = component-
        // order error (the grammar layer we're measuring)
        const frontierComp = g.strokes[g.nextIdx] ? g.strokes[g.nextIdx].comp : -1;
        if (target.comp === frontierComp) METRICS.orderBreaks.internal++;
        else METRICS.orderBreaks.component++;
        g.brokeLogged = true;
      }
      g.intact = false;
      g.flail++;
      sfxAshCut();
      sparks(midOf(target), ASH, 7);
    }
    checkComponent(target.comp);
    if (g.strokes.every(s => s.cut)) {
      g.done = true;
      setTimeout(() => beginResolve(g.intact), 380);
    }
  } else {
    target.shiver = 1;
    g.flail++;
    METRICS.deflects++;
    sfxDeflect();
    sparks(nearestOn(target, tr), '#d8cfb6', 6, true);
  }
}
function checkComponent(ci) {
  const g = state.glyph;
  if (ci < 0 || g.comps.length < 2) return;
  const comp = g.comps[ci];
  if (comp.done) return;
  const strokes = g.strokes.slice(comp.range[0], comp.range[1] + 1);
  if (!strokes.every(s => s.cut)) return;
  comp.done = true;
  comp.gold = strokes.every(s => s.gold);
  comp.pulse = 1;
  if (comp.gold) { METRICS.comps.gold++; sfxMiniLock(); }
  else { METRICS.comps.ash++; sfxMiniAsh(); }
}

/* ---- hints (S1-D012) ---- */
function nextUncutStroke() {
  const g = state.glyph;
  for (const st of g.strokes) if (!st.cut) return st;
  return null;
}
function maybeHint(now) {
  const g = state.glyph;
  if (!g || g.done || state.mode !== 'play' || g.comps.length < 2) return;
  if (g.breathe > 0 || g.comet > 0) return;
  const idle = now - g.lastAct > HINT_IDLE_MS;
  const flail = g.flail >= HINT_FLAIL;
  if (!idle && !flail) return;
  const st = nextUncutStroke();
  if (!st) return;
  g.lastAct = now; g.flail = 0;
  if (g.hintLevel === 0) {
    g.hintLevel = 1; g.breathe = 2600; g.breatheComp = st.comp;
    METRICS.hints.breathe++;
  } else {
    g.hintLevel = 2; g.comet = 2200; g.cometStroke = st.idx;
    METRICS.hints.comet++;
  }
}

/* ---- resolve ---- */
function beginResolve(locked) {
  const g = state.glyph;
  const def = g.def;
  METRICS.glyphs++;
  METRICS.glyphLog.push({
    ch: def.ch, locked: !!locked,
    worldDensity: g.density,
    timeToFirstCutMs: g.ttfcMs,
    whiffs: g.whiffs,
  });
  if (METRICS.glyphLog.length > GLYPH_LOG_CAP) METRICS.glyphLog.shift();
  state.mode = 'resolve';
  if (locked) {
    METRICS.locks++; METRICS.perChar[def.ch].locks++;
    state.resolve = { kind: 'lock', t: 0, dur: 2500, def };
    state.streak++;
    const isNew = !state.locked[def.ch];
    if (!isNew) METRICS.world.relocks++;
    state.locked[def.ch] = true;
    setTimeout(() => spawnWorldFor(def, isNew), 900);
    state.banner = { pinyin: def.pinyin, gloss: def.gloss, t: 0 };
    sfxLock();
    setTimeout(() => speak(def.ch), 220);
    setTimeout(() => spawnFx(def), 300);
    if (!reduceMotion) state.shake = Math.max(state.shake, 5);
  } else {
    METRICS.fizzles++; METRICS.perChar[def.ch].fizzles++;
    state.resolve = { kind: 'fizzle', t: 0, dur: 1450, def };
    state.streak = 0;
    sfxFizzle();
    crumbleGlyph();
  }
  const summary = { ...METRICS, glyphLog: METRICS.glyphLog.length + ' entries' };
  console.log('[S1]', JSON.stringify(summary));
}
function crumbleGlyph() {
  for (const st of state.glyph.strokes) {
    const n = Math.max(8, Math.floor(strokeLen(st) / 9));
    for (let i = 0; i <= n; i++) {
      const pt = pointAlong(st, i / n);
      addParticle(state.particles, {
        x: pt[0], y: pt[1],
        vx: (Math.random()-0.5) * 40, vy: -20 - Math.random() * 40,
        grav: 220, life: 0.9 + Math.random() * 0.5,
        size: 2.5 + Math.random() * 3,
        color: Math.random() < 0.12 ? GOLD : ASH,
      }, MAX_PARTICLES);
    }
  }
  state.glyph.strokes.forEach(s => { s.hidden = true; });
}
function sparks(pos, color, n, tiny) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 140;
    addParticle(state.particles, {
      x: pos[0], y: pos[1], vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 30,
      grav: 300, life: 0.3 + Math.random() * 0.35,
      size: tiny ? 1.5 + Math.random()*1.5 : 2 + Math.random()*2.5, color,
    }, MAX_PARTICLES);
  }
}
function addParticle(pool, p, cap) {
  pool.push(p);
  if (pool.length > cap) pool.shift();
}

// Test-readable glyph geometry (S1-D030): lets suites derive slash paths from
// the live data instead of hardcoding authored coordinates. Read-only state —
// slashes themselves stay real dispatched pointer events.
window.__S1_GLYPH = () => {
  const g = state.glyph;
  if (!g) return null;
  return {
    ch: g.def.ch, mode: state.mode, nextIdx: g.nextIdx, intact: g.intact, done: g.done,
    strokes: g.strokes.map(st => ({ t: st.t, cut: st.cut, gold: st.gold, pts: strokeScreenPts(st) })),
  };
};
