/* ========================= 02 DATA ========================= *
 * Pack loading + validation (S1-D024/D025). The engine carries no
 * character data, element mappings, or reaction tuning; the default
 * pack is injected by the build step as an application/json block.
 * `verbs` is the matching contract (direction classes only —
 * charter §7 Q1: nothing here or downstream may read curvature,
 * proportion, segment length ratios, or neatness). `pts` is the
 * render/hit geometry contract.
 * =========================================================== */
let PACK = null, CHARS = [], INTRO = [], KINDS = {}, ECOLOGY = null;

const VERB_TOKENS = ['heng', 'dr', 'shu', 'pie', 'ti', 'hook'];

function validateStroke(s) {
  if (!s || typeof s.verbs !== 'string') return 'stroke missing verbs';
  const toks = s.verbs.split('>');
  if (!toks.every(t => VERB_TOKENS.includes(t))) return 'unknown verb token in "' + s.verbs + '"';
  const segs = toks.filter(t => t !== 'hook').length;
  if (segs < 1) return 'empty verb string';
  if (segs > 3 && !s.complex) return 'more than 3 segments without complex flag';
  if (!Array.isArray(s.pts) || s.pts.length < 2 || s.pts.length > 12) return 'pts must have 2..12 points';
  for (const p of s.pts) {
    if (!Array.isArray(p) || p.length !== 2 ||
        !p.every(n => typeof n === 'number' && isFinite(n) && n >= 0 && n <= 100)) return 'pts out of 0-100 box';
  }
  return null;
}
function validateChar(c) {
  if (!c || typeof c.ch !== 'string' || !c.ch) return 'missing ch';
  if (!Array.isArray(c.strokes) || !c.strokes.length) return 'missing strokes';
  for (const s of c.strokes) { const e = validateStroke(s); if (e) return c.ch + ': ' + e; }
  if (!Array.isArray(c.comps) || !c.comps.length) return c.ch + ': missing comps';
  let next = 0;
  for (const cm of c.comps) {
    const r = cm && cm.range;
    if (!Array.isArray(r) || r.length !== 2 || r[0] !== next || r[1] < r[0]) return c.ch + ': comps not contiguous from 0';
    next = r[1] + 1;
  }
  if (next !== c.strokes.length) return c.ch + ': comps do not cover all strokes';
  const w = c.world;
  if (w != null) {
    if (w.tier === 1) { if (typeof w.kind !== 'string') return c.ch + ': tier-1 world needs kind'; }
    else if (w.tier === 2) { if (typeof w.class !== 'string') return c.ch + ': tier-2 world needs class'; }
    else return c.ch + ': world.tier must be 1 or 2';
  }
  return null;
}
// Returns { ok, errors, quarantined }. Pack-level failure → ok:false and the
// caller keeps whatever pack it already has; per-char failure → quarantine.
function validatePack(p) {
  const out = { ok: false, errors: [], quarantined: [] };
  if (!p || p.version !== 2) { out.errors.push('unsupported pack version: ' + (p && p.version)); return out; }
  if (!Array.isArray(p.chars) || !p.chars.length) { out.errors.push('pack has no chars'); return out; }
  if (!p.kinds || typeof p.kinds !== 'object') { out.errors.push('pack missing kinds block'); return out; }
  for (const c of p.chars) {
    const e = validateChar(c);
    if (e) out.quarantined.push(e);
  }
  if (out.quarantined.length === p.chars.length) { out.errors.push('every char failed validation'); return out; }
  out.ok = true;
  return out;
}
// Runtime shape: minimal churn from v1 — strokes keep a `t` field which is
// now the verb string ('dr' covers the merged down-right per S1-D013).
function adaptChar(c) {
  return {
    ch: c.ch, pinyin: c.pinyin || '', gloss: c.gloss || '',
    fx: c.fx ? c.fx.type : null, n: (c.fx && c.fx.n) || 1,
    strokes: c.strokes.map(s => ({ t: s.verbs, form: s.form || null, complex: !!s.complex, pts: s.pts })),
    comps: c.comps.map(cm => cm.range),
    world: c.world || null,
  };
}
function adoptPack(p) {
  const v = validatePack(p);
  if (!v.ok) return v;
  if (v.quarantined.length) console.warn('[S1] pack chars quarantined:', v.quarantined.join(' | '));
  PACK = p;
  KINDS = p.kinds;
  ECOLOGY = p.ecology || null; // E1 reaction tuning — data, never engine
  INTRO = (p.meta && p.meta.intro) || [];
  CHARS = p.chars.filter(c => !validateChar(c)).map(adaptChar);
  return v;
}
function loadEmbeddedPack() {
  const el = document.getElementById('pack-default');
  const v = adoptPack(JSON.parse(el.textContent));
  if (!v.ok) throw new Error('embedded pack rejected: ' + v.errors.join('; '));
}
async function loadPackParam(url) {
  try {
    const res = await fetch(url);
    const p = await res.json();
    const v = adoptPack(p);
    if (!v.ok) console.warn('[S1] ?pack= rejected (' + v.errors.join('; ') + '); using embedded pack');
    return v.ok;
  } catch (e) {
    console.warn('[S1] ?pack= load failed (' + e.message + '); using embedded pack');
    return false;
  }
}
function classOfKind(k) { const kd = KINDS[k]; return kd ? kd.cls : null; }
function kindHasTag(k, tag) { const kd = KINDS[k]; return !!(kd && kd.tags && kd.tags.includes(tag)); }
