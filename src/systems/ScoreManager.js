export default class ScoreManager {
  constructor(scene, x, y, initialScore = 0) {
    this.score = initialScore;
    this.text = scene.add.text(x, y, `Score: ${this.score}`, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#ffffff',
    });
  }

  add(points) {
    this.score += points;
    this.text.setText(`Score: ${this.score}`);
  }

  reset() {
    this.score = 0;
    this.text.setText('Score: 0');
  }
}
