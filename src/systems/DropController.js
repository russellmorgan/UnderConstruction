// Handles horizontal drop-position input — two modes (drag-to-aim or timed sweep),
// renders a brass chute indicator with a dashed drop line, and fires onDrop(x) on release.
import Phaser from 'phaser';
import { BOARD_WIDTH, CARNIVAL, PEG_FIELD, TIMED_DROP } from '../config/gameConfig.js';
import { DEPTH } from '../ui/GameHud.js';

// Handles horizontal drop-position selection, then fires onDrop(x) on confirm.
// Two modes, switched by TIMED_DROP.enabled:
//  - drag mode (default): drag/click along the top edge, release to drop where aimed.
//  - timed mode: indicator sweeps back and forth on its own, any tap/click drops now.
export default class DropController {
  // Set up input listeners and the visual indicator. Two modes: drag (default) or timed sweep.
  constructor(scene, onDrop) {
    this.scene = scene;
    this.onDrop = onDrop;
    this.enabled = true;
    this.minX = PEG_FIELD.sideMargin;
    this.maxX = BOARD_WIDTH - PEG_FIELD.sideMargin;
    this.x = BOARD_WIDTH / 2;
    this.timed = TIMED_DROP.enabled;

    this.indicator = this.createIndicator(scene);

    if (this.timed) {
      this.sweepTween = this.createSweepTween(scene);
      scene.input.on('pointerdown', this.handleRelease, this);
    } else {
      scene.input.on('pointermove', this.handleMove, this);
      scene.input.on('pointerup', this.handleRelease, this);
    }

    this.onKeySpace = () => this.handleRelease();
    scene.input.keyboard.on('keydown-SPACE', this.onKeySpace);
  }

  // An auto-sweeping tween for timed-drop mode — bounces left-right on a sine ease.
  createSweepTween(scene) {
    const proxy = { x: this.x };
    return scene.tweens.add({
      targets: proxy,
      x: { from: this.minX, to: this.maxX },
      duration: TIMED_DROP.sweepMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.x = proxy.x;
        this.indicator.x = this.x;
      },
    });
  }

  // A brass chute marker hanging off the header rail, with a dashed drop line down to
  // the top of the peg field so the aim reads without covering any of the play area.
  // Build the brass chute marker + dashed drop line and a gentle bob tween.
  createIndicator(scene) {
    const container = scene.add.container(this.x, 0).setDepth(DEPTH.label);
    const g = scene.add.graphics();

    // Shifted down from the header's own top edge (y=0) so the chute marker clears the
    // board/balls plaques in GameHud's header chrome (signPanel spans roughly y=3–57) —
    // undropped, this used to visually overlap those plaques.
    const topOffset = 48;

    g.fillStyle(CARNIVAL.gold, 1);
    g.fillTriangle(-9, 26 + topOffset, 9, 26 + topOffset, 0, 42 + topOffset);
    g.fillStyle(CARNIVAL.goldLight, 1);
    g.fillTriangle(-5, 27 + topOffset, 5, 27 + topOffset, 0, 36 + topOffset);
    g.fillStyle(CARNIVAL.wire, 1);
    g.fillRect(-1, 14 + topOffset, 2, 12);

    g.lineStyle(1, CARNIVAL.gold, 0.4);
    for (let y = 48 + topOffset; y < PEG_FIELD.topMargin - 12; y += 10) {
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

  // Constrain x to the playable horizontal range.
  clamp(x) {
    return Phaser.Math.Clamp(x, this.minX, this.maxX);
  }

  // Drag: follow the pointer while held.
  handleMove(pointer) {
    if (!this.enabled) return;
    this.x = this.clamp(pointer.x);
    this.indicator.x = this.x;
  }

  // Confirm the drop at the current x position. Used by pointer and keyboard (space) triggers.
  handleRelease(pointer) {
    if (!this.enabled) return;
    if (pointer && !this.timed) {
      this.x = this.clamp(pointer.x);
      this.indicator.x = this.x;
    }
    this.scene.sound.play('laser_shoot');
    this.onDrop(this.x);
  }

  // Toggle input listening and indicator visibility (disabled while a ball is falling).
  setEnabled(enabled) {
    this.enabled = enabled;
    this.indicator.setVisible(enabled);
    if (this.sweepTween) {
      if (enabled) this.sweepTween.resume();
      else this.sweepTween.pause();
    }
  }

  // Tear down input listeners and tweens. Called when the scene shuts down.
  destroy() {
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.off('keydown-SPACE', this.onKeySpace);
    }
    if (this.timed) {
      this.scene.input.off('pointerdown', this.handleRelease, this);
    } else {
      this.scene.input.off('pointermove', this.handleMove, this);
      this.scene.input.off('pointerup', this.handleRelease, this);
    }
    if (this.sweepTween) this.sweepTween.stop();
  }
}
