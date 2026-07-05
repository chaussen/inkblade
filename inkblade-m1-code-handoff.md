# Inkblade — M1 Code Handoff v1
## Work order: attention choreography · ecology E1 · the extensibility platform

**Audience:** the Code agent taking over implementation of the S1 track.
**Authority:** `inkblade-charter-v1.md` is the single source of truth; this handoff is the
M1 work order derived from charter rulings S1-D019–S1-D022. If this document and the
charter conflict, the charter wins and the conflict is escalated to the router (John).
**Nothing is real until logged.** Decision log IDs continue from S1-D022; your entries are
proposals until the router confirms.

---

## 1. Reading order & current verified state

Read: this §1–§3 → charter §1 (thesis), §5 (formal model), §7 (baseline checks) → the rest
of this document → charter in full.

| Asset | BUILD_ID | State |
|---|---|---|
| `inkblade-m0.html` | S1-M0-b2-20260704 | 8 singles, verified (suites: smoke.js, smoke2.js) |
| `inkblade-m05.html` | S1-M05-b1-20260705 | + 6 composites, wash, mini-locks, hints, `dr` merge (smoke3.js) |
| `inkblade-m075.html` | **S1-M075-b2-20260705** | + persistent living world, localStorage, relock metric (smoke4.js + smoke3 regression) — **the base you extend** |
| Regression suite | — | `inkblade-v1-regression-suite.zip`: smoke.js/smoke2.js/smoke3.js/smoke4.js, node + puppeteer, real dispatched pointer events |

**Binding disciplines (non-negotiable, inherited):**
1. Verification = headless Chromium + **real dispatched pointer events**. Direct handler
   invocation is banned for any claim of working behavior.
2. BUILD_ID in file header + on-canvas + `window.BUILD_ID`; bump on **any** edit before
   the file leaves your hands.
3. Engine code never contains content. All characters, mappings, reactions, and tuning
   live in data files.
4. Append-only decision log, single-row entries, newest first, `[LOCKED]`/`[LEAN]`/`[OPEN]`.
5. Run charter §7 baseline checks + this document's §9 red flags on every addition.
6. Regression suites must pass on every build you produce; extend them, never delete.

---

## 2. M1 scope at a glance

