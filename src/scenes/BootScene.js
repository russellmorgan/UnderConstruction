import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.audio('hit_hurt', 'src/audio/hit_hurt.wav');
    this.load.audio('laser_shoot', 'src/audio/laser_shoot.wav');
    this.load.audio('pickup_coin', 'src/audio/pickup_coin.wav');
    // ponytail: test background, remove once real art is in
    this.load.image('tmp_bg', 'src/img/tmp-bg.webp');
  }

  create() {
    this.scene.start('MenuScene');
  }
}
