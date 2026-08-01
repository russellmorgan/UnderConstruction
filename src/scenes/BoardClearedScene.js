// Timed interstitial between boards — shows a "BOARD CLEARED" splash with the running
// score, then auto-transitions to the next GameScene (incremented level, carried score
// and carry multiplier) after BOARD_CLEARED.delayMs.
import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT, BOARD_CLEARED, CARNIVAL } from '../config/gameConfig.js';
import { bulbString, marqueeFrame, signPanel, signText, sway, tentBackdrop, valance } from '../ui/carnival.js';
import { BOARD_CLEARED_LINES } from '../data/narratorLines.js';

// Brief interstitial shown between boards: confirms the clear, then hands off to the
// next board (already-selected data — level/totalScore/carryMultiplier — just passes
// through) after a fixed delay instead of loading it instantly.
export default class BoardClearedScene extends Phaser.Scene {
  constructor() {
    super('BoardClearedScene');
  }

  // Receive level, totalScore, and carryMultiplier passed through from GameScene.
  init(data) {
    this.level = data?.level ?? 1;
    this.totalScore = data?.totalScore ?? 0;
    this.carryMultiplier = data?.carryMultiplier ?? 1;
  }

  // Build the "BOARD CLEARED" splash and schedule the auto-transition to the next GameScene.
  create() {
    tentBackdrop(this, BOARD_WIDTH, BOARD_HEIGHT);
    valance(this, 0, BOARD_WIDTH, 26, 30);
    bulbString(this, 0, 52, BOARD_WIDTH, 52, 14, 16);

    const sign = this.add.container(BOARD_WIDTH / 2, 300);
    sign.add(signPanel(this, 0, 0, 340, 150, { top: CARNIVAL.gold, bottom: 0xc8891f }));
    marqueeFrame(this, 0, 0, 314, 124, 26).forEach((b) => sign.add(b));
    sign.add(signText(this, 0, -34, 'BOARD CLEARED', 26, CARNIVAL.cream));
    sign.add(signText(this, 0, 6, String(this.totalScore), 30, CARNIVAL.cream));
    const line = Phaser.Utils.Array.GetRandom(BOARD_CLEARED_LINES).replace('{level}', this.level);
    sign.add(signText(this, 0, 44, line, 13, CARNIVAL.cream));
    sign.setScale(0);
    this.tweens.add({
      targets: sign,
      scale: 1,
      duration: BOARD_CLEARED.popInMs,
      ease: 'Bounce.easeOut',
    });
    sway(this, sign, 1.8);

    this.time.delayedCall(BOARD_CLEARED.delayMs, () => {
      this.scene.start('GameScene', {
        level: this.level + 1,
        totalScore: this.totalScore,
        carryMultiplier: this.carryMultiplier,
      });
    });
  }
}
