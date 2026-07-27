import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT, CARNIVAL, CARRY, JUICE } from '../config/gameConfig.js';
import { getActiveAdapter } from '../platform/index.js';
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
  valance,
} from '../ui/carnival.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.cameras.main.filters.external.addGlow(
      JUICE.bloom.color,
      JUICE.bloom.outerStrength,
      0,
      1,
      false,
      JUICE.bloom.quality,
      JUICE.bloom.distance
    );

    tentBackdrop(this, BOARD_WIDTH, BOARD_HEIGHT);
    valance(this, 0, BOARD_WIDTH, 26, 30);
    bulbString(this, 0, 52, BOARD_WIDTH, 52, 14, 16);

    this.createTitleSign();
    this.createHighScoreStub();

    this.createBarkerBoard();

    // Phaser only overwrites a scene's stored data `if (data)` is truthy on start(), so a
    // bare start('GameScene') would silently resume the previous run's level/score/boost.
    ticketButton(this, BOARD_WIDTH / 2, 560, 210, 56, 'ADMIT ONE', () =>
      this.scene.start('GameScene', { level: 1, totalScore: 0, carryMultiplier: CARRY.start })
    );
    signText(this, BOARD_WIDTH / 2, 614, 'one ball, one bounce, one shot', 13, CARNIVAL.cream).setAlpha(0.75);

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

  // Title hangs from the light string on chains and sways — the whole sign is one
  // container so the bulbs, board and lettering drift together.
  createTitleSign() {
    chains(this, BOARD_WIDTH / 2, 56, 150, 44);

    const sign = this.add.container(BOARD_WIDTH / 2, 168);
    const w = 340;
    const h = 132;
    sign.add(signPanel(this, 0, 0, w, h).setPosition(0, 0));
    marqueeFrame(this, 0, 0, w - 26, h - 26, 26).forEach((b) => sign.add(b));
    sign.add(signText(this, 0, -20, 'MIDWAY', 46));
    sign.add(signText(this, 0, 26, 'DROP', 46));
    sway(this, sign);
  }

  // High score as a prize-booth ticket stub pinned under the title.
  createHighScoreStub() {
    const y = 300;
    signPanel(this, BOARD_WIDTH / 2, y, 260, 74, {
      top: CARNIVAL.wood,
      bottom: CARNIVAL.woodDark,
      radius: 6,
    });
    signText(this, BOARD_WIDTH / 2, y - 18, 'HOUSE RECORD', 13, CARNIVAL.cream);
    this.highScoreText = signText(this, BOARD_WIDTH / 2, y + 12, '—', 30, CARNIVAL.goldText);
  }

  createBarkerBoard() {
    const y = 430;
    signPanel(this, BOARD_WIDTH / 2, y, 380, 96, { top: CARNIVAL.panelRed, bottom: CARNIVAL.panelRedDark });
    signText(this, BOARD_WIDTH / 2, y - 28, 'STEP RIGHT UP', 20, CARNIVAL.goldText);
    hudText(this, BOARD_WIDTH / 2, y - 4, '', 12)
      .setOrigin(0.5)
      .setText('Ten balls. Seven slots. The pegs decide.\nClear the board to keep your boost.')
      .setAlign('center')
      .setColor(CARNIVAL.cream)
      .setLineSpacing(4);
  }

  async clearPlayerData() {
    const adapter = getActiveAdapter();
    await adapter.init();
    await adapter.clearData();
    this.highScoreText.setText('0');
  }

  async loadHighScore() {
    const adapter = getActiveAdapter();
    await adapter.init();
    const highScore = await adapter.getHighScore();
    this.highScoreText.setText(String(highScore));
  }
}
