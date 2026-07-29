// Running score display — tracks a numeric total and renders it as labelled or bare text.
const DEFAULT_STYLE = { fontFamily: 'monospace', fontSize: '13px', color: '#ffffff' };

export default class ScoreManager {
  // opts.label: prefix shown before the number (null for a bare number, e.g. when the
  // HUD plaque already labels it). opts.style: Phaser text style override.
  constructor(scene, x, y, initialScore = 0, opts = {}) {
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

  // Zero out the score and update the display.
  reset() {
    this.score = 0;
    this.text.setText(this.format());
  }
}
