import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT, PHYSICS } from './config/gameConfig.js';
import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: BOARD_WIDTH,
  height: BOARD_HEIGHT,
  backgroundColor: '#1a1a2e',
  disableVisibilityChange: true,
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: PHYSICS.gravityY },
      debug: false,
    },
  },
  scene: [BootScene, GameScene],
});
