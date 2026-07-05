/* ========================= 05 INPUT + CLASSIFICATION ========================= *
 * classifySlash stays a top-level global — smoke3 asserts it directly from
 * page.evaluate. Direction classes only; the classifier must never read
 * curvature, proportion, or neatness (charter §7 Q1, S1-D003).
 * ============================================================================ */
let trail = null, activePointer = null;
canvas.addEventListener('pointerdown', e => {
  audio();
  if (activePointer !== null) return;
  activePointer = e.pointerId;
  trail = [[e.clientX, e.clientY]];
});
canvas.addEventListener('pointermove', e => {
  if (e.pointerId !== activePointer || !trail) return;
  const last = trail[trail.length - 1];
  if (Math.hypot(e.clientX - last[0], e.clientY - last[1]) > 2) trail.push([e.clientX, e.clientY]);
});
window.addEventListener('pointerup', e => {
  if (e.pointerId !== activePointer) return;
  activePointer = null;
  if (trail && trail.length) { if (trail.length === 1) trail.push([e.clientX, e.clientY]); resolveSlash(trail); }
  trail = null;
});
window.addEventListener('pointercancel', () => { activePointer = null; trail = null; });

// Merged down-right verb (S1-D013): dian and na share one direction ('dr');
// from M1a the stroke data itself carries 'dr', so matching is direct.
const BUCKET_CENTERS = { heng: 0, dr: 45, shu: 90, pie: 135, ti: -45 };
const BUCKET_TOL = 32;
function angDist(a, c) { let d = Math.abs(a - c); if (d > 180) d = 360 - d; return d; }
function classifySlash(dx, dy, len) {
  const deg = Math.atan2(dy, dx) * 180 / Math.PI;
  let best = null, bd = 1e9;
  for (const [n, c] of [['heng', 0], ['dr', 45], ['shu', 90], ['pie', 135]]) {
    const d = angDist(deg, c);
    if (d < bd) { bd = d; best = n; }
  }
  return bd > BUCKET_TOL ? null : best;
}
// Target matching (S1-D032, extends S1-D013): a slash matches a stroke when
// its angle lies within ±32° of the TARGET's bucket center — the target's
// own type disambiguates the zones where bucket tolerances overlap (real
// medians put steep 撇 near the shu/pie boundary; nearest-center matching
// would deflect an honest along-stroke slash). Direction classes only:
// nothing here reads curvature, proportion, or neatness (charter §7 Q1).
function slashMatches(deg, strokeT) {
  const c = BUCKET_CENTERS[strokeT];
  return c !== undefined && angDist(deg, c) <= BUCKET_TOL;
}

