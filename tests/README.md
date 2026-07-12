# Inkblade regression suite
Real dispatched pointer events via puppeteer (direct handler invocation is banned).
Setup: `npm install puppeteer` (Node 18+); with a system Chromium, `export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`.
File paths inside scripts point at /home/zni/projects/inkblade/ — adjust to your layout.

Extend, never delete. All suites must pass with zero console errors on every build.

## Frozen suites (target the frozen v1 builds; never edited beyond paths)
| Suite | Targets | Covers |
|---|---|---|
| smoke.js | inkblade-m0.html | start, 一 lock, wrong-order fizzle, deflect, whiff, bucket classification |
| smoke2.js | inkblade-m0.html | full 8-char roster locked in canonical order; 木 crossing-stroke stress |
| smoke3.js | inkblade-m05.html | composites, hint ladder, 森 component-order fizzle + break classification, singles regression |
| smoke4.js | inkblade-m075.html | world planting, variance, relocks, persistence, horizon uniqueness, 森=3 trees, fizzle plants nothing |

`gen/smoke3-m1a.js` / `gen/smoke4-m1a.js` are filename-sed copies that gated the
M1a **step-1** build (geometry-identical legacy carry, S1-M1a-b2). They assume
hand-authored coordinates and do not apply to pipeline-generated builds (b3+).

## Live suites (target the current milestone build via helpers TARGET / $INKBLADE_TARGET; geometry-derived per S1-D030)
Slash coordinates come from live glyph state (`window.__S1_GLYPH`) via
`helpers.js`, so the suites survive data regeneration. Slashes remain real
dispatched pointer events.

