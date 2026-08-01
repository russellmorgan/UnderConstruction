import { describe, it, expect } from 'vitest';
import CarryMultiplier from './CarryMultiplier.js';
import { CARRY } from '../config/gameConfig.js';

describe('CarryMultiplier', () => {
  it('applies the full boost on a peg\'s first hit this board', () => {
    const carry = new CarryMultiplier();
    const baseBoost = 0.32; // diamond tier: stepPerTier * (mult5 - 1)
    const applied = carry.applyBoost(baseBoost, 0);
    expect(applied).toBeCloseTo(baseBoost);
    expect(carry.value).toBeCloseTo(CARRY.start + baseBoost);
  });

  it('scales repeat hits of the same peg by repeatHitFactor', () => {
    const carry = new CarryMultiplier();
    const baseBoost = 0.32;
    const applied = carry.applyBoost(baseBoost, 1);
    expect(applied).toBeCloseTo(baseBoost * CARRY.repeatHitFactor);
    expect(carry.value).toBeCloseTo(CARRY.start + baseBoost * CARRY.repeatHitFactor);
  });

  it('clamps at CARRY.max and returns only the delta actually applied', () => {
    const carry = new CarryMultiplier(2.45);
    const applied = carry.applyBoost(0.32, 0);
    expect(applied).toBeCloseTo(0.05);
    expect(carry.value).toBe(CARRY.max);
    expect(carry.value).toBe(2.5);

    // Already at the cap: any further boost is a full no-op.
    const secondApplied = carry.applyBoost(0.32, 0);
    expect(secondApplied).toBe(0);
    expect(carry.value).toBe(CARRY.max);
  });

  it('treats zero/negative baseBoost as a no-op (base/penalty pegs)', () => {
    const carry = new CarryMultiplier();
    expect(carry.applyBoost(0, 0)).toBe(0);
    expect(carry.applyBoost(-0.1, 0)).toBe(0);
    expect(carry.value).toBe(CARRY.start);
  });

  it('applies the multiplier sublinearly to slot payouts', () => {
    const carry = new CarryMultiplier(2.5);
    expect(carry.payout(2000)).toBe(3500);
    expect(carry.payout(2000)).toBe(
      Math.round(2000 * (1 + (2.5 - 1) * CARRY.payoutFraction))
    );
  });

  it('rounds payout and treats zero points as zero payout', () => {
    const carry = new CarryMultiplier(2.5);
    expect(carry.payout(0)).toBe(0);
  });

  it('carries over half the excess above 1 into the next board', () => {
    const carry = new CarryMultiplier(2.5);
    expect(carry.carryOver()).toBeCloseTo(1 + (2.5 - 1) * CARRY.carryOverFraction);
    expect(carry.carryOver()).toBeCloseTo(1.75);
  });

  it('never carries over below CARRY.start when already at 1', () => {
    const carry = new CarryMultiplier(CARRY.start);
    expect(carry.carryOver()).toBe(CARRY.start);
  });
});
