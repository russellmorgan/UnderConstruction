// Board progression maths. Pure and Phaser-free so it can be unit tested — GameScene
// only consumes it. Each board is a fresh random shape; the player advances only if the
// score EARNED on that board reaches the level's threshold.
import { PROGRESSION } from '../config/gameConfig.js';

// Per-board earn target: grows geometrically so later boards demand more points to clear.
export function thresholdForLevel(level) {
  return Math.round(PROGRESSION.baseThreshold * PROGRESSION.thresholdGrowth ** (level - 1));
}
