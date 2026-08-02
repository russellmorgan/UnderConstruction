import { describe, it, expect } from 'vitest';
import { thresholdForLevel } from './Progression.js';
import { PROGRESSION } from '../config/gameConfig.js';

describe('thresholdForLevel', () => {
  it('returns the base threshold on board 1', () => {
    expect(thresholdForLevel(1)).toBe(PROGRESSION.baseThreshold);
  });

  it('grows geometrically by thresholdGrowth per board', () => {
    for (const level of [2, 3, 4, 8]) {
      expect(thresholdForLevel(level)).toBe(
        Math.round(PROGRESSION.baseThreshold * PROGRESSION.thresholdGrowth ** (level - 1))
      );
    }
  });

  it('always returns a whole number of points', () => {
    for (let level = 1; level <= 12; level++) {
      expect(Number.isInteger(thresholdForLevel(level))).toBe(true);
    }
  });

  it('is strictly increasing, so a later board is never easier to clear', () => {
    for (let level = 1; level < 12; level++) {
      expect(thresholdForLevel(level + 1)).toBeGreaterThan(thresholdForLevel(level));
    }
  });
});
