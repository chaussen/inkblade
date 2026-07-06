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
| smoke11-ecology.js | Ecology E1 (S1-D020) over HTTP with a fast-clock fixture pack + seeded v2 payloads + ?seed=: E2 hard gate off; real 火 lock → full fire lifecycle to healed; startle/flee/return; tree beside fire survives its whole lifetime; warming drift+loiter; sheltered rest; mid-burn fuel checkpoint round-trip; cross-session ash decay; e1.destructions === 0 everywhere (E1 invariant) |

Full gate for a new build: rebuild (`node tools/build.mjs`) after bumping the
BUILD_ID file, then run smoke5–11; smoke1–4 re-run against the frozen builds.
