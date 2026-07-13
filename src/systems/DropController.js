import Phaser from 'phaser';
import { BOARD_WIDTH, PEG_FIELD } from '../config/gameConfig.js';

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

    this.indicator = scene.add.rectangle(this.x, 20, 4, 30, 0xffe14d);

    scene.input.on('pointermove', this.handleMove, this);
    scene.input.on('pointerup', this.handleRelease, this);
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
