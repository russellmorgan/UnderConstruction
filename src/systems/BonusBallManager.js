// Bonus ball evaluator — score-threshold crossings are the only source, capped by
// BONUS_BALLS.maxFromThreshold.
import { BONUS_BALLS } from '../config/gameConfig.js';

export default class BonusBallManager {
  // Per-board earnings always start at 0, so there's no carried-over count to seed here.
  constructor(boardTarget) {
    this.thresholdAwardedCount = 0;
    this.interval = boardTarget * BONUS_BALLS.targetFraction;
    this.scoreThresholdsCrossed = 0;
  }

  get capReached() {
    return this.thresholdAwardedCount >= BONUS_BALLS.maxFromThreshold;
  }

  // Awards one ball per newly-crossed multiple of this.interval (a fraction of the
  // board's target), capped by BONUS_BALLS.maxFromThreshold. Thresholds crossed while
  // capped are still marked as seen so they can't be re-awarded if the cap ever changes
  // mid-board. A non-positive/non-finite interval (e.g. a board with no target) means
  // the threshold can never be reached, so bail out before dividing by it.
  evaluateScoreThreshold(earnedThisBoard) {
    if (!(this.interval > 0) || !Number.isFinite(this.interval)) return 0;

    const totalCrossed = Math.floor(earnedThisBoard / this.interval);
    const newlyCrossed = totalCrossed - this.scoreThresholdsCrossed;
    this.scoreThresholdsCrossed = totalCrossed;
    if (newlyCrossed <= 0) return 0;

    const remaining = Math.max(0, BONUS_BALLS.maxFromThreshold - this.thresholdAwardedCount);
    const granted = Math.min(newlyCrossed, remaining);
    this.thresholdAwardedCount += granted;
    return granted;
  }
}
