# Midway Drop

A game about dropping your balls — a Pachinko/Galton-board browser game built with
Phaser 4 (Matter physics) and Vite.

## How to Play

The drop chute sweeps back and forth across the top of the board on its own. Click, tap,
or press **Space** to release a ball at the chute's current position — it's a timing
game, not an aiming game. The ball bounces down through the peg field and lands in one
of the seven scoring zones at the bottom. Press **Esc** to pause.

You get 10 balls per board. The run ends when you're out of balls and haven't hit the
board's target.

## Rules

- **Scoring zones**: seven zones across the bottom, worth 0 / 500 / 1000 / **2000** /
  1000 / 500 / 0. The two zero-value outer zones are FREE BALL zones (see below).
- **Pegs**: plain brass pegs are worth 5 points. Four reward tiers — bronze, silver,
  gold, diamond — are worth the same 5 points but add to your carry boost. The single
  spiked black-and-yellow hazard peg costs 20 points **and ends the drop instantly**,
  so the ball never reaches a scoring zone.
- **Carry boost**: starts at 1x, caps at 2.5x, and is the only multiplier in the game.
  - Each reward peg adds a boost sized by its tier (bronze smallest, diamond largest).
  - A peg pays its full boost once per board; re-hitting the same peg pays a quarter,
    so you have to spread across the board rather than grind one diamond.
  - It applies **sublinearly** to a landing: you get half the boost's effect, so a maxed
    2.5x boost multiplies a zone by 1.75x, not 2.5x.
  - Half the accumulated boost survives into the next board — stacking is rewarded, but
    one hot board doesn't carry the whole run.
- **Boards**: each board is a randomly-shaped peg field with an earn target. Board 1's
  target is 20,000 points earned **on that board**; every board after multiplies the
  target by 1.6. Hit the target before you run out of balls and you advance with your
  running total and half your boost. Miss it and the run ends.
- **Bonus balls**: up to 5 extra balls per session, from two sources:
  - Landing in either FREE BALL zone (the outer zones, the hardest to hit) grants +1.
  - Every 25% of the current board's target that you earn grants +1 — a single big
    landing can cross several thresholds at once and earns a ball for each.
- **Near misses**: land just outside the top-value zone and the barker will let you know
  how close you were.
- When the run ends, your final score is compared against your saved high score.

## Development

```
npm install
npm run dev      # vite dev server
npm run build    # production build
npm run preview  # serve the build
npm test         # vitest, unit tests for the pure systems
```

Pushes to the `dev` branch auto-deploy to GitHub Pages.

## Keeping the docs in sync

The rules above are a plain-English rendering of the constants in
[src/config/gameConfig.js](src/config/gameConfig.js). **Any change to gameplay balance,
scoring, progression, or controls must be reflected here in the same commit** — a stale
README is worse than no README, because it is read as the source of truth for intent.

[ARCHITECTURE.md](ARCHITECTURE.md) is the companion document for the code itself (what
each file owns, how a drop flows through the systems, where to change what). Update it
whenever a file's responsibility changes, a file is added, split, or removed, or the
scene graph changes. README = rules; ARCHITECTURE = structure; both are load-bearing.
