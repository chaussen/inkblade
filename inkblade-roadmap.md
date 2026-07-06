# Inkblade — Release Roadmap

Mandated by S1-D044: there is no Chat/design track (S1-D040) — Code decides and
designs; this file is the session-break continuity record. **The charter
(`inkblade-charter-v1.md`) stays the single source of truth** — this file is a
planning index into it, updated at every ship. Read the charter decision log
top-down for anything marked here; nothing below is real until logged there.

## How to resume a session
1. Read `inkblade-charter-v1.md` §10 decision log (newest first) to the last ship entry.
2. Read this file for what's next; check `BUILD_ID` for the current artifact.
3. Disciplines (non-negotiable, charter §7 + handoff §9): BUILD_ID bump on any
   edit; headless Chromium + REAL pointer events only; no content in engine;
   suites extend-never-delete (`tests/README.md`); full battery before any ship
   entry; commit + push to `chaussen/inkblade` master after ship.
4. Log a plan entry (next free S1-D0xx, newest-on-top) BEFORE writing code for a
   new milestone; log a ship entry after the battery is green. John confirms
   with short messages; his rulings get their own LOCKED entries.

## Current state (as of S1-D053, 2026-07-06)
- **Full delegation live (S1-D049)**: John has handed off all rulings — Code
  decides (including LOCKED amendments), logs rationale, ships, and reports.
- Artifact: `inkblade-m2a.html` (BUILD_ID `S1-M2a-b1-20260706`); tests target it
  via `tests/helpers.js` TARGET_FILE default (`INKBLADE_TARGET` env overrides).
- Placement choice live (S1-D052/D053): final-stroke exit point pulls placeEl
  scoring; weights in `ecology.placement.pull` (fire 0.85, default 0.3, seal
  0.5); UNIQUE exempt; E2 still gated — b2 is ignition + regrowth.
- Move-set: pie carries a second real-form center at 180° (flat-撇 grace,
  S1-D049a/D050/D051) at derive AND match; hooks keep strict pre-grace
  bucketing so they never harden into required pie tokens.
- Packs: `packs/core.json` (23 curated, embedded in the build by
  `tools/build.mjs`), `packs/basic.json` (500, fetched chapter). Chapter loading:
  `?pack=/packs/core.json,/packs/basic.json` (comma-list, first-wins merge).
- Pipeline: `node pipeline/build-packs.mjs` reads `pipeline/overrides.json`
  (curation + kinds + ecology tuning + radicalClasses map) and
  `pipeline/roster-basic.txt` (761 frequency-ordered chars), emits both packs +
  `pipeline/queue.json` (ambiguity triage; hard entries in core fail the build).
- Suites: smoke1–4 frozen (target frozen builds), smoke5–14 live. Run from
  `tests/` with `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium node smokeN-*.js`.
- Sim/render seams a new session will want: `E2_ENABLED` gate (src/00-config.js),
  `isLiveHeat`/`heatSources`/`updateAgent` (src/09-world-sim.js), burn-through
  event layer + class renderers (src/10-world-render.js), chapter merge
  (src/02-data.js), save v2 + MIGRATIONS (src/08-persist.js).

## Shipped
| Release | BUILD_ID | Contents | Charter |
|---|---|---|---|
| M0–M0.75 | S1-M0-b2…S1-M075 | v1 prototype line (frozen; smoke1–4 target these) | S1-D001–D022 |
| M1a | S1-M1a-b5-20260705 | Modular src, MMAH pipeline, save v2, attention veil | S1-D033 |
| M1b | S1-M1b-b1-20260705 | C1 polyline verbs, 23-char pack, classes, seal, sky | S1-D036 |
| M1c | S1-M1c-b2-20260706 | Ecology E1: fire lifecycle, R1–R3 agents, E2 hard gate | S1-D038 |
| M1d | S1-M1d-b1-20260706 | Depth staging (y-as-depth), cap 300 @60fps, alias sunset | S1-D042 |
| M1e | S1-M1e-b2-20260706 | Fire burns through the veil (EVENT_MIN_ALPHA overlay), 2-min observable cycle, spark flares, hearth interactions (shimmer/steam/hearth-calm via heatAuraR hot cue) | S1-D046 |
| M1f | S1-M1f-b1-20260706 | Basic tier: packs/basic.json 500 chars (317KB, frequency-ordered), chapter-pack ?pack= merge loader, radical→class auto-assignment, flora/terrain/figure renderers, derivation hardened (complex flag, sliver absorption). OPEN-15 logged: flat-撇 gap drops 看手系反笑爱委乎 — needs a move-set ruling | S1-D048 |
| M1f-b2 | S1-M1f-b2-20260706 | The 撇 grace (resolves OPEN-15): pie's second real-form center at 180° at derive+match, 看手系反笑爱委乎 restored (tail 8 shift to next tier), hooks kept strict, smoke15 added, smoke12 T3 made host-aware | S1-D049–D051 |
| M2a-b1 | S1-M2a-b1-20260706 | Placement choice (resolves OPEN-14): lockExit anchor pulls placeEl scoring, weights in pack data (fire decisive/default subtle/UNIQUE exempt), flick-through aiming, smoke16 added; E2 still gated | S1-D052–D053 |

