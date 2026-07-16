import Phaser from 'phaser';
import { BOARD_WIDTH, PEG_FIELD, PHYSICS } from '../config/gameConfig.js';

const randRange = (min, max) => min + Math.random() * (max - min);

// Staggered grid: alternating rows offset by half spacing, with per-peg jitter/size/bounciness.
export function createPegField(scene) {
  const pegs = [];
  const { rows, spacingX, spacingY, topMargin, sideMargin, jitter, radiusRange, restitutionRange, coldColor, hotColor } = PEG_FIELD;
  for (let row = 0; row < rows; row++) {
    const offset = row % 2 === 0 ? 0 : spacingX / 2;
    const y = topMargin + row * spacingY + randRange(-jitter, jitter);
    // Column count derived per-row (not a fixed value) so offset rows fill all the way to the edge instead of leaving a gap.
    const cols = Math.floor((BOARD_WIDTH - sideMargin - (sideMargin + offset)) / spacingX) + 1;
    for (let col = 0; col < cols; col++) {
      const x = sideMargin + offset + col * spacingX + randRange(-jitter, jitter);

      const radius = randRange(radiusRange[0], radiusRange[1]);
      const restitution = randRange(restitutionRange[0], restitutionRange[1]);
      const bounceT = (restitution - restitutionRange[0]) / (restitutionRange[1] - restitutionRange[0]);
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(coldColor),
        Phaser.Display.Color.ValueToColor(hotColor),
        100,
        bounceT * 100
      );

      const peg = scene.add.circle(x, y, radius, Phaser.Display.Color.GetColor(color.r, color.g, color.b));
      scene.matter.add.gameObject(peg, {
        isStatic: true,
        restitution,
        friction: PHYSICS.peg.friction,
        frictionStatic: PHYSICS.peg.frictionStatic,
        shape: { type: 'circle', radius },
        label: 'peg',
      });
      pegs.push(peg);
    }
  }
  return pegs;
}
