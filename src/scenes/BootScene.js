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
    this.load.audio('powerup_5', 'audio/Powerup 5.wav');
  }

  create() {
    this.scene.start('MenuScene');
  }
}
