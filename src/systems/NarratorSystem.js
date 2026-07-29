// Timed on-screen commentary — fires random barker lines at irregular intervals (based on
// drop count) from two pools (below/above score threshold), auto-clears after 3s.
import Phaser from 'phaser';
import { NARRATOR } from '../config/gameConfig.js';
import { BELOW_THRESHOLD_LINES, ABOVE_THRESHOLD_LINES } from '../data/narratorLines.js';

export default class NarratorSystem {
  // opts.style overrides the text style; opts.onChange(line) fires whenever the visible
  // line changes (empty string when it clears), so the UI can show/hide its own frame.
  constructor(scene, x, y, width, opts = {}) {
    this.scene = scene;
    this.dropCount = 0;
    this.nextTrigger = this.rollNextTrigger();
    this.onChange = opts.onChange;
    this.text = scene.add.text(x, y, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffe14d',
      wordWrap: { width },
      ...opts.style,
    });
    this.hideTimer = null;
  }

  // Roll a random number of drops before the next line fires (within NARRATOR bounds).
  rollNextTrigger() {
    const { minDropsBetweenLines, maxDropsBetweenLines } = NARRATOR;
    return Phaser.Math.Between(minDropsBetweenLines, maxDropsBetweenLines);
  }

  // Count drops; fire a line when the trigger count is reached, picking from the appropriate pool.
  onDrop(currentScore) {
    this.dropCount++;
    if (this.dropCount < this.nextTrigger) return;

    this.dropCount = 0;
    this.nextTrigger = this.rollNextTrigger();

    const pool = currentScore >= NARRATOR.scoreThreshold ? ABOVE_THRESHOLD_LINES : BELOW_THRESHOLD_LINES;
    const line = Phaser.Utils.Array.GetRandom(pool);
    this.show(line);
  }

  // Display a line and schedule its auto-clear after 3 seconds.
  show(line) {
    this.text.setText(line);
    this.onChange?.(line);
    if (this.hideTimer) this.hideTimer.remove();
    this.hideTimer = this.scene.time.delayedCall(3000, () => {
      this.text.setText('');
      this.onChange?.('');
    });
  }

  // Immediately clear the current line and hide the sign, cancelling the pending auto-hide.
  clear() {
    if (this.hideTimer) this.hideTimer.remove();
    this.hideTimer = null;
    this.text.setText('');
    this.onChange?.('');
  }
}
