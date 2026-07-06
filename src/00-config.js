/* ========================= 00 CONFIG ========================= *
 * Every tuning number in the game lives here, [LEAN] per charter
 * protocol. Content (characters, mappings, reactions) lives in
 * pack data, never here — this file is presentation/feel tuning
 * only (handoff C4: "tuning constants at top of config").
 * ============================================================= */

// Hint tuning [LEAN — S1-D012]: flail fires on the 2nd consecutive
// non-gold resolution; idle after 6s without a cut.
const HINT_FLAIL = 2;
const HINT_IDLE_MS = 6000;

// Attention choreography [LEAN — S1-D019/D027]. The figure-ground
// contract: writing → glyph owns (world recedes behind the veil);
// lock/fizzle → bloom (world owns). Bloom holds ATTN_HOLD_MS into
// the next glyph before receding, preserving glyph cadence.
const ATTN_RECESSION   = 0.35;  // world ink presence while writing
const ATTN_VEIL_ALPHA  = 0.5;   // writing-veil opacity
const ATTN_VEIL_BRIGHT = 'rgb(250,240,219)'; // paper tone +6% brightness
const ATTN_BLOOM_MS    = 400;   // ease up to full vividness
const ATTN_RECEDE_MS   = 400;   // ease back down to recession
const ATTN_HOLD_MS     = 1500;  // bloom hold after the next glyph appears
const ATTN_VEIL_MS     = 300;   // veil fade in/out
const ATTN_VEIL_PAD    = 0.12;  // veil margin around glyph bbox, ×S

// Polyline verb model [LEAN — C1, S1-D021]: trail corner-split constants.
// These MUST stay numerically aligned with pipeline/build-packs.mjs
// (CORNER_TURN_DEG / CORNER_WINDOW_UNITS / ARC_STEP / MIN_SEG_UNITS in
// 0–100 glyph units; here scaled by S/100 to screen px) — the gesture
// classifier and the data derivation are two halves of one contract.
const TRAIL_CORNER_TURN = 50;    // degrees of windowed turn = a corner
const TRAIL_WINDOW = 0.14;       // ×S — direction-averaging window
const TRAIL_ARC_STEP = 0.035;    // ×S — uniform resample step
const TRAIL_MIN_SEG = 0.07;      // ×S — slivers below this merge away
const TRAIL_MAX_SEGS = 3;        // charter cap: ≤3 segments per stroke verb

// Ecology E2 [S1-D020 → flipped ON by S1-D056]: the gate demanded a choice
// axis before heat could ignite flammable matter — placement choice (S1-D052)
// is that axis, and the playtest evidence discharged the condition. `?e2=0`
// is the kill switch (S1-D054 runtime resolution in 03-canvas). The covenant
// stands: ignition transforms, never destroys — kind+seed survive the burn
// and regrowth returns the same element; e1.destructions stays 0.
const E2_ENABLED = true;

// Render budget [LEAN — C4]
const MAX_PARTICLES = 600;        // glyph/fx particle pool cap
const MAX_WORLD_PARTICLES = 300;  // world-layer (leaves/embers) pool cap
const GLYPH_LOG_CAP = 200;        // per-glyph instrumentation ring buffer

const INK      = '#1b1712';
const ASH      = '#8f8a7c';
const GHOST    = 'rgba(70,62,48,0.16)';
const GOLD     = '#c9992b';
const CINNABAR = '#b2392a';
const PAPER    = '#ece3cf';
const CHAR_FONT = '"Kaiti SC","KaiTi","STKaiti","AR PL UKai CN",serif';
// Component wash tints — the character's own anatomy as segmentation (S1-D011)
const WASHES = ['rgba(96,116,152,0.10)', 'rgba(118,134,84,0.10)', 'rgba(164,116,84,0.10)'];

// World persistence [S1-D026]. Key name is historical; the payload
// carries the version (missing version field = implicit v1).
const WORLD_KEY = 'inkblade_world_v1';
const WORLD_BACKUP_KEY = 'inkblade_world_v1_backup';
const SAVE_VERSION = 2;
const WORLD_CAP = 300; // C4 soft budget: 60fps at 300 elements (M1d, measured by smoke12)

// World presentation layout (bands/z-order/uniqueness are shan-shui
// composition tuning; matter classes and char→element mappings are
// pack data, S1-D020/D024)
const UNIQUE = { horizon: 1, sun: 1, moon: 1 };
const ZI = { sun:0, moon:0, peak:1, ridge:2, terrace:3, field:3, horizon:4, tree:5, fire:5, resttree:5, path:6, seal:6, water:6, walker:7, crowd:7 };

// Depth staging [LEAN — S1-D041]: the scroll's y-axis IS its depth axis
// (shan-shui convention: higher on the paper = farther away), so depth is a
// pure render projection — saves carry no new field. Ground elements scale
// from DEPTH_SCALE_FAR at GROUND_FAR to DEPTH_SCALE_NEAR at GROUND_NEAR and
// paint far→near; a mist band gives the far zone atmospheric perspective.
const GROUND_FAR  = 0.56;   // farthest ground y
const GROUND_NEAR = 0.96;   // nearest ground y
const DEPTH_SCALE_FAR  = 0.55;
const DEPTH_SCALE_NEAR = 1.25;
const DEPTH_EXEMPT = { horizon: 1, sun: 1, moon: 1 }; // sky + the fixed reference line
const MIST_TOP = 0.55, MIST_BOTTOM = 0.72, MIST_ALPHA = 0.26;
// Fire is light, and light reads through paper [LEAN — S1-D045]: live heat
// events (and their sparks) composite at no less than this alpha, so a burn
// stays visible under the writing veil. Figure-ground for structures/agents
// (S1-D019) is unchanged — only light burns through.
const EVENT_MIN_ALPHA = 0.85;
function depthK(el){
  if (DEPTH_EXEMPT[el.k]) return 1;
  const q = Math.max(0, Math.min(1, (el.y - GROUND_FAR) / (GROUND_NEAR - GROUND_FAR)));
  return DEPTH_SCALE_FAR + q * (DEPTH_SCALE_NEAR - DEPTH_SCALE_FAR);
}
function bandFor(k){
  switch(k){
    case 'peak':    return [0.58, 0.66];
    case 'ridge':   return [0.60, 0.70];
    case 'terrace': return [0.62, 0.74];
    case 'horizon': return [0.76, 0.76];
    case 'tree': case 'fire': case 'resttree': return [0.60, 0.88];
    case 'flora':   return [0.60, 0.88];
    case 'terrain': return [0.58, 0.82];
    case 'path':    return [0.66, 0.88];
    case 'seal':    return [0.62, 0.86];
    case 'sun': case 'moon': return [0.09, 0.16];
    case 'field':   return [0.62, 0.76];
    case 'water':   return [0.64, 0.88];
    default:        return [0.62, 0.90]; // walker, crowd, unknown kinds
  }
}
