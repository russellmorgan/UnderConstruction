export default class ScoreManager {
  constructor(scene, x, y) {
    this.score = 0;
    this.text = scene.add.text(x, y, 'Score: 0', {
      fontFamily: 'monospace',
      fontSize: '20px',
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
