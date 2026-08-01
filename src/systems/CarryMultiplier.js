// Carry multiplier — a durable, stacking multiplier collected from mult pegs and
// applied to slot payouts. Deliberately weak (see gameConfig CARRY comment) so a
// maxed board can't outrun PROGRESSION.thresholdGrowth. Pure/no Phaser so it can be
// unit tested and reused by both GameScene (live play) and any board-transition logic.
import { CARRY } from '../config/gameConfig.js';

export default class CarryMultiplier {
  // start defaults to CARRY.start (the pre-any-boost value), but a board transition
  // needs to seed a new instance from carryOver()'s result, hence the parameter.
  constructor(value = CARRY.start) {
    this._value = value;
  }

  // Read-only: the multiplier is only ever moved via applyBoost/carryOver, never
  // set directly, so a getter keeps external code from bypassing the clamp logic.
  get value() {
    return this._value;
  }

  // priorHits > 0 means this exact peg already paid its full boost this board, so
  // re-hits only pay a fraction (repeatHitFactor) — otherwise grinding one diamond
  // peg would out-earn spreading across the board. baseBoost <= 0 (base/penalty
  // pegs carry no multiplier tier) is a no-op. The return value is the boost that
  // actually landed after the CARRY.max clamp, not the requested amount, so callers
  // can tell (e.g. for feedback text) when a hit was wasted at the cap.
  applyBoost(baseBoost, priorHits = 0) {
    if (baseBoost <= 0) return 0;
    const effective = priorHits === 0 ? baseBoost : baseBoost * CARRY.repeatHitFactor;
    const next = Math.min(CARRY.max, this._value + effective);
    const applied = next - this._value;
    this._value = next;
    return applied;
  }

  // The multiplier applies sublinearly (payoutFraction) rather than multiplying a
  // slot's value outright, so a maxed carry can't multiply the jackpot zone by 2.5x.
  payout(points) {
    return Math.round(points * (1 + (this._value - 1) * CARRY.payoutFraction));
  }

  // Only half (carryOverFraction) of the accumulated boost survives a board clear,
  // so stacking is still rewarded but a board-1 max isn't permanent. Clamped to
  // CARRY.start so a fresh board never starts below the game's baseline.
  carryOver() {
    return Math.max(CARRY.start, 1 + (this._value - 1) * CARRY.carryOverFraction);
  }
}
