// GameScene HUD chrome — builds the carnival backdrop, header plaques, hanging barker sign,
// slot booth framing, and bottom scorekeeper rail. Purely presentational; owns no gameplay
// state. Exports DEPTH bands: backdrop negative, play field 0, chrome 5-6, effects 15, ball 20.
import { BOARD_WIDTH, BOARD_HEIGHT, CARNIVAL, SLOTS } from '../config/gameConfig.js';
import {
  bulbString,
  chains,
  gradientRect,
  lerpColor,
  signPanel,
  signText,
  sway,
  valance,
  vignette,
  woodPost,
} from './carnival.js';

// Depth bands. The play field (pegs, slots) stays at the default depth 0 so the
// carnival chrome can never draw over it; the ball sits above everything so it is
// always readable while it falls past the top signage.
export const DEPTH = { chrome: 5, label: 6, effect: 15, ball: 20 };

// HUD chrome for GameScene: a midway header, a hanging barker sign, prize-booth
// framing around the scoring slots, and a wooden scorekeeper's rail at the bottom.
// Purely presentational — it owns no gameplay state.
export default class GameHud {
  // Build all HUD chrome: backdrop, header, barker sign, and bottom rail.
  constructor(scene) {
    this.scene = scene;
    this.createFieldBackdrop();
    this.createHeader();
    this.createBarkerSign();
    this.createBottomRail();
  }

  // The board back, all at negative depth so the pegs and ball always sit in front of it.
  // Every element here is deliberately low-contrast — the backdrop has to stay quiet
  // enough that a 12px peg still reads instantly against it.
  createFieldBackdrop() {
    const { scene } = this;
    const g = scene.add.graphics().setDepth(-3);
    gradientRect(g, 0, 0, BOARD_WIDTH, BOARD_HEIGHT, CARNIVAL.boardTop, CARNIVAL.boardBottom, 16);

    // Same tent wedges as the menu, dialled way down, so the play field reads as the
    // inside of the same tent rather than a separate dark screen.
    const apexX = BOARD_WIDTH / 2;
    const apexY = -280;
    const spread = BOARD_WIDTH * 2.6;
    const wedges = 16;
    for (let i = 0; i < wedges; i += 2) {
      const x0 = apexX - spread / 2 + (spread / wedges) * i;
      g.fillStyle(CARNIVAL.canvasRed, 0.035);
      g.fillTriangle(apexX, apexY, x0, BOARD_HEIGHT, x0 + spread / wedges, BOARD_HEIGHT);
    }

    // Canvas seams across the backing.
    g.fillStyle(0x000000, 0.18);
    for (let y = 168; y < BOARD_HEIGHT - 90; y += 96) {
      g.fillRect(0, y, BOARD_WIDTH, 1);
    }

    vignette(scene, BOARD_WIDTH, BOARD_HEIGHT).setDepth(-2);

    const posts = scene.add.graphics().setDepth(-1);
    woodPost(posts, 0, 0, 12, BOARD_HEIGHT);
    woodPost(posts, BOARD_WIDTH - 12, 0, 12, BOARD_HEIGHT);
  }

  // Top chrome: valance, bulb string, board/target plaque on the left, ball count plaque on the right.
  createHeader() {
    const { scene } = this;
    valance(scene, 0, BOARD_WIDTH, 14, 24).setDepth(DEPTH.chrome);
    bulbString(scene, 0, 30, BOARD_WIDTH, 30, 11, 8).graphics.setDepth(DEPTH.chrome);

    const plaque = { top: CARNIVAL.wood, bottom: CARNIVAL.woodDark, radius: 5 };
    signPanel(scene, 86, 30, 132, 54, plaque).setDepth(DEPTH.chrome);
    this.boardText = signText(scene, 86, 23, '', 12, CARNIVAL.cream).setDepth(DEPTH.label);
    this.targetText = signText(scene, 86, 37, '', 11, CARNIVAL.goldText).setDepth(DEPTH.label);

    signPanel(scene, BOARD_WIDTH - 86, 30, 132, 54, plaque).setDepth(DEPTH.chrome);
    this.ballsText = signText(scene, BOARD_WIDTH - 86, 30, '', 16, CARNIVAL.goldText).setDepth(DEPTH.label);
  }

  // The narrator gets a hanging midway signboard rather than a dialogue box: chains
  // from the light string, painted board, and it only drops in when the barker talks.
  // Hanging barker signboard: chains from the light string, painted panel, hidden until narrator speaks.
  createBarkerSign() {
    const { scene } = this;
    const y = Math.round(BOARD_HEIGHT / 2 - 100);
    this.barker = scene.add.container(BOARD_WIDTH / 2, y).setDepth(DEPTH.label).setAlpha(0);
    this.barkerChains = chains(scene, BOARD_WIDTH / 2, 36, 200, y - 38 - 36).setDepth(DEPTH.chrome).setAlpha(0);

    this.barkerPanel = signPanel(scene, 0, 0, 324, 86, { radius: 7 });
    this.barker.add(this.barkerPanel);
    this.barkerLabel = signText(scene, 0, -20, 'THE BARKER SAYS', 13, CARNIVAL.goldText);
    this.barker.add(this.barkerLabel);
    sway(scene, this.barker, 0.9);
  }

