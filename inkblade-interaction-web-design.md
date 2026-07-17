# Inkblade — The Sandbox Interaction Web: Design (S1-D088)

**Status: DESIGN, no code.** This is the design for the next MAJOR milestone
named at S1-D068(3): object↔object interactions — the sandbox world web.
John's brief for this pass: *"design the idea of interactions. you can ignore
and overrule all to be creative."* That license is used below, and every
place a prior LOCKED ruling is touched is named explicitly (§6). Everything
else — the two laws, the stability rule, the consent covenant, the children
audience, data-not-engine — is kept on purpose, because the design got
*better* inside those walls, not worse.

---

## 1. The reframe: one grammar, two pages

Inkblade already has a thesis for the pen: **strokes are verbs, characters
are combos, stroke order is grammar.** The interaction web is the same
thesis for the world:

> **Planted meanings are words. Proximity is syntax. Interactions are
> sentences — and some sentences are characters.**

Chinese doesn't only standardize how characters are *produced*; it
standardizes how meanings *combine*. 人 resting against 木 is not a metaphor
for 休 "rest" — it IS 休, literally, etymologically, visibly. 日 and 月
together ARE 明 "bright." Two 木 ARE 林 "grove." The lexicon the player is
learning already contains a physics of meanings, curated for three thousand
years, and the sandbox world can *enact* it.

So the web is three layers, each one feeding the next:

| Layer | What it is | Analogy on the pen side |
|---|---|---|
| **L1 — Reaction physics** | tag × tag → small legible effects (steam, gusts, drinking, kindling) | strokes: the atomic verbs |
| **L2 — Duets** | choreographed two-body behaviors (horse pulls cart, crowd follows banner) | components: chunks that move together |
| **L3 — 会意 resonance** | two meanings meet → the real compound character condenses over them as an offer | the lock: combos become characters |

L1 makes the world feel *physical*. L2 makes it feel *alive*. L3 closes the
loop back into the combo book — the world doesn't just react to what you
wrote, it **teaches you the next character by acting it out first**. That is
the creative headline of this design, and it is simultaneously the answer
OPEN-9 has been waiting for (§5).

---

## 2. Layer 1 — reaction physics: the tag×tag table

### 2.1 What exists today (audited S1-D081, verified in code)

R1–R4 (warm-drift, startle/flee, shelter-rest, fire mortality) are bespoke
functions in `src/09-world-sim.js`, not a table. E2 ignition
(`updateIgnition`) is the one true transform and already follows the shape
we want: engine reads tags (`heat`, `flammable`), all tuning lives in pack
data (`ecology.ignition`). The breadth-threshold prototype (S1-D084) proved
four more reactions (steam, drink, gust, flicker) work with zero new render
machinery — pure `addParticle` + existing pools.

**The milestone builds the missing thing once: a generic resolver.** After
it exists, a new interaction is a data row, not a function.

### 2.2 The reaction verb vocabulary (engine-side, closed set)

Mirroring the stroke move-set — a small, fixed set of verbs the engine
implements; packs may only compose them:

| Verb | Effect | Existing precedent |
|---|---|---|
| `emit` | transient particles at the pair site (steam curl, spark drift, petal fall, dust puff) — never persisted | breadth-prototype R5/R8 |
| `aura` | a render cue flag on the target (like `el.hot` today: shimmer, wet-sheen, wind-lean); renderers answer it | `el.hot` (S1-D046) |
| `move` | agent motion bias: approach / flee / loiter-at-distance | R1/R2 |
| `pose` | agent behavior beat with a duration + cooldown (rest, drink, perk-up, graze) | R3, prototype R6/R10 |
| `phase` | a **reversible** state cycle on the target (burn→ash→sprout→sapling→self; wilt→bloom; freeze→thaw) | E2 burn (S1-D054) |
| `clock` | modulate another interaction's timers (wind *fans* fire: shortens ignition dwell, lengthens flare; water *damps*: the reverse) | none — new, small |

Six verbs. Nothing deletes, nothing damages, nothing scores. Every verb's
visible result must read as a picture-book beat (children audience,
S1-D063): steam *curls*, the horse *trots proudly*, sparks *dance* — never
combat, never numbers.

