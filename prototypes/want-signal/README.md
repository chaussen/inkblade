# Want-Signal Experiments (OPEN-9 prototyping)

Eight isolated, killable prototypes for OPEN-9 (demand world / want-driven
repertoire — the one genuinely still-open design question in the charter,
per the S1-D079 reconciliation). Each answers the brief's question: what
form should an *ambient want-signal* take? Round 1 (A-D) all varied "a
visible marker gets more urgent." Round 2 (E-H) changes modality entirely —
accretion over real time, an absence instead of an addition, the player's
own play history as material, and audio with zero visual layer.

**These are standalone files, not part of the shipped game.** No BUILD_ID,
not built by `tools/build.mjs`, not merged into `src/`. Per the brief's own
"isolated build" rule, they intentionally don't share code with each other
or with the real engine — each is a minimal from-scratch scene.

## Running them

Open any file directly (`file://` works, no server needed):
`experiment-a-intensity.html`, `experiment-b-mood.html`,
`experiment-c-resonance.html`, `experiment-d-ripple.html`,
`experiment-e-gathering.html`, `experiment-f-stillness.html`,
`experiment-g-echo.html`, `experiment-h-whisper.html`.

Query params, A-D:
- `?debug=1` — shows a live metrics readout (top-left) and, on B, a manual
  "report as bug" button standing in for a human tester's judgment call.
- `?speed=N` — multiplies the want-clock so a bench session doesn't need to
  sit through the full real-time ramp (A/B default ~10-12s ramp; C/D are
  short enough to leave at 1×).

