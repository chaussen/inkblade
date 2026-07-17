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
5. **Playtest checkpoints are mandatory (S1-D058, see `CLAUDE.md`)**: every
   milestone / reasonable-size build ends with a stop-and-ask-John-to-play,
   with exact URL + params, what's new vs his last snapshot, an action
   script with timings, and the verdict needed. Parallel unblocked work OK;
   never stack unplaytested player-facing changes.

## Current state (as of S1-D087, 2026-07-15)
- Artifact: `inkblade-m2g.html` (BUILD_ID `S1-M2g-b11-20260715`). **M2g-b8..b11
  (S1-D087): pinyin/meaning redesign, round 4** — big red printing-serif
  pinyin is now the ONE pinyin display, living in the always-on caption
  right above the glyph (writing + resolve/transit hold); the post-lock
  reveal shows ONLY the meaning, centered literally where the character
  was; `newGlyph()` force-clears the reveal so it can't cover the next
  character; caption pulled tight against the glyph top (`GY-9px`) per
  John's live screenshot feedback that it read as detached. Full battery
  green — see charter S1-D087 for the four-step iteration. **PLAYTEST
  CHECKPOINT PENDING** — not yet confirmed on John's own hands/device.
- Artifact: `inkblade-m2g.html` (BUILD_ID `S1-M2g-b7-20260712`). **M2g-b7
  (S1-D086): the reveal banner now always centers on the character**
  (John's follow-up: position mattered more than size — retires S1-D069's
  arrival-anchor position, `state.banner.ax/ay` stay as tested data,
  `smoke20` still passes), **pinyin shows throughout writing, not just
  after lock** (English gloss still lock-only — that's the payoff), and
  **a Ninja Fruit onboarding fix**: the opening character is pre-created
  at boot so the "slash anywhere to begin" swipe is now a real first cut
  attempt (whiff-or-hit), not a discarded trigger; first-glyph hint delay
  dropped 3500ms→1000ms to match. Caught and fixed a real regression
  during verification — `smoke20` T7 had been accidentally measuring the
  OLD banner's text instead of the tree's own ink; recalibrated to the
  tree's actual color, not just re-tuned blind. Full battery green.
- Artifact: `inkblade-m2g.html` (BUILD_ID `S1-M2g-b5-20260712`). **M2g-b5
  (S1-D085): the mobile HUD-clip bug root-caused and fixed properly**
  (`window.innerHeight`/`100vh` → `visualViewport` + `100dvh` +
  `env(safe-area-inset-bottom)` — the actual APIs for this, not more
  margin-number tuning after two prior attempts), plus a bigger (+32%)
  and longer (+68%) pinyin/gloss arrival banner. Anchor position
  unchanged (that's the locked S1-D071 verdict) — flagged to John that
  repositioning is a distinct, bigger ask if that's what he actually
  wants. Full battery green.
- **Breadth-threshold playtest: "can't see much effect" — parked per
  John's instruction.** `prototypes/breadth-threshold/` stands as built,
  no further action pending his call.
- **Pure-emergence breadth-threshold experiment built (S1-D084)** —
  `prototypes/breadth-threshold/`. NOT a resolution of any real prior
  decision: the brief it came from cited S1-D034–037 for content that
  doesn't exist in this charter (checked directly, zero hits), so it's
  logged as a fresh experiment on its own merits, not the fake history it
  arrived with. Four breadth tiers (T0 shipped-only through T3), a blind
  session launcher, a results viewer, session data survives a tab close.
  Fully isolated from the shipped game (forked HTML, no BUILD_ID). Harness
  verified end-to-end via headless Chromium; the actual decay-curve data
  needs real multi-session human play — flagged plainly, not faked.
- Artifact: `inkblade-m2g.html` (BUILD_ID `S1-M2g-b4-20260712`), helpers
  TARGET default. **M2g-b4 (S1-D080): OPEN-12 licensing compliance —
  `LICENSE-ARPHIC.txt` at repo root, a small title-screen-only in-app
  credit, a README data-sources paragraph.** Caught and fixed a real
  regression during verification: the credit line's first position landed
  inside smoke21 T5's zero-ink assertion band; moved clear, re-verified
  green. Same checkpoint, compliance housekeeping not new gameplay.
- **Registry reconciliation (S1-D079) + two audits (S1-D080/D081) + four
  want-signal prototypes (S1-D082), same day.** An external "chat" planning
  session proposed decisions numbered S1-D028–D030 unaware the project had
  shipped to S1-D078 across ~15 more milestones — those IDs collided with
  real unrelated entries, so nothing was copied in as-numbered. Reconciled
  against actual history instead: OPEN-11/12/13/14 were already closed
  (S1-D034/035/037/049+059) months before this batch, chat unaware;
  OPEN-8 was substantively decided at S1-D011 but the registry row was
  never updated to say so (fixed); OPEN-6 (PvP parking) upgraded LEAN→LOCKED
  (was already parked via ancient S1-D006); OPEN-5 (same-type stroke
  disambiguation) is the one item genuinely still open — adopted plan:
  pull real telemetry from the live GitHub Pages build instead of
  scheduling a synthetic session. Separately audited (not implemented) the
  attached code-handoff's Object-Interaction Track A: water family is
  buildable now (水/川/etc., tag `wet`), wind needs one data-only tag added
  first (风 ships with zero tags), cold has no glyph at all (skipped per
  the handoff's own rule) — and found the handoff's assumption of an
  existing generic tag-reaction pipeline is false (R1-R4 are bespoke
  per-behavior functions, not a data table), so R5-R9 would be real new
  engineering, not config. Not built — genuine new player-facing behavior
  stacked on an already-pending checkpoint is exactly what the playtest
  mandate exists to prevent. **Then prototyped OPEN-9's four want-signal
  candidates** (`prototypes/want-signal/`, isolated from the shipped game —
  no BUILD_ID, not part of `tools/build.mjs`): escalating intensity, idle
  mood swap, resonance pulse, propagating ripple. All four functionally
  verified (zero console errors, instrumentation fires correctly); two real
  findings surfaced by building rather than just designing — intensity has
  no ceiling in its first pass (can hide its own referent), and the
  resonance pulse's first color choice didn't read as blue against this
  game's warm palette (fixed in-prototype). Go/No-Go response-rate metrics
  need real human testers, not headless verification — full findings in
  `prototypes/want-signal/README.md`. No OPEN-9 closure; human verdict
  still required.
- **M2g-b3 (S1-D078): mobile HUD-clip fix + embedded
  webfont, same checkpoint.** John's mobile-Chrome playtest report ("mobile
  device chrome also does not show the character shelf at the bottom")
  traced to the roster ledger sitting only 6px from the literal viewport
  bottom (`H`) — desktop's fixed chrome never touched that margin, mobile
  browsers reserve variable bottom-edge space `H` doesn't reliably exclude.
  New `HUD_BOTTOM_MARGIN` (34px) gives real clearance. Related finding:
  `CHAR_FONT` only named locally-installed Kai fonts, absent on mobile, so
  title/streak/HUD/seal glyph text silently fell back to generic serif
  there — fixed by embedding a subsetted Ma Shan Zheng webfont (607
  codepoints, SIL OFL, `fonts/`) that `boot()` now awaits via `FontFace`
  before the first frame, so every browser renders identical glyphs. Full
  battery green (smoke5–22 + frozen 1–4, zero console errors, perf 16.84ms
  @300, no regression).
- **M2g-b1 "the WebGL pilot" SHIPPED (S1-D075/D076),
  checkpoint pending — an EXPERIMENT verdict (continue polishing the real
  3D camera, or park it and move to the sprite pack block).** Gated behind
  `?r3d=1`, default off — `r3d` unset is confirmed byte-identical to m2f
  (full battery green proves it). Raw WebGL (no dependency): real
  perspective camera + z-buffer occlusion + distance fog; billboards
  textured by reusing the EXISTING 2D brush renderers via an offscreen
  stamp canvas (content-bbox cropped); sky + the approved 2D backdrop
  composite underneath unchanged; E2 ignition glow stays live per-frame via
  a `drawBurnFx` position override. Logged limitations: no 3D-space ambient
  particles, fire flicker is texture-refresh-rate not per-frame, no contact
  shadows, camera framing hand-tuned.
- **M2g-b2 (S1-D077): camera-unresponsive fix, same checkpoint.** John's
  mid-playtest report ("pointer does not affect camera at all," tried
  mobile finger + mouse) surfaced three real gaps: touch has no hover (any
  finger-drag on the fullscreen canvas becomes a writing trail immediately,
  so the pointer-follow listener never fired for a phone); OS `prefers-
  reduced-motion` silently zeroed the WHOLE camera with no way to tell why;
  the R3D camera's eye+center moved almost together, reading as barely-
  there even on a working mouse. Fixes: `?motion=1` override (accessibility
  default preserved without it); a `pointerdown` nudge (touch/click now get
  an immediate aim-toward-there cue); the camera reformulated as a real
  eye-orbit around a near-fixed look-at point. Verified directly (touch tap,
  motion override, hover) — a near tree now visibly shifts ~120px across
  the pointer's range (was a few px). Full battery re-green (smoke5–22 +
  frozen 1–4; perf 16.53ms @300, no regression). smoke22 (6 tests, incl. a
  forced-WebGL-unavailable fallback proving the pilot can never crash the
  game).
- **M2f-b1 "the world breathes" verdict (S1-D074, LOCKED): "just
  acceptable."** Read per the plan's own fork as authorization for the
  WebGL pilot rather than a hard stop. `inkblade-m2f.html` stands as the
  parallax-camera snapshot.
- **M2e-b1 "the ink travels" APPROVED by John (S1-D071, LOCKED)** —
  `inkblade-m2e.html` frozen as the approved snapshot. Lock transition:
  strokes coalesce to a gold droplet, arc into the world shrinking into
  depth, the object blooms from the splash, banner rises AT the arrival
  beside the object. Transit matter sim-exempt, never persists; ?seed=
  determinism byte-identical; plant latency ≈920ms ≈ the old +900ms.
- **Checkpoint-3 verdict (S1-D068, LOCKED): M2d-b1 ACCEPTED.** Core
  gameplay loop is fixed; 3D + visuals are cosmetic; chunk C stops bespoke
  batches — remaining 277 seals get faces when the swappable sprite pack
  block exists. **THE FUTURE GOAL (next MAJOR milestone after the cosmetic
  chunk): object↔object interactions — the sandbox world web** (reframes
  M2b's headline; tags-on-every-kind discipline continues as groundwork).
- Approved cosmetic order (exploration doc
  `inkblade-3d-transition-visuals-exploration.md`, this branch): (1) M2e
  lock transition — SHIPPED + APPROVED (S1-D071) → (2) M2f motion-parallax
  camera — SHIPPED, verdict "just acceptable" (S1-D074) → (3) M2g WebGL
  pilot — SHIPPED, **checkpoint pending (continue or park)** → (4) sprite
  pack block + seal coverage — waits on the M2g verdict either way (it
  ships regardless of which 3D approach wins; plan entry required).
- Session note: work lives on branch
  `claude/game-3d-rendering-exploration-39t6no` (remote-session mandate);
  merge to master brings m2e/m2f/m2g + smoke20–22 + charter/roadmap
  entries together.

## Previous state (as of S1-D067, 2026-07-11)
- Artifact: `inkblade-m2d.html` (BUILD_ID `S1-M2d-b1-20260710`), helpers
  TARGET default. **Chunk C batch 1 SHIPPED (S1-D066/D067), checkpoint
  pending — John's quality verdict gates scaling.** 7 bespoke kinds (大
  bigfig / 门 gate / 马 horse / 心 heart / 风 wind / 电 bolt / 车 cart), 3
  tier-2 families (banner ← 口讠言纟, dwelling ← 宀+家, skylight ← 日+天),
  flora flower (花), radicals 扌辶 → figure. Basic seals 377→277. Tags make
  the new matter reactive today (living horse; shelter+flammable dwelling —
  walker rests by huts, huts burn and regrow). Pipeline: `charsExtra` block
  curates non-core chars without growing the 23-char core roster. smoke19.
- Next batch candidates when scaling is green-lit: radical families 亠冖八
  力刀又土王白田目金钅... toward 0 seals; then the 3,000–7,000 tiers.

## Previous state (as of S1-D065, 2026-07-10)
- **Full delegation live (S1-D049)**: John has handed off all rulings — Code
  decides (including LOCKED amendments), logs rationale, ships, and reports.
- **AUDIENCE IS CHILDREN (S1-D063, LOCKED)** — picture-book clarity, wonder-
  forward interactions. Also LOCKED there: no engine/framework switch (vanilla
  Canvas 2D stays; Phaser 3/4 are natively 2D-only, three.js = full rewrite).
- Artifact: `inkblade-m2c.html` (BUILD_ID `S1-M2c-b2-20260710`); tests target it
  via `tests/helpers.js` TARGET_FILE default (`INKBLADE_TARGET` env overrides).
- **Chunk B shipped in two builds, checkpoint pending on b2** (charter §11):
  b1 (S1-D061/D062) — perspective convergence (`worldScreenX`, PERSP_FAR
  0.80, render-only), depth scale 0.42/1.45, two-stage mist, batched contact
  shadows, paper sky/ground washes, windowed roster ledger (`__S1_HUD`);
  smoke12 perf calibration now min-of-2. b2 (S1-D063–D065, answering John's
  "hollow" verdict) — the illustrated valley: `drawBackdrop()` on the world
  layer (ridgelines/drifting clouds/ground tufts, fixed seed 42, `__S1_SCENE`,
  empty-world early-return removed), smoke18 T6.
- **Chunk C is NEXT** (S1-D059(3), plan entry required before code): unique
  visual symbols for every char — first batch, then a John quality checkpoint
  before scale. Design for children's eyes (S1-D063).
- **Checkpoint 1 verdict landed (S1-D059) — M2b POSTPONED.** John's playtest of
  M2a surfaced four rulings, now the priority: (1) placement-choice aiming
  RETIRED — placement is pure chance again, interactions come from accidental
  proximity/collision (shipped as chunk A, S1-D060); (2) the world still
  doesn't read as 3D (standing S1-D040 ask, unresolved by M1d's depth-staging
  illusion) — folds into chunk B; (3) only 13 world.kind families exist and
  489/500 basic-tier chars render with no visual identity at all (plain seal)
  — confirmed duplicate: 大/山 share `peak`; chunk C; (4) canvas/UI needs a full
  redesign (500-char list too small to read) — chunk B. Execution order: A
  (done) → B (canvas/UI + 3D legibility) → C (visual symbols, first batch,
  checkpoint before scaling to 500 then 3,000–7,000).
- **M2a-b2 ignition/regrowth mechanics are UNCHANGED** by the S1-D059 ruling —
  only the aim bias on top of placement was removed: per-stage
  `ecology.ignition` flame/ember, `regrow` clocks; one hop; sun never
  ignites; kind+seed survive the burn (transformed ≠ destroyed). `?e2=0` is
  the kill switch.
- New sim seams: `E2_ON` (03-canvas), `updateIgnition`/`updateBurnLife`
  (09-world-sim), burn visuals (10-world-render), save v2 additive `burn`.
  `ecology.placement` is GONE from pack data (S1-D059/D060) — `placeEl` is
  pure max-spacing random again, no lockExit anywhere in state.
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
| M2a-b2 | S1-M2a-b2-20260707 | E2 ignition + regrowth behind the gate (?e2=1): per-stage kindle (embers slower/closer), burn walk to ash→sprout→sapling→itself (same seed), one hop, sun never ignites, save v2 +burn, smoke17 added | S1-D054–D055 |
| M2a-b3 | S1-M2a-b3-20260707 | **The flip: E2 default-ON, M2a complete.** ?e2=0 kill switch; gate assertions inverted (smoke11/17 T1); smoke17 T7 = the promise with real gestures (write 火, flick at a tree, it kindles and regrows) | S1-D056–D057 |
| M2a-b4 | S1-M2a-b4-20260707 | **Chunk A of Checkpoint 1's verdict: the aim mechanic retired.** John's playtest ruled release-point aiming awkward; `placeEl` reverts to pure random max-spacing, `ecology.placement` dropped from packs, `state.lockExit` removed. Ignition/regrowth (b2) untouched — proximity-driven "collision" interactions were already the model asked for. smoke16 inverted (exit-independent placement); smoke17 T7 rewritten (accidental collision, not aim) | S1-D059–D060 |
| M2c-b1 | S1-M2c-b1-20260710 | **Chunk B: the scroll gains depth + the legible ledger.** Perspective convergence (render-only), depth scale 0.42/1.45 (3.45×), two-stage mist, batched contact shadows, sky/ground paper furniture, windowed roster ledger with counter (fixes the 2px-cells-at-500 bug). smoke18 added; smoke12 perf calibration hardened to min-of-2 sampling | S1-D061–D062 |
| M2c-b2 | S1-M2c-b2-20260710 | **The illustrated valley (answers the "hollow" verdict).** Always-present backdrop on the world layer: 3 ridgeline silhouettes, 4 drifting clouds, 56 perspective-scaled ground tufts/pebbles, fixed seed 42, `__S1_SCENE`; empty-world early-return removed. smoke18 T6 added; perf: absolute budget passed WITH backdrop (17.41ms @300) | S1-D063–D065 |
| M2d-b1 | S1-M2d-b1-20260710 | **Chunk C batch 1: every character earns a face.** 大→bigfig dedupe, 6 more bespoke kinds (gate/horse/heart/wind/bolt/cart), banner/dwelling/skylight families + flora flower, radicals 口讠言纟宀日扌辶 mapped; basic seals 377→277; interaction tags live (rest-by-hut, hut burns+regrows); pipeline charsExtra; smoke19 | S1-D066–D067 |
| M2e-b1 | S1-M2e-b1-20260711 | **The ink travels (lock transition).** Character→object made legible: strokes coalesce → droplet arcs into the world shrinking into depth → object blooms from the splash; banner moves to arrival, anchored beside the object; transit matter sim-exempt + never persisted; seed determinism byte-identical; smoke20. **APPROVED (S1-D071)** | S1-D068–D071 |
| M2f-b1 | S1-M2f-b1-20260711 | **The world breathes (motion-parallax camera).** Idle drift + pointer pan, eased, per-depth-layer shift 0.18→1.0 (sky exempt, shadows/backdrop/transit/banner ride along); trail-gated, reduced-motion pinned; foreground occluder band (7 single-fill clumps, parallax 1.18) completes the depth sandwich; smoke21 (drift-proof layer contract). **Verdict: "just acceptable" (S1-D074)** | S1-D072–D074 |
| M2g-b1 | S1-M2g-b1-20260711 | **The WebGL pilot (experiment).** `?r3d=1`, default off, r3d-unset confirmed byte-identical to m2f. Raw WebGL (no dependency): real perspective camera + z-buffer occlusion + fog; billboards textured by reusing the existing 2D brush renderers (offscreen stamp, content-bbox cropped); sky/backdrop composite underneath unchanged; E2 ignition glow stays live via a drawBurnFx position override; graceful no-crash fallback if WebGL is unavailable. smoke22 | S1-D074–D076 |

## Planned
### Chunk B — canvas/UI redesign + 3D legibility — SHIPPED (S1-D061/D062, M2c-b1; playtest checkpoint pending)

### The sandbox interaction web — THE NEXT MAJOR MILESTONE (S1-D068(3)) — **DESIGNED (S1-D088)**
Full design: `inkblade-interaction-web-design.md` (2026-07-17, John's
creative-license brief). Three layers: **L1** the generic tag×tag resolver
(six closed engine verbs — emit/aura/move/pose/phase/clock — every
interaction a pack-data row; the missing pipeline S1-D081 identified),
**L2** duets (haul 马+车, procession, passThrough, glimmerPath 月+水),
**L3** 会意 resonance — adjacent planted characters that form a real
compound (人+木→休, 日+月→明, 木+木→林…) condense a wordless shimmer that
becomes the next glyph offer; locking it fuses the meaning at the site.
**L3 is the adopted OPEN-9 answer: wants are etymology.** One bounded
overrule: wind carries fire exactly one hop (amends S1-D049c at build
time). Build order b1 resolver → b2 duets → b3 resonance → b4 R1–R3
fold-in, every build a checkpoint. Code waits on the pending S1-D087
playtest verdict; every kind shipped meanwhile still must carry tags
(S1-D066 pattern).

### Chunk C — visual symbol expansion — batch 1 SHIPPED + ACCEPTED (S1-D068); scaling DEFERRED to the sprite pack block (cosmetic step 3)
Confirmed: only 13 `world.kind` families exist; 489/500 basic-tier chars (98%)
render with no visual identity (plain seal fallback); 大/山 literally share one
kind (`peak`). John wants every character visually unique and asked whether
Code can do this or needs another AI for visual design. Ruling: Code attempts
it — procedural canvas iconography (the existing technique for fire/tree/sun/
moon/walker), leaning on the radical-driven approach already flagged in the
backlog (`radicalClasses`, 口讠扌辶纟宀 etc. unmapped) since most of these
characters are literally pictographic. Ship a first batch covering the worst
offenders (dedupe 大/山, give 二/三/十 clearer forms, add several new radical
families) and STOP for a John quality/legibility checkpoint before scaling to
the rest of the 500, then the 3,000–7,000 roster (S1-D043).

### M2b — demand world (OPEN-9) — POSTPONED (S1-D059: everything waits on chunks A–C)
World state generates wants ("the grove is dark — write something that burns");
repertoire choice replaces some ghost glyphs. Needs a want-authoring model that
never becomes a quest log. Solves OPEN-3 diegetically. With E2 live, wants can
now be *answerable*: a want for light is answered by written fire that actually
kindles; regrowth means answering never permanently costs the world anything.

### M2a — E2 ignition + placement choice — COMPLETE, placement half later amended (S1-D057 closed it; S1-D059/D060 retired the aim mechanic in b4 — see above)
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
- ~~Radical map growth~~ PROMOTED to chunk C (S1-D059(3)) — 口讠扌辶纟宀 etc. unmapped (489/500 are seals today, current count) — each new family renderer + radicalClasses row converts dozens of seals into scenery.
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
| OPEN-14 | ~~E2 choice axis~~ RESOLVED S1-D049, AMENDED S1-D059: aim-based placement retired, chance+collision preferred; repertoire stays M2b | — |
| OPEN-15 | ~~Flat-撇 gap~~ RESOLVED S1-D049, shipped S1-D051 (M1f-b2): pie real-form grace at 180° | — |
