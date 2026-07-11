# Inkblade — 3D rendering, lock transition, and visual-assignment modularity

Exploration + code review requested by John (2026-07-11), three questions:

1. "3D is there, but not obvious … explore things like three.js to see the
   possibility of adding 3D rendering."
2. "Character turning into objects is the core interaction, but it is not
   always obvious which character projected to what object — we need a
   *transition* (animation/transformation), see Crayon Physics."
3. "Each character must be assigned an image of an object — review whether
   this is modularized enough that we can change images/glyphs per character
   often."

This is an assessment document, not a ship. Anything below that becomes code
gets its own plan entry (S1-D0xx) and playtest checkpoint per the standing
disciplines. Note: question 1 touches **LOCKED S1-D063** ("no engine switch;
three.js = full rewrite") — John raising it again is the license to re-examine
it, and the honest answer below includes a middle path S1-D063 didn't
consider.

---

## 1. 3D rendering — what exists, what three.js would cost, what to do

### What the build already does (why "3D is there")

All in vanilla Canvas 2D, `src/00-config.js` + `src/10-world-render.js`:

- **y-as-depth** (shan-shui convention): higher on the paper = farther.
  `depthK()` scales elements 0.42× (far) → 1.45× (near) — a 3.45× size ratio.
- **Perspective x-convergence** (`worldScreenX`, PERSP_FAR 0.80): the ground
  field squeezes toward a vanishing center with distance. Render-only.
- **Painter's sort** far→near, so near matter occludes far matter.
- **Two-stage mist** (atmospheric perspective) + **contact shadows** anchoring
  matter to the ground plane.
- **Illustrated backdrop** (ridgelines, drifting clouds, perspective-scaled
  ground tufts, fixed seed 42).

### Why it still doesn't read as 3D — the missing cue is MOTION

Every cue above is *static*. The camera never moves, so there is **zero
motion parallax** — and motion parallax is the strongest monocular depth cue
the human visual system has. A diorama photographed from a fixed tripod looks
flat; the same diorama with the camera swaying an inch looks deep. John has
now said three times (S1-D040, S1-D059(2), S1-D063→now) that the depth
doesn't land; each time we added more *static* cues. The gap is dynamic.

### Option A — full three.js rewrite: NO (recommendation unchanged)

- three.js core is ~680 KB minified (~170 KB gzip). The whole shipped game is
  139 KB. Embedding it quintuples the artifact and ends the dependency-free
  single-file discipline; loading from CDN breaks `file://` play and offline.
- The 19-suite battery (smoke1–19) drives the real canvas with real pointer
  events and probes pixels. A scene-graph rewrite invalidates effectively all
  of it, plus all 30 procedural brush renderers, the attention-veil
  compositing model, and the burn-through overlay.
- The payoff is a "true" camera — which Option C below gets for ~1% of the
  cost.

### Option B — hybrid: three.js (or raw WebGL) for the WORLD LAYER only

Worth knowing: this is architecturally *possible* today, because the world
already renders into an isolated offscreen layer (`worldLayer`/`eventLayer`
in `03-canvas.js`) that the frame composites with two `drawImage` calls. A
WebGL canvas can be composited exactly the same way (`drawImage(glCanvas)`).

- Glyph combat, input, HUD, attention veil stay Canvas 2D and untouched —
  combat suites survive.
- World content becomes **billboard sprites on a real ground plane** with a
  real perspective camera + fog. The existing procedural renderers can
  *rasterize into sprite textures* (draw each element to a small offscreen
  canvas, upload as texture), so the entire brush-art investment is reused,
  and animated kinds re-rasterize at ~15 Hz.
- Cost is still real: world pixel-probe suites (smoke12/13/18/19 T-cases) and
  the perf gate must be ported; the veil-alpha compositing and burn-through
  rules must be re-proven; +170 KB gz dependency (or a ~0 KB raw-WebGL
  billboard renderer, which for "camera + sprites + fog" is genuinely small).
- Verdict: **a legitimate pilot, not a first move.** If done, it ships as a
  separate gated artifact (`inkblade-3d-pilot.html`, `?r3d=1`), never by
  rewriting the main line, and only after Option C has had its checkpoint.

### Option C — RECOMMENDED FIRST: motion parallax in the existing renderer

Give the valley a camera without changing the world model. All presentation-
layer, no dependency, no save/sim impact:

1. **Idle camera drift**: a slow autonomous sway (a few px amplitude,
   ~20–30 s period) applied as a per-depth-layer x/y offset — backdrop
   ridges shift least, near tufts shift most. The scene visibly *is* layered
   the moment it breathes.
2. **Pointer parallax**: while not writing, pointer x (or device tilt on
   mobile) pans the camera ±2–4% with layer-proportional offsets. A child
   wiggles a finger and the hills slide against the trees — instantly "3D".
3. **Near-field occluder band**: a few large foreground tufts/rocks below
   GROUND_NEAR that slide fastest and partially occlude near elements —
   the depth sandwich (behind-things AND in-front-things) completes.
4. Optional: lock-bloom **dolly** — a 1–2% zoom ease on lock, so the world
   "steps forward" when it takes attention.

Implementation surface: a `camera{x,y}` in state, offsets applied in
`drawBackdrop`, `drawWorld`'s per-element transform (alongside the existing
convergence translate), and mist. Roughly config constants + ~60 lines.
Testable: a `__S1_CAM` handle + a smoke test asserting differential layer
shift. If this still doesn't land at checkpoint, escalate to Option B's
pilot with a clear conscience (and log the S1-D063 amendment).

