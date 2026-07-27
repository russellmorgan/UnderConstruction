# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Pachinko/Galton-board style browser game ("drop your balls") built with Phaser 4 + Matter physics and Vite. See [README.md](README.md) for gameplay rules (scoring zones, combo multiplier, bonus balls, near misses).

## Commands

```
npm run dev       # start Vite dev server
npm run build      # production build to dist/
npm run preview    # preview the production build
```

There is no test suite, linter, or type checker configured in this repo.

## Deployment

Pushes to the `dev` branch auto-deploy to GitHub Pages via [.github/workflows/deploy.yml](.github/workflows/deploy.yml) (`npm ci && npm run build`, then publish `dist/`). `vite.config.js` sets `base: '/UnderConstruction/'` to match the Pages path — keep this in sync if the repo is renamed.

## Architecture

**Scene flow** (`src/scenes/`): `BootScene` (preloads audio, uses `import.meta.env.BASE_URL`) → `MenuScene` → `GameScene` (core gameplay). Clearing a board's earn threshold sends the player to `BoardClearedScene` (a timed interstitial, delay set by `BOARD_CLEARED.delayMs` in config) which then starts a new `GameScene` with the carried score/multiplier and the next board's higher threshold; falling short of the threshold goes to `ResultsScene` instead. `PauseScene` is launched on top of `GameScene` (via `scene.launch`, not `scene.start`) when Esc is pressed, so `GameScene` state is preserved underneath.

**GameScene is the orchestrator.** It owns the Matter world and wires together a set of small, single-responsibility systems (`src/systems/`) rather than putting game logic in the scene itself:
- `PegField.createPegField` — builds the static peg grid
- `DropController` — turns pointer input into an x-position callback for spawning a ball; disabled while a ball is in play
- `ScoreManager` — running score + display
- `ComboManager` — multiplier state machine (`registerLanding(qualifies)` returns `{ appliedMultiplier, broke }`)
- `BonusBallManager` — evaluates the three independent bonus-ball rules (outer-zone landing, score-threshold crossing, combo-tier milestone) and returns a count to award
- `NarratorSystem` — timed on-screen commentary lines, driven by `narratorLines.js` data
- `AudioFeedback` — sound cue selection (e.g. pitch/sample tied to combo tier)

**Collision-driven scoring**: zones are Matter sensor bodies labeled `slot-<value>` with `comboQualifies`/`grantsBonusBall` data flags set in `createSlots()`. `GameScene.handleCollisions` listens for `collisionstart` on the Matter world and dispatches to `resolveDrop()`. A ball only ever resolves once per drop (`ballInPlay` guard) even if it straddles two sensors in the same physics step. A sensor floor (`label: 'floor'`) and invisible side walls exist purely as a safety net so a ball can never leave play without scoring.

**All visuals are procedural** (`src/ui/`): `carnival.js` is the shared kit (striped valances, swagged bulb strings, marquee frames, painted sign panels, ticket-stub buttons, wood posts, vignette, peg textures, sway/flicker tweens) used by every screen — no image assets, everything is Graphics + text. `GameHud.js` owns GameScene's overlay (board backdrop, header plaques, hanging barker sign, slot booth framing, scorekeeper rail) and exports the `DEPTH` bands: backdrop at negative depths, play field at 0, chrome at 5–6, effects at 15, ball at 20.

Pegs are stamped from supersampled textures built once per type and cached in Phaser's texture manager across board restarts (`PegField.pegTextureFor` picks the generator). Reward tiers (`makePegTexture`) read as a prize-shelf ladder — bronze → silver → gold → diamond — with `ring`/`glow` intensity climbing per tier, all defined per-entry on `PEG_TYPES` in gameConfig; diamond deliberately breaks into cool cyan-white against the otherwise warm palette so the jackpot tier still pops. The hazard peg (`hazard: true`) is a wholly separate generator, `makeHazardPegTexture`: spiked silhouette, black/yellow warning stripe, red core, painted "!", plus a live pulsing glow and shiver applied in `PegField.addHazardTells` — no reward tier is ever red or black, so "avoid this" stays unambiguous. `GameScene.failDrop` is the one over-the-top moment in `JUICE` (shockwave, two-tone burst, hard shake/flash, shaking popup) since it ends the drop outright rather than just deducting points. Palette and chrome tuning live in `CARNIVAL` in gameConfig. Legibility hierarchy is deliberate and worth preserving when tuning: muted brass base pegs → ringed/glowing prize tiers → the one spiked hazard peg, all under a deliberately low-contrast backdrop so a 12px peg still reads.

**Tunable constants live in one place**: [src/config/gameConfig.js](src/config/gameConfig.js) holds board size, physics bodies, peg field layout, zone values/flags, combo step/cap, "juice" (camera shake, particles, flash) tuning, bonus ball thresholds, narrator timing, and the storage key. Playtest tuning should happen here, not by editing scene/system code.

**Platform abstraction** (`src/platform/`): `PlatformAdapter` is the interface (`init`, `getHighScore`, `setHighScore`) all adapters implement; `LocalStorageAdapter` is the current implementation, `CrazyGamesAdapter` is a stub for a future integration. `index.js#getActiveAdapter()` is the single switch point — swap the returned adapter there when CrazyGames support is ready, rather than branching elsewhere.
