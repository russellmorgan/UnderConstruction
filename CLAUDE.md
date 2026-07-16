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

There is no test suite, linter, or type checker configured in this repo. Test functionality when possible but defer to user to test systems that rely on physics system as those are difficult to observe.

## Deployment

Pushes to the `dev` branch auto-deploy to GitHub Pages via [.github/workflows/deploy.yml](.github/workflows/deploy.yml) (`npm ci && npm run build`, then publish `dist/`). `vite.config.js` sets `base: '/UnderConstruction/'` to match the Pages path — keep this in sync if the repo is renamed.

## Architecture

**Scene flow** (`src/scenes/`): `BootScene` (preloads audio, uses `import.meta.env.BASE_URL`) → `MenuScene` → `GameScene` (core gameplay) → `ResultsScene`. `PauseScene` is launched on top of `GameScene` (via `scene.launch`, not `scene.start`) when Esc is pressed, so `GameScene` state is preserved underneath.

**GameScene is the orchestrator.** It owns the Matter world and wires together a set of small, single-responsibility systems (`src/systems/`) rather than putting game logic in the scene itself:
- `PegField.createPegField` — builds the static peg grid
- `DropController` — turns pointer input into an x-position callback for spawning a ball; disabled while a ball is in play
- `ScoreManager` — running score + display
- `ComboManager` — multiplier state machine (`registerLanding(qualifies)` returns `{ appliedMultiplier, broke }`)
- `BonusBallManager` — evaluates the three independent bonus-ball rules (outer-zone landing, score-threshold crossing, combo-tier milestone) and returns a count to award
- `NarratorSystem` — timed on-screen commentary lines, driven by `narratorLines.js` data
- `AudioFeedback` — sound cue selection (e.g. pitch/sample tied to combo tier)

**Collision-driven scoring**: zones are Matter sensor bodies labeled `slot-<value>` with `comboQualifies`/`grantsBonusBall` data flags set in `createSlots()`. `GameScene.handleCollisions` listens for `collisionstart` on the Matter world and dispatches to `resolveDrop()`. A ball only ever resolves once per drop (`ballInPlay` guard) even if it straddles two sensors in the same physics step. A sensor floor (`label: 'floor'`) and invisible side walls exist purely as a safety net so a ball can never leave play without scoring.

**Tunable constants live in one place**: [src/config/gameConfig.js](src/config/gameConfig.js) holds board size, physics bodies, peg field layout, zone values/flags, combo step/cap, "juice" (camera shake, particles, flash) tuning, bonus ball thresholds, narrator timing, and the storage key. Playtest tuning should happen here, not by editing scene/system code.

**Platform abstraction** (`src/platform/`): `PlatformAdapter` is the interface (`init`, `getHighScore`, `setHighScore`) all adapters implement; `LocalStorageAdapter` is the current implementation, `CrazyGamesAdapter` is a stub for a future integration. `index.js#getActiveAdapter()` is the single switch point — swap the returned adapter there when CrazyGames support is ready, rather than branching elsewhere.
