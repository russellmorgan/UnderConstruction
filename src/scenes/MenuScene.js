import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../config/gameConfig.js';
import { getActiveAdapter } from '../platform/index.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.add
      .text(BOARD_WIDTH / 2, 200, 'Under Construction', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#ffe14d',
      })
      .setOrigin(0.5);

    this.highScoreText = this.add
      .text(BOARD_WIDTH / 2, 250, 'High score: —', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(BOARD_WIDTH / 2, BOARD_HEIGHT / 2, '[ Start ]', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#00d9ff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.scene.start('GameScene'));

    this.loadHighScore();
  }

  async loadHighScore() {
    const adapter = getActiveAdapter();
    await adapter.init();
    const highScore = await adapter.getHighScore();
    this.highScoreText.setText(`High score: ${highScore}`);
  }
}
