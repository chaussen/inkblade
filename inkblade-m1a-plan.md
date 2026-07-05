# Inkblade — M1a Implementation Plan (proposal, pre-code)

**From:** Code (Claude) · **To:** John (router) · **Date:** 2026-07-05
**Base:** `inkblade-m075.html` BUILD_ID S1-M075-b2-20260705 · **Authority:** `inkblade-charter-v1.md`; work order `inkblade-m1-code-handoff.md` §10.
**Status of everything below: PROPOSAL.** Nothing is real until you confirm and append to the charter log. IDs continue from S1-D022. Each row in §1 is a binary confirm; §2 lists flags requiring a ruling or action from you; §3–§6 are the appendices the rows reference.

No code has been written. No BUILD_ID has been consumed.

> **STATUS 2026-07-05 (end of day): EXECUTED.** All nine proposals confirmed by
> the router and logged in the charter (S1-D023–D031); implementation shipped
> and verified as S1-M1a-b5-20260705 (charter S1-D032/D033). Flag outcomes:
> F1 resolved (lineage files delivered; full smoke1–4 baseline re-verified).
> F3 executed as proposed (smoke5 geometry-derived port). F4 ruled by router
> ("decide") → minimal seal renderer shipped at M1a. F5 ruled (audio lower
> priority) → hook only, `sfxWorldCue`, implementation M1c. F6 → curated
> overrides.json shipped. F7 ruled ("decide") → pre-render deferred behind
> the frame-time probe (`__S1_METRICS.perf`). F2 and F8 remain with the
> router (R4 kinship cross-log; OPEN-11/12/13 rulings — note OPEN-13's
> depth-1 reading was refined in practice: chunk by the leaves of the
> character's own decomposition tree, which reproduces v1 comps exactly).

---

## 1. Decision-log-ready entries (confirm each independently)

| date | id | decision (proposed) | by | status sought | supersedes |
|---|---|---|---|---|---|
| 2026-07-05 | S1-D023 | **M1a module layout + single-file build step.** Source split per handoff C4 into `src/`: `config.js` (all tuning constants, `[LEAN]` numbers only), `input.js` (pointer capture, trail, bucket classification), `combat.js` (glyph state, alignment-priority targeting, cut/deflect/lock/fizzle, comps, hints), `attention.js` (workstream-A state machine), `world/sim.js` + `world/render.js`, `render.js` (paper, glyph, trails, particles, HUD), `data.js` (pack load + validate — zero inline content), `persist.js` (versioned saves + migrations), `metrics.js`, `main.js` (boot + rAF loop). Build = dependency-free Node script `tools/build.mjs` concatenating modules in fixed order into one HTML file (deliverable stays single-file); build script stamps BUILD_ID into header comment, `window.BUILD_ID`, and the on-canvas draw from one source of truth. Engine contains zero character data, zero element mappings, zero reaction tuning (Q11). Layout detail: §3 | code | LEAN | — |
| 2026-07-05 | S1-D024 | **Final character-pack schema (format version 2).** Refines handoff C2 draft with three additions the current game needs and the draft omits: (1) `fx` — the lock meaning-effect id + params (content, must leave engine); (2) multiplicity folded into `world.params` (森 = `{kind:'tree', params:{count:3}}` — deletes the 14-case switch); (3) `meta.intro` — curriculum order (currently a hardcoded `INTRO` array in engine = content in code). Strokes: `{ verbs:'heng>shu', pts:[[x,y],…] }` — `pts` (0–100 box, y down, resampled ≤12 points) are the sole geometry source for render + hit; `verbs` (a `>`-joined string over `heng·dr·shu·pie·ti` + terminal `hook`, ≤3 segments, `complex:true` = match first+last only) the sole matching source; per-stroke `t` (dian/na) retired — S1-D013 disambiguation now falls out of `verbs`=`dr` + real median geometry. `comps`: `{ range:[s,e], layout:'⿰', ch:'木' }`, depth-1 (OPEN-13). `world`: `{tier:1, kind, params}` \| `{tier:2, class, params}` \| `null`→seal — tier-2 shape defined now so M1b needs no format bump. Unknown `version` → rejected cleanly. Full schema + example: §4 | code | LEAN | draft in handoff §6 |
| 2026-07-05 | S1-D025 | **Pack delivery: default pack embedded at build time; `?pack=` fetches an override.** Suites and players load via `file://`, where `fetch()` of a sibling JSON is blocked (CORS), so a runtime-fetched default pack is infeasible. The build script injects the pipeline-emitted JSON verbatim as a `<script type="application/json" id="pack-default">` block — still data, not engine code (engine never contains it in source; the pipeline emits it; the build step carries it). `?pack=url` fetches a replacement pack at runtime for dev/testing over http. `?char=` and `?reset=1` unchanged; `?seed=` added (routes all world randomness through the existing `rng(seed)` for deterministic M1c ecology tests — plumbing lands at M1a while the refactor has the world sim open) | code | LEAN | — |
| 2026-07-05 | S1-D026 | **Save schema v2 + append-only migration.** v2 payload `{ version:2, els:[{k,x,y,s,seed, cls}] }` — adds `cls` (structure/agent/event per S1-D020) now and reserves `life` (event lifecycle: fuel/phase/timestamp) for M1c. Key stays `inkblade_world_v1` (name is historical; payload carries the version); missing `version` field = implicit v1. Migration = append-only pure functions `migrate[1]→2, …`, run in memory on load, persisted on next save; the pre-migration raw payload is copied once to `inkblade_world_v1_backup` before first v2 write. Unknown kinds are **carried forward untouched** (never dropped, never rewritten) and the renderer falls back per C3 — self-healing lives in render, not in the migration, so no information is ever destroyed (Q12). Requires a minimal seal renderer at M1a (flag F4). Sketch: §5 | code | LEAN | implicit-v1 save format |
| 2026-07-05 | S1-D027 | **Attention choreography implementation (workstream A, S1-D019).** State machine `attention.mode ∈ {writing, bloom}` driven purely by game state: glyph active→writing; lock/fizzle begins→bloom (veil fades, world eases 0.35→1.0 over 400ms, holds through resolve + 1500ms); next glyph appears→writing. Title screen = world owns (×1.0). Recession = one `globalAlpha` multiplier around the world draw pass. Veil = soft-edged panel behind glyph bbox+margin (paper tone +6% brightness, alpha 0.5, radial soft edges), drawn between world and glyph. All five numbers are `[LEAN]` constants in `config.js` (RECESSION 0.35 · VEIL_ALPHA 0.5 · VEIL_BRIGHT +6% · BLOOM_MS 400 · BLOOM_HOLD_MS 1500). Test-readable state exposed at `window.__S1_ATTN = {mode, worldAlpha, veilAlpha}`. Instrumentation per handoff: per-glyph ring buffer (last 200) `{ch, worldDensity:{total, overGlyphBbox}, timeToFirstCutMs, whiffs}`. Ambient-audio-cue item: the routing hook (worldEvent→soft cue) is defined at M1a but has no callers until E1 exists — implementation lands M1c (flag F5) | code | LEAN | — |
| 2026-07-05 | S1-D028 | **Metrics rename + extension.** `window.__S1_METRICS` becomes the canonical object; `window.__M0_METRICS` aliases the same object for exactly one version (removal noted for M1b) so smoke1–4 pass unmodified. Adds: `glyphLog` ring buffer (per S1-D027), `world.density`, and zeroed E1 counter fields (`e1:{startles, warmings, rests, burnouts, destructions:0}`) so M1c changes data, not shape — `destructions` existing and asserting 0 is itself the E1-invariant regression hook | code | LEAN | `__M0_METRICS` naming (S1-D007) |
| 2026-07-05 | S1-D029 | **Content pipeline (offline, `pipeline/build-packs.mjs`).** Node script, authoring-time only, never at runtime. Stages per handoff C2: ingest MMAH medians+order+decomposition (data vendored locally, licensing = OPEN-12, prototyping only) → normalize MMAH 1024-box/y-up → game 0–100/y-down, RDP-resample ≤12 pts/stroke → verb derivation via cumulative-turn corner split (~50° within short window, max 2 splits — **the same constants the runtime classifier will use at M1b, shared from one config**) + ±32° segment classification → depth-1 comps from decomposition with stroke-count reconciliation → validation: unreconciled or uncertain entries go to `queue.json` for manual review (generated data is `[LEAN]` until spot-verified; retires OPEN-7) → emit versioned pack. **Pinyin/gloss/fx/world at M1a come from a hand-curated `overrides.json` merged at emit** (14 chars; full Unihan/CC-CEDICT ingestion deferred to M1b when packs grow — flag F6). Acceptance = the v1 roster regenerated through the pipeline passes the full regression suite (see S1-D030 for what "the suite" means against generated geometry) | code | LEAN | — |
| 2026-07-05 | S1-D030 | **Test plan / regression-suite extension.** (a) smoke1–4 are frozen against the frozen builds they target — never edited, never deleted. (b) New `smoke5-regression.js`: the complete smoke1–4 scenario set ported to a data-driven runner that reads the live glyph's stroke endpoints from exposed state (`window.__S1_GLYPH` geometry) and dispatches **real pointer slashes** along them — this is required because smoke1–4 hardcode screen coordinates derived from hand-authored geometry, and pipeline-generated medians will differ by a few units (flag F3; the ban is on direct handler invocation, which this does not touch — events remain real dispatched pointer events). (c) New `smoke6-veil.js`: `__S1_ATTN.worldAlpha` ≈0.35 during writing, ≈1.0 during bloom; veil present in play, absent in bloom; zero console errors. (d) New `smoke7-packs.js`: corrupted stroke rejected by validator; unknown pack version rejected cleanly; `?pack=` override loads. (e) New `smoke8-migration.js`: seed localStorage with a v1 payload including an unknown kind → all elements survive load, unknown kind renders as seal, payload round-trips as v2, backup key written, `?reset=1` still clears. Every suite asserts BUILD_ID and zero console errors. M1a gate = smoke3(sed)+smoke4 green on the refactor step AND smoke5–8 green on the generated-data step | code | LEAN | — |
| 2026-07-05 | S1-D031 | **M1a lands in two verified steps (two BUILD_IDs).** Step 1 `S1-M1a-b1`: pure refactor — modules + build script + save v2 migration + attention veil + metrics rename, **hand-authored data carried verbatim as a legacy-format pack** so geometry is bit-identical and smoke3(sed)+smoke4 pass against it directly (proves the refactor changed structure, not behavior). Step 2 `S1-M1a-b2+`: pipeline-generated pack swaps in; smoke5–8 become the verification base. Performance row of C4: particle caps land at M1a; **offscreen pre-render of static structures is deferred to a measured need** — as literally specified it conflicts with S1-D017 ("everything idles forever": trees sway, mist drifts — structures are animated), so at M1a I add a frame-time probe to metrics instead, and propose low-rate offscreen invalidation (~10Hz) as the M1b/M1c mechanism if the probe shows budget pressure at 300 elements (flag F7) | code | LEAN | — |

---

## 2. Flags — ambiguities, infeasibilities, reminders (need your action or ruling)

| id | flag | needs |
|---|---|---|
| F1 | **Missing lineage files.** `inkblade-m0.html` and `inkblade-m05.html` were listed as attached but are not in the working directory. smoke1/smoke2 target m0; smoke3 targets m05 (README permits sed→m075). Until provided, my pre-change baseline verification is smoke3(sed)+smoke4 against m075 only. | send files, or confirm reduced baseline |
| F2 | **R4 cross-log reminder (handoff §4 requires this in my first deliverable):** adopting the tag-reaction pattern requires you to add the one-line kinship cross-reference entry in the R4 charter per S1-D020/OPEN-10. | router action |
| F3 | **Suite coordinates are coupled to hand-authored geometry.** smoke1–4 slash at hardcoded pixels (e.g. 一's heng at y=52). Generated medians will move strokes by a few units; dense glyphs use 0.7× tolerance, so silent flakiness is guaranteed if I rerun them verbatim on generated data. S1-D030(b) is the fix; confirming S1-D030 confirms this interpretation of "full v1 regression suite green on generated data". | binary confirm (in S1-D030) |
| F4 | **Migration spec needs a seal renderer one milestone early.** Handoff C4 says unknown kinds → seal at M1a, but the seal element is a C3/M1b deliverable. Proposal: minimal cinnabar-seal renderer ships at M1a solely as the unknown-kind fallback (Q12 requires it to be visible, not just non-crashing); the full seal-fallback-on-lock rule stays M1b. Alternative: unknown kinds invisible-but-preserved until M1b. | binary confirm (in S1-D026) |
| F5 | **Ambient audio cues (workstream A) have no possible trigger at M1a** — the world has no events until E1 (M1c). Hook interface defined now, implementation M1c. | binary confirm (in S1-D027) |
| F6 | **Pinyin/gloss source at M1a:** curated `overrides.json` for the 14-char roster vs full Unihan/CC-CEDICT ingestion now. Recommend curated now, automate at M1b — the M1a acceptance case doesn't exercise gloss extraction. | binary confirm (in S1-D029) |
| F7 | **"Static structures pre-rendered" contradicts "everything idles forever" (S1-D017)** as literally written — no structure is static. Deferral + frame-time probe proposed in S1-D031. | binary confirm (in S1-D031) |
| F8 | **OPEN-13 (depth-1 chunking) gates the pipeline comps stage** — please rule before Step 2 emits packs. Note the v1 composites already conform (林 = 木+木 at depth 1). OPEN-12 (MMAH/Arphic licensing) stands: pipeline vendors MMAH for prototyping only; re-flagging per handoff before any commercial step. OPEN-11 (hooks optional) is M1b, not blocking M1a; the schema reserves the `hook` token either way. | router rulings (existing OPENs) |

---

## 3. Module layout (backs S1-D023)

```
inkblade/
  src/
    config.js          # every tuning constant, [LEAN], one place (hint, attention, tol, caps, corner-split)
    metrics.js         # __S1_METRICS + __M0_METRICS alias; glyphLog ring buffer
    input.js           # pointer capture, trail building, classifySlash (bucket / bucket-string at M1b)
    combat.js          # glyph state machine, targeting (S1-D008), cut/deflect/lock/fizzle, comps, hints (S1-D012)
    attention.js       # writing/bloom state machine, worldAlpha easing, veil geometry (S1-D019)
    world/sim.js       # element records, placement bands, uniqueness, caps, seeded rng, save hooks
    world/render.js    # per-kind draw registry (data-driven; seal fallback entry); NO kind switch in sim
    render.js          # paper texture, glyph draw, trails, particles, HUD, title
    data.js            # pack parse + validate + version gate; overrides merge; NO inline content
    persist.js         # load/save, migrate[] chain, backup-once, ?reset=1
    main.js            # boot, resize, rAF loop, URL params (?char ?pack ?seed ?reset)
  packs/core.json      # pipeline output (step 2); legacy-format carry (step 1)
  pipeline/build-packs.mjs   # offline only; + overrides.json, queue.json
  tools/build.mjs      # concat src → single inkblade-m1a.html; stamps BUILD_ID; injects pack
  tests/               # smoke.js..smoke4.js (frozen) + smoke5..smoke8 + helpers.js (slashStroke)
```

Concatenation order = the list order above; each module is an IIFE-free plain script sharing one `Ink` namespace object (no ES-module loader, so `file://` stays clean and the built file matches the current single-`<script>` shape).

## 4. Pack schema v2 — full form (backs S1-D024)

```jsonc
{
  "version": 2,
  "meta": {
    "id": "core", "generated": "2026-07-05",
    "source": "mmah@<commit>",          // provenance; license note per OPEN-12
    "intro": ["一","人","木","火","休","众","林","炎","森","焱"]   // curriculum order (content, not code)
  },
  "chars": [{
    "ch": "森", "pinyin": "sēn", "gloss": "forest", "freq": 1122,
    "fx": { "type": "tree", "n": 3 },              // lock meaning-effect (engine has fx primitives; mapping is data)
    "strokes": [
      { "verbs": "heng", "pts": [[30,18],[70,18]] },
      { "verbs": "shu",  "pts": [[50,4],[50,44]] }
      // M1b examples: { "verbs": "heng>shu", ... }  { "verbs": "shu>hook", ... }  { "verbs": "...", "complex": true }
    ],
    "comps": [ { "range": [0,3], "layout": "⿱", "ch": "木" },
               { "range": [4,7], "layout": "⿰", "ch": "木" },
               { "range": [8,11], "layout": "⿰", "ch": "木" } ],
    "world": { "tier": 1, "kind": "tree", "params": { "count": 3 } }   // or {"tier":2,"class":...} or null → seal
  }]
}
```

Validation gates (data.js): known `version` only; every `verbs` token ∈ {heng, dr, shu, pie, ti, hook}; ≤3 segments unless `complex`; `pts` length ≥2, all in [0,100]; comps ranges contiguous, non-overlapping, covering [0, n-1]; `world.tier` ∈ {1,2} with matching kind/class, or null. Any failure → char quarantined with console-visible (non-error-level) report; pack-level failure → clean rejection, engine falls back to embedded default.

Anti-grading audit (charter §7 Q1, handoff §9): `pts` are used for rendering and hit-distance only; nothing reads curvature, segment length ratios, corner sharpness, or proportion. The words do not appear in the codebase.

## 5. Migration sketch (backs S1-D026)

```js
// persist.js — append-only; never edit an existing migration
const migrate = {
  1: (d) => ({            // implicit v1: { els:[{k,x,y,s,seed}] }, no version field
    version: 2,
    els: (d.els || []).map(e => ({ ...e, cls: CLASS_OF[e.k] ?? null }))
    //          ^ unknown kind: cls null, k preserved verbatim → renderer seal-fallback (C3)
  })
};
```
`CLASS_OF` (kind→structure/agent/event) ships in world data, not engine. Load path: read key → detect version (`d.version ?? 1`) → chain migrations → run. First time a v1 payload is seen: raw string copied to `inkblade_world_v1_backup` before any v2 write. `?reset=1` clears the live key only (backup retained).

## 6. M1a exit checklist (gate restated, measurable)

1. Step-1 build: smoke3(sed→new file)+smoke4 green, zero console errors, byte-identical CHAR geometry. (+ smoke1/2 if F1 resolved.)
2. Step-2 build: smoke5-regression (all smoke1–4 scenarios, geometry-derived, real pointer events) + smoke6-veil + smoke7-packs + smoke8-migration green on pipeline-generated data.
3. Veil measurably alters world alpha (smoke6 asserts the two numbers differ per S1-D027 constants).
4. A live m075 `inkblade_world_v1` save loads with every element present; backup written; unknown-kind seal verified (smoke8).
5. `pipeline/queue.json` for the 14-char roster is empty or fully reviewed (generated data spot-verified before `[LEAN]` claim).
6. Charter §7 ten questions + Q11/Q12 + handoff §9 red-flag grep pass on the diff.
7. BUILD_ID `S1-M1a-b#` in header + on-canvas + `window.BUILD_ID`, bumped on every edit.

*End of M1a plan proposal. Awaiting binary confirms on S1-D023…S1-D031 and rulings on F1–F8.*
