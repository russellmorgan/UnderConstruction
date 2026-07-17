import Phaser from 'phaser';
import { NARRATOR } from '../config/gameConfig.js';
import { BELOW_THRESHOLD_LINES, ABOVE_THRESHOLD_LINES } from '../data/narratorLines.js';

export default class NarratorSystem {
  constructor(scene, x, y, width) {
    this.scene = scene;
    this.dropCount = 0;
    this.nextTrigger = this.rollNextTrigger();
    this.baseY = y;
    this.text = scene.add.text(x, y, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      wordWrap: { width },
    });
    this.text.setAlpha(0);
    this.hideTimer = null;
    this.currentTween = null;
    this.currentScore = 0;
  }

  rollNextTrigger() {
    const { minDropsBetweenLines, maxDropsBetweenLines } = NARRATOR;
    return Phaser.Math.Between(minDropsBetweenLines, maxDropsBetweenLines);
  }

  onDrop(currentScore) {
    this.currentScore = currentScore;
    this.dropCount++;
    if (this.dropCount < this.nextTrigger) return;

    this.dropCount = 0;
    this.nextTrigger = this.rollNextTrigger();

    const isAbove = currentScore >= NARRATOR.scoreThreshold;
    const pool = isAbove ? ABOVE_THRESHOLD_LINES : BELOW_THRESHOLD_LINES;
    const line = Phaser.Utils.Array.GetRandom(pool);
    this.show(line, isAbove);
  }

  show(line, isAbove, blink) {
    if (this.currentTween) this.currentTween.stop();
    if (this.hideTimer) this.hideTimer.remove();
    this.scene.tweens.killTweensOf(this.text);

    this.text.setAlpha(0);
    this.text.setScale(1);
    this.text.setY(this.baseY);
    this.text.setText(line);

    if (blink) {
      this.text.setColor('#ffffff');
      this.text.setAlpha(1);
      this.currentTween = this.scene.tweens.add({
        targets: this.text,
        alpha: 0,
        duration: 80,
        yoyo: true,
        repeat: 2,
        ease: 'Power0',
      });
    } else {
      this.text.setColor(isAbove ? '#44ff88' : '#ff4466');
      if (isAbove) {
        this.text.setScale(0.9);
        this.currentTween = this.scene.tweens.add({
          targets: this.text,
          alpha: 1,
          scale: 1,
          duration: 250,
          ease: 'Back.easeOut',
        });
      } else {
        this.text.setY(this.baseY - 6);
        this.currentTween = this.scene.tweens.add({
          targets: this.text,
          alpha: 1,
          y: this.baseY,
          duration: 400,
          ease: 'Power2',
        });
      }
    }

    this.hideTimer = this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({
        targets: this.text,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
      });
    });
  }
}
