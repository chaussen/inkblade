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

## Planned
### M2a — E2 ignition (OPEN-14 axis: Code designs now, per S1-D040) — NEXT
- Recommended axis: **placement choice** — the player chooses *where* the world-mark lands (e.g. slash direction/position at lock nudges the planting spot), making "fire next to the dry grove" a chosen act before ignition ever unlocks. Want-driven repertoire deferred to M2b.
- Then E2: heat + flammable adjacency → ignition, behind the existing `E2_ENABLED` gate flipped only when the choice axis ships. Player-planted matter must remain protected by an explicit consent rule to preserve the E1 no-destruction covenant (design note: burnt tree = transformed, never deleted — regrows).
- Regrowth pairs with it: ash → sprout → sapling (the scroll's answer to fire; additive lifecycle).

### M2b — demand world (OPEN-9)
- World state generates wants ("the grove is dark — write something that burns"); repertoire choice replaces some ghost glyphs. Needs want-authoring model that never becomes a quest log. Solves OPEN-3 diegetically.

### Backlog (unscheduled)
- OPEN-15 move-set ruling: flat-撇 (平撇, ~170°) — widen pie as real-form grace (S1-D032 amendment at derive AND match), a 6th bucket, or keep dropping 看手系反笑爱委乎. Restores 8 top-frequency chars.
- Radical map growth: 口讠扌辶纟宀 etc. unmapped (378/500 are seals today) — each new family renderer + radicalClasses row converts dozens of seals into scenery.
- Audio pass (palette beyond crackle/startle; John ruled lower priority).
- Real-device mobile perf measurement (headless 300@60fps logged S1-D042; pre-render only if a device breaches).
- Day/night from sun/moon presence; weather as events.
- PvP (parked M2+, S1-D006 — literacy asymmetry risk logged).
