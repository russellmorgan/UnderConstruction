// ponytail: smallest possible check for the one non-trivial new formula (the geometric
// board-advancement threshold). GameScene.js can't be imported outside a browser (Phaser
// needs `window`), so the formula is duplicated here rather than imported — keep this in
// sync with thresholdForLevel in src/scenes/GameScene.js and PROGRESSION in gameConfig.js.
// Run with: node scripts/test-threshold.mjs
import assert from 'node:assert/strict';
import { PROGRESSION } from '../src/config/gameConfig.js';

function thresholdForLevel(level) {
  return Math.round(PROGRESSION.baseThreshold * PROGRESSION.thresholdGrowth ** (level - 1));
}

assert.equal(thresholdForLevel(1), 2000);
assert.equal(thresholdForLevel(2), 2800);
assert.equal(thresholdForLevel(3), 3920);

console.log('test-threshold: ok');
