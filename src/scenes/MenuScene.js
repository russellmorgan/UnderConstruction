// Title/menu screen — tent backdrop, hanging midway sign, high-score stub, barker blurb,
// START GAME / SOUND / MUSIC buttons, and looping intro music with fade transitions.
import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT, CARNIVAL, CARRY, PEG_TYPES } from '../config/gameConfig.js';
import { getActiveAdapter } from '../platform/index.js';
import { isSoundOn, isMusicOn, toggleSound, toggleMusic } from '../systems/AudioSettings.js';
import {
  bulbString,
  chains,
  checkbox,
  hudText,
  marqueeFrame,
  signPanel,
  signText,
  sway,
  tentBackdrop,
  ticketButton,
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
    bulbString(this, 0, 52, BOARD_WIDTH, 52, 14, 24);

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
    this.createAudioToggles(605);
    ticketButton(this, BOARD_WIDTH / 2, 655, 200, 34, 'INSTRUCTIONS', () => {
      this.sound.play('menu_btn');
      this.showInstructions();
    }, { fontSize: 13, textShadow: false, textColor: '#ffffff' });
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
  }

  // Build SOUND and MUSIC toggle buttons and sync their initial states.
  createAudioToggles(y) {
    checkbox(this, BOARD_WIDTH / 2 - 81, y, 'SOUND', isSoundOn, toggleSound);
    checkbox(this, BOARD_WIDTH / 2 + 12, y, 'MUSIC', isMusicOn, () => {
      if (toggleMusic()) this.playMusic();
      else this.fadeMusicOut();
    });
  }

  // One looping instance shared across menu visits — Phaser dedupes by sound key
  // only if we track it ourselves, so guard against stacking on scene re-entry.
  // Start the intro music loop with a volume fade-in. Guards against stacking on re-entry.
  playMusic() {
    if (!isMusicOn()) return;
    if (this.music?.isPlaying) return;
    if (this.sound.locked) {
      this.sound.once('unlocked', () => this.playMusic());
      return;
    }
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
    signPanel(this, BOARD_WIDTH / 2, y, 260, 96, {
      top: CARNIVAL.wood,
      bottom: CARNIVAL.woodDark,
      radius: 6,
    });
    signText(this, BOARD_WIDTH / 2, y - 24, 'HOUSE RECORD', 13, CARNIVAL.cream);
    this.highScoreText = signText(this, BOARD_WIDTH / 2, y + 2, '—', 26, CARNIVAL.goldText);

    const boards = this.registry.get('sessionBoards') ?? 0;
    signText(
      this,
      BOARD_WIDTH / 2,
      y + 25,
      `${boards} board${boards === 1 ? '' : 's'} cleared`,
      11,
      CARNIVAL.cream
    ).setAlpha(0.8);
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

  // How-to-play modal: rules text plus a legend of every peg type and what it pays,
  // read straight off PEG_TYPES/CARRY so tuning the config retunes the legend.
  showInstructions() {
    const modal = this.add.container(0, 0).setDepth(500);

    const blocker = this.add
      .rectangle(0, 0, BOARD_WIDTH, BOARD_HEIGHT, 0x000000, 0.72)
      .setOrigin(0)
      .setInteractive();
    modal.add(blocker);

    const panelH = 520;
    const cy = BOARD_HEIGHT / 2 - 20;
    modal.add(signPanel(this, BOARD_WIDTH / 2, cy, 400, panelH));
    modal.add(signText(this, BOARD_WIDTH / 2, cy - panelH / 2 + 34, 'HOW TO PLAY', 24));

    const rules = hudText(this, BOARD_WIDTH / 2, cy - panelH / 2 + 100, '', 13)
      .setOrigin(0.5)
      .setText(
        'Drop ten balls from the top of the board.\n' +
          'Where a ball lands pays 100-2000 points.\n' +
          'Hit the bonus pegs on the way down to raise\n' +
          'your carry multiplier — it boosts every slot\n' +
          'payout and half of it survives a cleared board.'
      )
      .setAlign('center')
      .setColor(CARNIVAL.cream)
      .setLineSpacing(3);
    modal.add(rules);

    modal.add(signText(this, BOARD_WIDTH / 2, cy - 70, 'THE PEGS', 16, CARNIVAL.goldText));

    let y = cy - 40;
    for (const type of PEG_TYPES) {
      const swatch = this.add.graphics();
      swatch.fillStyle(type.color, 1);
      swatch.fillCircle(BOARD_WIDTH / 2 - 130, y, 9);
      swatch.lineStyle(2, type.hazard ? CARNIVAL.hazardRed : type.ring ?? CARNIVAL.gold, 1);
      swatch.strokeCircle(BOARD_WIDTH / 2 - 130, y, 10);
      modal.add(swatch);

      const label = type.hazard
        ? `Hazard — ${type.score} pts, ends the drop`
        : type.scoreMultiplier
          ? `Bonus ×${type.scoreMultiplier} — +${(type.scoreMultiplier - 1) * CARRY.stepPerTier} multiplier`
          : `Base peg — +${type.score} pts`;
      modal.add(
        hudText(this, BOARD_WIDTH / 2 - 110, y, label, 13)
          .setOrigin(0, 0.5)
          .setColor(type.hazard ? CARNIVAL.dimText : CARNIVAL.cream)
      );
      y += 32;
    }

    modal.add(
      hudText(this, BOARD_WIDTH / 2, y + 4, `Multiplier caps at ×${CARRY.max}.`, 16)
        .setOrigin(0.5)
        .setColor(CARNIVAL.goldText)
    );

    modal.add(
      ticketButton(this, BOARD_WIDTH / 2, cy + panelH / 2 - 55, 150, 40, 'CLOSE', () => {
        this.sound.play('menu_btn');
        modal.destroy(true);
      }, { fontSize: 14, textShadow: false, textColor: '#ffffff' })
    );
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
}