### 2.3 The data schema (pack `ecology.web`)

```json
"web": {
  "reactions": [
    {"a":"heat","b":"wet",     "verb":"emit", "fx":"steam",  "r":0.07, "everyMs":900,  "cooldownMs":0},
    {"a":"wet","b":"living",   "verb":"pose", "pose":"drink","r":0.05, "dwellMs":2000, "cooldownMs":12000},
    {"a":"wind","b":"flammable","verb":"clock","target":"ignition","mult":0.6, "r":0.09},
    {"a":"wind","b":"structure","verb":"emit", "fx":"gust",  "r":0.10, "everyMs":1400},
    {"a":"heat","b":"living",  "verb":"move", "mode":"warm", "r":"comfortR"}
  ]
}
```

Rules of the schema:
- `a`/`b` are **tags** (or the special `cls:` prefix to match a class).
  Symmetric matching; the element carrying `a` is the actor.
- All radii/clocks are data. String radius values reference named ecology
  constants so shipped tuning stays in one place.
- No row in the pack ⇒ no reaction in the world (same covenant as E2's
  "no ignition block, no ignition").
- Deterministic under `?seed=`: pair iteration in stable element order,
  all randomness through `worldRand()`.

### 2.4 Migration honesty

R1–R3 are NOT rewritten in build 1. They keep working as-is; the resolver
ships alongside them carrying only *new* rows (steam/drink/gust/flicker —
already human-shaped by the prototype). Once the resolver has survived a
playtest checkpoint, R1–R3 fold into `move`/`pose` rows in a
behavior-preserving refactor build. Proving the table with new content
first, then migrating old content, means no working behavior is ever bet
on unproven machinery.

---

## 3. Layer 2 — duets: two bodies, one choreography

Some interactions are not field effects — they are *relationships*. The
horse doesn't emit particles at the cart; it **harnesses and pulls it**.
These need light choreography the tag table can't express, so the engine
ships a small set of named duets, and packs declare which pairs may perform
them:

```json
"duets": [
  {"kinds":["horse","cart"], "duet":"haul",   "r":0.08, "chancePerSec":0.01},
  {"kinds":["crowd","banner"],"duet":"procession","r":0.10,"chancePerSec":0.008},
  {"kinds":["walker","gate"],"duet":"passThrough","r":0.06,"chancePerSec":0.02},
  {"kinds":["moon","water"], "duet":"glimmerPath","r":999, "chancePerSec":0.004}
]
```

Launch choreography set (each is a loop that returns both bodies to their
idle life — duets borrow, never consume):

- **haul** — the horse sidles to the cart, they couple, trot a short arc
  together, uncouple; the cart ends somewhere new. The world's first
  *cooperative movement*, and 马+车 is the pair John named at S1-D068.
- **procession** — the crowd falls into line behind the banner and ambles
  a lap; pure Bruegel-for-children.
- **passThrough** — a walker approaches the gate, pauses under the arch
  (a little bow), continues. Gates finally *mean* something.
- **glimmerPath** — when the moon is up and water is planted, a silver
  ripple-path draws across the water toward the moon. Radius ∞: sky
  objects duet at any distance. First sky↔ground interaction.

Duets are the character-actor layer: they give the sandbox *stories without
words*, which is exactly what a picture-book world needs. Engine cost is a
handful of small state machines shaped exactly like `updateAgent`'s
existing modes — proven architecture, not new risk.

---

## 4. Layer 3 — 会意 resonance: when meanings meet, characters are born

### 4.1 The mechanic

A curated table maps **pairs of planted characters** to the real compound
they form:

```json
"compounds": [
  {"pair":["人","木"], "makes":"休", "via":"proximity"},
  {"pair":["日","月"], "makes":"明", "via":"proximity"},
  {"pair":["木","木"], "makes":"林", "via":"proximity"},
  {"pair":["林","木"], "makes":"森", "via":"proximity"},
  {"pair":["火","火"], "makes":"炎", "via":"proximity"},
  {"pair":["人","人"], "makes":"从", "via":"duet:follow"},
  {"pair":["女","子"], "makes":"好", "via":"proximity"}
]
```

