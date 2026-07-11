/* ========================= 01 STATE + METRICS ========================= *
 * `state` stays a top-level global — the regression suites read it via
 * page.evaluate (smoke4 world assertions). __S1_METRICS is canonical from
 * M1a; the one-version __M0_METRICS alias (S1-D028) sunset at M1d —
 * smoke1–4 read it only on their frozen builds.
 * ====================================================================== */
window.BUILD_ID = BUILD_ID; // fingerprint discipline: header + on-canvas + window
window.__S1_FLAGS = { e2: E2_ENABLED }; // test-readable gate state
const state = {
  mode: 'title',
  glyph: null,
  introIdx: 0,
  prevCh: null,
  streak: 0,
  locked: {},
  trails: [],
  particles: [],        // glyph/fx layer (full vividness)
  worldParticles: [],   // world layer (leaves, embers — recede with the world)
  effects: [],
  shake: 0,
  resolve: null,
  banner: null,
  transit: null,   // the ink in flight between glyph and world (S1-D069)
  world: { els: [] },
};
const METRICS = window.__S1_METRICS = {
  build: BUILD_ID, glyphs: 0, locks: 0, fizzles: 0,
  cuts: 0, goldCuts: 0, deflects: 0, whiffs: 0,
  comps: { gold: 0, ash: 0 },
  hints: { breathe: 0, comet: 0 },
  orderBreaks: { internal: 0, component: 0 },
  world: { elements: 0, relocks: 0, density: null },
  // E1 counters land with M1c; zeroed fields ship now so the shape is
  // stable — destructions existing and asserting 0 IS the E1-invariant
  // regression hook (S1-D028).
  e1: { startles: 0, warmings: 0, rests: 0, burnouts: 0, destructions: 0 },
  // E2 counters (S1-D054): ignition transforms, never destroys — regrowths
  // returning to equal ignitions over time IS the covenant, measured.
  e2: { ignitions: 0, regrowths: 0 },
  perf: { avgFrameMs: 0, worstFrameMs: 0 },
  glyphLog: [],
  perChar: {},
};
