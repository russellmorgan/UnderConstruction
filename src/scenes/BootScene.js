// First scene: preloads all audio assets (using BASE_URL for the correct path), forces
// webfont loading before any text renders, then hands off to MenuScene.
import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  // Load all audio assets using BASE_URL for the correct asset path.
  preload() {
    this.load.setBaseURL(import.meta.env.BASE_URL);
    this.load.audio('hit_hurt', 'audio/hit_hurt.wav');
    this.load.audio('laser_shoot', 'audio/laser_shoot.wav');
    this.load.audio('pickup_coin', 'audio/pickup_coin.wav');
    this.load.audio('powerup_5', 'audio/Powerup 5.wav');
    this.load.audio('intro_music', 'audio/intro.mp3');
    for (let i = 0; i < 5; i++) {
      this.load.audio(`impact_plank_${i}`, `audio/impactPlank_medium_00${i}.ogg`);
    }
    this.load.audio('impact_glass_heavy', 'audio/impactGlass_heavy_002.ogg');
    this.load.audio('menu_btn', 'audio/menu_btn.wav');
  }

  // Force webfont loading before transitioning to the menu (canvas text fallback is silent).
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
