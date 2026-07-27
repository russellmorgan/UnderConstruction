# Claude Code prompt — Midway Drop UI pass

Copy/paste the block below into Claude Code in this project.

---

**Context:** This is "Midway Drop," a Phaser 3 + Matter.js plinko/peggle-style web game (see `pachinko-mvp-plan.md` for design decisions and `claude-code-implementation-plan.md` for the engineering spec and current project structure — read both before starting). Core physics loop is built and validated. I need you to build the UI layer: `MenuScene`, the HUD overlay inside `GameScene`, and `ResultsScene`.

**Tone and art direction:** Carnival/midway aesthetic — string lights, striped canvas/tent patterns, painted-sign typography, ticket-stub and prize-booth motifs, warm palette (think reds, golds, cream, weathered wood tones — not neon/modern). The narrator is a hybrid: primarily an in-world carnival barker (hypes the player, taunts or celebrates the score, "step right up" energy) with occasional fourth-wall breaks as an exception, not the default mode. Write 8-10 placeholder barker lines yourself to get the visual/text rhythm right — I'll replace these with final copy later, they're just to prove the system out.

**No art assets exist yet and none are in scope for this pass.** Everything must be built with Phaser's Graphics API, generated textures, and text objects — same placeholder-asset approach already used for the physics elements. This is a constraint, not a limitation to work around quietly: use it as the creative problem. Procedural stripes, scalloped borders, gradient "painted sign" panels, ticket-shaped buttons, layered rectangles suggesting depth, subtle idle animation (flickering "lights," gentle sign sway, marquee-style text) — all achievable without image assets if you commit to it. Don't default to flat rectangles with centered text just because it's the safe option.

**Hard constraint — do not violate:** the ball and pegs (physics elements) must stay visually clean and simple, unchanged from their current appearance. The carnival styling is confined to UI chrome and decoration only — menu, HUD frame, buttons, backgrounds, results screen. If the stylization bleeds into the play field, the game reads as "broken," not "styled."

**Scope, in order:**
1. `MenuScene` — title "Midway Drop," start button, current high score (via the existing `PlatformAdapter`/`LocalStorageAdapter` pattern — don't bypass it).
2. `GameScene` HUD overlay — running score, barker narrator text box (should feel like it's part of the midway signage, not a generic dialogue box), drop-position indicator, scoring slot labels. Layer this over the existing physics scene without altering physics/gameplay logic files.
3. `ResultsScene` — final score, high-score comparison and "new high score" state, replay and return-to-menu buttons.

**Respect existing architecture:** scene flow (MenuScene → GameScene → ResultsScene), the `PlatformAdapter` pattern for score persistence, and the Scale Manager (FIT/RESIZE) config already in place — layouts need to hold up under that scaling, not assume a fixed canvas size.

**What I want back:** one confident, complete visual direction across all three screens (not multiple options to choose between) — but take a real creative swing within the constraints above rather than the minimum viable layout. If you make a bold choice I didn't ask for and it's in the spirit of "carnival midway," keep it; flag it in your summary so I know it was a judgment call rather than something I explicitly requested.

---
