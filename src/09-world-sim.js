/* ========================= 09 WORLD SIM ========================= *
 * The persistent living scroll (S1-D016/D017). Planting is driven
 * entirely by pack data (`world` field): tier-1 kind + params, or
 * null → seal fallback (C3: no character locks without leaving a
 * mark). The v1 14-case switch is deleted (S1-D021.3).
 * `?seed=` routes world randomness through the seeded rng for
 * deterministic ecology scenarios (S1-D025).
 * ================================================================ */
function clamp01(v){ return Math.max(0.04, Math.min(0.96, v)); }
function rng(seed){ let t = seed>>>0; return ()=>{ t+=0x6D2B79F5; let r=Math.imul(t^t>>>15,1|t); r^=r+Math.imul(r^r>>>7,61|r); return ((r^r>>>14)>>>0)/4294967296; }; }
const worldRand = SEED_PARAM !== null ? rng(parseInt(SEED_PARAM, 10) || 1) : Math.random;

function placeEl(k, s, isNew){
  const [y1, y2] = bandFor(k);
  // Placement choice (S1-D052, OPEN-14): the lock gesture's exit point pulls
  // candidate scoring toward where the player ended the final stroke — exit
  // x lands in the field, exit y maps into the kind's band (high = far, low
  // = near). Pull weights are pack data (ecology.placement.pull); no data or
  // UNIQUE kinds → pull 0 → pure max-spacing, exactly the old selection.
  const pulls = ECOLOGY && ECOLOGY.placement && ECOLOGY.placement.pull;
  const pull = (pulls && state.lockExit && !UNIQUE[k])
    ? (pulls[k] !== undefined ? pulls[k] : (pulls.default || 0)) : 0;
  const ax = pull ? Math.max(0.08, Math.min(0.92, state.lockExit.x)) : 0;
  const ay = pull ? y1 + Math.max(0, Math.min(1, state.lockExit.y)) * (y2 - y1) : 0;
  // candidates scored by 2D distance to same-kind neighbors — the depth
  // field (S1-D041) fills in both axes, not a strip
  let bx = 0.5, by = (y1 + y2) / 2, bd = -1e9;
  for (let i = 0; i < 10; i++){
    const cx = 0.08 + worldRand() * 0.84;
    const cy = y1 + worldRand() * (y2 - y1);
    let d = 1e9;
    for (const e of state.world.els) if (e.k === k) d = Math.min(d, Math.hypot(e.x - cx, e.y - cy));
    const score = pull ? (1 - pull) * Math.min(d, 1.4) - pull * Math.hypot(cx - ax, cy - ay) : d;
    if (score > bd) { bd = score; bx = cx; by = cy; }
  }
  const el = {
    k, x: bx, y: by, s,
    seed: Math.floor(worldRand()*1e9), cls: classOfKind(k),
    born: performance.now(), fresh: !!isNew,
  };
  // event-class matter is mortal (S1-D020 R4): larger fires carry more fuel
  if (ECOLOGY && kindHasTag(k, 'mortal')) {
    el.life = { phase: 'burning', fuel: ECOLOGY.fire.fuelMs * s, t: 0, flare: 0, nextFlare: flareIn() };
  }
  if (UNIQUE[k]) state.world.els = state.world.els.filter(e => e.k !== k);
  state.world.els.push(el);
  while (state.world.els.length > WORLD_CAP) {
    const i = state.world.els.findIndex(e => !UNIQUE[e.k]);
    if (i < 0) break;
    state.world.els.splice(i, 1);
  }
  METRICS.world.elements = state.world.els.length;
  return el;
}
function spawnWorldFor(def, isNew){
  const wp = def.world;
  const kindKey = wp && (wp.kind || wp.class); // tier 1 = bespoke kind; tier 2 = class family
  if (!kindKey) { plantSeal(def, isNew); saveWorld(); return; } // seal fallback (C3: no lock without a mark)
  const P = wp.params || {};
  const v = () => 0.8 + worldRand() * 0.45; // per-instance body variance
  const s0 = (P.scale || 1) * (P.vary === false ? 1 : v());
  const base = placeEl(kindKey, s0, isNew);
  if (wp.tier === 2) base.p = P; // per-char skin params, persisted with the element
  for (const dx of (P.offsets || [])) {
    const m = placeEl(kindKey, (P.memberScale || 0.9) * v(), isNew);
    m.x = clamp01(base.x + dx);
    // a group shares its base's depth (±jitter) — 林 is one grove, not
    // trees scattered across the field
    const [gy1, gy2] = bandFor(kindKey);
    m.y = Math.max(gy1, Math.min(gy2, base.y + (worldRand() - 0.5) * 0.03));
    if (wp.tier === 2) m.p = P;
  }
  saveWorld();
}
function plantSeal(def, isNew){
  const el = placeEl('seal', 1, isNew);
  el.ch = def.ch; // the seal bears the character's form (C3)
}

/* ---------------- ecology E1 (S1-D020) ---------------- *
 * Reactive only. All thresholds and clocks come from pack data
 * (ECOLOGY); the engine knows tags, not tuning. Invariant: nothing
 * the player has planted is ever destroyed or degraded in E1 —
 * the only removals here are the fire lifecycle completing (event-
 * class mortality, R4) which is design, not destruction, and is
 * counted in e1.burnouts, never e1.destructions. E2 (heat ignites
 * flammable) is HARD-GATED: E2_ENABLED is false, no ignition code
 * ships until the OPEN-14 choice-axis design exists.
 * ------------------------------------------------------ */