  // Recolor the barker sign panel: solid panelRedDark when below threshold,
  // default red gradient when at or above threshold.
  setBarkerBelowThreshold(below) {
    this.barkerPanel.destroy();
    const top = below ? CARNIVAL.panelRedDark : CARNIVAL.panelRed;
    const bottom = below ? CARNIVAL.panelRedDark : CARNIVAL.panelRedDark;
    this.barkerPanel = signPanel(this.scene, 0, 0, 324, 86, { radius: 7, top, bottom });
    this.barker.addAt(this.barkerPanel, 0);
  }

  // Fades the whole sign with the line so an empty board never hangs there blank.
  // Fade the sign and chains in/out with the narrator text.
  setBarkerVisible(visible) {
    [this.barker, this.barkerChains].forEach((target) =>
      this.scene.tweens.add({ targets: target, alpha: visible ? 1 : 0, duration: 420 })
    );
  }

  // Add the narrator's text object to the barker sign container.
  attachBarkerText(text) {
    this.barker.add(text.setPosition(0, 8));
  }

  // Booth chrome for the scoring slots: a striped awning above the row, a painted
  // fascia per slot tinted by its tier, and a counter plank below.
  // Booth chrome for the scoring slot row: valance above, wood counter below, prize plates per slot.
  decorateSlots(slotY) {
    const { scene } = this;
    const { height, zones } = SLOTS;
    const slotWidth = BOARD_WIDTH / zones.length;
    const top = slotY - height / 2;
    const bottom = slotY + height / 2;
    const maxValue = Math.max(...zones.map((z) => z.value));

    valance(scene, top - 22, BOARD_WIDTH, 10, slotWidth / 4).setDepth(DEPTH.chrome);

    const g = scene.add.graphics().setDepth(DEPTH.chrome);
    g.fillStyle(CARNIVAL.woodDark, 1);
    g.fillRect(0, bottom, BOARD_WIDTH, 10);
    g.fillStyle(CARNIVAL.wood, 1);
    g.fillRect(0, bottom, BOARD_WIDTH, 3);

    zones.forEach(({ value }, i) => {
      const x = slotWidth * i + slotWidth / 2;
      // Divider posts between booths.
      g.fillStyle(CARNIVAL.wood, 0.9);
      g.fillRect(slotWidth * i - 1, top, 2, height);
      // Prize plate under the value text, hotter as the tier climbs.
      const heat = value / maxValue;
      const plate = lerpColor(CARNIVAL.panelRed, CARNIVAL.gold, heat * 0.9);
      gradientRect(g, x - slotWidth / 2 + 5, bottom - 22, slotWidth - 10, 16, plate, CARNIVAL.woodDark, 6);
    });
    return { slotWidth, top, bottom };
  }

  // Slot value labels, painted rather than plain — the top-tier slot gets marquee bulbs.
  // Painted slot value label — top-tier slot breathes with a scale pulse tween.
  slotLabel(x, y, value, isTop) {
    const isText = typeof value === 'string';
    const fontSize = isText ? 12 : isTop ? 18 : 15;
    const label = signText(
      this.scene,
      x,
      y,
      String(value),
      fontSize,
      isTop ? CARNIVAL.goldText : CARNIVAL.cream,
      isText ? { align: 'center' } : {},
    ).setDepth(DEPTH.label);
    if (isTop) {
      this.scene.tweens.add({
        targets: label,
        scale: { from: 1, to: 1.08 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    return label;
  }

  // Scorekeeper's rail across the bottom: score on the left plaque, carry boost on the
  // right, all on weathered wood.
  // Wooden scorekeeper's rail at the bottom with a plaque for the running score.
  createBottomRail() {
    const { scene } = this;
    const railTop = BOARD_HEIGHT - 52;
    const g = scene.add.graphics().setDepth(DEPTH.chrome);
    gradientRect(g, 0, railTop, BOARD_WIDTH, BOARD_HEIGHT - railTop, CARNIVAL.wood, CARNIVAL.woodDark, 8);
    g.fillStyle(CARNIVAL.gold, 0.55);
    g.fillRect(0, railTop, BOARD_WIDTH, 2);

    signPanel(scene, 124, BOARD_HEIGHT - 26, 208, 40, { radius: 5 }).setDepth(DEPTH.chrome);
    signText(scene, 58, BOARD_HEIGHT - 26, 'SCORE', 11, CARNIVAL.goldText).setDepth(DEPTH.label);
  }

  // Update board number and the points still needed to clear this board.
  updateBoard(level, remaining) {
    this.boardText.setText(`BOARD ${level}`);
    this.targetText.setText(`EARN ${Math.max(0, Math.ceil(remaining))}`);
  }

  // Update the remaining ball count display.
  updateBalls(count) {
    this.ballsText.setText(`BALLS ${count}`);
  }
}
