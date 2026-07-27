import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT, CARNIVAL } from '../config/gameConfig.js';
import { signPanel, signText, sway, ticketButton } from '../ui/carnival.js';

// Launched on top of a paused GameScene (rather than living inside it) so its
// buttons keep receiving input while GameScene's own update/physics/input are frozen.
export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create() {
    this.add.rectangle(BOARD_WIDTH / 2, BOARD_HEIGHT / 2, BOARD_WIDTH, BOARD_HEIGHT, 0x000000, 0.75);

    const sign = this.add.container(BOARD_WIDTH / 2, BOARD_HEIGHT / 2 - 80);
    sign.add(signPanel(this, 0, 0, 260, 70));
    sign.add(signText(this, 0, -8, 'INTERMISSION', 22));
    sign.add(signText(this, 0, 18, 'the board will wait', 11, CARNIVAL.cream));
    sway(this, sign);

    ticketButton(this, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 20, 200, 50, 'BACK IN', () => this.resume(), {
      notchColor: 0x0b0710,
    });
    ticketButton(this, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 92, 170, 42, 'MIDWAY', () => this.goToMenu(), {
      fontSize: 17,
      notchColor: 0x0b0710,
    });

    this.input.keyboard.on('keydown-ESC', () => this.resume());
  }

  resume() {
    this.scene.resume('GameScene');
    this.scene.stop();
  }

  goToMenu() {
    this.scene.stop('GameScene');
    this.scene.stop();
    this.scene.start('MenuScene');
  }
}
