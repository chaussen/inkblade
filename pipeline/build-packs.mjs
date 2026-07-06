// Inkblade content pipeline (S1-D029) — offline build step, run at authoring
// time, NEVER at runtime. Derives versioned character packs from the MMAH
// stroke DB (pipeline/data/, Arphic-derived — OPEN-12: prototyping only).
//
//   node pipeline/build-packs.mjs            → packs/core.json + packs/basic.json + pipeline/queue.json
//
// Stages (handoff C2): ingest → geometry → verb derivation → component
// derivation → validation (ambiguity queue) → emit. Anti-grading invariants
// [LOCKED, S1-D021]: verb derivation reads direction classes ONLY — nothing
// here may score curvature, proportion, corner sharpness, or neatness; the
// geometry it emits is render/hit data, not a grading template.
import { readFileSync, writeFileSync, createReadStream } from 'node:fs';
import readline from 'node:readline';

const root = new URL('..', import.meta.url);
const overrides = JSON.parse(readFileSync(new URL('overrides.json', import.meta.url), 'utf8'));
const roster = Object.keys(overrides.chars);
// The basic tier (S1-D047): frequency-ordered roster; the first BASIC_TARGET
// chars that survive derivation ship as packs/basic.json.
const rosterBasic = [...readFileSync(new URL('roster-basic.txt', import.meta.url), 'utf8').trim()];
const BASIC_TARGET = 500;
const queue = [];

/* ---------------- geometry ---------------- */
// MMAH glyph space: x 0..1024, y up, baseline at 900. Game space: 0–100, y down.
const tx = ([x, y]) => [x / 1024 * 100, (900 - y) / 1024 * 100];

function rdp(pts, eps) {
  if (pts.length <= 2) return pts;
  let maxD = 0, idx = 0;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDist(pts[i], a, b);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= eps) return [a, b];
  return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)];
}
function perpDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  return Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / L;
}
const round1 = n => Math.round(n * 10) / 10;

function processMedian(ch, i, median) {
  let pts = median.map(tx);
  for (const p of pts) {
    if (p[0] < -2 || p[0] > 102 || p[1] < -2 || p[1] > 102)
      queue.push({ ch, stroke: i, issue: 'geometry out of box', detail: JSON.stringify(p) });
    p[0] = Math.min(100, Math.max(0, p[0]));
    p[1] = Math.min(100, Math.max(0, p[1]));
  }
  pts = rdp(pts, 1.2);
  while (pts.length > 12) pts = rdp(pts, 2.5);
  if (pts.length > 12) pts = pts.filter((_, j) => j === 0 || j === pts.length - 1 || j % 2 === 0);
  return pts.map(p => [round1(p[0]), round1(p[1])]);
}

/* ---------------- verb derivation ---------------- */
// Direction buckets (screen space, y down). ti (up-right) joins at M1b play;
// deriving it now costs nothing. ±32° per charter §5.1. pie carries a second
// real-form center at 180° — the flat-撇 grace (S1-D049/S1-D050, amends
// S1-D032): 平撇 opens 看手系反笑爱委乎 at ~167–173°, a real written form.
const CENTERS = [['heng', 0], ['dr', 45], ['shu', 90], ['pie', 135], ['pie', 180], ['ti', -45]];
// Strict centers (pre-grace) still decide terminal-flick hookness: a hook's
// up-left tick (~180±) must stay a hook — optional at play (S1-D034) — and
// never harden into a required pie token via the grace center.
const CENTERS_STRICT = CENTERS.filter(([, c]) => c !== 180);
function bucketIn(deg, centers) {
  let best = null, bd = 1e9;
  for (const [n, c] of centers) { let d = Math.abs(deg - c); if (d > 180) d = 360 - d; if (d < bd) { bd = d; best = n; } }
  return bd > 32 ? null : best;
}
const bucketOf = deg => bucketIn(deg, CENTERS);
const bucketOfStrict = deg => bucketIn(deg, CENTERS_STRICT);
const angleOf = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
const turn = (a, b) => { let d = b - a; while (d > 180) d -= 360; while (d < -180) d += 360; return d; };