Query params, E-H (each has its own since the mechanisms differ more):
- **E**: `?debug=1`; `?resetPile=1` wipes the persisted pile (it survives a
  real tab close via `localStorage`, on purpose — that's the whole point);
  `?fastforward=MS` simulates having been away that long, for bench-testing
  without literally waiting minutes.
- **F**: `?debug=1` only. The decoy "hitch" on a random non-want tree fires
  on its own timer regardless of debug mode.
- **G**: `?debug=1`; `?mode=generic` swaps the personal captured-stroke echo
  for a fixed template shape — the brief's own control condition. Default
  (`personal`) requires drawing one stroke near the left marker first.
- **H**: `?debug=1`; `?debugReveal=1` draws a faint circle at the real want
  location — **a dev verification aid only**, never on by default, added
  because I have no way to confirm positional-audio math is correct by
  actually listening.

Each exposes `window.__WANT_METRICS` with fields matching its own brief
section (A-D: `wantOnsetTime`, `wantNoticedTime`, `wantResolvedTime`,
`wantIgnoredDuration`, plus B's `signalMisreadAsBug` and C's
`wrongFamilyAttempt`; E-H: see each section below), so a real playtest
session could harvest them the same way the shipped game's `__S1_METRICS`
already gets read.

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

### E — Gathering (accumulating debris)
**Built:** existing-style ambient particles (leaves/dust) get a weak drift
bias toward the active want location once they wander near it, settling
into a growing pile. The clock runs on wall-clock `Date.now()` persisted to
`localStorage`, not `performance.now()` — this is the one candidate whose
entire premise is surviving a real tab close, so it has to actually survive
one, not just simulate it within a single page session.

**What I observed:** confirmed genuine cross-session persistence — closing
the tab and reopening (or `?fastforward=300000` for bench-testing) shows a
visibly larger pile than when you left, screenshot-verified
(`e_returning.png`: a clear cluster of settled marks where there was open
ground before). **Real risk surfaced, matching the brief's own stated
concern exactly:** this candidate's legibility depends entirely on the
player noticing a slow accretion against everything else in the scene that
*also* looks like ambient world texture (grass, mist, the shan-shui ground
grain) — a pile of a dozen small marks reads as "a spot on the world," not
obviously as "an unanswered want," without more visual distinction (denser
clustering, a slightly different color from ambient decoration, etc.) than
this first pass gives it. Cheapest of all eight to build (reuses an
existing particle system's motion, no new render path), but the one most
likely to fail silently — you don't get a dramatic NO-GO, you get players
who never form the belief that the pile *means* anything.

### F — Stillness (the signal is an absence)
**Built:** four idle-swaying trees; the want-tagged one drops to zero sway
amplitude on onset. A decoy tree on a separate timer freezes for 350ms
every ~4s regardless of want state, to test the brief's own named
confusion risk against something that isn't the real signal at all.

**What I observed — and an honest limitation of this verification
method:** the onset/notice/resolve instrumentation fires correctly (a
click on the frozen tree logs `stillnessDwellBeforeNotice` and
`wantResolvedTime` as expected), but **a static screenshot cannot show
"nothing is moving here"** — that's only visible over time, which is
inherent to this mechanism's whole design, not a flaw in how I verified
it. What a screenshot *can't* substitute for is exactly what a real
playtest needs to answer: whether a frozen tree among three moving ones
reads as deliberate at a glance, or whether (per the brief's own risk)
it gets attributed to a frame hitch — especially since I built a literal
decoy hitch into the same scene specifically so that confusion is
measurable (`falsePositiveClicks`) rather than theoretical.

### G — Ghost-ink echo (the world remembers your own hand)
**Built:** draw one real stroke near a "source" marker (genuine captured
pointer path, normalized to a reusable box, not a canned shape); every
~4.5s afterward, a low-opacity gold echo of that exact stroke drifts from
source to the want location and fades. `?mode=generic` swaps in a fixed
template path as the brief's own control.

**What I observed:** the capture-and-replay pipeline works end-to-end — a
hand-drawn "V" shape (screenshot `g_echo_midflight.png`) shows the real
captured stroke re-rendered mid-drift in gold at reduced scale, not a
placeholder. `echoSourceAge` correctly tracks how long ago the source
glyph was drawn, which is the field the brief needs to test its central
question (does response rate change with a fresher vs. staler personal
echo). **What I can't tell you:** whether the personalization actually
lands emotionally — "that's MY handwriting drifting across the world" is
exactly the kind of thing that reads completely differently on a screen
recording of someone's own real session versus a scripted Playwright
mouse-move, and this is the one experiment where that gap matters most.
This candidate is unique among all eight in being literally impossible to
fully self-test — its entire hypothesis is about a first-person felt
sense I cannot generate synthetically.

### H — Whisper (audio-only, no visual layer)
**Built:** a synthesized filtered-noise "breath" texture (matching the
shipped game's own no-audio-files convention — no waveform is loaded, only
generated), stereo-panned toward the want location and gained by proximity
to the mouse (standing in for the player-avatar). Zero visual cue by
default; `?debugReveal=1` draws a faint circle for my own math-verification
only.

**What I observed:** gain climbs correctly with proximity — measured
0.088 at the want location itself vs. 0.006 at the far corner of the
scene (`h_near.png` debug readout), confirming the volume curve tracks
the intended point, and clicking there resolves the want. **What I
genuinely cannot verify at all:** whether any of this is audible, well-
balanced, or actually locatable by ear — I can confirm the numbers are
correct and the panning math points the right direction, but "does this
read as a whisper with a direction" is a claim only a human with working
ears and headphones can check. This is the purest instance of the
brief's own point that a near-zero response rate here might mean
"delivery context, not concept failure" (no headphones, phone speaker) —
I have literally no way to distinguish those two explanations from the
inside, which is exactly why the brief calls for a BOUNCE outcome
distinct from NO-GO on this one specifically.

## Cross-experiment read (mine, not a verdict)

**Round 1 (A-D):** B (mood swap) and D (differentiated reaction) felt like
the two strongest candidates from a pure "does this look like something,
not noise" standpoint — both route the signal through behavior rather than
a raw color/opacity parameter, which seems to read faster in a static
screenshot. A and C both work, but each surfaced a real ceiling/legibility
risk during build that a synthetic test wouldn't have caught on paper.

**Round 2 (E-H):** these four are harder for me to rank because three of
the four (F, G, H) have their entire hypothesis riding on something I
cannot self-test — temporal perception, first-person emotional read, and
literal audibility, respectively. E is the one Round-2 candidate I can say
something concrete and slightly negative about: its accretion is real and
persists correctly, but nothing in this first pass distinguishes "a want
pile" from "ambient scene texture" strongly enough, which is a legibility
gap, not an infrastructure one, and cheap to iterate on. My honest
instinct, worth exactly what an instinct is worth here: G is the most
interesting to a human tester because it's the only one that uses the
player's own material, but it's also the one I'm least equipped to
pre-screen, which is its own kind of finding.

None of the eight is disqualified by anything I found — this is exactly
the kind of thing the brief's real Go/No-Go criteria are for, and those
need real testers.