When a listed pair stands close (or completes the named duet) for a dwell
time, the compound **condenses**: a faint gold ghost of the character
forms in the air above the pair — the same visual language as the stage's
ghost glyphs, small, breathing, wordless. The world is saying: *these two
things together have a name.*

Then, through machinery that already exists: **the next stage glyph offer
becomes that compound** (a repertoire replacement in `advance()`, not a
new UI). If the player writes and locks it, the transit droplet arcs to
the resonance site — and the compound's meaning manifests *fused, in
place*:

- 休 locks → the walker settles against that tree in the resting-figure
  pose (the character becomes the scene that summoned it).
- 明 locks → the sky brightens around sun/moon for a spell; the wash
  lifts.
- 林/森 lock → the trees that summoned it fill out, plus the normal
  plant — the grove becomes denser than the sum of its plantings.
- 好 locks → a small mutual bow and a shared gold ripple.

If the player ignores the shimmer or fizzles, it dissolves as mist after
its hold and the queue returns to normal. **Nothing is lost, nothing is
demanded, nothing is worded** — the stability rule extends cleanly:
resonance is an offer, never an assignment.

### 4.2 Why this is the load-bearing creative move

1. **It answers OPEN-9 diegetically and finally.** The want-authoring
   model that "never becomes a quest log" was the hard open question.
   Answer: *wants are etymology.* The world never invents a demand — it
   surfaces a truth about the language that the player's own plantings
   composed. No text, no list, no marker taxonomy (the four want-signal
   prototypes explored *how* to signal; resonance settles *what* is
   signaled — the S1-D082 findings about legibility and intensity
   ceilings apply directly to tuning the shimmer).
2. **Law 1 holds structurally.** The depth lands in the combo layer: the
   payoff of world-play is *new characters offered at the moment their
   meaning is self-evident*. The player learns 休 at the instant a person
   leans on a tree — pedagogy by wonder, zero tutorial text.
3. **Law 2 holds structurally.** Compounds scale with the lexicon — the
   500-tier and the 3,000–7,000 tiers carry thousands of 会意/合体
   pairs. The table is pure pack data; rows whose `makes` character isn't
   in the loaded packs are filtered out at load, so the mechanic
   automatically grows with every chapter shipped.
4. **It is unreskinnable.** The dark-twin test in reverse, again: no
   invented rune system has real compounding etymology. This mechanic is
   only possible in Chinese — which is the entire market identity of the
   game (§2 of the charter).

### 4.3 Verified starter table

Characters verified present in shipped packs today (core ✓ / basic ✓):
人 木 日 月 火 女 子 从 休 明 好 林 炎 森 众 马 车 门 风 石 声 心 田 力.
All seven starter rows above are therefore live-able now. Candidates
blocked on roster gaps (雨 云 鸟 草 尘 旦 鸣 absent) wait for their
chapter — logged, not invented.

---

## 5. What this milestone deliberately is NOT

- **Not a crafting system.** No inventory, no recipes-as-UI, no
  discovery journal. The combo-book strip already IS the collection; a
  compound locked via resonance seals into it like any lock.
- **Not combat.** Tags never oppose; reactions are weather, warmth,
  play. Fire remains the only transform, and it remains a covenant
  (regrowth), not a weapon.
- **Not a quest system.** Resonance offers replace at most one queue
  slot at a time, one shimmer active at a time (S1-D082's intensity
  finding: signals with no ceiling hide their referent).
- **Not a rules engine.** Six verbs, a handful of duets, one resonance
  mechanic. If a proposed interaction needs a seventh verb, the design
  bar is: would a child *see* the difference? If not, compose the six.

---

## 6. Covenants kept, and the one overrule invoked

Kept, deliberately, despite the license to break them:

| Covenant | Status |
|---|---|
| Consent covenant: nothing player-planted is ever destroyed; transform ≠ destroy; every phase cycle returns | **KEPT** — the `phase` verb may only declare closed cycles; `e1.destructions === 0` regression stays |
| Sun never ignites; sky is safe | **KEPT** (children audience) |
| Stability rule: lock/fizzle only, no "wrong," no demands | **KEPT and extended** to resonance offers |
| No tutorial text, no quest log | **KEPT** — resonance is wordless |
| Content in data, never engine | **KEPT** — verbs/duets/compounds are engine vocabulary; every row is pack data |
| Placement is chance + collision (S1-D059) | **KEPT** — resonance *rewards* accidental adjacency, which retroactively makes chance placement the right call: the dice now write poetry |