| Suite | Covers |
|---|---|
| smoke5-regression.js | Complete smoke1–4 scenario port on generated data: 14/14 canonical locks (zero deflects), wrong-order fizzle + stability rule, deflect, whiff, classification contract, 森 component-break classification, hint ladder, world battery |
| smoke6-veil.js | Attention choreography (S1-D019/D027): writing recession 0.35, veil presence, bloom to 1.0, hold into next glyph, recede; per-glyph instrumentation; metrics alias |
| smoke7-packs.js | Pack validation (S1-D024/D025) over HTTP: ?pack= override plays; future version rejected; corrupted stroke quarantined alone; missing pack falls back to embedded |
| smoke8-migration.js | Save v2 migration (S1-D026): implicit-v1 + unknown kind loads losslessly, seal self-heal, one-time backup, v2 round-trip |
| smoke9-folds.js | Polyline verb model (C1): 口日月田国土山水川 lock via real fold/hook gestures; straight shu cuts 竖钩 (hooks optional); wrong-turn deflects; jitter never splits a straight slash |
| smoke10-classes.js | Element classes + seal fallback (C3): world:null plants a seal bearing the char; tier-2 water family with per-char persisted skins; sky uniqueness (sun) |
| smoke11-ecology.js | Ecology E1 (S1-D020) over HTTP with a fast-clock fixture pack + seeded v2 payloads + ?seed=: E2 gate default-ON since the S1-D056 flip with ?e2=0 kill switch (T1 asserts both; the fixture has no ignition data so every E1 scenario is untouched by the flip — data-gating is the fence); real 火 lock → full fire lifecycle to healed; startle/flee/return; tree beside fire survives its whole lifetime; warming drift+loiter; sheltered rest; mid-burn fuel checkpoint round-trip; cross-session ash decay; e1.destructions === 0 everywhere (E1 invariant) |
| smoke12-depth.js | Depth staging (S1-D041): depthK projection contract (far<1<near, sky/horizon exempt); near-paints-more-ink pixel evidence read off the live canvas; 300 elements co-exist at the 60fps budget (C4 measurement — host-aware since M1f-b2: a breach calibrates against frozen m1d in-session; throttled hosts enforce no-regression-vs-baseline, capable hosts the absolute budget); E1 danger distance spans the depth axis; __M0_METRICS sunset guarded in smoke6 |
| smoke13-fire.js | Fire burns through (S1-D045): pack clock contract (full cycle fits a sitting, heatAuraR + wet tag present); pixel evidence that live fire stays visible during settled writing recession while the tree recedes to nothing, bloom restores both; hearth scene — hot cue on tree/water/warming walker, steam, sparks, warmings, zero destructions |
| smoke14-scale.js | Basic tier (S1-D047): 500 chars load zero-quarantine with frequency intro + size budget; chapter merge dedupes first-wins (curated 火 survives) and skips bad chapters; six seeded random chars lock end-to-end with real gestures; flora/terrain/figure/seal families plant from locks |
| smoke15-flatpie.js | Flat-撇 grace (S1-D049/S1-D050, amends S1-D032): all 8 restored chars (看手系反笑爱委乎) carry a graced flat-撇 in pack data and lock end-to-end with real gestures, zero deflects; explicit 170° slash gold-cuts a pie target but still deflects on a heng target (grace is pie-only, buckets stay directional); classifySlash keeps the nearest-center contract |
| smoke16-placement.js | Placement is a dice roll, not an aim (S1-D059, supersedes S1-D052/D053 aim mechanic — inverted per the smoke6 gate-flip pattern): neither pack carries ecology.placement anymore; 火 locked with a natural exit vs a flicked-through exit under the same seed plants in the EXACT same spot (exit-independent); a different seed plants differently (still genuinely random) |
| smoke17-ignition.js | Ecology E2 (S1-D049c/d, S1-D054, flipped ON S1-D056) with fast-clock ignition fixture: gate defaults ON and ?e2=0 kills it (T1 asserts both directions); flame ignition transforms (kind+seed kept, element count stable); full burn walk to regrowth — the same seed returns; embers kindle slower and closer (per-stage radius negative included); the sun never ignites; no chaining through burning matter (one hop); mid-burn reload resumes and completes; T7 the milestone promise with real gestures, updated for S1-D059 (no more aiming) — 火 is written with an ordinary lock, its random placement happens to land beside a seeded tree (a known collision for a fixed seed), kindles it, and the tree regrows; e1.destructions === 0 in every scenario |
| smoke18-scene.js | Scene depth + roster ledger (S1-D061, M2c): perspective projection contract (far x converges toward the vanishing center, near uncompressed, horizon/sky exempt, depth-scale contrast >3×); convergence is render-only (persisted el.x stays world-space after a real lock); the windowed roster ledger stays ≥28px at 509 chars AND at 23 with a truthful counter (__S1_HUD); scene furniture (sky/ground washes, foreshortened grain) counts as ZERO ink under the smoke12/13 pixel thresholds in every zone; T6 (M2c-b2): an EMPTY world still shows the illustrated-valley backdrop (__S1_SCENE ridges/clouds/tufts) and the ridge band actually tints pixels while staying under every ink threshold |
| smoke19-symbols.js | Chunk C batch 1 (S1-D066, M2d): batch chars carry their designed worlds in pack data (大→bigfig at last ≠ 山→peak, 门 gate/马 horse/心 heart/风 wind/电 bolt/车 cart bespoke; 家 dwelling:hut, 天 skylight, 花 flora:flower curated) with interaction tags (horse/bigfig living, dwelling shelter+flammable, banner flammable); basic-tier seal population ≤300 (radical families 口讠言纟→banner, 宀→dwelling, 日→skylight, 扌辶→figure convert at scale); real-gesture locks plant the right matter end-to-end; fast-clock interaction scene — a walker RESTS by a dwelling (shelter tag drives R3) and a hut kindles from adjacent fire then regrows into ITSELF (seed+form kept, destructions 0) |
| smoke20-transit.js | The ink travels (S1-D069, M2e): matter is chosen at lock (transit-flagged, sim-exempt) and revealed on arrival (born stamps, transit clears); ?seed= determinism byte-identical across runs despite the refactor; a grove's droplets arrive staggered ~90ms apart; the arrival banner is anchored at the element and absent mid-flight; a flying fire's life clock is frozen at 0 and ticks after landing; a mid-flight reload lands the element with no transit; post-arrival pixel evidence of real ink at the anchor |
| smoke21-parallax.js | The world breathes (S1-D072, M2f): the camera drifts (bounded) and pans with real pointer moves; the parallax contract measured off the live canvas — a near element's painted ink slides more than a far element's, matching each layer's predicted factor to within a few px; the pan target freezes while a trail is active and resumes after; prefers-reduced-motion pins the camera at 0; the foreground occluder band tints visibly while counting ZERO under both ink thresholds; render-only (el.x bit-identical across a full sweep) |
| smoke22-webgl.js | The WebGL pilot (S1-D075, M2g), gated behind ?r3d=1 — the REAL regression gate for this build is the rest of the battery passing unchanged with r3d unset; this suite covers only the r3d=1 contract: WebGL context created; a locked character renders real billboard pixels through the actual camera/projection; the camera responds to real pointer movement (elScreenPos shifts, smoke21's technique); live E2 ignition glow tracks the projected billboard position; render-only (a full pointer sweep never touches el.x); a page with WebGL forced unavailable still boots, reports the fallback reason, and locks a real character end-to-end with zero console errors |

Full gate for a new build: rebuild (`node tools/build.mjs`) after bumping the
BUILD_ID file, then run smoke5–22; smoke1–4 re-run against the frozen builds.
