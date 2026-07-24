import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT, BOARD_CLEARED } from '../config/gameConfig.js';

// Brief interstitial shown between boards: confirms the clear, then hands off to the
// next board (already-selected data — level/totalScore/carryMultiplier — just passes
// through) after a fixed delay instead of loading it instantly.
export default class BoardClearedScene extends Phaser.Scene {
  constructor() {
    super('BoardClearedScene');
  }

  init(data) {
    this.level = data?.level ?? 1;
    this.totalScore = data?.totalScore ?? 0;
    this.carryMultiplier = data?.carryMultiplier ?? 1;
  }

  create() {
    this.add
      .text(BOARD_WIDTH / 2, 260, 'BOARD CLEARED', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#7cff7c',
      })
      .setOrigin(0.5);

    this.add
      .text(BOARD_WIDTH / 2, 310, `Score: ${this.totalScore}`, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(BOARD_WIDTH / 2, 340, `Boards cleared: ${this.level}`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#aaaaee',
      })
      .setOrigin(0.5);

    this.time.delayedCall(BOARD_CLEARED.delayMs, () => {
      this.scene.start('GameScene', {
        level: this.level + 1,
        totalScore: this.totalScore,
        carryMultiplier: this.carryMultiplier,
      });
    });
  }
}
