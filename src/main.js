import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT, PHYSICS } from './config/gameConfig.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import BoardClearedScene from './scenes/BoardClearedScene.js';
import ResultsScene from './scenes/ResultsScene.js';
import PauseScene from './scenes/PauseScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#1a1a2e',
  disableVisibilityChange: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
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
