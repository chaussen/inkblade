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
  // Placement is a dice roll, not an aim (S1-D059, supersedes S1-D052/D053):
  // John's playtest ruling — release point is low priority, interactions
  // should emerge from things randomly landing near each other, not from a
  // targeting act. Candidates scored by 2D distance to same-kind neighbors
  // only (the depth field, S1-D041, fills in both axes, not a strip).
  let bx = 0.5, by = (y1 + y2) / 2, bd = -1e9;
  for (let i = 0; i < 10; i++){
    const cx = 0.08 + worldRand() * 0.84;
    const cy = y1 + worldRand() * (y2 - y1);
    let d = 1e9;
    for (const e of state.world.els) if (e.k === k) d = Math.min(d, Math.hypot(e.x - cx, e.y - cy));
    if (d > bd) { bd = d; bx = cx; by = cy; }
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
  const els = [];
  if (!kindKey) { els.push(plantSeal(def, isNew)); } // seal fallback (C3: no lock without a mark)
  else {
    const P = wp.params || {};
    const v = () => 0.8 + worldRand() * 0.45; // per-instance body variance
    const s0 = (P.scale || 1) * (P.vary === false ? 1 : v());
    const base = placeEl(kindKey, s0, isNew);
    if (wp.tier === 2) base.p = P; // per-char skin params, persisted with the element
    els.push(base);
    for (const dx of (P.offsets || [])) {
      const m = placeEl(kindKey, (P.memberScale || 0.9) * v(), isNew);
      m.x = clamp01(base.x + dx);
      // a group shares its base's depth (±jitter) — 林 is one grove, not
      // trees scattered across the field
      const [gy1, gy2] = bandFor(kindKey);
      m.y = Math.max(gy1, Math.min(gy2, base.y + (worldRand() - 0.5) * 0.03));
      if (wp.tier === 2) m.p = P;
      els.push(m);
    }
  }
  // the ink travels (S1-D069): matter is chosen now, revealed on arrival —
  // transit els are skipped by render and sim; saveWorld's explicit field
  // pick omits the flag, so a mid-flight reload completes the plant.
  for (const el of els) el.transit = true;
  saveWorld();
  return els;
}
function plantSeal(def, isNew){
  const el = placeEl('seal', 1, isNew);
  el.ch = def.ch; // the seal bears the character's form (C3)
  return el;
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
  // ink in flight gives no heat — the world reacts to landed matter only (S1-D069)
  return state.world.els.filter(el => !el.transit && isLiveHeat(el));
}
function updateWorld(dt, now){
  if (!ECOLOGY || !state.world.els.length) return;
  let removed = false;
  const fires = heatSources();
  const aura = ECOLOGY.heatAuraR || 0;
  for (const el of state.world.els){
    if (el.transit) continue; // in flight — clocks and reactions start at arrival (S1-D069)
    if (el.life) updateFireLife(el, dt);
    if (el.burn) updateBurnLife(el, dt);
    if (kindHasTag(el.k, 'living')) updateAgent(el, dt, fires);
    // transient heat-aura cue (never persisted): renderers answer it —
    // trees shimmer, water steams, walkers stand hearth-calm
    el.hot = aura > 0 && !kindHasTag(el.k, 'heat') && fires.some(f => elDist(el, f) < aura);
  }
  if (E2_ON) updateIgnition(dt, fires);
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
/* ---------------- ecology E2 (S1-D049/S1-D054, gated by E2_ON) ---------------- *
 * Ignition transforms, never destroys: a kindled element keeps its kind and
 * seed and walks burn → ash → sprout → sapling → ITSELF. Only live heat
 * ignites (heatSources() — fire kinds; burning matter never joins it, so
 * chains stop at one hop per S1-D049c; the sun has no life and never
 * ignites). All radii and clocks are pack data — no ignition block in the
 * pack, no ignition in the world.
 * ------------------------------------------------------------------------------ */
function updateIgnition(dt, fires){
  const IG = ECOLOGY && ECOLOGY.ignition;
  if (!IG || !ECOLOGY.regrow || !fires.length) return;
  for (const el of state.world.els){
    if (el.transit || el.burn || el.life || !kindHasTag(el.k, 'flammable')) continue;
    // dwell accumulates as a rate so mixed flame/ember exposure adds honestly;
    // embers kindle slower and closer (S1-D049d — the smolder-catch stays legible)
    let rate = 0;
    for (const f of fires){
      const P = IG[f.life.phase === 'burning' ? 'flame' : 'ember'];
      if (P && elDist(el, f) < P.r) rate = Math.max(rate, 1 / P.dwellMs);
    }
    if (rate){
      el.kindleT = (el.kindleT || 0) + dt * rate;
      if (el.kindleT >= 1){
        delete el.kindleT;
        el.burn = { phase: 'burning', fuel: ECOLOGY.fire.fuelMs * el.s, t: 0, flare: 0, nextFlare: flareIn() };
        METRICS.e2.ignitions++;
        sfxWorldCue('crackle');
        saveWorld();
      }
    } else if (el.kindleT) el.kindleT = Math.max(0, el.kindleT - dt / (IG.coolMs || 1));
  }
}
function updateBurnLife(el, dt){
  const B = el.burn, F = ECOLOGY.fire, R = ECOLOGY.regrow;
  if (B.nextFlare === undefined){ B.flare = 0; B.nextFlare = flareIn(); } // restored mid-burn from a save
  B.t += dt;
  if (B.phase === 'burning'){
    B.fuel -= dt;
    if (B.flare > 0) B.flare -= dt;
    else { B.nextFlare -= dt; if (B.nextFlare <= 0){ B.flare = F.flareMs; B.nextFlare = flareIn(); sfxWorldCue('crackle'); saveWorld(); } }
    if (B.fuel <= 0){ B.phase = 'embers'; B.t = 0; B.flare = 0; saveWorld(); }
  } else if (B.phase === 'embers'){
    if (B.t >= F.emberMs){ B.phase = 'smoke'; B.t = 0; saveWorld(); }
  } else if (B.phase === 'smoke'){
    if (B.t >= F.smokeMs){ B.phase = 'ash'; B.t = 0; saveWorld(); }
  } else if (B.phase === 'ash'){
    if (B.t >= R.ashMs){ B.phase = 'sprout'; B.t = 0; saveWorld(); }
  } else if (B.phase === 'sprout'){
    if (B.t >= R.sproutMs){ B.phase = 'sapling'; B.t = 0; saveWorld(); }
  } else if (B.phase === 'sapling'){
    // the same seed grows back: regrowth completes the covenant
    if (B.t >= R.saplingMs){ delete el.burn; METRICS.e2.regrowths++; saveWorld(); }
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
