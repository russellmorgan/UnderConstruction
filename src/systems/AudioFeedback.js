// Sound cue dispatcher — mixes pre-recorded samples (peg hits via Phaser sound) with
// procedural Web Audio oscillator tones (score cues, ball pop). Game logic
// calls named methods, never touches sound.play() or oscillators directly.
import { isSoundOn } from './AudioSettings.js';

// Sampled plank impacts for the base peg hit — randomized so the same peg never
// sounds identical twice in a row.
const PLANK_HIT_KEYS = ['impact_plank_0', 'impact_plank_1', 'impact_plank_2', 'impact_plank_3', 'impact_plank_4'];

// Mix of real sample playback (peg hits) and procedural Web Audio oscillators
// (score cues) — isolated here so game logic only ever calls
// pegHit()/specialPegHit()/deadBallHit()/scoreHit() and never touches
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

  // Play a single oscillator tone at the given frequency and duration. Type and gain configurable.
  tone(freq, duration, { type = 'sine', gain = 0.15 } = {}) {
    if (!isSoundOn()) return;
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(amp).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  // Play a random sampled plank hit for a base peg collision.
  pegHit() {
    if (!isSoundOn()) return;
    const key = PLANK_HIT_KEYS[Math.floor(Math.random() * PLANK_HIT_KEYS.length)];
    this.scene.sound.play(key, { volume: 0.5 });
  }

  // Reward (multiplier) pegs get a brighter, heavier cue than a plain plank hit so
  // they read as special.
  // Play a brighter glass impact for reward-tier peg hits.
  specialPegHit() {
    if (!isSoundOn()) return;
    this.scene.sound.play('impact_glass_heavy', { volume: 0.6 });
  }

  // Placeholder sample until final SFX are picked — the hazard/dead-ball peg keeps
  // its own distinct hit, layered with the descending ballPop() tone below.
  // Play a hurt/hit sample for the hazard peg collision.
  deadBallHit() {
    if (!isSoundOn()) return;
    this.scene.sound.play('hit_hurt', { volume: 0.7 });
  }

  // carryStep: 0, 1, 2... — pitch rises with the carry multiplier.
  // Rising-pitch triangle tone: pitch increases with carry multiplier.
  scoreHit(carryStep = 0) {
    this.tone(660 + carryStep * 110, 0.18, { type: 'triangle', gain: 0.18 });
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
}
