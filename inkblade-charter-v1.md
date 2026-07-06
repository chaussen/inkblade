# Inkblade — S1 Charter v1
## The Combo-Orthography Track

**Status: INDEPENDENT TRACK.** This game shares process conventions with the Game Design Lab but is a separate project from Hanzi Sandbox (R4/v3). No fight protocol exists between S1 and any other track — they teach different literacy operations and contest nothing (§6). This document is the single source of truth for S1. Nothing is real until written here.

**This document is self-contained.** An agent with zero prior context must be able to read only this file and (a) understand why the game exists in this form, (b) continue development without drifting, (c) audit any work against the baseline checks in §7.

**Status tokens:** `[LOCKED]` settled · `[LEAN]` working default · `[OPEN]` undecided.
**Roles:** Chat = analysis/arbitration/specs · Design = feel/playtest verdicts · Code = implementation · John = router, binding calls.
**Protocol:** append-only Decision Log (§9), newest first, single-row entries; `[LOCKED]` changes only via superseding entry; decisions as tables, not prose.

---

## 1. The Thesis  `[LOCKED]`

### 1.1 One sentence (the identity claim)

> **The real stroke inventory is the move-set and the real lexicon is the combo book — writing Chinese is literally executing curated combos, and no other game can claim this because no other writing system standardizes production order.**

### 1.2 The anti-pattern: the dictation game

Every stroke-writing product ever shipped (Skritter, tracing apps, school software) shares one structure: writing is transcription to be graded. The player produces strokes; a judge compares to a template; feedback is correct/incorrect. Skill accrues to *pleasing the grader*, not to writing. **A stroke is not input to be judged. A stroke is a verb.**

### 1.3 The substrate

| Orthographic fact | Game-structural equivalent |
|---|---|
| ~8 basic stroke types (横竖撇捺点提折钩) | A fixed move-set of distinct gestures |
| Every character = a standardized stroke sequence | Every character = a combo string |
| Stroke-order rules (top→bottom, left→right, horizontal-before-vertical, outside-before-inside) | Combo *grammar* — patterns that predict unseen combos |
| The lexicon = the sequences history kept | A pre-curated combo book, 3,000 years of curation |
| Each stroke has native direction and shape | Each move has native geometry: the drawn form IS the attack's physical form |

Player skill attaches to: (a) motor execution of stroke gestures — generic; (b) knowledge of specific sequences; (c) internalized order grammar that predicts unseen characters. (b) and (c) **are literacy** — the production side.

### 1.4 The two laws  `[LOCKED]`

**Law 1 — Depth lives in the combo layer.** The slash layer (gesture-combat) is fun themeless (Fruit Ninja is the existence proof) — that satisfies the Illiterate Fun Test but carries zero identity. All mastery growth the game rewards must live in sequence knowledge and order grammar. If playtests show skill growth only in slashing, the model has failed.

**Law 2 — Novelty pressure.** The identity holds only if the winning skill is grammar, not memorization. The content pipeline must keep serving unseen characters faster than players can memorize them. A fixed small roster fails the dark-twin test by construction. (M0 is exempt: its 8-character roster tests the loop, not the pipeline.)

### 1.5 The core loop  `[LOCKED]`

```
A ghost glyph appears (the character to be written; strokes visible as pale targets)
  → each slash IS a physical act; to cut a stroke, the slash's direction
    bucket must match the stroke's canonical direction (Variant B, S1-D003)
  → strokes cut in the canonical sequence ink in GOLD; out of order still cut, ash-grey
  → all strokes cut, order intact → LOCK: the character assembles, speaks its
    pinyin, and its MEANING manifests as the superattack (火 → flame; 木 → tree grows)
  → order broken → FIZZLE: the character crumbles — you still did a thing,
    nothing locked. No "wrong" is ever surfaced. (stability rule, S1-D002)
```

### 1.6 What is rejected  `[LOCKED]`

- ❌ **Variant A — shape-grading** (drawn gesture compared to stroke template form): the dictation game with juice. Direction buckets only; the recognizer must never judge form quality (S1-D003).
- ❌ Correct/incorrect judgments surfaced to the player — lock/fizzle only.
- ❌ XP, streaks-as-reward, badges, timers-as-pressure. (The streak counter is display of fact, not a reward system; the combo book collection IS the content.)
- ❌ In-game tutorial or instruction text. One framing line on the boot screen is the permitted maximum (S1-D007).
- ❌ Stroke-order hints that reveal sequence (the world demonstrates via gold/ash; that is the entire pedagogy).

---

## 2. Why Chinese — uniqueness case  `[LOCKED]`

Alphabets have letter order in *spelling* but no standardized *production* sequence with spatial grammar — no rule system says which pen motion of "W" comes first in a way that transfers across the letterset. Chinese stroke order is (a) standardized, (b) rule-governed by a small learnable grammar, (c) applied uniformly across a lexicon of thousands. It is the only writing system whose production procedure is itself a curated combo system. The concept is not reskinnable to another language — its market identity and its dark-twin test in reverse.

## 3. The three tests  `[LOCKED]`

| Test | Method | Pass condition |
|---|---|---|
| **Illiterate Fun Test** | Tester told nothing about Chinese | Sustained voluntary play; describes it as a slash/combo game, not a language app |
| **Transfer Test** (production-side) | After ~5 hours, show an unseen character | Player attempts a plausible stroke sequence using order grammar (top-first, left-first, outside-first) — not random |
| **Dark-twin test** | Reskin strokes as arbitrary runes with arbitrary sequences | Slash layer survives (expected, fine). Combo layer must collapse: no grammar, no prediction, nothing internalizable. If sequence skill survives the reskin intact, players were memorizing, not reading — audit against Law 2 |

## 4. Nearest relatives and distances

| Relative | Distance |
|---|---|
| **Okami** | Closest ancestor: brush strokes as spells — but ~13 invented whole-shape symbols, no sequence grammar. Here the move-set is a real writing system and the combo book is the lexicon |
| Fruit Ninja | The slash layer alone: no vocabulary, no sequences, no grammar |
| Skritter / tracers | The anti-model: dictation game. No consequence, no world, no verb |
| Fighting games | Sequence execution as mastery — but combos invented per-game; here inherited and meaningful |
| Hanzi Sandbox (R4) | Sibling, not rival: R4 = reading (decompose/compose components, positional grammar); S1 = writing (produce stroke sequences, order grammar) |

