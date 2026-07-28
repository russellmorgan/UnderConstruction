import { describe, it, expect } from 'vitest';
import ComboManager from './ComboManager.js';

const fakeScene = { add: { text: () => ({ setText() {} }) } };

describe('ComboManager', () => {
  it('increments by step on qualifying landings, capped at max', () => {
    const combo = new ComboManager(fakeScene, 0, 0);
    expect(combo.registerLanding(true).appliedMultiplier).toBe(1);
    expect(combo.multiplier).toBe(1.5);
    combo.registerLanding(true);
    combo.registerLanding(true);
    combo.registerLanding(true);
    expect(combo.multiplier).toBe(3);
  });

  it('resets to 1x and reports broke on a non-qualifying landing', () => {
    const combo = new ComboManager(fakeScene, 0, 0);
    combo.registerLanding(true);
    const result = combo.registerLanding(false);
    expect(result.appliedMultiplier).toBe(1.5);
    expect(result.broke).toBe(true);
    expect(combo.multiplier).toBe(1);
  });

  it('does not report broke when already at 1x', () => {
    const combo = new ComboManager(fakeScene, 0, 0);
    expect(combo.registerLanding(false).broke).toBe(false);
  });
});
