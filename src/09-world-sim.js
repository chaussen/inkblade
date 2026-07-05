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
  let bx = 0.5, bd = -1;
  for (let i = 0; i < 8; i++){
    const cx = 0.08 + worldRand() * 0.84;
    let d = 1e9;
    for (const e of state.world.els) if (e.k === k) d = Math.min(d, Math.abs(e.x - cx));
    if (d > bd) { bd = d; bx = cx; }
  }
  const el = {
    k, x: bx, y: y1 + worldRand() * (y2 - y1), s,
    seed: Math.floor(worldRand()*1e9), cls: classOfKind(k),
    born: performance.now(), fresh: !!isNew,
  };
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
    if (wp.tier === 2) m.p = P;
  }
  saveWorld();
}
function plantSeal(def, isNew){
  const el = placeEl('seal', 1, isNew);
  el.ch = def.ch; // the seal bears the character's form (C3)
}