// Corner-split (S1-D021/D029): resample to uniform arc steps, split where the
// cumulative turn within a short window exceeds ~50°; max 2 splits. The same
// numbers the M1b runtime slash classifier will share.
const CORNER_TURN_DEG = 50;
const CORNER_WINDOW_UNITS = 14;
const ARC_STEP = 3.5;
const MIN_SEG_UNITS = 7;
const HOOK_MAX_UNITS = 12;

function resampleUniform(pts, step) {
  const out = [pts[0]];
  let carry = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let d = step - carry;
    while (d < L) {
      out.push([a[0] + (b[0] - a[0]) * d / L, a[1] + (b[1] - a[1]) * d / L]);
      d += step;
    }
    carry = (carry + L) % step;
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function deriveVerbs(ch, i, pts) {
  const u = resampleUniform(pts, ARC_STEP);
  const win = Math.max(1, Math.round(CORNER_WINDOW_UNITS / ARC_STEP));
  const angles = [];
  for (let j = 0; j < u.length - 1; j++) angles.push(angleOf(u[j], u[j + 1]));
  // corner score at j: turn between mean-direction windows before/after
  const splits = [];
  for (let j = win; j < angles.length - win; j++) {
    const before = angles.slice(j - win, j), after = angles.slice(j, j + win);
    const mean = arr => Math.atan2(
      arr.reduce((s, a) => s + Math.sin(a * Math.PI / 180), 0),
      arr.reduce((s, a) => s + Math.cos(a * Math.PI / 180), 0)) * 180 / Math.PI;
    const t = Math.abs(turn(mean(before), mean(after)));
    if (t > CORNER_TURN_DEG) {
      if (splits.length && j - splits[splits.length - 1].j < win * 2) {
        if (t > splits[splits.length - 1].t) splits[splits.length - 1] = { j, t };
      } else splits.push({ j, t });
    }
  }
  while (splits.length > 2) { splits.sort((a, b) => b.t - a.t); splits.length = 2; splits.sort((a, b) => a.j - b.j); }
  const cuts = [0, ...splits.map(s => s.j), u.length - 1];
  const segs = [];
  for (let s = 0; s < cuts.length - 1; s++) {
    const a = u[cuts[s]], b = u[cuts[s + 1]];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < MIN_SEG_UNITS && segs.length) continue; // absorb slivers (no length judgment reaches the player)
    segs.push({ a, b, L });
  }
  const toks = [];
  for (let s = 0; s < segs.length; s++) {
    const seg = segs[s];
    const bk = bucketOf(angleOf(seg.a, seg.b));
    // Hook derivation (S1-D021/S1-D034 — hooks optional at play): a short
    // TERMINAL flick that turns hard off the previous segment emits 'hook'.
    // Length here is an authoring-time heuristic on the source glyph, never
    // a judgment on player input.
    if (s === segs.length - 1 && s > 0) {
      // a terminal segment with NO bucket (up/left directions) can only be a
      // hook — no legal stroke continues that way; a bucketed terminal flick
      // also reads as a hook when short and turning hard
      const prev = segs[s - 1];
      const t = Math.abs(turn(angleOf(prev.a, prev.b), angleOf(seg.a, seg.b)));
      if (!bucketOfStrict(angleOf(seg.a, seg.b)) || (seg.L < HOOK_MAX_UNITS && t > CORNER_TURN_DEG)) { toks.push('hook'); continue; }
    }
    if (!bk) {
      // a short leftward/upward mid-segment is a pen transition, not a
      // writing direction — absorb it (S1-D047); long ones stay hard
      if (seg.L < HOOK_MAX_UNITS) { queue.push({ ch, stroke: i, issue: 'no-bucket sliver absorbed', detail: angleOf(seg.a, seg.b).toFixed(1) + '°', review: 'soft' }); continue; }
      queue.push({ ch, stroke: i, issue: 'segment in no bucket', detail: angleOf(seg.a, seg.b).toFixed(1) + '°' }); return null;
    }
    if (toks[toks.length - 1] !== bk) toks.push(bk); // repeated bucket = gentle curve, not a compound
  }
  const nseg = toks.filter(t => t !== 'hook').length;
  if (!nseg) { queue.push({ ch, stroke: i, issue: 'no segments derived' }); return null; }
  if (nseg > 3) {
    // the sanctioned escape (S1-D021): complex strokes match first+last
    queue.push({ ch, stroke: i, issue: 'complex stroke (>3 segments)', detail: toks.join('>'), review: 'soft' });
    return { verbs: toks.join('>'), complex: true };
  }
  return { verbs: toks.join('>') };
}

