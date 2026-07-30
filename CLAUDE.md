# CLAUDE.md

A Pachinko/Galton-board browser game ("drop your balls"). See [README.md](README.md) for gameplay rules (scoring zones, combo multiplier, bonus balls, near misses).

## Testing

`npm test` runs the vitest suite (`src/systems/*.test.js`). No linter or type checker is configured. Systems that depend on Matter physics are hard to observe programmatically — defer those to the user to playtest.

## Deployment

Pushes to the `dev` branch auto-deploy to GitHub Pages via [.github/workflows/deploy.yml](.github/workflows/deploy.yml). `vite.config.js` sets `base: '/UnderConstruction/'` to match the Pages path — keep this in sync if the repo is renamed.

## Gotchas and rationale

**`PauseScene` is launched, not started** — `scene.launch` on top of `GameScene` when Esc is pressed, so `GameScene` state is preserved underneath. Using `scene.start` would destroy the in-progress game.

**A ball only ever resolves once per drop.** Zones are Matter sensor bodies labeled `slot-<value>`; the `ballInPlay` guard in `GameScene.handleCollisions` prevents double-scoring when a ball straddles two sensors in the same physics step. The sensor floor (`label: 'floor'`) and invisible side walls exist purely as a safety net so a ball can never leave play without scoring — they are not gameplay features.

**Peg legibility hierarchy is deliberate and worth preserving when tuning:** muted brass base pegs → ringed/glowing prize tiers (bronze → silver → gold → diamond, `ring`/`glow` intensity climbing per tier) → the one spiked hazard peg, all under a deliberately low-contrast backdrop so a 12px peg still reads. Diamond breaks into cool cyan-white against the otherwise warm palette so the jackpot tier still pops. No reward tier is ever red or black, so the hazard peg's "avoid this" stays unambiguous. `GameScene.failDrop` is the one over-the-top moment in `JUICE` since it ends the drop outright rather than just deducting points.

**Tune in config, not in code.** [src/config/gameConfig.js](src/config/gameConfig.js) holds board size, physics bodies, peg field layout, zone values/flags, combo step/cap, juice tuning, bonus ball thresholds, narrator timing, palette (`CARNIVAL`), and the storage key. Playtest tuning happens here, not by editing scene/system code.

**`getActiveAdapter()` in `src/platform/index.js` is the single switch point** for platform backends. Swap the returned adapter there when CrazyGames support is ready, rather than branching elsewhere.

**GameScene is the orchestrator** — it owns the Matter world and delegates to small single-responsibility systems in `src/systems/`. Keep game logic in those systems rather than in the scene. Visuals are entirely procedural (`src/ui/`) — no image assets; `carnival.js` is the shared kit and `GameHud.js` exports the `DEPTH` bands.
