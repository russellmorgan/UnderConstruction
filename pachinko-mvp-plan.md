# Pachinko/Peggle-style Web Game — MVP Plan

**Working title: "Under Construction"** (provisional — dev-time placeholder only, not locked as the ship name. Other candidates under consideration: FINAL_v2_REAL, Top 8, New Message (1).)

Phaser + Matter.js. Goal: fast, data-driven signal test — not a breakout hit, just real activity to measure against.

## Theme & art direction (locked)

Meta-aware narrator — comments on its own genre tropes, the score-gate mechanic it's running on, and the reality that this is a fast, cheap web game. Art direction: intentionally lo-fi, MySpace/early-2000s-web pastiche (tiled backgrounds, marquee text, mismatched fonts, fake hit counter) — reinforces the narrator's self-aware bit rather than sitting apart from it.

Guardrails:
- Irony/crappiness confined to UI chrome and decoration only. Ball/peg/physics elements stay visually clean — don't let the joke read as "the game is broken."
- Needs curation, not just janky-by-default: the specific 2000s-web signifiers (marquee scroll, starfield cursor, Comic Sans, visitor counter) are what make it read as authored irony instead of actually bad. Build a reference board before asset work starts.
- Audience skews toward people old enough to remember MySpace (roughly late 20s–mid 40s) — the joke doesn't land without that context. Keep in mind when judging early feedback.

## Priority tasks

1. **Core physics loop** — ball drop, peg field, gravity/restitution tuning, scoring slots. This is the actual risk in the project; budget real iteration time on bounciness/peg spacing, not one afternoon.
2. **Score system** — running total, persisted across drops within a session.
3. **Narrator trigger system** — counter fires every 5-8 drops (random within range); on trigger, check score against threshold; pull a line from "below threshold" or "neutral/above" pool.
4. **Narrator seed content** — Russell writes 15-20 seed lines to lock tone/voice before any AI-assisted extension.
5. **Playtest pass #1** — determine what a "bad" score actually feels like on this board; set the real threshold from data, not guess.
6. **Playtest pass #2** — check narrator trigger timing/feel; if immediate-shot commentary feels mistimed against cumulative score, revisit rolling-window trigger instead of global threshold (don't build this preemptively).
7. **Narrator line expansion** — once voice is locked from seed lines, extend line pool with AI assistance matching established tone.
8. **Ship v1 / measure activity** — this is the actual checkpoint. Decide in advance what "activity" needs to show to be worth continuing investment (traffic source, session count, whatever the real bar is).
9. ✅ **Scoring persistence** — high score stored across sessions via a swappable platform adapter (`getActiveAdapter()`), not hardcoded storage calls in game logic.
10. ✅ **Scene flow** — real Phaser scenes: MenuScene (title, high score, start) → GameScene (unchanged MVP gameplay) → ResultsScene (final score, high-score check/persist, replay/menu).
11. ✅ **CrazyGames adapter stub** — `CrazyGamesAdapter` matches the `PlatformAdapter` interface with TODO-marked method bodies; flipping `getActiveAdapter()` to it is the only change needed once the real SDK is wired up.
12. ✅ **Scale Manager** — Phaser Scale Manager configured in FIT mode with auto-centering, for responsive embed sizing ahead of CrazyGames distribution.

## Explicitly deferred / cut for v1

- Aim/launcher layer (Peggle-style skill shot) — v2 decision point after physics feel is validated.
- Voice-acted narrator lines — text only for v1, audio is a cost decision for later.
- Multiple boards/levels — one well-tuned board first.

## Open decisions

- Exact score threshold for "bad" trigger pool — set from playtest data, not upfront.
- Global cumulative threshold vs. rolling recent-performance window — default to cumulative, revisit only if playtesting shows mistimed comments.

## Phase 3 — Combo & juice pass

1. ✅ **Combo/multiplier system** — each slot in `SLOTS.zones` (`gameConfig.js`) carries `comboQualifies` (1000/5000 zones qualify, 100/500/gutter don't). `ComboManager` tracks a session multiplier starting at 1x, +0.5x per consecutive qualifying landing, capped at 3x, hard reset to 1x on any non-qualifying landing (including the floor). The multiplier applied to a landing is the value in effect *before* that landing's own increment/reset, so the first qualifying hit scores at 1x and the streak compounds from there. Displayed live next to the score.
2. ✅ **Visual juice** — `cameras.main.shake` on every peg hit (subtle) and every scoring landing (stronger, scaled by the applied multiplier). Particle burst on scoring landings via `this.add.particles` with a Graphics-drawn dot texture, burst size and color (cyan → yellow) both scaling with multiplier. Combo break triggers a red `cameras.main.flash`.
3. ✅ **Procedural audio** — `src/systems/AudioFeedback.js` is a standalone Web Audio oscillator module (no audio files): light blip on peg hits, chime on scoring with pitch rising per combo step, distinct low tone on combo break. Replaces the old `hit_hurt`/`pickup_coin` wav calls in `GameScene`; isolated so it can be swapped for real SFX later without touching game logic.
4. ✅ **Near-miss highlight** — landing-x heuristic in `GameScene.checkNearMiss`: if the ball lands just outside the top-value zone's boundary (within `JUICE.nearMissMargin`), the narrator text flashes "So close!". Approximate by design (landing position, not full trajectory) to keep the geometry simple.

Verified manually in-browser: multiplier climbs 1.0x → 1.5x → 2.0x across consecutive qualifying drops, score reflects the multiplied award each time, and a gutter landing applies the pre-reset multiplier then hard-resets the combo to 1.0x.
