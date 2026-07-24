import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../config/gameConfig.js';
import { getActiveAdapter } from '../platform/index.js';

export default class ResultsScene extends Phaser.Scene {
  constructor() {
    super('ResultsScene');
  }

  init(data) {
    this.finalScore = data?.score ?? 0;
    this.level = data?.level ?? 1;
  }

  create() {
    this.add
      .text(BOARD_WIDTH / 2, 160, 'Session over', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(BOARD_WIDTH / 2, 210, `Final score: ${this.finalScore}`, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(BOARD_WIDTH / 2, 240, `Reached board ${this.level}`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#aaaaee',
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(BOARD_WIDTH / 2, 270, 'Checking high score…', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffe14d',
      })
      .setOrigin(0.5);

    this.add
      .text(BOARD_WIDTH / 2, 340, '[ Play again ]', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#00d9ff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.scene.start('GameScene'));

    this.add
      .text(BOARD_WIDTH / 2, 390, '[ Menu ]', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#00d9ff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.scene.start('MenuScene'));

    this.resolveHighScore();
  }

  async resolveHighScore() {
    const adapter = getActiveAdapter();
    await adapter.init();
    const previousHigh = await adapter.getHighScore();

    if (this.finalScore > previousHigh) {
      await adapter.setHighScore(this.finalScore);
      this.statusText.setText('New high score!');
    } else {
      this.statusText.setText(`High score: ${previousHigh}`);
    }
  }
}
