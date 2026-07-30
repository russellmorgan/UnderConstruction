// Pause overlay — launched on top of GameScene (via scene.launch, not scene.start) so
// GameScene's physics/update freeze underneath while this scene's interactive buttons
// (resume, quit to menu, toggle sound/music) stay responsive to input.
import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT, CARNIVAL } from '../config/gameConfig.js';
import { isSoundOn, isMusicOn, toggleSound, toggleMusic } from '../systems/AudioSettings.js';
import { signPanel, signText, sway, ticketButton, toggleButton } from '../ui/carnival.js';

// Launched on top of a paused GameScene (rather than living inside it) so its
// buttons keep receiving input while GameScene's own update/physics/input are frozen.
export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  // Build the overlay: dimmed backdrop, "INTERMISSION" sign, BACK IN / MIDWAY buttons, sound/music toggles, ESC listener.
  create() {
    this.add.rectangle(BOARD_WIDTH / 2, BOARD_HEIGHT / 2, BOARD_WIDTH, BOARD_HEIGHT, 0x000000, 0.75);

    const sign = this.add.container(BOARD_WIDTH / 2, BOARD_HEIGHT / 2 - 80);
    sign.add(signPanel(this, 0, 0, 260, 70));
    sign.add(signText(this, 0, -8, 'INTERMISSION', 22));
    sign.add(signText(this, 0, 18, 'the board will wait', 11, CARNIVAL.cream));
    sway(this, sign);

    ticketButton(this, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 20, 200, 50, 'BACK IN', () => {
      this.sound.play('menu_btn');
      this.resume();
    }, {
      notchColor: 0x0b0710,
    });
    ticketButton(this, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 92, 170, 42, 'MIDWAY', () => {
      this.sound.play('menu_btn');
      this.goToMenu();
    }, {
      fontSize: 17,
      notchColor: 0x0b0710,
    });

    const toggleY = BOARD_HEIGHT / 2 + 150;
    toggleButton(
      this,
      BOARD_WIDTH / 2 - 60,
      toggleY,
      100,
      32,
      (on) => `SOUND: ${on ? 'ON' : 'OFF'}`,
      isSoundOn,
      () => {
        this.sound.mute = !toggleSound();
      },
      { fontSize: 12, notchColor: 0x0b0710, textShadow: false }
    );
    toggleButton(
      this,
      BOARD_WIDTH / 2 + 60,
      toggleY,
      100,
      32,
      (on) => `MUSIC: ${on ? 'ON' : 'OFF'}`,
      isMusicOn,
      () => {
        const on = toggleMusic();
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
          if (on) {
            if (!gameScene.gameMusic?.isPlaying) {
              gameScene.gameMusic = gameScene.sound.add('game_music', { loop: true, volume: 0.2 });
              gameScene.gameMusic.play();
            }
          } else {
            if (gameScene.gameMusic) {
              gameScene.gameMusic.stop();
              gameScene.gameMusic = null;
            }
          }
        }
      },
      { fontSize: 12, notchColor: 0x0b0710, textShadow: false }
    );

    this.input.keyboard.on('keydown-ESC', () => this.resume());
  }

  // Resume the frozen GameScene and stop this overlay.
  resume() {
    this.scene.resume('GameScene');
    this.scene.stop();
  }

  // Stop both scenes and return to the menu.
  goToMenu() {
    this.scene.stop('GameScene');
    this.scene.stop();
    this.scene.start('MenuScene');
  }
}
