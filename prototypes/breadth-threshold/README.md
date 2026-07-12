# Pure-Emergence Breadth-Threshold Experiment

Tests whether a pure-emergence world (real E1/E2 ecology, zero want-signal,
zero purpose apparatus) sustains engagement through breadth of interaction
alone — and if so, how much breadth is actually needed. Companion to the
`prototypes/want-signal/` track, not a replacement for it: this asks "do we
even need a want-signal," the other asks "if we do, what should it look
like." Both stay open until a human plays enough of either to answer.

**A note on where this brief came from.** The brief this was built from cited
decision IDs (S1-D034 "Ornament Exemption," S1-D035 "pure emergence
CONDITIONAL GO," S1-D036 "want-signal retired") that don't exist anywhere in
the real charter — checked directly, zero hits for "emergence," "Ornament
Exemption," or "Option 1." The real S1-D034–037 are shipped M1-era
orthography/pipeline decisions with no connection to this topic, and the
premise (want-signal work "retired") is flatly contradicted by
`prototypes/want-signal/` existing and being actively worked this same
session. This was built as a **fresh, standalone experiment on its own
merits** — the underlying question (does breadth alone sustain engagement?)
is a reasonable thing to want to know — logged under a real, currently-free
decision ID, not as the resolution of a decision that never happened.

## What this is, mechanically

`inkblade-breadth-experiment.html` is the shipped game
(`inkblade-m2g.html`, byte-identical fork) with one additive script
appended at the end. Nothing in `src/` changed; this isn't built by
`tools/build.mjs` and carries no BUILD_ID. The appended script:

- Reads/mutates the real running engine's already-global bindings (`KINDS`,
  `CHARS`, `state`, `METRICS`, `elDist`, `kindHasTag`, `addParticle`) —
  classic (non-module) `<script>` tags in one document share top-level
  `const`/`let`/`function` bindings, so this works without editing or
  rebuilding anything.
- Monkeypatches `updateWorld` (wraps the original, calls it first, then
  layers new reaction checks after) rather than duplicating the sim loop.
- Adds reactions by pushing into the **existing** `state.worldParticles`
  pool via the **existing** `addParticle()` — the real renderer draws them
  unmodified. No new render path anywhere.

## The four tiers

| Tier | What's active | Data changes |
|---|---|---|
| T0 | Shipped E1 only (R1 warm, R2 flee, R3 rest, R4 mortality) | none — this is literally the live game, just instrumented |
| T1 | + R5 (water+heat → steam), R6 (water+living → drink pause, reuses R3's rest fields), R8 (wind+structure → gust particles), R9 (wind+event → flicker) | `KINDS.wind.tags` patched from `[]` to `['wind']` — it shipped with the kind but no tag (this exact gap was caught in the earlier Track A audit, S1-D081) |
| T2 | + R10 (sound+living → a curiosity "perk up" pulse, distinct from R2's flee — no danger response) | 声 ("sound," basic tier, ships `world:null`→plain seal) gets a real kind (`bell`); a genuinely orthogonal axis from heat/water, not a rename of one |
| T3 | Same reactions as T2, denser eligibility | `fire` also tagged `sound` (crackling), `banner` also tagged `wind` (flutters) — more pairs eligible, zero new kinds or characters |

Water (`R5`/`R6`) and wind (`R8`/`R9`) match the Track A audit's own
findings from earlier this session — water was already fully buildable,
wind needed exactly the one data-only tag patch this implements. Cold (`R7`
in the original Track A brief) still has no glyph anywhere in the roster —
skipped here too, same as that audit concluded.

## Running a session

**`start-session.html`** is the entry point — not the experiment file
directly. It picks the least-tested tier (round-robin, not pure random, so
four sessions naturally cover all four tiers) and redirects without ever
displaying which one, per the brief's own blinding requirement. True
server-side blinding isn't available on static hosting, so the tier is
technically still visible in the resulting URL to anyone who looks — but
it's never surfaced in any UI text, which is the part that actually matters
for not contaminating the read.

No tutorial, no purpose text, matching the original M0 protocol exactly —
this file adds zero UI of its own once a session starts.

**Session data survives closing the tab.** That's the expected "voluntary
stop" signal per the brief's protocol, so losing it there would defeat the
whole instrument: `beforeunload`/`visibilitychange` persist the running
report to `localStorage`, plus a 15s periodic checkpoint in case the tab is
killed outright rather than closed. **`results.html`** reads that log back
— open it on the same origin the sessions were played on (localStorage is
per-origin; a Pages session's data won't show up read from a local file).

## What I verified vs. what needs a real human

**Verified, mechanically, via headless Chromium with a seeded world (real
code paths, deterministic adjacency so the test doesn't have to fight
S1-D059's random placement):**
- All four tiers apply their patches correctly (`KINDS.wind.tags`,
  `CHARS`'s 声 entry, the T3 cross-tags) — confirmed by reading the live
  `KINDS`/`CHARS` objects back after boot.
- Every reaction (R1 through R10) fires exactly when its tier says it
  should and not before — confirmed by watching `seenPairKeys` populate.
- A real glyph lock (dispatched pointer events, not direct handler calls)
  correctly increments `METRICS.locks`, gets picked up, bucketed into
  `compositionsPerMinute`, and classified for `noveltyRatio`.
- The full session loop — blind launch → play → tab-hidden exit →
  persisted report → `results.html` reading it back on a fresh page in the
  same browser context — works end-to-end.
- Zero console errors across every tier and the full loop.

**Cannot be verified by me, at all, no matter how thorough the harness:**
the actual `compositionsPerMinute` decay curve and `noveltyRatio` this
experiment exists to measure. Those require **real human engagement
decaying (or not) over real minutes** — a scripted session has no boredom,
no novelty-seeking, no "I'm done" moment, so any numbers I generated myself
would be theater, not data. This is categorically different from the
want-signal prototypes' Go/No-Go gap: there, I could at least pre-screen
legibility from a screenshot. Here, there is nothing to pre-screen — the
whole measurement IS the human sitting with it.

## What's needed to actually resolve this

Per the original protocol: minimum 4 sessions per tier (16 total), each
running to a voluntary stop or a 20-minute cap, via `start-session.html`.
`results.html` aggregates whatever's been played so far at any point — it
doesn't need all 16 before showing something. The per-tier and overall
Go/No-Go math (§5 of the brief) is straightforward to apply to
`results.html`'s output once real sessions exist; I haven't pre-computed a
verdict because there's no real data yet to compute one from.
