import { COMBO } from '../config/gameConfig.js';

// Tracks the session multiplier: +COMBO.step per consecutive qualifying landing
// (capped at COMBO.max), hard reset to 1x on any non-qualifying landing.
export default class ComboManager {
  constructor(scene, x, y, style = {}) {
    this.multiplier = 1;
    this.text = scene.add.text(x, y, 'COMBO 1.0x', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#ffe14d',
      ...style,
    });
  }

  // Returns { appliedMultiplier, broke } — appliedMultiplier is the multiplier in
  // effect for the landing just scored (i.e. before this landing's own increment/reset).
  registerLanding(qualifies) {
    const appliedMultiplier = this.multiplier;
    const broke = !qualifies && this.multiplier > 1;

    this.multiplier = qualifies ? Math.min(COMBO.max, this.multiplier + COMBO.step) : 1;
    this.text.setText(`COMBO ${this.multiplier.toFixed(1)}x`);

    return { appliedMultiplier, broke };
  }

  reset() {
    this.multiplier = 1;
    this.text.setText('COMBO 1.0x');
  }
}