/* ---------------- component derivation ---------------- */
// Chunk by the leaves of the character's own decomposition tree (matches
// paths) — no recursion into a component's internal decomposition, honoring
// OPEN-13 (墨 = 黑+土). Non-spatial IDC nodes (⿻ overlaid, ⿴… surrounds)
// collapse: they are not separable writing regions. Chunks under 2 strokes
// merge into the previous chunk (a lone stroke is not a perception unit);
// merges are queued for review.
const SPATIAL_IDC = new Set(['⿰', '⿱', '⿲', '⿳']);
function deriveComps(ch, dict, strokeCount) {
  const matches = dict && dict.matches;
  if (!matches || matches.length !== strokeCount || matches.every(m => m == null))
    return [{ range: [0, strokeCount - 1] }];
  // spatial prefix depth: how deep the decomposition stays ⿰⿱⿲⿳
  const decomp = [...(dict.decomposition || '')];
  const keyFor = path => {
    if (path == null) return 'x';
    const key = [];
    let node = decomp[0], di = 0;
    for (const step of path) {
      if (!SPATIAL_IDC.has(node)) break;
      key.push(step);
      // walk the decomposition string to the step-th child to see if it is itself an IDC
      node = childIDC(decomp, di, step);
    }
    return key.join('.') || 'x';
  };
  const keys = matches.map(keyFor);
  const comps = [];
  for (let i = 0; i < keys.length; i++) {
    if (comps.length && keys[i] === keys[i - 1]) comps[comps.length - 1].range[1] = i;
    else if (comps.length && comps[comps.length - 1].key === keys[i]) {
      queue.push({ ch, issue: 'non-contiguous component strokes', detail: keys[i] });
      return [{ range: [0, strokeCount - 1] }];
    }
    else comps.push({ range: [i, i], key: keys[i] });
  }
  // merge chunks under 2 strokes
  for (let i = comps.length - 1; i >= 0; i--) {
    if (comps[i].range[1] - comps[i].range[0] < 1 && comps.length > 1) {
      queue.push({ ch, issue: 'sub-2-stroke chunk merged', detail: 'chunk ' + i, review: 'soft' });
      const into = i > 0 ? i - 1 : i + 1;
      comps[into].range = [Math.min(comps[into].range[0], comps[i].range[0]), Math.max(comps[into].range[1], comps[i].range[1])];
      comps.splice(i, 1);
    }
  }
  return comps.map(c => ({ range: c.range }));
}
// Find whether the step-th child of the IDC at position di is itself an IDC
// (needed to keep walking match paths through nested spatial layouts).
function childIDC(decomp, di, step) {
  const arity = c => (c === '⿲' || c === '⿳') ? 3 : (/[⿰-⿻]/.test(c) ? 2 : 0);
  let i = di + 1;
  const skip = () => { const n = arity(decomp[i]); const c = decomp[i]; i++; for (let k = 0; k < n; k++) skip(); return c; };
  let child = null;
  for (let s = 0; s <= step; s++) child = skip();
  return child;
}

/* ---------------- ingest + emit ---------------- */
const dict = {};
for (const line of readFileSync(new URL('data/dictionary.txt', import.meta.url), 'utf8').split('\n'))
  if (line) { const d = JSON.parse(line); dict[d.character] = d; }

