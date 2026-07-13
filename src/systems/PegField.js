import { BOARD_WIDTH, PEG_FIELD, PHYSICS } from '../config/gameConfig.js';

// Staggered grid: alternating rows offset by half spacing.
export function createPegField(scene) {
  const pegs = [];
  const { rows, spacingX, spacingY, topMargin, sideMargin } = PEG_FIELD;
  const usableWidth = BOARD_WIDTH - sideMargin * 2;
  const cols = Math.floor(usableWidth / spacingX);

  for (let row = 0; row < rows; row++) {
    const offset = row % 2 === 0 ? 0 : spacingX / 2;
    const y = topMargin + row * spacingY;
    for (let col = 0; col < cols; col++) {
      const x = sideMargin + offset + col * spacingX;
      if (x > BOARD_WIDTH - sideMargin) continue;

      const peg = scene.add.circle(x, y, PHYSICS.peg.radius, 0x00d9ff);
      scene.matter.add.gameObject(peg, {
        isStatic: true,
        restitution: PHYSICS.peg.restitution,
        friction: PHYSICS.peg.friction,
        frictionStatic: PHYSICS.peg.frictionStatic,
        shape: { type: 'circle', radius: PHYSICS.peg.radius },
        label: 'peg',
      });
      pegs.push(peg);
    }
  }
  return pegs;
}
