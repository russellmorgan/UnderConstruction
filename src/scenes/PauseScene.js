import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../config/gameConfig.js';

// Launched on top of a paused GameScene (rather than living inside it) so its
// buttons keep receiving input while GameScene's own update/physics/input are frozen.
export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create() {
    this.add.rectangle(BOARD_WIDTH / 2, BOARD_HEIGHT / 2, BOARD_WIDTH, BOARD_HEIGHT, 0x000000, 0.75);

    this.add
      .text(BOARD_WIDTH / 2, BOARD_HEIGHT / 2 - 60, 'Paused', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(BOARD_WIDTH / 2, BOARD_HEIGHT / 2, '[ Resume ]', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#00d9ff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.resume());

    this.add
      .text(BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 50, '[ Main Menu ]', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#00d9ff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.goToMenu());

    this.input.keyboard.on('keydown-ESC', () => this.resume());
  }

  resume() {
    this.scene.resume('GameScene');
    this.scene.stop();
  }

  goToMenu() {
    this.scene.stop('GameScene');
    this.scene.stop();
    this.scene.start('MenuScene');
  }
}