---

## 2. The lock transition — making "character → object" legible

### Today's sequence (the gap)

On lock (`beginResolve`, 06-combat.js): gold flash on the glyph (500 ms) →
banner + pronunciation + full-screen fx → **at +900 ms** `spawnWorldFor`
plants the element at a *random* spot (`placeEl` max-spacing dice roll,
S1-D059) → the element eases in over 700 ms with a 900 ms gold ring.

The written character sits center-screen; the object pops in *somewhere
else*, small, during the same moment the banner and full-screen fx are
competing for attention. Nothing visually connects glyph to object — the
player must infer the link. That's the complaint, and it's real.

### Crayon Physics' lesson

In Crayon Physics the drawing **is** the object — the ink you made never
disappears; it becomes the thing in place, so authorship is never in doubt.
We can't keep it in place (the glyph lives in the writing box, the object
lives in the world), but we can keep the **ink continuity**: the ink the
player cut should visibly *travel to and become* the object.

### Proposed design: "the ink travels" (three phases, all Canvas 2D)

1. **Coalesce (~300 ms)** — on lock, the glyph's cut strokes (already
   polylines with known screen points) lift and contract toward the glyph's
   centroid, ink brightening through gold. The character visibly gathers
   itself into a droplet of ink.
2. **Flight (~500–700 ms)** — the ink droplet flies on a quadratic arc from
   the glyph centroid to the element's anchor point, leaving a tapering ink
   trail, shrinking toward the target's `depthK` scale so it lands *into*
   the perspective. (Depth cue for free: the drop gets smaller as it goes
   deeper — this also reinforces question 1.)
3. **Bloom (existing)** — on arrival the element reveals: the existing
   700 ms grow-in + gold ring plays, plus a small ink-splash at the anchor.
   The banner (pinyin/gloss) moves to fire at *arrival*, next to the object,
   not at lock — name appears where the thing appears.

Stretch variant (closest to Crayon): interpolate each stroke polyline
point-wise toward the anchor while shrinking, so the character's own strokes
morph into the landing splash. More striking; slightly more code. Batch-1
candidate: ship droplet-flight first, evaluate stroke-morph at checkpoint.

### Implementation seams (verified in code)

- **Placement must be decided at lock time, not +900 ms.** Split
  `spawnWorldFor` into `chooseWorldFor(def)` (runs placeEl, returns elements
  flagged `transit: true`, skipped by `drawWorld`) and reveal-on-arrival
  (clears the flag, stamps `born`, saves). `worldRand` call order preserved →
  `?seed=` determinism and all seeded suites stay valid.
- Group spawns (林 = 3 trees) send one droplet per member, staggered ~80 ms —
  a little squadron of ink, very kid-legible.
- Seal-fallback chars work identically (the glyph shrinks into its own
  stamp — arguably the clearest case).
