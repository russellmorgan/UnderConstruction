// Procedural placeholder SFX via Web Audio oscillators — no audio files.
// Isolated on purpose: swap the tone-generation bodies for real sound.play() calls
// later without touching game logic that calls pegHit()/scoreHit()/comboBreak().
export default class AudioFeedback {
  constructor() {
    this.ctx = null;
  }

  getContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  tone(freq, duration, { type = 'sine', gain = 0.15 } = {}) {
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

  pegHit() {
    this.tone(440, 0.05, { type: 'square', gain: 0.05 });
  }

  // comboStep: 0, 1, 2... — pitch rises with each consecutive combo step.
  scoreHit(comboStep = 0) {
    this.tone(660 + comboStep * 110, 0.18, { type: 'triangle', gain: 0.18 });
  }

  comboBreak() {
    this.tone(180, 0.3, { type: 'sawtooth', gain: 0.15 });
  }

  bonusBall() {
    this.tone(920, 0.22, { type: 'triangle', gain: 0.2 });
  }
}
