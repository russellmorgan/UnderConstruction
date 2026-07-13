import Phaser from 'phaser';
import { NARRATOR } from '../config/gameConfig.js';
import { BELOW_THRESHOLD_LINES, ABOVE_THRESHOLD_LINES } from '../data/narratorLines.js';

export default class NarratorSystem {
  constructor(scene, x, y, width) {
    this.scene = scene;
    this.dropCount = 0;
    this.nextTrigger = this.rollNextTrigger();
    this.text = scene.add.text(x, y, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffe14d',
      wordWrap: { width },
    });
    this.hideTimer = null;
  }

  rollNextTrigger() {
    const { minDropsBetweenLines, maxDropsBetweenLines } = NARRATOR;
    return Phaser.Math.Between(minDropsBetweenLines, maxDropsBetweenLines);
  }

  onDrop(currentScore) {
    this.dropCount++;
    if (this.dropCount < this.nextTrigger) return;

    this.dropCount = 0;
    this.nextTrigger = this.rollNextTrigger();

    const pool = currentScore >= NARRATOR.scoreThreshold ? ABOVE_THRESHOLD_LINES : BELOW_THRESHOLD_LINES;
    const line = Phaser.Utils.Array.GetRandom(pool);
    this.show(line);
  }

  show(line) {
    this.text.setText(line);
    if (this.hideTimer) this.hideTimer.remove();
    this.hideTimer = this.scene.time.delayedCall(3000, () => this.text.setText(''));
  }
}
