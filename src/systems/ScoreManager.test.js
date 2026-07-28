import { describe, it, expect } from 'vitest';
import ScoreManager from './ScoreManager.js';

const fakeScene = { add: { text: () => ({ setText() {} }) } };

describe('ScoreManager', () => {
  it('starts at the initial score and accumulates added points', () => {
    const score = new ScoreManager(fakeScene, 0, 0, 10);
    score.add(5);
    score.add(3);
    expect(score.score).toBe(18);
  });

  it('resets to zero', () => {
    const score = new ScoreManager(fakeScene, 0, 0, 10);
    score.reset();
    expect(score.score).toBe(0);
  });

  it('formats with a label by default and bare when label is null', () => {
    const labeled = new ScoreManager(fakeScene, 0, 0, 7);
    expect(labeled.format()).toBe('Score: 7');
    const bare = new ScoreManager(fakeScene, 0, 0, 7, { label: null });
    expect(bare.format()).toBe('7');
  });
});
