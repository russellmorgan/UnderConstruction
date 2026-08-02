import { describe, it, expect } from 'vitest';
import BonusBallManager from './BonusBallManager.js';

describe('BonusBallManager', () => {
  it('awards one ball per newly-crossed fraction of the board target, respecting the threshold cap', () => {
    // boardTarget 20000 * targetFraction 0.25 => interval 5000. maxFromThreshold 3.
    const mgr = new BonusBallManager(20000);
    expect(mgr.evaluateScoreThreshold(5000)).toBe(1);
    expect(mgr.evaluateScoreThreshold(5000)).toBe(0);
    expect(mgr.evaluateScoreThreshold(25000)).toBe(2);
    expect(mgr.evaluateScoreThreshold(30000)).toBe(0);
  });

  it('does not award past the threshold cap once thresholds outrun it', () => {
    const mgr = new BonusBallManager(20000);
    expect(mgr.evaluateScoreThreshold(25000)).toBe(3);
    expect(mgr.capReached).toBe(true);
    expect(mgr.evaluateScoreThreshold(50000)).toBe(0);
  });

  it('awards nothing from thresholds when boardTarget is zero or negative', () => {
    expect(new BonusBallManager(0).evaluateScoreThreshold(5000)).toBe(0);
    expect(new BonusBallManager(-1000).evaluateScoreThreshold(5000)).toBe(0);
  });
});
