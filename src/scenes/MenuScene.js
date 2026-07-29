// Title/menu screen — tent backdrop, hanging midway sign, high-score stub, barker blurb,
// START GAME / SOUND / MUSIC buttons, and looping intro music with fade transitions.
import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT, CARNIVAL, CARRY } from '../config/gameConfig.js';
import { getActiveAdapter } from '../platform/index.js';
import { isSoundOn, isMusicOn, toggleSound, toggleMusic } from '../systems/AudioSettings.js';
import {
  bulbString,
  chains,
  hudText,
  marqueeFrame,
  signPanel,
  signText,
  sway,
  tentBackdrop,
  ticketButton,
  toggleButton,
  valance,
} from '../ui/carnival.js';

const MUSIC_VOLUME = 0.5;
const MUSIC_FADE_MS = 500;

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  // Build the full menu: backdrop, valance, bulb string, title sign, high-score stub,
  // barker board, START GAME button, audio toggles, music playback, and data-reset links.
  create() {
    tentBackdrop(this, BOARD_WIDTH, BOARD_HEIGHT);
    valance(this, 0, BOARD_WIDTH, 26, 30);
    bulbString(this, 0, 52, BOARD_WIDTH, 52, 14, 16);

    this.createTitleSign();
    this.createHighScoreStub();

    this.createBarkerBoard();

    // Phaser only overwrites a scene's stored data `if (data)` is truthy on start(), so a
    // bare start('GameScene') would silently resume the previous run's level/score/boost.
    ticketButton(
      this,
      BOARD_WIDTH / 2,
      540,
      252,
      67,
      'START GAME',
      () => {
        this.sound.play('menu_btn');
        this.fadeMusicOut(() =>
          this.scene.start('GameScene', { level: 1, totalScore: 0, carryMultiplier: CARRY.start })
        );
      },
      { fontSize: 24, textShadow: false, letterSpacing: 2, textColor: '#ffffff' }
    );
    this.createAudioToggles(618);
    this.playMusic();

    this.add
      .text(BOARD_WIDTH / 2, BOARD_HEIGHT - 14, '[ reset player data ]', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: CARNIVAL.dimText,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.clearPlayerData());

    this.loadHighScore();

    this.add
      .text(BOARD_WIDTH / 2, BOARD_HEIGHT - 40, 'clear high score', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#555577',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.clearHighScore());
  }

  // SOUND toggles Phaser's sound manager (shared game-wide) and the raw-oscillator
  // AudioFeedback tones together. MUSIC gates the intro track loop below.
  // Build SOUND and MUSIC toggle buttons and sync their initial states.
  createAudioToggles(y) {
    this.sound.mute = !isSoundOn();
    toggleButton(this, BOARD_WIDTH / 2 - 76, y, 132, 38, (on) => `SOUND: ${on ? 'ON' : 'OFF'}`, isSoundOn, () => {
      this.sound.mute = !toggleSound();
    }, { fontSize: 12, textShadow: false, textColor: '#ffffff' });
    toggleButton(this, BOARD_WIDTH / 2 + 88, y, 132, 38, (on) => `MUSIC: ${on ? 'ON' : 'OFF'}`, isMusicOn, () => {
      const on = toggleMusic();
      if (on) this.playMusic();
      else this.fadeMusicOut();
    }, {
      fontSize: 12,
      textShadow: false,
      textColor: '#ffffff',
    });
  }

  // One looping instance shared across menu visits — Phaser dedupes by sound key
  // only if we track it ourselves, so guard against stacking on scene re-entry.
  // Start the intro music loop with a volume fade-in. Guards against stacking on re-entry.
  playMusic() {
    if (!isMusicOn()) return;
    if (this.music?.isPlaying) return;
    this.music = this.sound.add('intro_music', { loop: true, volume: 0 });
    this.music.play();
    this.tweens.add({ targets: this.music, volume: MUSIC_VOLUME, duration: MUSIC_FADE_MS });
  }

  // Tweens live on this scene's tween manager, so they're cancelled if the scene
  // shuts down mid-fade — callers that need to wait (leaving for GameScene) pass
  // onComplete rather than assuming the fade finishes on its own.
  // Fade out the music over MUSIC_FADE_MS, then stop. Calls onComplete when done.
  fadeMusicOut(onComplete) {
    if (!this.music?.isPlaying) {
      onComplete?.();
      return;
    }
    this.tweens.add({
      targets: this.music,
      volume: 0,
      duration: MUSIC_FADE_MS,
      onComplete: () => {
        this.music.stop();
        onComplete?.();
      },
    });
  }

  // Title hangs from the light string on chains and sways — the whole sign is one
  // container so the bulbs, board and lettering drift together.
  // Hanging title sign with chains, marquee frame, "MIDWAY" / "DROP" lettering, and a sway tween.
  createTitleSign() {
    chains(this, BOARD_WIDTH / 2, 56, 150, 44);

    const sign = this.add.container(BOARD_WIDTH / 2, 168);
    const w = 340;
    const h = 142;
    sign.add(signPanel(this, 0, 0, w, h).setPosition(0, 0));
    marqueeFrame(this, 0, 0, w - 26, h - 26, 26).forEach((b) => sign.add(b));
    sign.add(signText(this, 0, -20, 'MIDWAY', 44));
    sign.add(signText(this, 0, 26, 'DROP', 44));
    sway(this, sign);
  }

  // High score as a prize-booth ticket stub pinned under the title.
  // Prize-booth ticket stub showing the current house record.
  createHighScoreStub() {
    const y = 310;
    signPanel(this, BOARD_WIDTH / 2, y, 260, 78, {
      top: CARNIVAL.wood,
      bottom: CARNIVAL.woodDark,
      radius: 6,
    });
    signText(this, BOARD_WIDTH / 2, y - 14, 'HOUSE RECORD', 13, CARNIVAL.cream);
    this.highScoreText = signText(this, BOARD_WIDTH / 2, y + 12, '—', 26, CARNIVAL.goldText);
  }

  // Instruction panel with the game's one-sentence rules.
  createBarkerBoard() {
    const y = 430;
    signPanel(this, BOARD_WIDTH / 2, y, 380, 96, { top: CARNIVAL.panelRed, bottom: CARNIVAL.panelRedDark });
    signText(this, BOARD_WIDTH / 2, y - 18, 'STEP RIGHT UP', 20, CARNIVAL.goldText);
    hudText(this, BOARD_WIDTH / 2, y + 12, '', 14)
      .setOrigin(0.5)
      .setText('Ten balls. Seven slots. The pegs decide.\nClear the board to keep your boost.')
      .setAlign('center')
      .setColor(CARNIVAL.cream)
      .setLineSpacing(1);
  }

  // Reset all persisted player data via the platform adapter.
  async clearPlayerData() {
    const adapter = getActiveAdapter();
    await adapter.init();
    await adapter.clearData();
    this.highScoreText.setText('0');
  }

  // Fetch and display the high score from the platform adapter.
  async loadHighScore() {
    const adapter = getActiveAdapter();
    await adapter.init();
    const highScore = await adapter.getHighScore();
    this.highScoreText.setText(String(highScore));
  }

  // Reset the high score to zero and update the display.
  async clearHighScore() {
    const adapter = getActiveAdapter();
    await adapter.clearHighScore();
    this.highScoreText.setText('High score: —');
  }
}
