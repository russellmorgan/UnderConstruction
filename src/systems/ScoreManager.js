// Running score display — tracks a numeric total and renders it as labelled or bare text.
// No Phaser import here (unlike carnival.js's bounceScale) — kept duck-typed against a
// scene stub so it can be unit tested under Node without a DOM/window.
import { JUICE, TEXT_RESOLUTION } from '../config/gameConfig.js';

const DEFAULT_STYLE = { fontFamily: 'monospace', fontSize: '13px', color: '#ffffff', resolution: TEXT_RESOLUTION };

export default class ScoreManager {
  // opts.label: prefix shown before the number (null for a bare number, e.g. when the
  // HUD plaque already labels it). opts.style: Phaser text style override.
  constructor(scene, x, y, initialScore = 0, opts = {}) {
    this.scene = scene;
    this.score = initialScore;
    this.label = opts.label === undefined ? 'Score' : opts.label;
    this.text = scene.add.text(x, y, this.format(), { ...DEFAULT_STYLE, ...opts.style });
  }

  // Return the display string — either "label: score" or bare score.
  format() {
    return this.label ? `${this.label}: ${this.score}` : String(this.score);
  }

  // Add points to the running total and update the display.
  add(points) {
    this.score += points;
    this.text.setText(this.format());
  }

  // Bounce the score text on a scoring-zone landing: grow up, then settle back to 1x.
  bounce() {
    this.scene.tweens.killTweensOf(this.text);
    this.text.setScale(1);
    this.scene.tweens.add({
      targets: this.text,
      scale: JUICE.scoreBounce.scale,
      duration: JUICE.scoreBounce.duration / 2,
      ease: 'Sine.easeInOut',
      yoyo: true,
    });
  }

  // Zero out the score and update the display.
  reset() {
    this.score = 0;
    this.text.setText(this.format());
  }
}