- Transit never persists: a reload mid-flight completes the plant instantly
  (same pattern as fire's mid-burn checkpoint).
- Suite audit needed before the plan entry: smoke5/10/14/17/19 assert world
  counts after locks with fixed waits; flight adds ~1 s to plant latency, so
  waits/fixtures must be re-timed (extend-never-delete).

This is player-facing behavior → own plan entry, BUILD_ID bump, full
battery, and a John checkpoint. It's also the highest value-per-cost item of
the three: it strengthens the core fantasy directly and needs no new tech.

---

## 3. Modularity review — how characters get their object visuals

### The mapping today (three layers, verified)

1. **Pack data (the contract):** every char carries
   `world: {tier:1, kind:"horse"}` (bespoke) or
   `world: {tier:2, class:"flora", params:{form:"flower"}}` (family skin),
   or `world:null` → seal fallback. The engine reads only this.
2. **Pipeline (the curation):** `pipeline/overrides.json` —
   `chars` (core 23), `charsExtra` (curated non-core, S1-D067),
   `radicalClasses` (radical → class/form at scale, e.g. 氵→water, 宀→
   dwelling). `node pipeline/build-packs.mjs` re-emits both packs.
3. **Engine (the art):** `ELEMENT_DRAW` registry in 10-world-render.js maps
   kind → procedural brush renderer (30 kinds today); tier-2 renderers take
   `form` params + per-seed variance; unknown kinds self-heal to seals.

### Verdict

**The *assignment* is properly modularized.** Changing which visual a
character gets is a JSON edit + pack rebuild — no engine change, no save
migration (unknown kinds self-heal). Example: moving 花 from generic flora
to a new form was one `charsExtra` row. This is the architecture working.

**The *visuals themselves* are not swappable assets — and no character is
assigned an "image" anywhere.** Three findings:

- **F1 — Renderers, not images.** What a kind *looks like* is JS code in
  `src/10-world-render.js`. "Update the object visuals" today means editing
  a draw function, rebuilding the artifact, BUILD_ID bump, full battery. Fine
  at 30 kinds; a bottleneck if art iteration becomes frequent or if John
  wants to supply/see concrete images per character.
- **F2 — Coverage.** 23 core chars are fully bespoke; ~223 of the 500 basic
  tier have family visuals; **277/500 still render as plain seals** (chunk C
  batch 2+ is the planned fix, gated on John's M2d-b1 quality checkpoint —
  still pending).
- **F3 — Content leak (minor).** `drawWalkerEl`/`drawRestTreeEl` and the
  `figure` fx literally `fillText('人')` — CJK content in the engine,
  against the "no content in engine" rule (predates it; the newer `figure`
  renderer is pure geometry). Cheap cleanup whenever those files are next
  touched.

### Recommendation: make the long-tail visuals data, keep the living ones code

Add one generic renderer + one pack block:

- Pack gains an optional `sprites` block: kind (or per-char) →
  **SVG path data or data-URI image** + anchor/scale metadata.
- Engine gains a single `drawSpriteEl` that draws the sprite with all the
  standard behaviors it inherits for free from `drawWorld`'s shared
  transform (depth scale, convergence, grow-in, contact shadow, burn/regrow
  phases).

Then updating a character's object visual = editing pack data, no engine
rebuild — exactly the "change images often" workflow John asked about. It
also dovetails with the Option-B billboard pilot (sprites ARE billboards)
and with scaling chunk C past 500 chars without writing hundreds of bespoke
renderers.

Honest trade-off (children's-eyes law, S1-D063): static images are *dead*
next to the animated brush figures — the horse trots, the heart pulses, the
banner flutters. So: **bespoke procedural renderers stay the tier-1 poetic
set; sprites become the tier-3 long tail**, and any sprite kind can later be
promoted to a living renderer without touching pack data (the kind key stays
the key).

---

## Suggested execution order (each step = plan entry + checkpoint)

1. **Lock transition** ("the ink travels") — highest impact on the core
   fantasy, no new tech, directly answers question 2.
2. **Motion parallax camera** (Option C) — answers "3D not obvious" at ~1%
   of a rewrite's cost; its checkpoint verdict decides whether the WebGL
   billboard pilot (Option B) is ever needed.
3. **Sprite pack block** (F1) + chunk C batch 2 — makes visuals updatable as
   data while the remaining 277 seals get faces.
4. **Option B pilot** only if 2's verdict still reads flat — separate gated
   artifact, never a main-line rewrite; would be logged as an S1-D063
   amendment.