/* ---- polyline verb model (C1, S1-D021) ---- */
// A stroke's verb is a SEQUENCE of direction buckets. The trail is resampled,
// split where the windowed direction turn exceeds TRAIL_CORNER_TURN (max 2
// splits), and each segment is matched by angle against the target's token
// centers (S1-D032). Direction classes only — segment lengths exist solely to
// merge jitter slivers, never to judge the player (charter §7 Q1).
function resampleTrail(tr, step) {
  const out = [tr[0]];
  let carry = 0;
  for (let i = 0; i < tr.length - 1; i++) {
    const [a, b] = [tr[i], tr[i + 1]];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let d = step - carry;
    while (d < L) {
      out.push([a[0] + (b[0] - a[0]) * d / L, a[1] + (b[1] - a[1]) * d / L]);
      d += step;
    }
    carry = (carry + L) % step;
  }
  out.push(tr[tr.length - 1]);
  return out;
}
function segTurn(a, b) { let d = b - a; while (d > 180) d -= 360; while (d < -180) d += 360; return d; }
function meanAngle(arr) {
  let sx = 0, sy = 0;
  for (const a of arr) { sx += Math.cos(a * Math.PI / 180); sy += Math.sin(a * Math.PI / 180); }
  return Math.atan2(sy, sx) * 180 / Math.PI;
}
// → array of {deg, len} segments (1–3 entries), or null for a degenerate trail
function classifyTrail(tr) {
  const step = S * TRAIL_ARC_STEP, minSeg = S * TRAIL_MIN_SEG;
  const win = Math.max(1, Math.round(TRAIL_WINDOW / TRAIL_ARC_STEP));
  const u = resampleTrail(tr, step);
  if (u.length < 2) return null;
  const angles = [];
  for (let j = 0; j < u.length - 1; j++)
    angles.push(Math.atan2(u[j + 1][1] - u[j][1], u[j + 1][0] - u[j][0]) * 180 / Math.PI);
  const splits = [];
  for (let j = win; j < angles.length - win; j++) {
    const t = Math.abs(segTurn(meanAngle(angles.slice(j - win, j)), meanAngle(angles.slice(j, j + win))));
    if (t > TRAIL_CORNER_TURN) {
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
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < minSeg && segs.length) continue; // jitter sliver — merge away
    segs.push({ deg: Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, len });
  }
  return segs.length ? segs : null;
}
// Does the trail's segment sequence match this stroke's verb string?
// Hooks are OPTIONAL (S1-D034/OPEN-11): the trail may omit the hook, and one
// extra terminal flick beyond the required tokens is accepted unjudged.
// `complex` strokes match leniently on first + last segment only.
function strokeMatches(segs, st) {
  if (!segs) return false;
  const toks = st.t.split('>');
  const req = toks.filter(t => t !== 'hook');
  const hooked = toks.length !== req.length;
  let use = segs;
  if (hooked && segs.length === req.length + 1) use = segs.slice(0, -1);
  if (use.length > TRAIL_MAX_SEGS) return false;
  const fits = (seg, tok) => slashMatches(seg.deg, tok);
  if (st.complex) {
    return use.length >= 1 && fits(use[0], req[0]) && fits(use[use.length - 1], req[req.length - 1]);
  }
  if (use.length !== req.length) return false;
  return use.every((seg, i) => fits(seg, req[i]));
}
function segPointDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
  let t = L2 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function orient(ax, ay, bx, by, cx, cy) { return Math.sign((bx-ax)*(cy-ay) - (by-ay)*(cx-ax)); }
function segsIntersect(a, b, c, d) {
  const o1 = orient(a[0],a[1],b[0],b[1],c[0],c[1]), o2 = orient(a[0],a[1],b[0],b[1],d[0],d[1]);
  const o3 = orient(c[0],c[1],d[0],d[1],a[0],a[1]), o4 = orient(c[0],c[1],d[0],d[1],b[0],b[1]);
  return o1 !== o2 && o3 !== o4;
}
function segSegDist(a, b, c, d) {
  if (segsIntersect(a, b, c, d)) return 0;
  return Math.min(
    segPointDist(c[0],c[1],a[0],a[1],b[0],b[1]), segPointDist(d[0],d[1],a[0],a[1],b[0],b[1]),
    segPointDist(a[0],a[1],c[0],c[1],d[0],d[1]), segPointDist(b[0],b[1],c[0],c[1],d[0],d[1]));
}
// Min distance between the drawn trail and a stroke polyline — both sides
// iterate segments (the stroke side generalized for C1 polylines, handoff §5).
function trailStrokeDist(tr, st) {
  const p = strokeScreenPts(st);
  let best = 1e9;
  for (let i = 0; i < tr.length - 1; i++)
    for (let j = 0; j < p.length - 1; j++)
      best = Math.min(best, segSegDist(tr[i], tr[i+1], p[j], p[j+1]));
  return best;
}
// Nearest point on the stroke polyline to the trail's midpoint (deflect spark anchor)
function nearestOn(st, tr) {
  const m = tr[Math.floor(tr.length/2)];
  const p = strokeScreenPts(st);
  let best = null, bd = 1e9;
  for (let i = 0; i < p.length - 1; i++) {
    const [ax,ay] = p[i], [bx,by] = p[i+1];
    const dx = bx-ax, dy = by-ay, L2 = dx*dx+dy*dy;
    let t = L2 ? ((m[0]-ax)*dx + (m[1]-ay)*dy) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    const q = [ax+t*dx, ay+t*dy];
    const d = Math.hypot(m[0]-q[0], m[1]-q[1]);
    if (d < bd) { bd = d; best = q; }
  }
  return best || p[0];
}
