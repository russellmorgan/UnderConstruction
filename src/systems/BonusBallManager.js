import { BONUS_BALLS } from '../config/gameConfig.js';

// Tracks the three bonus-ball sources (zone, score threshold, combo milestone) against
// a shared session cap. All three sources consume the same pool, evaluated in whatever
// order the caller calls them, so a single landing that qualifies for more than one
// source still can't award past the cap.
export default class BonusBallManager {
  constructor() {
    this.awardedCount = 0;
    this.scoreThresholdsCrossed = 0;
    this.comboMilestoneAwarded = false;
  }

  get capReached() {
    return this.awardedCount >= BONUS_BALLS.maxPerSession;
  }

  remainingCapacity() {
    return Math.max(0, BONUS_BALLS.maxPerSession - this.awardedCount);
  }

  evaluateZone(grantsBonusBall) {
    if (!grantsBonusBall || this.capReached) return 0;
    this.awardedCount += 1;
    return 1;
  }

  // Awards one ball per newly-crossed multiple of scoreInterval, capped by remaining
  // capacity. Thresholds crossed while capped are still marked as seen so they can't
  // be re-awarded once the cap frees up (it never does within a session, but this keeps
  // the bookkeeping correct regardless).
  evaluateScoreThreshold(currentScore) {
    const totalCrossed = Math.floor(currentScore / BONUS_BALLS.scoreInterval);
    const newlyCrossed = totalCrossed - this.scoreThresholdsCrossed;
    this.scoreThresholdsCrossed = totalCrossed;
    if (newlyCrossed <= 0) return 0;

    const granted = Math.min(newlyCrossed, this.remainingCapacity());
    this.awardedCount += granted;
    return granted;
  }

  // Fires once per session the first time the multiplier reaches comboTier — the flag
  // is set on first reach regardless of cap state, so a later reset-and-rebuild to the
  // same tier can never re-trigger it.
  evaluateComboMilestone(currentMultiplier) {
    if (this.comboMilestoneAwarded || currentMultiplier < BONUS_BALLS.comboTier) return 0;
    this.comboMilestoneAwarded = true;
    if (this.capReached) return 0;
    this.awardedCount += 1;
    return 1;
  }
}
