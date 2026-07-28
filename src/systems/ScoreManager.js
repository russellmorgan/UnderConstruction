const DEFAULT_STYLE = { fontFamily: 'monospace', fontSize: '13px', color: '#ffffff' };

export default class ScoreManager {
  // opts.label: prefix shown before the number (null for a bare number, e.g. when the
  // HUD plaque already labels it). opts.style: Phaser text style override.
  constructor(scene, x, y, initialScore = 0, opts = {}) {
    this.score = initialScore;
    this.label = opts.label === undefined ? 'Score' : opts.label;
    this.text = scene.add.text(x, y, this.format(), { ...DEFAULT_STYLE, ...opts.style });
  }

  format() {
    return this.label ? `${this.label}: ${this.score}` : String(this.score);
  }

  add(points) {
    this.score += points;
    this.text.setText(this.format());
  }

  reset() {
    this.score = 0;
    this.text.setText(this.format());
  }
}
