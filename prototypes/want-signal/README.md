# Want-Signal Experiments (OPEN-9 prototyping)

Four isolated, killable prototypes for OPEN-9 (demand world / want-driven
repertoire — the one genuinely still-open design question in the charter,
per the S1-D079 reconciliation). Each answers the brief's question: what
form should an *ambient want-signal* take?

**These are standalone files, not part of the shipped game.** No BUILD_ID,
not built by `tools/build.mjs`, not merged into `src/`. Per the brief's own
"isolated build" rule, they intentionally don't share code with each other
or with the real engine — each is a minimal from-scratch scene.

## Running them

Open any file directly (`file://` works, no server needed):
`experiment-a-intensity.html`, `experiment-b-mood.html`,
`experiment-c-resonance.html`, `experiment-d-ripple.html`.

Query params on all four:
- `?debug=1` — shows a live metrics readout (top-left) and, on B, a manual
  "report as bug" button standing in for a human tester's judgment call.
- `?speed=N` — multiplies the want-clock so a bench session doesn't need to
  sit through the full real-time ramp (A/B default ~10-12s ramp; C/D are
  short enough to leave at 1×).

Each exposes `window.__WANT_METRICS` with the fields the brief asks for
(`wantOnsetTime`, `wantNoticedTime`, `wantResolvedTime`,
`wantIgnoredDuration`, plus B's `signalMisreadAsBug` and C's
`wrongFamilyAttempt`), so a real playtest session could harvest them the
same way the shipped game's `__S1_METRICS` already gets read.

## What I could and couldn't actually test

I can verify each mechanism **renders correctly and the instrumentation
fires correctly** — confirmed for all four via headless Chromium (zero
console errors, metrics populate on the expected events, screenshots below
match the intended read). I **cannot** produce the Go/No-Go response-rate
numbers (≥60% noticed, ≥80% correctly-read-as-intentional, etc.) — those
require real human testers reacting without knowing what's being measured,
which is exactly the thing I am not. What follows is my own read of each
prototype's legibility, offered as a pre-screen, not a verdict.

Also: none of these have a real glyph-writing loop (that's the whole
engine, out of scope for a killable prototype). "Response" is simulated as
a click/tap on the matter — a stand-in for "the player wrote the answering
character nearby." This is noted per-experiment below where it matters.

## Findings, per experiment

### A — Escalating visual intensity
**Built:** a tree + dusk-creep overlay + thickening haze, all driven by one
continuous `unmet` parameter (0→1 over the ramp). Signal lives in the
receded window on purpose (visible at the writing-time 35% envelope, not
gated behind a bloom).

**What I observed:** the escalation itself reads clearly — a real
before/after screenshot pair shows unmistakable dusk/haze buildup. **Risk
found:** at `unmet=1` the overlay is dark/dense enough that the tree — the
actual referent — nearly disappears into the haze. That's a real tuning
trap for this mechanism specifically: intensity that scales without a
ceiling can eventually obscure the thing it's drawing attention to, which
would be self-defeating (a signal you can no longer see is not a signal).
Fixable (cap overlay alpha well under 1, or let intensity plateau rather
than climb linearly to full opacity) but worth flagging rather than
silently tuning away, since it's evidence about the *mechanism's* ceiling
behavior, not just this instance's numbers.

### B — Idle-animation mood swap
**Built:** a walker with two idle states — calm upright pacing vs. a
huddled/shivering squash-and-jitter — crossfaded by the same want-clock
shape as A, for direct comparability.

**What I observed:** calm-vs-huddled reads as a clear behavioral
difference in side-by-side screenshots (upright/arms-out vs.
hunched/tucked/jittering). This is the strongest read of the four on a
static screenshot basis — "this creature is now doing something else" is
more immediately legible than a continuous color shift. The brief's own
named risk (`signalMisreadAsBug`) is real but untestable by me — a
huddling sprite genuinely could read as a glitch to someone who's never
seen the calm state, and I have no way to distinguish "correctly read as
intentional" from "looked weird" without a human. Flagging this as the
one field in the whole set that a real playtest session needs to prioritize
capturing.

### C — Resonance pulse (family hint)
**Built:** an unlit hearth (want-source) with 3 hinted cells that pulse
blue-family and 1 decoy cell that doesn't, to test whether the hint
communicates *category* rather than just *location*.

**What I observed, and a real correction made in-flight:** my first color
choice (`rgba(96,140,190,·)`, alpha peaking ~0.7) rendered as washed-out
grey against this game's warm paper backdrop, not legibly blue — confirmed
via a full-presence screenshot before touching anything. This is exactly
the brief's own predicted failure mode ("the hint isn't communicating
category, just 'something here'") — caught in the prototype itself, not
hypothetically. Raised saturation + a higher alpha floor
(`rgba(50,110,190,·)`, floor 0.55) fixed it — now unambiguously blue at
full presence (verified visually via headless screenshot, not committed to
the repo). **Takeaway for the real design:** this
mechanism's legibility is highly palette-dependent — any category-color
scheme will need per-color contrast checks against the shan-shui warm
palette, not just against a neutral test background, before it ships.
Cheap to get wrong, cheap to fix once you're looking for it.

### D — Propagating ripple (differentiated reaction)
**Built:** a periodic flare with three tagged objects in radius — flammable
(shake + gold-tint flash), living (recoil + tiny cower), sheltered (static,
calm protective glow, no flinch) — no dedicated signal layer at all.

**What I observed:** the three reactions are objectively different in the
code and in screenshots, but **the "living" recoil is the weakest of the
three to parse** — it reads mostly as a small position shift, easy to
mistake for idle wander noise rather than a deliberate "flinch," especially
next to the flammable prop's much more legible color-flash. The
sheltered/calm object's non-reaction is clean and unambiguous by contrast
(it's the easiest of the three to read precisely because it does nothing
different). If this candidate advances, the living-tag reaction needs a
stronger differentiator than a positional recoil alone (its own
color/silhouette change, matching the visual grammar the other two
already use).

Also worth noting for the real design conversation: the brief calls this
"the cheapest candidate if it works" because it claims to need "no new
visual layer" — but the flammable and living reactions I built here
**are** new per-tag animation branches (shake-and-tint, recoil-and-cower)
that don't exist in the shipped game's actual R1-R4 (`src/09-world-sim.js`
is bespoke per-behavior code, not a generic tag→animation table this could
slot into for free). The engineering cost is real, just smaller than A/B/C
because it reuses existing matter instead of adding new visual apparatus
on top of it.

## Cross-experiment read (mine, not a verdict)

B (mood swap) and D (differentiated reaction) felt like the two strongest
candidates from a pure "does this look like something, not noise"
standpoint — both route the signal through behavior rather than a raw
color/opacity parameter, which seems to read faster in a static screenshot.
A and C both work, but each surfaced a real ceiling/legibility risk during
build that a synthetic test wouldn't have caught on paper. None of the four
is disqualified by anything I found — this is exactly the kind of thing
the brief's real Go/No-Go criteria are for, and those need real testers.