function flareIn(){ const [a, b] = ECOLOGY.fire.flareEveryMs; return a + worldRand() * (b - a); }
const elDist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
// A live heat event — the render's burn-through predicate and the sim's heat
// source are one definition (S1-D045).
function isLiveHeat(el){
  return !!(ECOLOGY && el.life && kindHasTag(el.k, 'heat') && ECOLOGY.fire.heatPhases.includes(el.life.phase));
}
function heatSources(){
  return state.world.els.filter(isLiveHeat);
}
function updateWorld(dt, now){
  if (!ECOLOGY || !state.world.els.length) return;
  let removed = false;
  const fires = heatSources();
  const aura = ECOLOGY.heatAuraR || 0;
  for (const el of state.world.els){
    if (el.life) updateFireLife(el, dt);
    if (kindHasTag(el.k, 'living')) updateAgent(el, dt, fires);
    // transient heat-aura cue (never persisted): renderers answer it —
    // trees shimmer, water steams, walkers stand hearth-calm
    el.hot = aura > 0 && !kindHasTag(el.k, 'heat') && fires.some(f => elDist(el, f) < aura);
  }
  const before = state.world.els.length;
  state.world.els = state.world.els.filter(el => !(el.life && el.life.phase === 'gone'));
  if (state.world.els.length !== before) { removed = true; METRICS.world.elements = state.world.els.length; }
  if (removed) saveWorld(); // the scroll healed — persist it
}
function updateFireLife(el, dt){
  const L = el.life, F = ECOLOGY.fire;
  if (L.nextFlare === undefined){ L.flare = 0; L.nextFlare = flareIn(); } // restored mid-burn from a save
  L.t += dt;
  if (L.phase === 'burning'){
    L.fuel -= dt;
    if (L.flare > 0) L.flare -= dt;
    // the flare doubles as the mid-burn save checkpoint (Q12: remaining
    // fuel survives a reload without per-frame localStorage churn)
    else { L.nextFlare -= dt; if (L.nextFlare <= 0){ L.flare = F.flareMs; L.nextFlare = flareIn(); sfxWorldCue('crackle'); saveWorld(); } }
    if (L.fuel <= 0){ L.phase = 'embers'; L.t = 0; L.flare = 0; METRICS.e1.burnouts++; saveWorld(); }
  } else if (L.phase === 'embers'){
    if (L.t >= F.emberMs){ L.phase = 'smoke'; L.t = 0; saveWorld(); }
  } else if (L.phase === 'smoke'){
    if (L.t >= F.smokeMs){ L.phase = 'ash'; L.t = 0; saveWorld(); }
  } else if (L.phase === 'ash'){
    if (L.t >= ECOLOGY.ashDecayMs) L.phase = 'gone';
  }
}
function updateAgent(el, dt, fires){
  const E = ECOLOGY;
  if (!el.beh) el.beh = { home: el.x, mode: 'wander', hopT: 0, warmed: false, restCd: 0, restT: 0 };
  const B = el.beh;
  if (B.hopT > 0) B.hopT -= dt;
  if (B.restCd > 0) B.restCd -= dt;
  let near = null, nd = 1e9;
  for (const f of fires){ const d = elDist(el, f); if (d < nd){ nd = d; near = f; } }
  const dangerNow = near ? E.dangerR * (near.life.flare > 0 ? E.fire.flareBoost : 1) : 0;

  // R2: startle + flee re-center away; return after the fire dies
  if (near && nd < dangerNow && B.mode !== 'flee' && B.mode !== 'avoid'){
    B.mode = 'flee'; B.hopT = 400; B.restT = 0;
    const dir = Math.sign(el.x - near.x) || (worldRand() < 0.5 ? -1 : 1);
    B.target = clamp01(near.x + dir * E.fleeDist);
    METRICS.e1.startles++;
    sfxWorldCue('startle');
  }
  const speed = E.walkSpeed * (B.mode === 'flee' ? E.fleeSpeedMult : 1) * dt / 1000;
  if (B.mode === 'flee'){
    el.x = stepX(el.x, B.target, speed);
    if (el.x === B.target) B.mode = 'avoid';
  } else if (B.mode === 'avoid'){
    if (!near) B.mode = 'return'; // fire died — come back
  } else if (B.mode === 'return'){
    el.x = stepX(el.x, B.home, speed);
    if (el.x === B.home){ B.mode = 'wander'; B.warmed = false; }
  } else if (B.mode === 'rest'){
    B.restT -= dt;
    if (B.restT <= 0){ B.mode = 'wander'; B.restCd = E.restCooldownMs; }
  } else { // wander
    // R1: comfort-radius warming — drift toward the fire, loiter at warmDist
    if (near && nd < E.comfortR && nd > E.warmDist){
      const dir = Math.sign(near.x - el.x) || 1;
      el.x = stepX(el.x, clamp01(near.x - dir * E.warmDist), speed);
      if (!B.warmed){ B.warmed = true; METRICS.e1.warmings++; }
    } else if (!near) B.warmed = false;
    // R3: an occasional rest beat under shelter
    if (B.restCd <= 0){
      const sheltered = state.world.els.some(e => e !== el && kindHasTag(e.k, 'shelter') && elDist(el, e) < E.shelterR);
      if (sheltered && worldRand() < E.restChancePerSec * dt / 1000){
        B.mode = 'rest'; B.restT = E.restMs; METRICS.e1.rests++;
      }
    }
  }
}
function stepX(x, target, maxStep){
  const d = target - x;
  return Math.abs(d) <= maxStep ? target : x + Math.sign(d) * maxStep;
}
