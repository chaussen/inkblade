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
// First-glyph hint delay (John's mandate, Ninja Fruit onboarding): the
// opening character is now pre-created at boot and the title-dismissing
// swipe is a real first attempt (13-main.js/06-combat.js) — if it whiffs,
// the demonstration should feel like an immediate answer, not a second
// 3.5s wait on top of however long the player already spent reading the
// title. Was hardcoded 3500 inline.
const FIRST_HINT_DELAY_MS = 1000;

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

// Ecology E2 [S1-D020 → flipped ON by S1-D056]: heat ignites flammable matter
// by proximity alone — placement is a dice roll (S1-D059), so ignition is an
// accident of where things land, not a targeted act. `?e2=0` is the kill
// switch (S1-D054 runtime resolution in 03-canvas). The covenant stands:
// ignition transforms, never destroys — kind+seed survive the burn and
// regrowth returns the same element; e1.destructions stays 0.
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
// "Inkblade Kai" is an embedded webfont (S1-D078, loaded in 13-main.js boot)
// so title/HUD/world glyph text renders identically on every browser — the
// named system fonts after it are a defense-in-depth fallback only (they're
// absent on most mobile browsers, which used to silently drop to generic
// serif and look inconsistent with desktop).
const CHAR_FONT = '"Inkblade Kai","Kaiti SC","KaiTi","STKaiti","AR PL UKai CN",serif';
// Component wash tints — the character's own anatomy as segmentation (S1-D011)
const WASHES = ['rgba(96,116,152,0.10)', 'rgba(118,134,84,0.10)', 'rgba(164,116,84,0.10)'];
// HUD bottom clearance [S1-D078]: the roster ledger used to sit 6px from the
// literal bottom of `H` (window.innerHeight) — fine on desktop's fixed chrome,
// but mobile browsers reserve variable space at the bottom edge (toolbar,
// Android gesture-nav strip) that `H` doesn't reliably exclude, so the ledger
// rendered but was clipped/covered there. This is real margin, not padding.
const HUD_BOTTOM_MARGIN = 34;

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
const ZI = { sun:0, moon:0, skylight:0, peak:1, ridge:2, terrace:3, field:3, horizon:4, tree:5, fire:5, resttree:5, dwelling:5, gate:5, path:6, seal:6, water:6, cart:6, banner:6, heart:6, bolt:6, walker:7, crowd:7, bigfig:7, horse:7, wind:7 };