## Planned
### M2a — E2 ignition + placement choice — IN FLIGHT (b1 placement SHIPPED S1-D053; b2+ = ignition/regrowth, then the flip)
Resolves OPEN-14. Why E2 was gated (S1-D020): ignition without a *choice* is
just weather — the player must be able to mean it. So the milestone has two
halves, choice first:

**Half 1 — placement choice (the OPEN-14 axis).** Recommended design: the
final stroke's ending position (already a real gesture datum — no new input)
biases where the world-mark plants: `placeEl` currently picks max-spacing
candidates; weight that scoring toward the lock gesture's exit point mapped
into the kind's band. Subtle for structures, decisive for `fire`. Result:
"fire beside the dry grove" is an authored act, not a dice roll. Constraints:
tuning in pack data (a `placement` block in ecology or per-kind), engine reads
weights only; deterministic under `?seed=`; UNIQUE kinds exempt; must not
break smoke5/10/12 world assertions (they assert kinds/counts, not positions —
verify). Want-driven repertoire (the other axis) stays deferred to M2b.

**Half 2 — ignition behind the gate.** heat + `flammable` within an ignition
radius for a dwell time → the flammable element *transforms* (burning variant
of itself), then follows the fire lifecycle into ash and **regrows: ash →
sprout → sapling → itself** (additive lifecycle; flora/tree share it).
The consent covenant that keeps the E1 promise honest:
- Nothing is ever deleted by ignition — `transformed ≠ destroyed`; the element
  keeps its identity (`el.k` unchanged, a `burn` sub-state like `life`) and
  returns via regrowth. `e1.destructions` stays 0 and its regression stays.
- Ignition only propagates from PLAYER-planted heat (fires are only ever
  player-planted today — assert this stays true); sun never ignites.
- A metrics block (`e2: {ignitions, regrowths}`) lands with it; scenario
  tests mirror smoke11's fast-clock fixture pattern.
- `E2_ENABLED` flips default-ON only after playtest confirms the choice axis
  reads; ship order within M2a: placement (b1) → ignition + regrowth (b2+) →
  flip + full battery. The flag and `__S1_FLAGS.e2` stay as the kill switch.
Sub-questions RULED by S1-D049: **embers ignite too** (John's call — keep the
smolder-catch legible: per-stage ignition params in pack data, ember dwell
longer and/or radius smaller than flame) and **NO chaining at v1** (one hop
from player-planted heat; chain behind a data knob later). Still open for the
plan entry: the actual radius/dwell numbers (pack data).

### M2b — demand world (OPEN-9)
- World state generates wants ("the grove is dark — write something that burns"); repertoire choice replaces some ghost glyphs. Needs want-authoring model that never becomes a quest log. Solves OPEN-3 diegetically.

### Backlog (unscheduled)
- Radical map growth: 口讠扌辶纟宀 etc. unmapped (378/500 are seals today) — each new family renderer + radicalClasses row converts dozens of seals into scenery.
- Next roster tiers toward 3,000–7,000 (S1-D043 path): extend roster file, ship as more chapters; nothing but data + the existing loader.
- Audio pass (palette beyond crackle/startle; John ruled lower priority).
- Real-device mobile perf measurement (headless 300@60fps logged S1-D042; pre-render only if a device breaches).
- Day/night from sun/moon presence; weather as events.
- PvP (parked M2+, S1-D006 — literacy asymmetry risk logged).

## Open questions (live registry mirror — the charter §9 table is canonical)
| id | Question | Where it lands |
|---|---|---|
| OPEN-5 | Same-type stroke disambiguation (三's hengs, 焱's pies): survives scripted play — does it survive fast sloppy HUMAN play? | needs a John playtest verdict; no code scheduled |
| OPEN-6 | PvP model (literacy asymmetry as arsenal + matchmaking problem) | parked M2+ |
| OPEN-8 | Component wash: always-on vs fading with mastery (mastery-fade adds a progression system — Fun Gate check required) | unscheduled; ask John before adding any progression |
| OPEN-9 | Demand world — want-authoring model that never becomes a quest log | M2b headline |
| OPEN-14 | ~~E2 choice axis~~ RESOLVED S1-D049: placement choice (M2a); repertoire stays M2b | — |
| OPEN-15 | ~~Flat-撇 gap~~ RESOLVED S1-D049, shipped S1-D051 (M1f-b2): pie real-form grace at 180° | — |