| Workstream | What | Charter basis | Milestone |
|---|---|---|---|
| **A** | Attention choreography (focus recession + writing veil) | S1-D019 | M1a |
| **B** | Ecology phase E1 (reactive; E2 spec'd but HARD-GATED) | S1-D020 | M1c |
| **C1** | Polyline verb model (折/钩/提 — the extended move-set) | S1-D021 | M1b |
| **C2** | Content pipeline (character packs derived from stroke DB) | S1-D021 | M1a–M1b |
| **C3** | World element classes + seal fallback rule | S1-D021 | M1b |
| **C4** | Architecture refactor, save versioning, perf, metrics | S1-D021 | M1a |

Out of scope entirely: §8.

---

## 3. Workstream A — Attention choreography  `[LOCKED principle / LEAN numbers]`

**Principle (charter S1-D019):** the figure-ground contract — at any moment exactly one
plane owns attention; game state drives transitions. Writing → glyph owns; resolution →
world owns.

| Spec item | Value (all tuning constants at top of config, `[LEAN]`) |
|---|---|
| World recession | While a glyph is active: world layer ink presence ×0.35 (global alpha multiplier). Animations continue — quiet, not frozen |
| Writing veil | Soft-edged fresh-paper panel behind the glyph bbox + margin: paper tone +6% brightness, alpha ~0.5, radial soft edges. Diegesis: a fresh leaf laid over the scroll |
| Bloom | On lock/fizzle begin: veil fades out and world eases to ×1.0 over ~400ms; holds through resolve + ~1.5s after; recedes again as next glyph appears |
| Ambient audio cues | World events that occur while receded (E1 fire crackle, startle) emit soft audio so nothing important is silent-missable |
| Instrumentation | Per-glyph log: `worldDensity` (element count + count overlapping glyph bbox), `timeToFirstCut`, whiff rate — the veil's effectiveness must be measurable |

**Self-tests (extend smoke suite):** world alpha measurably differs between writing and
resolve phases (readable via exposed state); veil present during play, absent during
bloom; all M0.75 world tests still pass; zero console errors.

---

## 4. Workstream B — Ecology  `[E1 ADOPTED / E2 GATED]`

**Matter classes (charter S1-D020):**

| Class | Kinds | Lifecycle |
|---|---|---|
| **structure** | tree, resttree, peak, ridge, terrace, horizon, path, (seal/stele from C3) | permanent (E2 may transform) |
| **agent** | walker, crowd | mobile forever; behavioral reactions |
| **event** | fire (later: weather) | mortal — fuel clock → embers → smoke wisp → ash mark that fades over minutes; ash persists across sessions with a decay timestamp (the scroll remembers, then heals) |

**Tag vocabulary (world layer only — never touches the glyph/stroke layer):**
`heat`, `flammable`, `living`, `shelter`, `mortal`. Assignments in data:
fire{heat, mortal} · tree/resttree{flammable, shelter} · walker/crowd{living}.

**E1 reaction rules (adjacency = normalized distance thresholds in data):**

| # | Rule | Behavior |
|---|---|---|
| R1 | living near heat (comfort radius) | walker's wander biases toward fire (warming) — visible loitering |
| R2 | living near heat (danger radius, or on flare) | startle: hop + flee re-center away; return after fire dies |
| R3 | living near shelter | occasional pause-under-tree rest beat |
| R4 | mortal lifecycle | fire burns N minutes (data), flares occasionally, → embers → smoke → ash mark |

E1 invariant: **nothing the player has planted is ever destroyed or degraded in E1.**

**E2 (spec'd, HARD-GATED — do not enable):** heat + flammable adjacency → ignition after
dwell → burning tree (animated) → ash scar structure → (future) regrowth want. Spread
depth capped at 1. Gate: E2 ships only after a choice axis exists (placement choice or
want-driven repertoire choice) — that design is a Chat/Design deliverable, not yours.
Implement behind a config flag default-off; the flag being off is itself a regression test.

**Cross-log requirement:** adopting the tag-reaction pattern requires the router to add a
one-line cross-reference entry in the R4 charter (kinship note). Remind him in your first
deliverable.

**Self-tests:** deterministic-seed scenario tests — walker within danger radius flees and
returns post-burnout; fire completes full lifecycle to ash; ash decays; E2 flag off →
tree adjacent to fire for full fire lifetime remains untouched; save/load mid-fire
restores remaining fuel; zero destruction events logged in E1 telemetry.

---

## 5. Workstream C1 — Polyline verb model (extended move-set)  `[LEAN]`

**Problem:** 横竖撇捺点 cannot express 折 (turns), 钩 (hooks), 提 (rising) → 口日月田国
and most of the lexicon are unwritable. This is the hard wall on "infinite characters."

**Model:** a stroke's verb is a **sequence of direction buckets** (bucket-string).

| Element | Spec |
|---|---|
| Atomic buckets | existing: `heng`(0°) `dr`(45°, na/dian merged per S1-D013) `shu`(90°) `pie`(135°) · new: `ti` (up-right, −45°) |
| Compound strokes | 横折 = `heng>shu` · 竖折 = `shu>heng` · 横折钩 = `heng>shu>hook` · 竖钩 = `shu>hook` · caps at 3 segments; rarer strokes marked `complex` in data and matched leniently (first + last segment only) |
| Hooks | terminal short flick segment, direction class only. **Hook matching is OPTIONAL at M1** (`[LEAN]`, router confirm pending as OPEN-11): a `shu` slash cuts a 竖钩 stroke; performing the hook is polish, never required |
| Corner detection | resample trail → split at cumulative turn > ~50° within a short window → classify each segment with the existing ±32° coarse buckets. Max 2 splits |
| Anti-grading invariants `[LOCKED]` | Only direction classes per segment. NEVER: curvature scores, segment length ratios, corner sharpness, proportion, neatness. Charter §7 Q1 applies to every segment |
| Targeting | alignment-priority (S1-D008) generalizes: a hit's match score = its bucket-string compatibility with the slash's segment string; distance still breaks ties |
| Rendering/hit geometry | strokes become true polylines (from C2 medians); `trailStrokeDist` already iterates segments — generalize the stroke side to polyline |

**Self-tests:** single-segment slashes still classify identically to v1 (full smoke1–4
regression); 口/日/田 lock end-to-end with real two-segment 横折 gestures; a straight
`shu` slash cuts 竖钩 (hook-optional); a deliberate wrong-turn (`heng>pie`) on 横折
deflects; corner detection never splits a naturally-wobbly straight slash (jitter
tolerance test); zero console errors.

---

## 6. Workstream C2 — Content pipeline  `[LEAN]`

**Source:** Make Me a Hanzi (or equivalent): per-character median polylines (stroke
geometry), array order = canonical stroke order, decomposition (component tree with
ideographic description characters ⿰⿱⿴… = layout), ~9.5k characters.
⚠️ **Licensing (OPEN-12):** MMAH glyph data is Arphic-derived (APL). Flag to router before
any commercial step; acceptable for prototyping. Pinyin/gloss from Unihan + CC-CEDICT
(permissive).

**Offline build step (a script, run at authoring time — never at runtime):**

| Stage | Output |
|---|---|
| Ingest | raw medians + order + decomposition per char |
| Geometry | resample/simplify medians to the game's normalized box; polyline per stroke |
| Verb derivation | auto-classify each stroke's bucket-string from its median direction profile |
| Component derivation | **depth-1 chunking `[LEAN]`, OPEN-13:** top-level decomposition only (墨 = 黑+土; 黑 is one chunk) → `comps` ranges via component stroke counts; layout from IDC |
| Validation | ambiguity queue: strokes whose bucket-string is uncertain, comps whose ranges don't reconcile → flagged for manual review. Generated data is `[LEAN]` until spot-verified; this also retires OPEN-7 (众/焱 forms come from real data) |
| Emit | versioned JSON character packs |

**Character pack schema (draft — refine in your M1a plan):**
```
{ version, chars: [ { ch, pinyin, gloss, freq,
    strokes: [ { verbs: "heng>shu", pts: [[x,y],…] } ],
    comps: [ { range: [s,e], layout: "⿰", ch: "木" } ],
    world: { tier, kind|class, params } | null   // null → seal fallback (C3)
} ] }
```
Runtime loads packs; the hand-authored v1 roster is regenerated through the pipeline as
its first validation case (diff against current behavior = the acceptance test).

**Self-tests:** pipeline regenerates the 14-char v1 roster and the full regression suite
passes against generated data; 口日国 packs load and lock; validator catches a
deliberately corrupted stroke; unknown pack versions rejected cleanly.

---

## 7. Workstream C3 — World element classes + seal fallback  `[LOCKED rule / LEAN library]`

| Tier | Mapping | Examples |
|---|---|---|
| 1 — bespoke | hand-authored element kinds (current library, grows opportunistically) | tree, fire, walker, peak… |
| 2 — class-mapped | semantic category (via radical/decomposition) → parametrized element family with per-char skin params | flora, fauna, water, structures |
| 3 — **seal fallback `[LOCKED]`** | any character without a mapping plants as a cinnabar seal stamp or small stone stele bearing its form | *every* character |

**The seal fallback rule: no character locks without leaving a mark.** This is what makes
the world extensible by construction — and diegetically true (real scrolls accumulate
seals and inscriptions). Unknown element kinds found in old saves also render as seals
(self-healing, see C4).

World mapping lives in pack data (`world` field), never in a code switch. The current
14-case switch is deleted in the refactor.

**Self-tests:** a pack char with `world: null` locks and plants a seal; a save containing
an unknown kind renders as a seal without error; Tier-2 class element renders with two
different param skins from two different chars.

---

## 8. Workstream C4 — Architecture, saves, performance  `[LEAN]`

| Item | Requirement |
|---|---|
| Modules | input/classification · glyph combat · world sim · render · data loading · persistence · metrics. Single-file build output is fine (build step may concatenate); *source* must be modular |
| Engine/content split | engine contains zero character data, zero reaction tuning, zero element mappings |
| Save schema | `{ version, els: […] }` — current live saves are implicit-v1 (`inkblade_world_v1`). Ship migration v1→v2 (add class/lifecycle fields); unknown kinds → seal; never destroy a player's world on upgrade. Migrations are append-only functions |
| Performance | soft budget: 60fps at 300 elements on mid mobile. Static structures pre-rendered to an offscreen layer, invalidated only on change; agents/events/fresh-grow drawn live. Particle caps |
| Metrics | carry `__M0_METRICS` forward (rename `__S1_METRICS`, keep old alias one version); add worldDensity, per-glyph timeToFirstCut, E1 event counts |
| Dev affordances | keep `?char=` and `?reset=1`; add `?pack=` and `?seed=` for deterministic ecology tests |

**Explicitly OUT OF SCOPE for Code (do not design or implement):**
demand world (OPEN-9 — Chat deliverable) · E2 enablement and any placement-choice UI ·
PvP · day/night visuals beyond what 日/月 packs + C1 unlock naturally · any tutorial text ·
any XP/streak-reward system · SRS/scheduling.

---

## 9. Baseline check additions (run with charter §7 on every change)

New red-flag phrases — audit immediately if any appears in code, comments, or commits:
"curvature score" · "corner precision" · "segment length ratio" · "stroke accuracy %" ·
"neatness" · "penalize the hook" · "hardcode the character" · "special-case this char in
the engine" · "skip the pointer-event test, the logic is obviously right" ·
"burn the player's tree" (while E2 flag is off).

Two questions added to the Ten for M1 work:
Q11: Does this change put content in engine code? (must be NO)
Q12: Can an old save load into this build without loss? (must be YES)

---

## 10. Milestones, gates, expected outputs

| Milestone | Contents | Gate to pass |
|---|---|---|
| **M1a** | C4 refactor + C2 pipeline (regenerating v1 roster) + A veil | Full v1 regression suite green on generated data; veil measurably alters world alpha; old saves migrate; BUILD_ID `S1-M1a-b#` |
| **M1b** | C1 extended move-set + C3 element classes/seal fallback + first extended pack (suggest: 口日月田国土山水 + a Tier-2 batch) | 口/日 lock with real fold gestures; seal fallback exercised; regression green |
| **M1c** | B ecology E1 | E1 scenario tests green; E2 flag off verified; zero-destruction telemetry |

**Your first deliverable (before any code):** an M1a implementation plan — module layout,
final pack schema, save migration plan, test plan extending the regression suite —
written as decision-log-ready single-row entries for router confirm. Flag anything in
this handoff that is ambiguous or infeasible instead of improvising around it.

## 11. Router decisions pending (for John, tracked in charter)

| id | Question |
|---|---|
| OPEN-11 | Hook matching optional (recommended) or required? |
| OPEN-12 | MMAH/Arphic licensing review before any commercial step |
| OPEN-13 | Depth-1 component chunking confirm (墨 = 黑+土, not recursive) |
| OPEN-14 | E2 gate: which choice axis first — placement choice or want-driven repertoire? (Chat design task) |

*End of handoff v1.*
