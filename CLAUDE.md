# Inkblade — session instructions

`inkblade-charter-v1.md` is the single source of truth; `inkblade-roadmap.md`
is the resume index. Read both before working. Disciplines in roadmap §how-to-
resume are binding (plan entry before code, BUILD_ID bump, real pointer
events, full battery, push after ship).

## Playtest checkpoints (John's mandate, S1-D058 — binding)

There are exactly two people on this project: Code (Claude) and John (the
host). Automated batteries prove mechanics; only John's hands prove the game.
Therefore:

- **Every milestone must end at a PLAYTEST CHECKPOINT, and reasonable-size
  chunks of a milestone (roughly each shipped build) get one too.** Code
  decides the best checkpoint locations, but they must come — never ship
  multiple builds of new player-facing behavior without stopping to ask John
  to play.
- **At a checkpoint, STOP and ask John to playtest.** Code may continue in
  parallel with work that is NOT blocked by John's verdict (tests, pipeline,
  refactors, the next build's plan) but must not pile further player-facing
  changes on top of unplaytested ones.
- **Each checkpoint message must contain, concretely:**
  1. **Where** — the exact artifact and URL, including the server command if
     one is needed (e.g. `python3 -m http.server 8000` from the repo root —
     `?pack=` chapter loading DOES NOT work from `file://`).
  2. **How to reach it** — exact query params (`?reset=1`, `?char=火`,
     `?pack=/packs/basic.json`, `?seed=`, `?e2=0`), and any state conditions
     (saves persist in localStorage per origin — `reset=1` clears the world;
     without it you resume the old scroll).
  3. **What's new vs the last snapshot he played** — name the specific
     differences and where on screen/in play they appear, so he knows what
     sets this build apart.
  4. **What to try** — a short script of actions (2–6 steps) that exercises
     the new behavior, with expected timings when clocks are involved (fire
     cycles run minutes; say so).
  5. **What verdict is needed** — what question his playtest answers, and
     what is blocked on it (if anything).
- **Checkpoint verdicts get logged.** John's response becomes a charter entry
  (LOCKED if it rules on design), and open questions marked "needs a John
  playtest verdict" (e.g. OPEN-5) should be attached to a checkpoint rather
  than left floating.

## Running the game (so instructions stay honest)

- Latest artifact = the file named in `BUILD_ID` (`inkblade-<milestone>.html`).
  Only `inkblade-m0.html` / `inkblade-m05.html` / `inkblade-m075.html` are kept
  as frozen snapshots (they're the fixed targets of frozen suites smoke1–4,
  per `tests/README.md`) — opening them shows OLD behavior by design. Every
  other superseded milestone build gets deleted once it's no longer the
  current artifact; git history has the rest if one is ever needed again.
- The embedded default pack is core (23 chars). The 500-char basic tier only
  loads via `?pack=/packs/basic.json` (or `?pack=/packs/core.json,/packs/basic.json`)
  **served over HTTP** — from the repo root: `python3 -m http.server 8000`,
  then `http://localhost:8000/inkblade-m2g.html?...` (swap in whatever
  `BUILD_ID` currently names).
- `?reset=1` = fresh world (clears the persistent scroll). `?char=X` pins the
  stage to one character. `?seed=N` makes world randomness deterministic.
  `?e2=0` kills ignition (E2 is default-ON since S1-D057).
- Fire clocks are real minutes in shipped packs (full fire cycle ≈ 2 min;
  tree burn → regrowth ≈ 4–5 min). Tests use fast-clock fixture packs instead
  of touching shipped tuning.
