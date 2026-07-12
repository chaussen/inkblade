# 墨刃 Inkblade

*Write the character, plant the world.*

Inkblade is a browser game built on one claim: **the real Chinese stroke
inventory is a fighting-game move-set, and the real lexicon is a curated
combo book.** Chinese is the only writing system with a standardized,
rule-governed *production order* for its symbols — so instead of grading
handwriting (the dictation-app model every stroke-writing product has
shipped), Inkblade turns "does this character have components, and do they
have an order" into slash-combat mastery. A stroke is not input to be
judged; it's a verb.

Nothing here is a tutorial. There is no in-game instruction text beyond one
framing line on the boot screen. The world teaches order grammar by showing
it, not telling it.

## Play it

- **Live** (GitHub Pages, redeploys on every push to `master`):
  https://chaussen.github.io/inkblade/ — the landing page has one-click
  links for reset / the 500-character tier / a character picker / a seeded
  world, so you rarely need to hand-type query params there.
- **Locally**: `python3 -m http.server 8000` from the repo root, then open
  `http://localhost:8000/<artifact>.html` (the current artifact name is in
  `BUILD_ID`, currently `inkblade-m2g.html`). Opening the file directly
  (`file://`) works for the embedded 23-character pack, but the 500-char
  tier and any `?pack=` chapter load over HTTP only.

## The core loop

```
A ghost glyph appears (its strokes visible as pale targets)
  → each slash is a physical act: to cut a stroke, the slash's direction
    must match the stroke's canonical direction
  → strokes cut in canonical order ink GOLD; out-of-order strokes still
    cut, but ash-grey
  → all strokes cut, order intact → LOCK: the character assembles, speaks
    its pinyin aloud, and its MEANING manifests physically (火 → flame,
    木 → a tree grows) — then the character plants itself into a persistent
    painted world
  → order broken → FIZZLE: the character crumbles. You still did
    something; nothing is ever labeled "wrong."
```

## Features

### Writing & combat
- **Five direction buckets** (横 heng, 竖 shu, 撇 pie, 捺 na, 点 dian) — a
  slash is classified by direction only, never by curvature, proportion, or
  neatness. ±32° tolerance to the nearest bucket.
- **Alignment-priority targeting**: a slash cuts the stroke it runs
  *along*, not merely whatever it crosses.
- **Gold vs. ash ink**: strokes cut in canonical sequence ink gold; strokes
  cut out of order still register, but ash-grey — errors are visible, never
  scored or labeled.
- **Deflect**: a slash whose bucket doesn't match any nearby stroke bounces
  off with a spark and a ting — interesting, not punishing.
- **Composite characters**: each component sits on a faint tinted "ink
  wash" for segmentation; completing one gold mini-locks it independently;
  a breathing hint (escalating to a comet) nudges toward the next canonical
  stroke after two flails or six seconds idle.
- **Meaning effects on lock**: a character's gloss manifests physically —
  beams, fire, a growing tree, a figure, a shockwave, a calming ripple —
  never as text.
- **Pinyin spoken aloud** on every lock (Web Speech API).
- **Procedural sound effects** — no audio files, every tone is synthesized.
- **Streak counter** (连) — a display of fact, not a reward system; no XP,
  no badges, no timer pressure anywhere in the game.

### The living world
- Every locked character plants a matching painted element into a
  persistent scroll (autosaved to `localStorage`). Matter comes in three
  classes: **structure** (permanent), **agent** (mobile, living), **event**
  (mortal — fire burns out to embers, smoke, then fading ash; the scroll
  remembers, then heals).
- **Placement is a dice roll, not an aim** — where a new element lands is
  chosen at random among well-spaced candidate spots, independent of how
  the winning slash was drawn (an earlier aim-by-gesture mechanic was
  retired after playtesting read as awkward). Writing is the skill, not
  marksmanship.
- **Ecology E1 (reactive world)**: living agents warm to and gather near
  fire, flee real danger, and rest in shelter; fire has a full lifecycle
  (flame → embers → smoke → ash, ~2 real minutes). Nothing the player
  plants is ever destroyed — the invariant is measured, not just claimed.
- **Ecology E2 (ignition, on by default — `?e2=0` to disable)**: heat
  ignites nearby flammable matter one hop out, burns it to ash, and it
  regrows through sprout → sapling → itself over minutes. Ignition
  *transforms*, it never destroys.
- **500-character basic tier** (`packs/basic.json`) plus the 23-character
  embedded core pack, loadable together via a chapter-pack loader
  (`?pack=`, comma-separated URLs, first-wins merge, bad chapters skipped
  without poisoning the rest).
