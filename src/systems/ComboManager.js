import { COMBO } from '../config/gameConfig.js';

// Tracks the session multiplier: +COMBO.step per consecutive qualifying landing
// (capped at COMBO.max), hard reset to 1x on any non-qualifying landing.
export default class ComboManager {
  constructor(scene, x, y) {
    this.multiplier = 1;
    this.text = scene.add.text(x, y, 'Combo: 1.0x', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffe14d',
    });
  }

  // Returns { appliedMultiplier, broke } — appliedMultiplier is the multiplier in
  // effect for the landing just scored (i.e. before this landing's own increment/reset).
  registerLanding(qualifies) {
    const appliedMultiplier = this.multiplier;
    const broke = !qualifies && this.multiplier > 1;

    this.multiplier = qualifies ? Math.min(COMBO.max, this.multiplier + COMBO.step) : 1;
    this.text.setText(`Combo: ${this.multiplier.toFixed(1)}x`);

    return { appliedMultiplier, broke };
  }

  reset() {
    this.multiplier = 1;
    this.text.setText('Combo: 1.0x');
  }
}