## 5. Formal model — v1  `[LEAN]`

### 5.1 Direction buckets (the move-set)

| Bucket | Gesture | Angle center (screen, y down) | Notes |
|---|---|---|---|
| 横 heng | rightward slash | 0° | slight upward tilt tolerated (calligraphically honest) |
| 竖 shu | downward slash | 90° | |
| 撇 pie | down-left sweep | 135° | |
| 捺 na | down-right press | 45° | shares one down-right verb with 点 (S1-D013) |
| 点 dian | down-right flick | 45° | target's own type disambiguates; absolute-length split superseded |

Tolerance ±32° to nearest center; leftward/upward slashes classify to no bucket. **S1-D013:** 捺 and 点 are one direction verb (`dr`); composite compression shrinks 捺 below any fixed length threshold, so length-based discrimination produced false deflects by construction. The target stroke's own type resolves ambiguity; alignment-priority targeting (S1-D008) is unchanged. v2 candidates: 提 折 钩 (`OPEN-2`).

### 5.2 Resolution rules

1. A slash that overlaps no uncut stroke → **whiff** (trail fades, nothing else).
2. **Alignment-priority targeting** `[LOCKED, S1-D008]`: among overlapped uncut strokes, prefer those whose type matches the slash bucket; distance breaks ties. Rationale: a crossing stroke always intersects a slash at distance 0, so min-distance targeting hands a horizontal slash across 十 to the vertical stroke. A slash cuts what it runs *along*, not what it crosses.
3. Bucket matches target type → **cut**. In-sequence while order intact → gold ink; otherwise ash ink, order broken.
4. Bucket mismatches target type → **deflect**: stroke shivers, sparks, metallic ting; stroke stays. (Interesting, not punishing.)
5. All strokes cut: order intact → **lock** (assemble, pinyin speech, meaning effect); else → **fizzle** (crumble, soft gong, small delight).

### 5.3 Character data contract

`{ ch, pinyin, gloss, fx, strokes: [{t: bucket, a: [x,y], b: [x,y]}], comps: [[start,end],…] }` — stroke array order IS canonical global order; geometry in a 0–100 box; `comps` are contiguous stroke-index ranges in canonical component order (global order = component order × internal order, so `comps` adds presentation chunking, not a new rule). Every character's strokes must all live in implemented buckets. **Positional inflection is honored in data:** a component's strokes change form by position per standard orthography (林's left 木 and 炎's top 火 compress 捺→点) — the required gesture physically changes with position. Meaning effect (`fx`) manifests the gloss physically, never as text-first reward.

### 5.4 Composite presentation (S1-D010/D011/D012)

| Element | Rule |
|---|---|
| **Component wash** | Each component's ghost strokes sit on a faint tinted region (diluted ink-wash). Segmentation is perception support — always on; order remains the skill. External sprite/pictorial markers are REJECTED (S1-D010) |
| **Fractal combo / mini-lock** | Complete a component with all-gold strokes → mini-lock (solid ink, pulse, chime); any ash → settles grey. Localizes errors by chunk and by level (internal vs component order) |
| **Breathing hint** | Flail (2 consecutive non-gold) or idle (6s no cut) → the component containing the next canonical uncut stroke breathes; repeat trigger escalates to a stroke comet. Never pre-emptive, never external, composites only |

## 6. Relationship to other Lab tracks  `[LOCKED]`

| | Hanzi Sandbox (R4) | Inkblade (S1) |
|---|---|---|
| Literacy operation | Reading: decode, analyze, compose | Writing: produce stroke sequences |
| Grammar taught | Component position | Stroke order |
| 形声 doctrine | ~80% of lexicon excluded (phonetic misleads meaning-reading) | **No exclusion**: order grammar applies to every character; meaning is granted on completion, not decoded from form. Vocabulary effectively unbounded — exactly what Law 2 demands (S1-D005) |
| Shared inheritance | Stability rule (lock/fizzle, never "wrong"), Fun Gate, ≤3s action-to-response, no engagement-substitutes, verification via real dispatched pointer events, BUILD_ID fingerprinting |

PvP: parked to M2+ (S1-D006). Noted risk: literacy asymmetry becomes directly competitive (more characters known = stronger arsenal) — purest "knowledge is power" and a matchmaking problem simultaneously.

## 7. Baseline Check Protocol — drift detector  `[LOCKED]`

Run on every addition; any wrong answer → stop, escalate to router with a log draft.

| # | Question | Required |
|---|---|---|
| 1 | Does this compare a drawn gesture to a template *form* (curvature, proportion, neatness)? | NO — direction bucket + overlap only |
| 2 | Does this surface a correct/incorrect judgment? | NO — lock/fizzle only |
| 3 | Does this add depth to the slash layer that the combo layer doesn't share? | NO (Law 1) |
| 4 | Does this reward memorizing a fixed roster over inferring order grammar? | NO (Law 2) |
| 5 | Is every new character's stroke data canonical (real sequence, real direction types)? | YES |
| 6 | Does a lock's payoff manifest the character's *meaning* physically? | YES |
| 7 | Slash-to-visible-response ≤ 3 seconds? | YES |
| 8 | Would this mechanic be worth keeping if it taught nothing? (Fun Gate) | YES |
| 9 | Does this add tutorial text, order hints, or XP/badge/streak rewards? | NO |
| 10 | Is the change verified with real dispatched pointer events against a fingerprinted build? | YES |

**Red-flag phrases:** "grade the stroke" · "accuracy score" · "trace the character" · "show the correct order" · "practice mode" · "the player wrote it wrong" · "neatness bonus" · "daily streak reward".

## 8. M0 — the smallest honest prototype  `[LOCKED spec / build shipped]`

**The one question:** is slash-sequencing a visible character by inferred stroke order — and being paid in its meaning — fun for 10 minutes?