- **Bespoke art for high-frequency characters** — dedicated renderers for
  大/门/马/心/风/电/车 and more, plus radical-driven family renderers
  (banner, dwelling, skylight, flora, terrain, figure, water); every
  character not yet bespoke still gets a legible seal so nothing is ever a
  blank on day one.

### Presentation
- **Shan-shui scroll composition**: y-axis-as-depth staging, atmospheric
  mist bands, perspective convergence toward a vanishing point, and contact
  shadows anchoring matter to the ground.
- **Always-present illustrated valley backdrop** (ridgelines, drifting
  clouds, foreshortened ground grain) — the scroll never looks empty, even
  before anything is written.
- **Windowed roster ledger** (bottom HUD): a scrolling strip of nearby
  characters centered on the current one, with a locked/total counter,
  legible whether the roster is 23 characters or 500.
- **The ink travels**: on lock, the glyph's strokes coalesce into a droplet
  that arcs into the world and blooms into the planted object — character
  and object are visibly the same thing.
- **Motion-parallax camera**: idle drift plus pointer-follow panning, each
  depth layer sliding at its own rate; respects OS `prefers-reduced-motion`
  (with a `?motion=1` playtest override) and freezes while writing.
- **Experimental WebGL 3D pilot** (`?r3d=1`, off by default): a real
  perspective camera with z-buffer occlusion and distance fog, reusing the
  same 2D brush art as billboards — falls back to the 2D renderer
  automatically if WebGL is unavailable, and never touches the default
  path when unset.
- **Consistent cross-device typography**: all Chinese glyph text (title,
  HUD, world seals) renders from an embedded, subsetted webfont, so mobile
  browsers show the same brush-style characters as desktop instead of
  falling back to a generic system serif.

### Persistence & pipeline
- World state autosaves to `localStorage`, versioned and self-healing —
  old saves migrate losslessly, a one-time backup is kept, and corrupted
  entries repair themselves rather than crashing.
- `?reset=1` clears the saved world; `?seed=N` makes world randomness
  reproducible for testing or sharing a scene.
- Every character's stroke data is generated by a content pipeline from
  [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) (open
  stroke-order data), never hand-authored inside the engine.
- The whole game is **one dependency-free HTML file** — `tools/build.mjs`
  concatenates the `src/` modules and embeds the default pack and webfont
  at build time; nothing is fetched at runtime except optional chapter
  packs.

## Data sources & licensing

Character stroke-order/geometry data is derived by `pipeline/` from
[Make Me a Hanzi](https://github.com/skishore/makemeahanzi) (Copyright ©
2016 Shaunak Kishore), itself built on Arphic Technology Co., Ltd.'s font
data under the 1999 Arphic Public License — a free, FSF-recognized
copyleft license, not the separate non-commercial 2010 revision. The
license attaches to the pack data the pipeline emits, not to the engine
(which contains zero character data). Full license text, attribution, and
compliance notes: `LICENSE-ARPHIC.txt` (repo root); the embedded webfont
has its own license in `fonts/OFL.txt`.

## Query parameters

| Param | Effect |
|---|---|
| `?reset=1` | Clear the saved world and start fresh |
| `?char=X` | Pin the stage to one character (e.g. `?char=火`) |
| `?pack=url[,url...]` | Load one or more chapter packs (e.g. `?pack=/packs/core.json,/packs/basic.json` for the 500-tier) |
| `?seed=N` | Deterministic world randomness |
| `?e2=0` / `?e2=1` | Force ecology E2 (ignition) off/on, overriding the shipped default |
| `?motion=1` | Force camera motion on regardless of OS reduced-motion setting |
| `?r3d=1` | Enable the experimental WebGL 3D pilot |

## Project layout

- `src/` — modular engine source (`00-config.js` … `14-webgl.js`); the
  shipped `inkblade-*.html` is generated, not hand-edited.
- `tools/build.mjs` — the single-file build.
- `packs/` — generated character data (`core.json` embedded, `basic.json`
  the 500-char tier).
- `pipeline/` — the Make Me a Hanzi → pack derivation pipeline.
- `fonts/` — the embedded webfont subset + license/provenance.
- `tests/` — the regression suite (real dispatched pointer events via
  Puppeteer; see `tests/README.md`).
- `site/` — the GitHub Pages landing page.

## Design documentation

This README covers *what's built*. For *why* and *what's next*:
- `inkblade-charter-v1.md` — the single source of design truth (thesis,
  formal model, decision log).
- `inkblade-roadmap.md` — the milestone-by-milestone build history and
  session resume index.
- `CLAUDE.md` — contributor/session working agreements.