**Overruled (one, named, bounded): S1-D049c "no chaining, one hop."**
Amendment: **wind may carry fire exactly one extra hop.** When a `wind`
element's gust crosses a burning element, a single visible ember mote
rides the gust and may kindle one flammable target in its short arc —
`carryHops: 1` in pack data, default present in shipped packs. Rationale:
the original ruling guarded against illegible runaway chains; a *carried*
ember is the opposite — a legible, watchable, child-followable story beat
("the wind took a spark!"), and it makes 风 matter, which today is a
tagless statue. Chains remain bounded (a carried burn never re-carries),
and `?e2=0` still kills the whole family.

---

## 7. Engineering shape (for the plan entry, not built here)

- **Resolver**: one `updateWeb(dt)` pass in `09-world-sim.js` after
  `updateIgnition`. Elements bucketed by x into radius-sized bins (world
  is effectively 1D + depth), pairs scanned bin-local — O(n·k), fine
  inside the 300-element @60fps budget (17ms measured headroom, S1-D065).
  Per-pair transient state (dwell accumulators, cooldowns) lives in a
  keyed map, **never persisted** except `phase` states, which extend save
  v2 additively exactly as `burn` did.
- **Resonance queue hook**: `advance()` consults a single
  `state.resonance` slot (char + site + expiry) before random pick; the
  transit targeting reuses `elRef`/`elScreenPos` (S1-D075) so it lands
  correctly in both 2D and R3D paths.
- **Metrics** (additive): `web: {reactions:{steam,drink,gust,…},
  duets:{haul,…}, resonancesOffered, resonancesAnswered,
  emberCarries}` — `resonancesAnswered / resonancesOffered` is the
  single most important number the milestone produces (it is OPEN-9's
  Go/No-Go in disguise).
- **Tests**: fast-clock fixture pack (`tests/fixtures/`), new smoke23:
  every launch row fires under seeded adjacency; determinism byte-check
  under `?seed=`; consent regression (`destructions===0` with the full
  web active); resonance offer → real-gesture lock → fused payoff
  end-to-end; ember-carry exactly-one-hop assertion; full battery
  unchanged elsewhere.
- **Build order, each build = a playtest checkpoint** (S1-D058 mandate):
  - **b1 — the table lives**: resolver + L1 rows (steam, drink, gust,
    flicker, wind-fans-fire, wind tag patch). Mostly already
    human-validated via the breadth prototype.
  - **b2 — the world performs**: duets (haul, procession, passThrough,
    glimmerPath) + ember-carry.
  - **b3 — characters are born**: resonance, starter compound table,
    fused payoffs for 休 明 林 森 炎 从 好.
  - **b4 — fold-in**: R1–R3 migrate into the table (behavior-preserving;
    battery is the proof).
- **Sequencing constraint honored**: the S1-D087 pinyin-redesign
  checkpoint is still PENDING John's hands. This document is parallel
  unblocked work; **no web code ships until that verdict lands** —
  that's exactly what the checkpoint discipline exists to prevent.

## 8. Open questions raised by this design

| id | Question |
|---|---|
| WEB-1 | Resonance dwell + shimmer hold times: how long before an offer feels like nagging? (S1-D082's want-signal timing data applies; needs John's hands) |
| WEB-2 | Should a compound locked via resonance ALSO plant its own world object, or only fuse? (休 fusing is obviously right; 好 has no world object today — fine; 森 wants both. Current lean: `makes`-char's own `world` block decides, data not engine) |
| WEB-3 | One shimmer at a time is the launch rule — does a busy 300-element scroll starve resonance into invisibility? (metric: resonancesOffered per minute at density) |
| WEB-4 | Cold/rain family: 雨 云 雪 冰 are roster-absent; the `clock`-damp verb ships dormant until one lands. Which chapter brings them? |