const gfx = {};
const rl = readline.createInterface({ input: createReadStream(new URL('data/graphics.txt', import.meta.url)) });
rl.on('line', l => {
  if (!l) return;
  const ch = JSON.parse(l).character;
  if (roster.includes(ch) || rosterBasic.includes(ch)) gfx[ch] = JSON.parse(l);
});
// Radical → tier-2 class family (S1-D047): world presence at scale without
// per-char curation. Form picked by codepoint — siblings, not clones.
// Chars with no mapped radical fall to world:null → the seal (C3).
function autoWorld(ch, d) {
  const rc = overrides.radicalClasses && d && overrides.radicalClasses[d.radical];
  if (!rc) return null;
  const form = rc.forms[ch.codePointAt(0) % rc.forms.length];
  return { tier: 2, class: rc.class, params: { form } };
}
function buildChar(ch) {
  const ov = overrides.chars[ch] || {};
  const g = gfx[ch], d = dict[ch];
  if (!g) { queue.push({ ch, issue: 'no glyph data' }); return null; }
  const strokes = [];
  let bad = false;
  g.medians.forEach((m, i) => {
    const pts = processMedian(ch, i, m);
    const dv = deriveVerbs(ch, i, pts);
    let verbs = dv && dv.verbs;
    if (ov.expectVerbs && verbs !== ov.expectVerbs[i]) {
      queue.push({ ch, stroke: i, issue: 'derived verb differs from canon', detail: (verbs || 'null') + ' vs ' + ov.expectVerbs[i], review: verbs ? 'soft' : 'hard' });
      verbs = ov.expectVerbs[i]; // canon (real orthography) pins the verb; geometry stays real
    }
    if (!verbs) bad = true;
    strokes.push(dv && dv.complex ? { verbs, pts, complex: true } : { verbs, pts });
  });
  if (bad) return null;
  const comps = ov.comps ? ov.comps.map(r => ({ range: r })) : deriveComps(ch, d, strokes.length);
  const pinyin = (d && d.pinyin && d.pinyin[0]) || ov.pinyin || '';
  if (ov.pinyin && pinyin !== ov.pinyin) queue.push({ ch, issue: 'pinyin differs', detail: pinyin + ' vs ' + ov.pinyin, review: 'soft' });
  return {
    ch, pinyin: ov.pinyin || pinyin, gloss: ov.gloss || ((d && d.definition) || '').split(/[;,]/)[0],
    fx: ov.fx, strokes, comps,
    world: ov.world !== undefined ? ov.world : autoWorld(ch, d),
  };
}
function emitPack(file, id, intro, chars) {
  writeFileSync(new URL(file, root), JSON.stringify({
    version: 2,
    meta: {
      id, generated: new Date().toISOString().slice(0, 10),
      source: 'makemeahanzi (Arphic APL 1999 — S1-D035)',
      intro,
    },
    kinds: overrides.kinds,
    ecology: overrides.ecology || null,
    chars,
  })); // minified — packs are machine artifacts; queue.json stays readable
}
rl.on('close', () => {
  // core: the curated starter — hard queue entries here fail the build
  const chars = [];
  for (const ch of roster) { const c = buildChar(ch); if (c) chars.push(c); }
  const coreHard = queue.filter(q => q.review !== 'soft').length;
  emitPack('packs/core.json', overrides.meta.id, overrides.meta.intro, chars);

  // basic: first BASIC_TARGET survivors of the frequency roster, intro =
  // emission order (frequency-ordered progression). Hard entries here drop
  // the char and the roster flows past them.
  const basic = [];
  const dropped = [];
  for (const ch of rosterBasic) {
    if (basic.length >= BASIC_TARGET) break;
    const c = buildChar(ch);
    if (c) basic.push(c); else dropped.push(ch);
  }
  emitPack('packs/basic.json', 'basic', basic.map(c => c.ch), basic);

  writeFileSync(new URL('queue.json', import.meta.url), JSON.stringify(queue, null, 1));
  const hard = queue.filter(q => q.review !== 'soft');
  console.log('packs/core.json:', chars.length, 'chars emitted.');
  console.log('packs/basic.json:', basic.length, 'chars emitted (' + dropped.length + ' dropped: ' + dropped.join('') + ')');
  console.log('queue:', queue.length, 'entries (' + hard.length + ' hard, ' + coreHard + ' in core).');
  for (const q of hard) console.log('  (HARD)', q.ch, q.issue, q.detail || '', q.stroke ?? '');
  if (coreHard) process.exitCode = 1;
});
