import Phaser from 'phaser';
import { BOARD_WIDTH, CARNIVAL, PEG_FIELD } from '../config/gameConfig.js';
import { DEPTH } from '../ui/GameHud.js';

// Handles horizontal drop-position selection via drag/click along the top edge,
// then fires onDrop(x) when the player confirms (release).
export default class DropController {
  constructor(scene, onDrop) {
    this.scene = scene;
    this.onDrop = onDrop;
    this.enabled = true;
    this.minX = PEG_FIELD.sideMargin;
    this.maxX = BOARD_WIDTH - PEG_FIELD.sideMargin;
    this.x = BOARD_WIDTH / 2;

    this.indicator = this.createIndicator(scene);

    scene.input.on('pointermove', this.handleMove, this);
    scene.input.on('pointerup', this.handleRelease, this);
  }

  // A brass chute marker hanging off the header rail, with a dashed drop line down to
  // the top of the peg field so the aim reads without covering any of the play area.
  createIndicator(scene) {
    const container = scene.add.container(this.x, 0).setDepth(DEPTH.label);
    const g = scene.add.graphics();

    g.fillStyle(CARNIVAL.gold, 1);
    g.fillTriangle(-9, 26, 9, 26, 0, 42);
    g.fillStyle(CARNIVAL.goldLight, 1);
    g.fillTriangle(-5, 27, 5, 27, 0, 36);
    g.fillStyle(CARNIVAL.wire, 1);
    g.fillRect(-1, 14, 2, 12);

    g.lineStyle(1, CARNIVAL.gold, 0.4);
    for (let y = 48; y < PEG_FIELD.topMargin - 12; y += 10) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(0, y + 5);
      g.strokePath();
    }

    container.add(g);
    scene.tweens.add({
      targets: container,
      y: { from: 0, to: 3 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    return container;
  }

  clamp(x) {
    return Phaser.Math.Clamp(x, this.minX, this.maxX);
  }

  handleMove(pointer) {
    if (!this.enabled) return;
    this.x = this.clamp(pointer.x);
    this.indicator.x = this.x;
  }

  handleRelease(pointer) {
    if (!this.enabled) return;
    this.x = this.clamp(pointer.x);
    this.indicator.x = this.x;
    this.scene.sound.play('laser_shoot');
    this.onDrop(this.x);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.indicator.setVisible(enabled);
  }

  destroy() {
    this.scene.input.off('pointermove', this.handleMove, this);
    this.scene.input.off('pointerup', this.handleRelease, this);
  }
}
