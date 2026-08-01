// Bonus ball evaluator — two independent sources (outer-zone landing, score-threshold
// crossing) all drawing from a shared per-session cap.
import { BONUS_BALLS } from '../config/gameConfig.js';

// Tracks the two bonus-ball sources (zone, score threshold) against a shared session
// cap. Both sources consume the same pool, evaluated in whatever order the caller
// calls them, so a single landing that qualifies for more than one source still can't
// award past the cap.
export default class BonusBallManager {
  // The score-threshold source is gated on a fraction of THIS BOARD's target, not an
  // absolute score, so an inflated economy (high carry, big slots, late boards) can't
  // auto-max the cap in the first few drops the way a flat interval did. Per-board
  // earnings always start at 0, so there's no carried-over count to seed here.
  constructor(boardTarget) {
    this.awardedCount = 0;
    this.interval = boardTarget * BONUS_BALLS.targetFraction;
    this.scoreThresholdsCrossed = 0;
  }

  // True when the session cap on bonus balls has been hit.
  get capReached() {
    return this.awardedCount >= BONUS_BALLS.maxPerSession;
  }

  // How many more bonus balls can be awarded this session.
  remainingCapacity() {
    return Math.max(0, BONUS_BALLS.maxPerSession - this.awardedCount);
  }

  // Award one bonus ball if the landing zone qualifies and the cap hasn't been reached.
  evaluateZone(grantsBonusBall) {
    if (!grantsBonusBall || this.capReached) return 0;
    this.awardedCount += 1;
    return 1;
  }

  // Awards one ball per newly-crossed multiple of this.interval (a fraction of the
  // board's target), capped by remaining capacity. Thresholds crossed while capped are
  // still marked as seen so they can't be re-awarded once the cap frees up (it never
  // does within a session, but this keeps the bookkeeping correct regardless). A
  // non-positive/non-finite interval (e.g. a board with no target) means the threshold
  // can never be reached, so bail out before dividing by it.
  evaluateScoreThreshold(earnedThisBoard) {
    if (!(this.interval > 0) || !Number.isFinite(this.interval)) return 0;

    const totalCrossed = Math.floor(earnedThisBoard / this.interval);
    const newlyCrossed = totalCrossed - this.scoreThresholdsCrossed;
    this.scoreThresholdsCrossed = totalCrossed;
    if (newlyCrossed <= 0) return 0;

    const granted = Math.min(newlyCrossed, this.remainingCapacity());
    this.awardedCount += granted;
    return granted;
  }
}
