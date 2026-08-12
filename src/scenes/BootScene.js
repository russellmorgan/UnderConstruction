// First scene: preloads all audio assets (using BASE_URL for the correct path) and
// forces webfont loading before any text renders, then hands off to MenuScene.
import Phaser from 'phaser';
import { COIN_HIT_KEYS } from '../systems/AudioFeedback.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  // Load all audio assets using BASE_URL for the correct asset path.
  preload() {
    this.load.setBaseURL(import.meta.env.BASE_URL);
    this.load.audio('hit_hurt', 'audio/hit_hurt.ogg');
    this.load.audio('laser_shoot', 'audio/woosh-ball-drop.ogg');
    this.load.audio('intro_music', 'audio/intro.mp3');
    this.load.audio('ball_drop', 'audio/ball-drop.ogg');
    for (let i = 0; i < 5; i++) {
      this.load.audio(`impact_plank_${i}`, `audio/impactPlank_medium_00${i}.ogg`);
    }
    // Reward-tier coin ladder; keys/files come from AudioFeedback so the preload can
    // never drift out of sync with the tier -> sample mapping it plays.
    for (const { key, file } of COIN_HIT_KEYS) {
      this.load.audio(key, file);
    }
    this.load.audio('menu_btn', 'audio/glass-clink.ogg');
    this.load.audio('board_complete', 'audio/board-complete.mp3');
    this.load.audio('game_music', 'audio/game_music.mp3');
    this.load.audio('end_game', 'audio/end-game.ogg');
  }

  // Force webfont loading before transitioning to the menu.
  async create() {
    // Canvas text silently falls back if the font isn't downloaded yet, so force
    // both webfonts to load before the first scene renders any text with them.
    await Promise.allSettled([
      document.fonts.load('400 16px "Rye"'),
      document.fonts.load('700 16px "Work Sans"'),
    ]);
    this.scene.start('MenuScene');
  }
}
