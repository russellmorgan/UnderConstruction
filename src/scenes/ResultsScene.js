import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT, CARNIVAL, CARRY } from '../config/gameConfig.js';
import { getActiveAdapter } from '../platform/index.js';
import {
  bulbString,
  chains,
  marqueeFrame,
  signPanel,
  signText,
  sway,
  tentBackdrop,
  ticketButton,
  valance,
} from '../ui/carnival.js';

export default class ResultsScene extends Phaser.Scene {
  constructor() {
    super('ResultsScene');
  }

  init(data) {
    this.finalScore = data?.score ?? 0;
    this.level = data?.level ?? 1;
  }

  create() {
    tentBackdrop(this, BOARD_WIDTH, BOARD_HEIGHT);
    valance(this, 0, BOARD_WIDTH, 26, 30);
    bulbString(this, 0, 52, BOARD_WIDTH, 52, 14, 16);

    chains(this, BOARD_WIDTH / 2, 56, 120, 40);
    const banner = this.add.container(BOARD_WIDTH / 2, 128);
    banner.add(signPanel(this, 0, 0, 300, 68));
    banner.add(signText(this, 0, 0, "THAT'S THE SHOW", 24));
    sway(this, banner);

    this.createStub();

    // Built up front and revealed with a fade so the record callout doesn't shove the
    // layout around when the adapter resolves a beat later.
    this.recordSign = this.add.container(BOARD_WIDTH / 2, 404).setAlpha(0);
    this.recordSign.add(signPanel(this, 0, 0, 320, 70, { top: CARNIVAL.gold, bottom: 0xc8891f }));
    marqueeFrame(this, 0, 0, 296, 48, 26).forEach((b) => this.recordSign.add(b));
    this.recordSign.add(signText(this, 0, 0, 'NEW HOUSE RECORD', 18, CARNIVAL.inkText));

    // See MenuScene's ADMIT ONE handler: Phaser keeps stale scene data when start() is
    // called with no data, so a new run must explicitly reset level/score/boost here too.
    ticketButton(this, BOARD_WIDTH / 2, 500, 220, 54, 'ONE MORE', () =>
      this.scene.start('GameScene', { level: 1, totalScore: 0, carryMultiplier: CARRY.start })
    );
    ticketButton(this, BOARD_WIDTH / 2, 578, 180, 44, 'MIDWAY', () => this.scene.start('MenuScene'), {
      fontSize: 17,
    });

    signText(this, BOARD_WIDTH / 2, BOARD_HEIGHT - 22, 'thank you kindly', 12, CARNIVAL.cream).setAlpha(0.6);

    this.resolveHighScore();
  }

  // The run's takings, printed like a prize-booth receipt.
  createStub() {
    const y = 280;
    signPanel(this, BOARD_WIDTH / 2, y, 320, 150, { top: CARNIVAL.wood, bottom: CARNIVAL.woodDark, radius: 8 });
    signText(this, BOARD_WIDTH / 2, y - 52, 'YOUR TAKE', 14, CARNIVAL.cream);
    signText(this, BOARD_WIDTH / 2, y - 12, String(this.finalScore), 42, CARNIVAL.goldText);

    const boards = this.level === 1 ? 'no boards cleared' : `${this.level - 1} boards cleared`;
    signText(this, BOARD_WIDTH / 2, y + 28, boards, 13, CARNIVAL.cream).setAlpha(0.85);
    this.statusText = signText(this, BOARD_WIDTH / 2, y + 54, 'checking the ledger…', 12, CARNIVAL.dimText);
  }

  async resolveHighScore() {
    const adapter = getActiveAdapter();
    await adapter.init();
    const previousHigh = await adapter.getHighScore();

    if (this.finalScore > previousHigh) {
      await adapter.setHighScore(this.finalScore);
      this.statusText.setText(`beat ${previousHigh}`);
      this.statusText.setColor(CARNIVAL.greenText);
      this.tweens.add({ targets: this.recordSign, alpha: 1, duration: 400 });
      sway(this, this.recordSign, 1.8);
    } else {
      this.statusText.setText(`house record ${previousHigh}`);
    }
  }
}