| Spec item | Value |
|---|---|
| Build | Single HTML file, canvas, touch + mouse, `inkblade-m0.html` |
| Roster | 一 二 三 十 人 大 木 火 (2–5 strokes, buckets 横竖撇捺点 only) |
| Presentation | One ghost glyph at a time; strokes as pale targets; no enemies, no waves, no health |
| Feedback | Gold/ash ink per cut, deflect on wrong direction, lock (pinyin + meaning effect + cinnabar seal into the combo-book strip) vs fizzle (crumble) |
| Discoverability | Gesture hint on the first glyph (一) only — teaches the slash, cannot leak order (single-stroke). One framing line on boot. Zero in-game text after |
| Instrumentation | `window.__M0_METRICS` (glyphs, locks, fizzles, cuts, goldCuts, deflects, whiffs, perChar) + BUILD_ID in header, on-screen, and `window.BUILD_ID` |

**Go / No-Go (observable):**
- **GO**: tester voluntarily plays >10 min; attempts unseen characters with visible order reasoning (hesitation, deliberate first-stroke choice — grammar engaging, not spamming); ≥1 lock produces visible delight; wrong-order fizzles read as "did a thing," not failure.
- **NO-GO**: testers wait to be shown orders, or stop caring about order once slashing feels good (combo layer not load-bearing → Fruit Ninja with subtitles), or engagement dies <5 min.
- **BOUNCE**: newly discovered defect blocking the metrics — fix and re-run, no verdict filed.

### M0.5 — composites (`inkblade-m05.html`)

**The one question:** do composite characters read as *chunks to conquer in order* rather than stroke soup — without external markers?

| Spec item | Value |
|---|---|
| Composite roster | 休(6) 众(6) 林(8) 炎(8) 森(12) 焱(12) — all bucket-legal, composed of taught primitives 人木火 |
| Curriculum intro | 一 人 木 火 → 休 众 林 炎 森 焱; remaining singles join the random pool after |
| New systems | component wash · mini-locks · breathing hint (§5.4) · merged `dr` verb (S1-D013) |
| Instrumentation | adds `comps{gold,ash}`, `hints{breathe,comet}`, `orderBreaks{internal,component}` — the last distinguishes stroke-grammar errors from component-grammar errors |
| Dev affordance | `?char=X` forces a single-character loop for playtesting |
| 墨 status | excluded — 黑 contains fold strokes (㇕), blocked on OPEN-2, not on this system |

**Go / No-Go (observable):**
- **GO**: tester completes ≥1 twelve-stroke composite; `orderBreaks.component` *decreases* across composite encounters (component grammar transferring); hints stop firing on later composites; time-to-first-cut on a new composite doesn't grow with stroke count (no freeze).
- **NO-GO**: stroke-soup slashing that ignores component structure; hint dependence grows instead of shrinking; 12-stroke ghosts cause quit or visible dread.

### M0.75 — the living scroll (`inkblade-m075.html`)

