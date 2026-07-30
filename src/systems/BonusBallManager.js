// Bonus ball evaluator — two independent sources (outer-zone landing, score-threshold
// crossing) all drawing from a shared per-session cap.
import { BONUS_BALLS } from '../config/gameConfig.js';

// Tracks the two bonus-ball sources (zone, score threshold) against a shared session
// cap. Both sources consume the same pool, evaluated in whatever order the caller
// calls them, so a single landing that qualifies for more than one source still can't
// award past the cap.
export default class BonusBallManager {
  // initialScore lets a new board's manager start from the carried-over total's
  // already-crossed thresholds, so resuming a run doesn't re-award every threshold
  // the player already passed on prior boards in one burst.
  constructor(initialScore = 0) {
    this.awardedCount = 0;
    this.scoreThresholdsCrossed = Math.floor(initialScore / BONUS_BALLS.scoreInterval);
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

  // Awards one ball per newly-crossed multiple of scoreInterval, capped by remaining
  // capacity. Thresholds crossed while capped are still marked as seen so they can't
  // be re-awarded once the cap frees up (it never does within a session, but this keeps
  // the bookkeeping correct regardless).
  // Award one bonus ball per newly-crossed score interval, capped by remaining capacity.
  evaluateScoreThreshold(currentScore) {
    const totalCrossed = Math.floor(currentScore / BONUS_BALLS.scoreInterval);
    const newlyCrossed = totalCrossed - this.scoreThresholdsCrossed;
    this.scoreThresholdsCrossed = totalCrossed;
    if (newlyCrossed <= 0) return 0;

    const granted = Math.min(newlyCrossed, this.remainingCapacity());
    this.awardedCount += granted;
    return granted;
  }
}
