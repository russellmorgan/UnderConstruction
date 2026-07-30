import { describe, it, expect } from 'vitest';
import BonusBallManager from './BonusBallManager.js';

describe('BonusBallManager', () => {
  it('awards one ball per zone landing until the session cap', () => {
    const mgr = new BonusBallManager();
    for (let i = 0; i < 5; i++) expect(mgr.evaluateZone(true)).toBe(1);
    expect(mgr.capReached).toBe(true);
    expect(mgr.evaluateZone(true)).toBe(0);
  });

  it('ignores non-qualifying zone landings', () => {
    const mgr = new BonusBallManager();
    expect(mgr.evaluateZone(false)).toBe(0);
  });

  it('awards one ball per newly-crossed score threshold, respecting remaining cap', () => {
    const mgr = new BonusBallManager();
    expect(mgr.evaluateScoreThreshold(500)).toBe(1);
    expect(mgr.evaluateScoreThreshold(500)).toBe(0);
    expect(mgr.evaluateScoreThreshold(2500)).toBe(4);
    expect(mgr.evaluateScoreThreshold(3000)).toBe(0);
  });

  it('does not re-award thresholds already crossed on carried-over score', () => {
    const mgr = new BonusBallManager(500);
    expect(mgr.evaluateScoreThreshold(500)).toBe(0);
    expect(mgr.evaluateScoreThreshold(1000)).toBe(1);
  });
});
