import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.setBaseURL(import.meta.env.BASE_URL);
    this.load.audio('hit_hurt', 'audio/hit_hurt.wav');
    this.load.audio('laser_shoot', 'audio/laser_shoot.wav');
    this.load.audio('pickup_coin', 'audio/pickup_coin.wav');
    // ponytail: test background, remove once real art is in
    this.load.image('tmp_bg', 'img/tmp-bg.webp');
  }

  create() {
    this.scene.start('MenuScene');
  }
}
