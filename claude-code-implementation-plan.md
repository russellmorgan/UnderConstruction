# Pachinko MVP — Claude Code Implementation Plan

Companion to `pachinko-mvp-plan.md` (design decisions). This doc is the engineering spec — hand this to Claude Code to start building. Art and theme are explicitly out of scope here; placeholder shapes/colors only.

## Goal

A playable Phaser web build: player picks a horizontal drop position, ball falls through a peg field under physics, lands in a scoring slot, running score displayed, and a narrator system fires placeholder commentary on a randomized interval gated by score. No art, no sound design, no aim/launcher control beyond drop position.

## Tech stack

- **Engine:** Phaser 3 (latest stable)
- **Physics:** Matter.js, via Phaser's built-in Matter integration. Not Arcade, not Box2D — see rationale below.
- **Build tooling:** Vite (standard modern Phaser starter, fast dev server, minimal config)
- **Language:** Plain JavaScript for v1. TypeScript can be layered in later if desired — not a blocker for this pass.

## Physics engine decision — Matter.js

Rationale, for the record: Arcade Physics uses discrete collision detection, which risks tunneling (ball skipping through a peg between steps) in a dense peg field unless ball speed is capped and pegs oversized — that constrains board design around an engine limitation. Matter does proper collision resolution and ships inside Phaser core, so there's no added integration cost over Arcade. Box2D isn't built into Phaser at all and would require an external plugin/WASM binding — more integration surface for no real capability gain here. If the physics-feel playtest later says Matter is overkill, swapping to Arcade is a contained change since gameplay logic doesn't depend on which backend resolves the bounce.

Starting physics constants (tune from here, not final):
- World gravity: y = 1 (Matter default scale) — adjust until drop speed feels right, likely needs tuning
- Ball: radius 8px, restitution 0.65, friction low
- Pegs: static bodies, radius 6px, restitution 0.7
- Peg field: staggered/offset grid (alternating row offset by half spacing) — standard pachinko/peggle layout. Start with ~8 rows, spacing ~40px, adjust to board width.

## Input model

Player selects horizontal drop position via click/tap or drag along a control at the top of the board (a simple horizontal slider or direct tap-to-position), then confirms/releases to spawn the ball at that x-position with zero initial velocity, letting gravity take over. This is the only player input in v1 — no launcher, no trajectory aim, no power control. That layer is explicitly deferred; see `pachinko-mvp-plan.md`.

## Placeholder asset approach

No image or audio files needed to start. Use Phaser's Graphics API to draw all game objects programmatically:
- Ball: filled circle
- Pegs: filled circles, distinct color from ball
- Scoring slots: colored rectangles/zones at the bottom with visible point values as text
- Drop-position indicator: simple line or arrow marker

Skip sound entirely for this pass — not even placeholder beeps. Add audio when layering in real assets later.

## Project structure

```
src/
  main.js                  # Phaser game config, scene registration
  scenes/
    BootScene.js           # minimal init, straight into GameScene (no asset loading needed yet)
    GameScene.js            # core play loop: board render, drop input, ball lifecycle
  systems/
    ScoreManager.js         # running score state, score display update
    NarratorSystem.js       # drop counter, random 5-8 trigger, score-gate line selection, display
    DropController.js       # handles input for horizontal drop-position selection and ball spawn
    PegField.js              # generates staggered peg layout from config
  data/
    narratorLines.js        # placeholder generic lines array (below-threshold / above-threshold pools)
  config/
    gameConfig.js            # physics constants, peg field params, board dimensions, score thresholds
```

## Build order / milestones

**M0 — Scaffold:** Vite + Phaser project boots, empty Matter-enabled scene renders at target resolution.

**M1 — Core physics loop:** Static peg field generated from config, ball spawns and falls under gravity, collides and bounces off pegs realistically. Acceptance: across 50 consecutive test drops at default speed, zero tunneling incidents (ball passing through a peg without a registered collision).

**M2 — Drop-position input:** Player can select horizontal spawn position via click/drag along the top edge before the ball drops. Acceptance: input feels responsive, position clearly indicated before drop, ball spawns at the selected x.

**M3 — Scoring:** Collision zones at the bottom assign point values on ball landing, running score total displayed and updates correctly. Acceptance: score updates match landing zone value with no double-counting or missed triggers.

**M4 — Narrator trigger system:** Drop counter fires every 5-8 drops (randomized within range each cycle). On trigger, compare current score to a placeholder threshold constant (to be tuned via playtesting per the design doc) and display a random line from the appropriate pool in a simple text UI element. Acceptance: trigger frequency visibly randomized within range across a test session, correct pool selected relative to threshold.

**M5 — Session loop:** Fixed number of balls per session (placeholder count, e.g. 10), end-of-session state showing final score, reset/replay option.

## Acceptance criteria for "MVP complete"

- Full loop playable start to finish: select drop position → ball falls and bounces → lands in scoring slot → score updates → narrator occasionally comments → session ends after fixed ball count → replay available.
- No tunneling or physics glitches across repeated test sessions.
- Zero art/audio dependencies — runs entirely on programmatic shapes and text.
- Score threshold and narrator trigger range exposed as easily-editable constants in `gameConfig.js`, ready for playtest-driven tuning without code restructuring.

## Explicit non-goals for this pass

- No launcher/trajectory/power aim control — drop-position selection only
- No art, sound, or theme/narrator voice content — placeholder shapes and generic lines only
- No persistence/save system beyond a single session
- No mobile-specific input polish or responsive layout
- No multiple boards/levels — one board only
