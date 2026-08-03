// Game entry point — creates the Phaser instance with Matter physics, registers all scenes,
// and exposes a dev-only global handle for console jumping during development.
import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT, PHYSICS } from './config/gameConfig.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import BoardClearedScene from './scenes/BoardClearedScene.js';
import ResultsScene from './scenes/ResultsScene.js';
import PauseScene from './scenes/PauseScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#1a1a2e',
  disableVisibilityChange: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // BOARD_WIDTH/BOARD_HEIGHT (9:16) is the design resolution FIT scales from — not a
    // pixel cap. FIT always preserves that aspect ratio, so the canvas grows or shrinks
    // with the viewport (letterboxed to 9:16) instead of being pinned to 480x853 and
    // letterboxed at native size. Phaser 4 has no canvas-resolution knob to counter the
    // resulting CSS upscale on large/HiDPI screens (see TEXT_RESOLUTION above for the
    // text-specific half of that same tradeoff) — responsive sizing wins over pixel
    // sharpness here.
    width: BOARD_WIDTH,
    height: BOARD_HEIGHT,
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: PHYSICS.gravityY },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, GameScene, BoardClearedScene, ResultsScene, PauseScene],
});

// Dev-only handle so a scene/state can be jumped to straight from the console
// (e.g. game.scene.start('ResultsScene', { score: 9000, level: 3 })) when checking UI.
if (import.meta.env.DEV) window.game = game;
