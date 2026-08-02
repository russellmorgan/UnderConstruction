// Sound cue dispatcher — mixes pre-recorded samples (peg hits via Phaser sound) with
// procedural Web Audio oscillator tones (score cues, ball pop). Game logic
// calls named methods, never touches sound.play() or oscillators directly.
import { PEG_TYPES } from '../config/gameConfig.js';
import { isSoundOn } from './AudioSettings.js';

// Sampled plank impacts for the base peg hit — randomized so the same peg never
// sounds identical twice in a row.
const PLANK_HIT_KEYS = ['impact_plank_0', 'impact_plank_1', 'impact_plank_2', 'impact_plank_3', 'impact_plank_4'];

// Coin-collect samples for the reward tiers, ordered lowest multiplier first:
// mult2 -> coin_1 ... mult5 -> coin_4. Derived from PEG_TYPES rather than hardcoded so
// adding or retuning a tier remaps the audio ladder with it. Exported for BootScene,
// which must preload exactly these keys.
export const COIN_HIT_KEYS = PEG_TYPES.filter((t) => t.scoreMultiplier)
  .sort((a, b) => a.scoreMultiplier - b.scoreMultiplier)
  .map((t, i) => ({ multiplier: t.scoreMultiplier, key: `coin_${i + 1}`, file: `audio/coins/coin-0${i + 1}.ogg` }));

// Lowest tier's sample, used when a reward peg reports a multiplier outside the ladder.
const COIN_FALLBACK_KEY = COIN_HIT_KEYS[0]?.key;

// Mix of real sample playback (peg hits) and procedural Web Audio oscillators
// (score cues) — isolated here so game logic only ever calls
// pegHit()/specialPegHit()/deadBallHit()/ballDrop() and never touches
// sound.play() or oscillators directly.
export default class AudioFeedback {
  // Store the scene for Phaser sound access; AudioContext created lazily.
  constructor(scene) {
    this.scene = scene;
    this.ctx = null;
  }

  // Lazily create / resume the Web Audio context for procedural tones.
  getContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  // Play a random sampled plank hit for a base peg collision.
  pegHit() {
    if (!isSoundOn()) return;
    const key = PLANK_HIT_KEYS[Math.floor(Math.random() * PLANK_HIT_KEYS.length)];
    this.scene.sound.play(key, { volume: 0.5 });
  }

  // Reward (multiplier) pegs play a coin-collect sample chosen by tier — the higher the
  // multiplier, the higher up the coin ladder — so the payoff is audible before the
  // popup is read. Falls back to the lowest tier's sample for an unmapped multiplier.
  specialPegHit(multiplier) {
    if (!isSoundOn()) return;
    const key = COIN_HIT_KEYS.find((c) => c.multiplier === multiplier)?.key ?? COIN_FALLBACK_KEY;
    if (key) this.scene.sound.play(key, { volume: 0.5 });
  }

  // Placeholder sample until final SFX are picked — the hazard/dead-ball peg keeps
  // its own distinct hit, layered with the descending ballPop() tone below.
  // Play a hurt/hit sample for the hazard peg collision.
  deadBallHit() {
    if (!isSoundOn()) return;
    this.scene.sound.play('hit_hurt', { volume: 0.7 });
  }

  // Descending pitch rather than a fixed tone — reads as a deflate/pop, layered under
  // the real 'hit_hurt' sample the hazard peg also plays.
  // Descending sawtooth "deflate" tone layered under the hazard peg's hit sample.
  ballPop() {
    if (!isSoundOn()) return;
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.25);
    amp.gain.setValueAtTime(0.22, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    osc.connect(amp).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  // Play the ball-drop sound when the ball reaches the bottom.
  ballDrop() {
    if (!isSoundOn()) return;
    this.scene.sound.play('ball_drop', { volume: 0.6 });
  }

  // Play the game-over sting when the run ends (board target missed, out of balls).
  gameOver() {
    if (!isSoundOn()) return;
    this.scene.sound.play('end_game', { volume: 0.7 });
  }
}