// Depth staging [LEAN — S1-D041, deepened S1-D061]: the scroll's y-axis IS
// its depth axis (shan-shui convention: higher on the paper = farther away),
// so depth is a pure render projection — saves carry no new field. Ground
// elements scale from DEPTH_SCALE_FAR at GROUND_FAR to DEPTH_SCALE_NEAR at
// GROUND_NEAR and paint far→near; a mist band gives the far zone atmospheric
// perspective. S1-D061 strengthens the read: perspective x-convergence
// toward a vanishing center, per-element atmospheric fade, and contact
// shadows anchoring matter to the ground plane.
const GROUND_FAR  = 0.56;   // farthest ground y
const GROUND_NEAR = 0.96;   // nearest ground y
const DEPTH_SCALE_FAR  = 0.42;
const DEPTH_SCALE_NEAR = 1.45;
const DEPTH_EXEMPT = { horizon: 1, sun: 1, moon: 1, skylight: 1 }; // sky + the fixed reference line
const MIST_TOP = 0.55, MIST_BOTTOM = 0.72, MIST_ALPHA = 0.26;
// Second mist stage [LEAN — S1-D061]: a gentler dissolve continuing into the
// midfield, so atmosphere fades continuously with distance (it also covers
// world particles — renderers own their internal alphas, so atmospheric fade
// lives in the compositor, not per element).
const MIST2_TOP = 0.72, MIST2_BOTTOM = 0.86, MIST2_ALPHA = 0.09;
// Perspective convergence [LEAN — S1-D061]: at the far edge of the ground
// the x-field squeezes to PERSP_FAR of its width about the vanishing center;
// at the near edge it is uncompressed. Render-only — el.x stays world-space
// (saves, E1/E2 distances untouched).
const PERSP_FAR = 0.80;
// Contact shadow [LEAN — S1-D061]: the ground-anchor ellipse under matter.
const SHADOW_ALPHA = 0.12;
// Fire is light, and light reads through paper [LEAN — S1-D045]: live heat
// events (and their sparks) composite at no less than this alpha, so a burn
// stays visible under the writing veil. Figure-ground for structures/agents
// (S1-D019) is unchanged — only light burns through.
const EVENT_MIN_ALPHA = 0.85;
// The ink travels [LEAN — S1-D069]: on lock the glyph's strokes coalesce
// into a droplet that flies to the planted element; the element reveals on
// arrival. COALESCE+FLIGHT ≈ the old +900ms plant delay, so world timing
// (grow-in, suite waits) is unchanged. Stagger spaces group members' drops.
const TRANSIT_COALESCE_MS = 300;
const TRANSIT_FLIGHT_MS   = 620;
const TRANSIT_STAGGER_MS  = 90;
const TRANSIT_ARC_LIFT    = 0.16; // ×H — how high the droplet's arc rises
// Pinyin/gloss banner (John's mandate, mobile playtest — two rounds). Round
// 1: the anchored-at-arrival banner (S1-D069/D071) shrank to 0.72x and held
// only ~2.5s total — too small/brief to read on a real device; sized back
// up and extended here. Round 2: reading-hands-on found even a bigger
// version near the small planted object still wasn't the right READ — this
// is a writing AND reading game, so the reveal now always centers on the
// character itself (12-render.js), retiring S1-D069's arrival-anchor
// POSITION (the size/duration constants below still apply at full scale,
// no anchored-shrink case remains).
const BANNER_HOLD_MS = 3400;        // was 2100
const BANNER_FADE_MS = 500;         // was 400
// The world breathes [LEAN — S1-D072]: a motion-parallax camera. Depth's
// missing cue was MOTION — near matter slides more than far matter under a
// slow idle drift plus a pointer-following pan. Render-only: el.x, saves,
// sim distances never move. The pan target freezes while a trail is active
// (writing is never disturbed); prefers-reduced-motion pins the camera.
const CAM_DRIFT       = 0.008; // ×W — idle sway amplitude
const CAM_POINTER     = 0.020; // ×W — max pointer pan at the near layer
const CAM_EASE_MS     = 450;   // exponential ease toward the target
const PARALLAX_FAR    = 0.18;  // layer factor at GROUND_FAR…
const PARALLAX_NEAR   = 1.0;   // …to the near edge (sky/horizon shift 0)
const PARALLAX_FG     = 1.18;  // the foreground band slides fastest
const FG_CLUMPS       = 7;     // near-field occluders (grass clumps/stones)
// The WebGL pilot [LEAN — S1-D075]: raw WebGL (no dependency), gated behind
// ?r3d=1. World-space mapping reuses depthQ (el.y→depth) and el.x (→world
// X) unchanged — presentation-only, same as the 2D camera before it.
const R3D_HALF_W      = 3.4;    // world X half-extent
const R3D_DEPTH       = 7.5;    // world Z span (far..near)
const R3D_EYE_H       = 4.4;    // camera height above the ground plane
const R3D_EYE_BACK    = 3.2;    // camera pulled back beyond the near edge
const R3D_FOV         = 52 * Math.PI / 180;
const R3D_NEAR        = 0.1, R3D_FAR = 30;
const R3D_FOG_NEAR    = 4.5, R3D_FOG_FAR = 11.5;
const R3D_PAN_SCALE   = 0.09;    // CAM.px → world units the eye swings sideways (an orbit, not a translate)
const R3D_PX_WORLD    = 0.015;   // world units per stamp-canvas pixel, ×el.s (tight content bbox, not the full canvas)
const R3D_SCALE_REF   = 0.145;  // calibrates elScreenPos's depthK-equivalent
const R3D_STAMP       = 192;    // sprite texture size, px
const R3D_STAMP_S     = 150;    // "S" fed to the reused 2D renderers for the stamp
const R3D_STAMP_ANCHOR = 0.66;  // ground row, as a fraction from the stamp's top
const R3D_REFRESH_MS  = 140;    // sprite texture refresh cadence
function depthQ(el){
  return Math.max(0, Math.min(1, (el.y - GROUND_FAR) / (GROUND_NEAR - GROUND_FAR)));
}
function depthK(el){
  if (DEPTH_EXEMPT[el.k]) return 1;
  return DEPTH_SCALE_FAR + depthQ(el) * (DEPTH_SCALE_NEAR - DEPTH_SCALE_FAR);
}
// Screen-space x for a world element under perspective convergence (S1-D061).
// Normalized (×W at the call site). Sky/horizon keep their world x.
function worldScreenX(el){
  if (DEPTH_EXEMPT[el.k]) return el.x;
  const f = PERSP_FAR + depthQ(el) * (1 - PERSP_FAR);
  return 0.5 + (el.x - 0.5) * f;
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
    case 'skylight': return [0.14, 0.26];
    case 'field':   return [0.62, 0.76];
    case 'water':   return [0.64, 0.88];
    // chunk C batch 1 (S1-D066)
    case 'dwelling': case 'gate': return [0.62, 0.84];
    case 'cart': case 'banner': return [0.64, 0.88];
    case 'heart': case 'wind': case 'bolt': return [0.58, 0.78];
    case 'bigfig': case 'horse': return [0.62, 0.90];
    default:        return [0.62, 0.90]; // walker, crowd, unknown kinds
  }
}