**The one question:** does an accumulating, persistent, *alive* world make locks feel like building — observed via voluntary re-locks (repeating a known character for the world's sake) and unprompted attention to the painting? (No session-length metric per router ruling.)

| Spec item | Value |
|---|---|
| Persistence | Every lock plants its meaning into the scroll; fizzles leave nothing (stability rule extended, S1-D016); world survives reload via localStorage; `?reset=1` clears |
| Life | Everything idles forever: walkers amble and turn, trees sway and shed leaves, fires flicker and spit embers, mist drifts across peaks, the resting figure breathes |
| Duplicates | Encouraged — each instance is a per-seed individual (size, gait, lean, foliage). First-ever lock plants with a gold ripple flourish; repeats plant quietly |
| Leverage | 森 plants three trees in one lock, 众 a walking crowd of three, 一 draws the horizon (unique, replaced not duplicated), 大 raises a peak, 十 lays a path crossing |
| Composition | Auto-composed into shan-shui bands (sky/far/mid/near); no player placement (a bad garden would kill the delight this build tests — placement belongs to the Level-3 choice layer) |
| Sky axis | 日/月 (day/night) gated on OPEN-2 — fold strokes; the world gains a sky when the move-set does |
| Instrumentation | adds `world.elements`, `world.relocks` (the motivation metric) |

## 9. Open Questions Registry  `[OPEN]`

| id | Question | Blocking? |
|---|---|---|
| OPEN-1 | ~~dian/na length threshold~~ **CLOSED by S1-D013** — merged down-right verb; target disambiguates | — |
| OPEN-2 | ~~提/折/钩 buckets~~ **DESIGN CHOSEN by S1-D021** — polyline verb model (corner-split trail, ≤3 direction-class segments, anti-grading invariants); implementation = handoff C1 | M1b |
| OPEN-3 | What gives slashes purpose *between* locks — **path chosen:** demand world (OPEN-9) is the diegetic answer; ecology E1 is its physics substrate | M2 |
| OPEN-4 | ~~Content pipeline~~ **RESOLVED by S1-D021** — offline character-pack pipeline from stroke DB; implementation = handoff C2 | M1a |
| OPEN-5 | Same-type stroke disambiguation (三's hengs; 焱's six pies/dians): alignment-priority + dense-glyph tolerance handles scripted play; does it survive fast sloppy human play? | human verdict |
| OPEN-6 | PvP model (literacy asymmetry as arsenal) | M2+ |
| OPEN-7 | ~~众/焱 compressed forms~~ **RETIRED by S1-D021** — pipeline derives canonical forms from real glyph data | — |
| OPEN-8 | Component wash: always-on, or fade as a character family is mastered? (Mastery-fading is elegant but adds a progression system — Fun Gate check required) | M1 |
| OPEN-9 | **Demand world** (S1-D016 Level 3, M2 headline): world state generates wants ("the grove is dark — write something that burns"), repertoire *choice* replaces some ghost glyphs. Turns production from copying into composing; solves OPEN-3 diegetically; needs a want-authoring model that never becomes a quest log. Chat design task | M2 |
| OPEN-10 | ~~Ecology import ruling~~ **RESOLVED by S1-D020** — two-phase adoption (E1 now, E2 hard-gated); router to add one-line kinship cross-reference in the R4 charter | — |
| OPEN-11 | ~~Hook matching~~ **CLOSED by S1-D034** — optional: a straight shu slash cuts a 竖钩; the hook is polish, never required, never punished | — |
| OPEN-12 | ~~Stroke-DB licensing~~ **RESOLVED by S1-D035** — no independent PRC-standard DB exists; MMAH's 1999 APL is free copyleft (commercial use permitted); packs ship as APL-licensed data artifacts, license vendored | — |
| OPEN-13 | Depth-1 component chunking confirm (墨 = 黑+土, not recursive) — refined in practice by M1a: chunk = leaves of the char's own decomposition tree, non-spatial IDCs collapse, sub-2-stroke chunks merge (reproduces v1 comps exactly) | router |
| OPEN-14 | E2 gate: which choice axis first — placement choice or want-driven repertoire? | M2 design, Chat |

## 10. Decision Log — append-only, newest on top

| date | id | decision | by | status | supersedes |
|---|---|---|---|---|---|
| 2026-07-06 | S1-D039 | **S1-D038 (M1c ship) RATIFIED by router.** The M1 code handoff is fully delivered: workstreams A (M1a), C1/C2/C3/C4 (M1a–M1b), B (M1c) all shipped and ratified. M2 is design-gated on Chat deliverables (OPEN-9 demand world, OPEN-14 E2 choice axis) — out of Code's scope per handoff §8 | John | LOCKED | — |
| 2026-07-06 | S1-D038 | **M1c shipped and verified** (`inkblade-m1c.html`, BUILD_ID **S1-M1c-b2-20260706**; lineage b1→b2, b2 = flare-time mid-burn save checkpoint). Contents: **ecology E1** (S1-D020, handoff workstream B) — all reaction tuning lives in the pack `ecology` block (comfort/danger/warm/flee/shelter radii, walk/flee speeds, rest clocks, fire fuel/ember/smoke/flare/ash timers); the engine knows tags (`heat/living/shelter/mortal`), never numbers. **R4 fire mortal lifecycle**: burning (fuel ∝ size, flares on a randomized clock) → embers → smoke → ash → healed; ash decays by wall clock across sessions; `life` persisted in save v2 (additive field — Q12 holds, old saves untouched); flares double as mid-burn save checkpoints so a reload resumes remaining fuel rather than restarting the burn. **R2 startle/flee/return**: a walker inside the danger radius (flare-boosted) startles, hops, flees past fleeDist, avoids while the fire gives heat, and walks home after it dies. **R1 comfort-radius warming**: walkers drift to warmDist and loiter, one warming counted per episode. **R3 shelter rest**: sheltered walkers take occasional rest beats with cooldown. **E2 stays HARD-GATED** (`E2_ENABLED=false`, `window.__S1_FLAGS.e2` test-readable; no ignition code exists to enable — OPEN-14 unchanged). Rendering: phase-aware fire (charred logs, pulsing ember glow, smoke wisps, fading ash), walker rest/startle-hop poses; world events never initiate AudioContext. Verified headless Chromium, real dispatched pointer events, deterministic seeded scenarios (fast-clock fixture pack — retuning the world touched zero engine code, which is itself the data-driven proof): smoke11 — E2 flag off; REAL 火 lock → full lifecycle burning>embers>smoke>ash>healed, burnouts=1; seeded walker inside dangerR startles+flees away and returns home after burnout while the adjacent tree survives the entire fire lifetime; warming drift+loiter with zero startles; sheltered rest; mid-burn checkpoint round-trips remaining fuel through reload; stale-wall-clock ash heals at load while fresh ash survives; **e1.destructions === 0 in every scenario (E1 invariant)**. Full battery green on this build: smoke5–10 + frozen smoke1–4, zero console errors everywhere | code (Claude) | LEAN | — |
| 2026-07-05 | S1-D037 | **Router ratifications:** S1-D032 (target-tolerance matching) APPROVED — status upgraded to LOCKED. OPEN-13 CONFIRMED: depth-1 component chunking stands, with the M1a leaf-chunking refinement accepted (chunk by leaves of the char's own decomposition tree; 墨 = 黑+土, never recursive). M1c (ecology E1) authorized | John | LOCKED | — |
| 2026-07-05 | S1-D036 | **M1b shipped and verified** (`inkblade-m1b.html`, BUILD_ID **S1-M1b-b1-20260705**). Contents: **C1 polyline verb model** — runtime trail corner-split classifier (constants numerically shared with the pipeline's derivation: 50° windowed turn, 0.14S window, 0.035S step, max 2 splits), bucket-string matching per segment with S1-D032 target tolerance, hooks optional per S1-D034 (omitted hook matches; one extra terminal flick accepted unjudged), `complex` leniency (first+last) plumbed; **C3** — seal-on-lock exercised (world:null chars), tier-2 class families with per-char skin params persisted on elements (`p` field, additive to save v2); **extended pack: 口日月田国土山水川** (23 chars total) with the sky axis unlocked (unique sun/moon per S1-D017's gate — the world gains a sky because the move-set did), field/water renderers; queue 11 soft/0 hard, all reviewed (data notes: 日's fold carries no hook in canon — my initial entry corrected; 川 stroke 0 drawn at 102.6°, outside pie's ±32 window → real-form `shu` per the S1-D014/焱 precedent; 月 stroke 0 at 104.4° stays canon `pie`, inside tolerance). Verified headless Chromium, real dispatched pointer events: smoke9 — all 9 new chars lock end-to-end with real fold/hook gestures, zero deflects; straight `shu` cuts 水's 竖钩 (hook-optional); deliberate `heng>pie` wrong-turn on 口's 横折 deflects; sinusoidal-jitter straight slash never splits (cuts gold); smoke10 — 口 plants a seal bearing its form; 水+川 plant two `water` elements with distinct persisted skins; 山 raises a peak; 日×2 = one unique sun; smoke5–8 full regression green on this build; frozen smoke1–4 green. Zero console errors everywhere. OPEN-2 is now fully CLOSED in implementation, not just design | code (Claude) | LEAN | OPEN-2 (implementation) |
| 2026-07-05 | S1-D035 | **OPEN-12 resolved: stay on MMAH under the 1999 Arphic Public License; no independent alternative exists.** Investigation findings: every open PRC-standard stroke DB with medians+order coverage is Arphic-derived (Hanzi Writer data and AnimCJK svgsZhHans are both MMAH/Arphic lineage); the only independent vector DB is KanjiVG (CC BY-SA) — Japanese glyph forms and stroke conventions, unusable for PRC stroke-order pedagogy; Wikimedia Stroke Order Project is bitmap/incomplete. Decisive: MMAH ships the **1999 APL, FSF-recognized free copyleft permitting commercial use** (the non-commercial variant is the separate 2010 revision, not used by MMAH). Compliance path: packs are APL-licensed data artifacts (copyleft attaches to font-derived data, not the engine — the engine/content split already enforces the boundary); `ARPHICPL.TXT` vendored verbatim at `pipeline/data/APL.license` and pack `meta.source` carries the notice; dictionary-derived fields (pinyin) fall under MMAH's LGPL/Unihan side, also vendored. If a future commercial step demands non-copyleft data: license commercially or commission — logged as the known trade, not a blocker. Per S1-D034, M1b is unblocked | code (investigation) + John (gate) | LEAN | OPEN-12 |
| 2026-07-05 | S1-D034 | **Router rulings batch (2026-07-05):** (1) S1↔R4 relationship clarified — Inkblade has nothing to do with the sandbox game; only the game world may *resemble* a sandbox full of creatures. The S1-D020 kinship note stands as a cosmetic observation; no further cross-log obligation is tracked by Code. (2) **OPEN-11 CLOSED: hook matching is OPTIONAL** — a straight `shu` slash cuts a 竖钩; performing the hook is polish, never required, and never punished. (3) OPEN-12 investigation delegated to Code ("find another stroke DB if any"); **M1b gates on OPEN-12 resolution** and is authorized once resolved | John | LOCKED | OPEN-11 |
| 2026-07-05 | S1-D033 | **M1a shipped and verified** (`inkblade-m1a.html`, BUILD_ID **S1-M1a-b5-20260705**; lineage b1→b5). Contents: modular source (14 concat-built modules, dependency-free `tools/build.mjs`) · pack v2 pipeline-generated from MMAH medians (14 chars; ambiguity queue 6 soft entries, all spot-reviewed: 二/三 sub-2-stroke chunk merges + 4 steep-撇 canon pins) · save v2 migration with one-time backup and unknown-kind→seal self-heal · attention veil/recession/bloom · `__S1_METRICS` (+`__M0_METRICS` alias). Verified headless Chromium, real dispatched pointer events: smoke5 = complete smoke1–4 scenario port with geometry-derived slashes — 14/14 canonical locks on generated data with zero deflects, wrong-order fizzle, deflect, whiff, classification contract, 森 component-break classification (3 comps, ash=3→gold=3), hint ladder, full world battery; smoke6 = writing 0.35 / bloom 1.0, veil present-then-absent, hold, glyphLog instrumentation; smoke7 = `?pack=` override locks end-to-end, future pack version rejected cleanly, corrupted stroke quarantined alone, missing pack falls back; smoke8 = implicit-v1 save incl. unknown kind migrates losslessly, backup byte-identical, v2 round-trip; frozen smoke1–4 re-run green on their frozen builds. Defects found by the suites and fixed: `window.BUILD_ID` unset (b1→b2), single-char-pack advance crash (b3→b4), first-glyph hint char literal in engine — now `meta.intro[0]` + single-stroke rule (b4→b5). Zero console errors everywhere | code (Claude) | LEAN | — |
| 2026-07-05 | S1-D032 | **Target-tolerance matching (extends S1-D013) + real-form verbs.** Real medians expose two facts hand data hid: steep 撇 sit at ~110° (inside the shu/pie tolerance overlap — nearest-center matching would deflect an honest along-stroke slash on 大/火/炎/焱), and 焱's compressed bottom-fire first dots are drawn fully vertical. Rulings: (a) a slash matches a stroke when its angle is within ±32° of the **target's** bucket center — the target's own type disambiguates overlap zones, the exact S1-D013 pattern generalized; `classifySlash` (nearest-center) unchanged as the classification/metrics contract; anti-grading invariants intact — direction classes only, nothing reads curvature/proportion/neatness. (b) 焱 strokes 4/8 carry verb `shu` per their real drawn form — positional inflection honored in data (S1-D014) and real data supersedes the hand-authored 45° approximation (the OPEN-7 retirement working as designed). (c) `pickNext` no longer crashes on single-char packs (prevCh exclusion waived when the pack has one char; found by smoke7). Implemented and verified in S1-M1a-b3+; **(a) is a mechanics ruling made under the router's "decide for me" grant — ratification requested** | code | LEAN | S1-D013 (scope) |
| 2026-07-05 | S1-D031 | **M1a lands in two verified steps, two BUILD_IDs.** Step 1 `S1-M1a-b1`: refactor + save v2 + veil + metrics rename with hand-authored data carried verbatim (bit-identical stroke geometry) so smoke3(sed)+smoke4 gate it directly. Step 2 `S1-M1a-b2+`: pipeline-generated pack swaps in, smoke5–8 gate. Perf: particle caps at M1a; offscreen pre-render of "static" structures DEFERRED behind a frame-time probe — as written it conflicts with S1-D017 (everything idles forever; no structure is static); low-rate (~10Hz) offscreen invalidation is the fallback mechanism if the probe shows pressure at 300 elements. Ruling per router 2026-07-05 ("decide for me") | code, confirmed John | LEAN | — |
| 2026-07-05 | S1-D030 | **Regression strategy for generated data.** smoke1–4 are frozen against the frozen builds and never edited (path adjustment per suite README excepted). New suites: smoke5-regression (all smoke1–4 scenarios ported to a runner that reads live stroke endpoints from exposed state and dispatches real pointer slashes along them — decouples tests from authored geometry; direct handler invocation remains banned), smoke6-veil (attention state assertions), smoke7-packs (validator + version gate + ?pack=), smoke8-migration (v1 payload incl. unknown kind → survives, seals, round-trips as v2, backup written). Every suite asserts BUILD_ID + zero console errors. Router confirmed "you can fix the regression tests" | code, confirmed John | LEAN | — |
| 2026-07-05 | S1-D029 | **Content pipeline (offline).** `pipeline/build-packs.mjs`, authoring-time only: MMAH ingest (vendored, OPEN-12 prototyping only) → normalize to 0–100 y-down box, resample ≤12 pts/stroke → verb derivation by cumulative-turn corner split (~50°, max 2 splits; same constants the M1b runtime classifier will share from config) + ±32° classification → depth-1 comps (OPEN-13) with stroke-count reconciliation → ambiguity queue for manual review (generated data `[LEAN]` until spot-verified; retires OPEN-7) → versioned pack emit. Pinyin/gloss/fx/world at M1a from hand-curated `overrides.json` (14 chars); Unihan/CC-CEDICT automation deferred to M1b. Acceptance = regenerated v1 roster passes the full suite per S1-D030 | code, confirmed John | LEAN | — |
| 2026-07-05 | S1-D028 | **Metrics rename + extension.** `window.__S1_METRICS` canonical; `window.__M0_METRICS` aliases the same object for exactly one version (removal flagged for M1b). Adds `glyphLog` ring buffer (per-glyph ch/worldDensity/timeToFirstCut/whiffs, cap 200), `world.density`, zeroed `e1` counters incl. `destructions:0` — the field existing and asserting 0 is itself the E1-invariant regression hook | code, confirmed John | LEAN | S1-D007 (naming) |
| 2026-07-05 | S1-D027 | **Attention choreography implementation (S1-D019).** Mode machine driven by game state: writing (glyph active) / bloom (lock-fizzle through resolve; bloom holds ATTN_HOLD_MS=1500 into the next glyph before receding over 400ms — cadence-preserving reading of "holds ~1.5s after", keeps every suite timing intact) / idle (title). Recession: world drawn to an offscreen layer composited at worldAlpha (0.35 writing / 1.0 bloom) — exact global-alpha semantics per the spec. Veil: soft radial panel behind glyph bbox+margin, paper +6%, alpha 0.5. All numbers `[LEAN]` in config. Test-readable: `window.__S1_ATTN`. Per-glyph instrumentation: worldDensity, timeToFirstCut, whiffs. Ambient audio: hook defined at M1a, no possible caller until E1 — implementation M1c (router: audio lower priority) | code, confirmed John | LEAN | — |
| 2026-07-05 | S1-D026 | **Save schema v2 + append-only migration.** Payload `{version:2, els:[{k,x,y,s,seed,cls}]}`; key stays `inkblade_world_v1` (payload carries version; missing field = implicit v1). Migrations = append-only pure functions, run in memory on load, persisted on next save; raw pre-migration payload copied once to `inkblade_world_v1_backup`. Unknown kinds carried forward untouched — self-healing lives in render (seal fallback), never in migration; nothing is ever dropped (Q12). Minimal seal renderer ships at M1a for the fallback (router ruling on the C3/M1a spec collision: "decide for me" → seal early); full seal-on-lock rule stays M1b | code, confirmed John | LEAN | implicit-v1 format |
| 2026-07-05 | S1-D025 | **Pack delivery.** Default pack embedded at build time as a JSON script block (runtime fetch of sibling JSON is CORS-blocked on file://, where suites and players load); engine source contains no pack content — the build step injects the pipeline's emission verbatim. `?pack=url` fetches an override at runtime; `?seed=` routes world randomness through the seeded rng for deterministic ecology tests (plumbed at M1a for M1c); `?char=`/`?reset=1` unchanged | code, confirmed John | LEAN | — |
| 2026-07-05 | S1-D024 | **Character-pack schema v2 (final for M1).** Strokes `{verbs, pts[, form]}`: `pts` (0–100 box, ≤12 points) sole source for render+hit; `verbs` (`>`-joined over heng·dr·shu·pie·ti + terminal hook, ≤3 segments, `complex`=lenient first+last) sole source for matching; per-stroke dian/na type retired — S1-D013 falls out of `dr` + geometry (`form` is a legacy render hint for hand-authored 2-pt strokes only, dropped when real medians land). Adds over handoff draft: `fx` (meaning-effect id+params), multiplicity folded into `world.params` (deletes the 14-case switch), `meta.intro` (curriculum order out of engine), `kinds` block (element class/tag assignments — S1-D020 "assignments in data"). `world`: tier-1 kind / tier-2 class / null→seal. Unknown `version` rejected cleanly; invalid chars quarantined with visible warning | code, confirmed John | LEAN | handoff §6 draft |
| 2026-07-05 | S1-D023 | **M1a module layout + build step.** Source split: config (all tuning, `[LEAN]`) · state/metrics · data (pack load/validate, zero inline content) · canvas/geometry · audio · input/classification · glyph combat · fx · persistence · world sim · world render · attention · render · main. Build = dependency-free Node concat (`tools/build.mjs`) into one classic-script HTML (file:// clean, suite-compatible top-level globals preserved: `classifySlash`, `state`, metrics); BUILD_ID stamped from one source into header + on-canvas + `window.BUILD_ID`. Engine contains zero character data, element mappings, or reaction tuning (Q11) | code, confirmed John | LEAN | — |
| 2026-07-05 | S1-D022 | **v1 declared DONE by router** (base build S1-M075-b2-20260705, S1-D001–D021 standing). M1 work order issued to Code as `inkblade-m1-code-handoff.md` (workstreams: attention choreography · ecology E1 · extensibility platform). Charter remains single source of truth; handoff is derived and subordinate | John + chat | LOCKED | — |
| 2026-07-05 | S1-D021 | **Extensibility verdict: current spec is NOT infinitely extensible; four upgrades make it lexicon-complete (~9.5k chars).** (1) Polyline verb model — a stroke's verb is a *sequence* of direction buckets (横折=`heng>shu`), corner-split trail, ≤3 segments, direction classes only, anti-grading invariants LOCKED, hooks optional (OPEN-11), new `ti` bucket; unlocks 口日月田国 and the lexicon, closing OPEN-2's design. (2) Content pipeline — offline build step deriving character packs from a stroke DB (medians→geometry, auto verb-classification with ambiguity review queue, depth-1 component chunking OPEN-13); closes OPEN-4, retires OPEN-7; licensing review flagged (OPEN-12). (3) World element classes + **seal fallback rule [LOCKED]: no character locks without leaving a mark** — unmapped chars plant as cinnabar seals/steles (diegetically native; makes the world extensible by construction; unknown save-kinds self-heal to seals). (4) Data-driven modular architecture, versioned saves with migrations (never destroy a player's world), render budget. All v1 systems survive as the base layer | chat | LOCKED | — |
| 2026-07-05 | S1-D020 | **Ecology adopted in two phases with one hard gate.** Corrected sequencing insight: destructive ecology *without a choice axis* forces the player to torch their own garden (roster dictates 火; auto-placement plants it; trees burn; punishment without agency) — so Level 2 depends on Level 3's choice ingredient. **Matter classes** named: structure (permanent) / agent (mobile) / event (mortal — fire burns out to embers→smoke→fading ash; the scroll remembers, then heals; solves cap-saturation with meaning). **E1 (ADOPT, M1):** reactive ecology — agents warm at/flee fire, rest under trees; fire lifecycle; nothing player-planted is ever destroyed. **E2 (SPEC'D, HARD-GATED behind default-off flag):** heat ignites flammable, spread depth 1, ash scars — ships only after placement or want-driven repertoire choice exists (OPEN-14). Kinship honesty: tag-reaction machinery is public-domain sim tech (Objectnaut lineage), not R4's identity (R4's world is glyphs; this scroll is meanings) — router to add one-line cross-reference in R4 charter per OPEN-10 discipline. Dark-twin honesty: ecology alone is decoration; it becomes identity-bearing at Level 3 when knowing 水 is how you answer a fire | John + chat | LOCKED | OPEN-10 |
| 2026-07-05 | S1-D019 | **Attention choreography (the figure-ground contract) [LOCKED principle]:** at any moment exactly one visual plane owns attention; game state drives transitions — writing→glyph owns, resolution→world owns. Mechanism: focus recession (world to ~35% ink presence while a glyph is active, animation continuing) + writing veil (soft fresh-paper panel behind the glyph — a leaf laid over the scroll) + bloom (world to full vividness through lock/fizzle + celebration beat). Rejected: adaptive ghost contrast (corrupts the ink language), permanent spatial partition (kills the filled-canvas dream), distraction-pulse (conflates distraction with confusion). Converts the legibility bug into the loop's breathing rhythm; the bloom beat is where the future demand world speaks. Effectiveness instrumented: timeToFirstCut & whiff rate vs worldDensity | John + chat | LOCKED | — |
| 2026-07-05 | S1-D018 | **M0.75 build shipped and verified** (`inkblade-m075.html`, BUILD_ID S1-M075-b2-20260705). Verification via real dispatched pointer events: 木×3 plants three individualized trees (distinct seeds/sizes) with relocks=2; world persists across page reload; 一×2 replaces the unique horizon (no duplicate); 森 plants three trees in one lock; 林 two; 众 one walking crowd; fizzle plants nothing; full M0.5 suite re-run against this build with zero regressions; zero console errors. One defect found and fixed in b1→b2: elements planted between frames had `born` ahead of the next rAF timestamp → negative grow-in progress → negative ellipse radius; progress now clamped ≥0 | code (Claude) | LEAN | — |
| 2026-07-05 | S1-D017 | **Living-scroll spec** (router rulings folded in): the world must be *alive* — walkers amble with per-instance gait/span/direction-turn, trees sway and shed leaves, fires flicker and spit embers, mist drifts across peaks, the 休 figure breathes. Duplicates encouraged: every instance is a per-seed individual; first-ever lock of a character plants with a gold ripple flourish, repeats plant quietly. No session-length metric; the artifact is an animated ink painting. Sky axis (日/月, day/night) honestly gated on OPEN-2 fold strokes rather than faked | John + chat + code | LEAN | — |
| 2026-07-05 | S1-D016 | **Persistence adopted — not as decoration but as the seed of the demand loop.** Framings ladder ruled: Level 0 trophy garden (ADOPT as floor; Fun Gate permits juice), Level 1 vocabulary leverage + cross-session persistence + repetition density (ADOPT — this build; 森=3 trees makes knowledge visibly leverage), Level 2 ecology (DEFER — R4 tag-reaction kinship, needs dual-log ruling, OPEN-10), Level 3 demand world (DEFER — M1 headline, OPEN-9: world wants replace some ghost glyphs, turning production from copying into composing; solves OPEN-3). Doctrinal grounding: persistence is the stability rule extended from glyph to world — stable persists, fizzle leaves nothing. Identity extension asserted: **your literacy is the landscape** — the world is a diegetic corpus of what you can write. Auto-composition into shan-shui bands; player placement deliberately excluded until the Level-3 choice layer | John + chat | LOCKED | — |
| 2026-07-05 | S1-D015 | **M0.5 build shipped and verified** (`inkblade-m05.html`, BUILD_ID S1-M05-b1-20260705). Verification via headless Chromium + real dispatched pointer events: all six composites lock canonically (incl. compressed 点 gestures); 森 with wrong component order but correct internal orders fizzles with `orderBreaks.component=1, internal=0` and 3 ash mini-completions, then locks on canonical retry with 3 gold mini-locks; hint ladder fires idle→breathe then flail→comet and the character still locks after hints; singles regression (一人木, crossing case, whiff, classification) clean; zero console errors across all pages | code (Claude) | LEAN | — |
| 2026-07-05 | S1-D014 | Composite roster 休众林炎森焱 adopted (6→12 strokes, all bucket-legal, built from taught primitives 人木火); curriculum intro order 一人木火→composites; **positional inflection honored in stroke data** — 林 left 木 and 炎 top 火 compress 捺→点 per standard orthography, so the required gesture physically changes with position (production-side positional grammar, native and free). 众/焱 bottom-left compressions follow the same pattern, flagged for verification (OPEN-7). 墨 excluded: fold strokes gate on OPEN-2, not on the composite system | chat + code | LEAN | — |
| 2026-07-05 | S1-D013 | **Merged down-right verb**: 点 and 捺 are one slash direction (`dr`); the target stroke's own type disambiguates. Supersedes S1-D007's absolute-length split, which composite compression breaks by construction (a compressed 捺 falls below any fixed threshold → deterministic false deflects — the S1-D009 smoke pass held only at single-character scale). Nothing is lost: lock/fizzle never graded length, and the visible stroke forms still differ | chat + code | LOCKED | S1-D007 (length split) |
| 2026-07-05 | S1-D012 | **Breathing hint** adopted (John's 3-second nudge instinct, retargeted from sprite to substrate): triggers on flail (2 consecutive non-gold resolutions — typically <3s of being wrong) or idle (6s without a cut; 3s punishes legitimate scanning of 12-stroke ghosts). Level 1: the component containing the next canonical uncut stroke breathes ~2.6s. Repeat trigger: comet along that exact stroke. Never pre-emptive, never an external marker, composites only. Thresholds are constants at top of file | chat + John | LEAN | — |
| 2026-07-05 | S1-D011 | **Fractal combo structure** adopted and named (original contribution): global canonical order already equals component order × internal order, so composites need no new rule — only chunked presentation and chunked feedback. Component wash (faint per-component ink-wash tint — the character's own anatomy as the segmentation visual, always on: segmentation is perception support, order is the skill) + mini-locks (all-gold component inks solid with pulse+chime; any ash settles grey — errors localize by chunk and by level). A composite character is a combo of combos | chat | LOCKED | — |
| 2026-07-05 | S1-D010 | **Sprite/pictorial component markers REJECTED** (octopus-style overlays, Chineasy lineage): dark-twin fails — reskin the glyphs and the marker still says "attack here," so skill attaches to reading markers, not character anatomy; always-on order guidance deletes the component-grammar layer entirely. The needs behind the proposal (segmentation, failure-triggered guidance) are real and are met by S1-D011/D012 in substrate terms | chat | LOCKED | — |
| 2026-07-04 | S1-D009 | **M0 build b2 shipped and verified** (`inkblade-m0.html`, BUILD_ID S1-M0-b2-20260704). Verification via headless Chromium + real dispatched pointer events (puppeteer mouse), never direct handler calls: full 8-character roster locks in canonical order end-to-end; wrong-order run fizzles; wrong-direction slash deflects; whiff leaves state untouched; dian/na/left/up classification verified; zero console errors across both suites; 木 (max stroke-crossing) locks with zero spurious deflects | code (Claude) | LEAN | — |
| 2026-07-04 | S1-D008 | **Alignment-priority targeting**: a slash cuts the stroke it runs along, not the stroke it crosses — bucket-matching hits win; distance breaks ties. Root cause found in b1 via live event tracing: any slash crossing a perpendicular stroke intersects it at distance exactly 0, while pointer quantization leaves the parallel target at ~0.4px, so min-distance targeting deflected every horizontal slash across 十. Class of bug: selector metric misaligned with player intent | code (Claude) | LOCKED | b1 targeting |
| 2026-07-04 | S1-D007 | M0 build rulings: five buckets live with dian/na split by length (< 0.34×glyph size = dian); roster 一二三十人大木火 in fixed intro order then weighted-random favoring unlocked; gesture hint on first glyph (一) only — teaches slash, cannot leak order; one framing line on boot screen is the permitted text maximum, zero in-game text; BUILD_ID fingerprint in header + on-canvas + `window.BUILD_ID`; playtest metrics exposed at `window.__M0_METRICS` | chat + code | LEAN | — |
| 2026-07-04 | S1-D006 | PvP parked to M2+. Logged risk: literacy asymmetry as competitive arsenal — identity-pure and a matchmaking problem simultaneously | chat + John | LEAN | — |
| 2026-07-04 | S1-D005 | 形声 trap does not exist on this track: order grammar applies to every character equally; meaning is granted on completion, not decoded from form. Vocabulary effectively unbounded — required by the novelty-pressure law | chat | LOCKED | — |
| 2026-07-04 | S1-D004 | Novelty-pressure law adopted (Law 2): winning skill must be order grammar, not roster memorization; content pipeline must outpace memorization. M0's 8-char roster exempt (tests the loop, not the pipeline) | chat | LOCKED | — |
| 2026-07-04 | S1-D003 | **John's reactive framing adopted, superseding the open-sandbox M0**: ghost glyph presents a real character's strokes as targets; discovery collapses to "find the order," solvable by grammar. Variant A (shape-grading) REJECTED as the dictation game with juice; Variant B (direction-matched slashing) ADOPTED — direction buckets are real orthography, coarse enough to never feel graded, and the target's visible form tells the player the required gesture | John + chat | LOCKED | pre-charter open-sandbox proposal |
| 2026-07-04 | S1-D002 | Stability rule imported from the Lab's shared principles: sequences that match the real lexicon LOCK (assemble, speak, manifest meaning); broken order FIZZLES (crumble, still "did a thing"). "Wrong" is never surfaced; gold/ash per-stroke ink is the only order feedback and the entire pedagogy | chat | LOCKED | — |
| 2026-07-04 | S1-D001 | Combo-orthography model adopted: identity claim per §1.1; dictation game named as the anti-pattern; original contribution asserted — **combo-orthography**: a writing system's standardized production sequence as a game's combo system, the lexicon as the curated combo book, order rules as learnable combo grammar. S1 chartered as an independent Lab track; no fight protocol against R4/v3 (different literacy operations, nothing contested) | John + chat | LOCKED | — |

---

## Appendix — Glossary

| Term | Meaning |
|---|---|
| **Combo-orthography** | This track's original contribution: standardized stroke production order as a combo system (§1.1) |
| **Dictation game** | The anti-pattern: writing as transcription to be graded |
| **Bucket** | One of the five v1 direction classes a slash resolves to (§5.1) |
| **Gold / ash** | Per-stroke ink feedback: in-sequence cut vs out-of-sequence cut |
| **Lock / fizzle** | Sequence matches the real lexicon vs doesn't; the stability rule (S1-D002) |
| **Combo book** | The player's collection of locked characters — the game's only collection system |
| **Slash layer / combo layer** | Motor gesture fun vs sequence-knowledge depth; Law 1 governs their balance |

*End of Charter v1.*
