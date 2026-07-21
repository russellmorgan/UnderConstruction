import { BOARD_WIDTH, PEG_FIELD, PEG_TYPES, PHYSICS } from '../config/gameConfig.js';

const BASE_TYPE = PEG_TYPES.find((t) => t.count === 'rest');

// Assigns each grid position a peg type: `count` positions per non-'rest' type
// (randomly picked), everything left over gets the 'rest' (base) type.
function assignTypes(positionCount) {
  const indices = Array.from({ length: positionCount }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const types = new Array(positionCount).fill(BASE_TYPE);
  let cursor = 0;
  for (const type of PEG_TYPES) {
    if (type.count === 'rest') continue;
    for (let n = 0; n < type.count; n++) {
      types[indices[cursor++]] = type;
    }
  }
  return types;
}

function pointsFor(type) {
  return type.scoreMultiplier ? BASE_TYPE.score * type.scoreMultiplier : type.score;
}

// Staggered grid: alternating rows offset by half spacing.
export function createPegField(scene) {
  const pegs = [];
  const { rows, spacingX, spacingY, topMargin, sideMargin } = PEG_FIELD;
  const usableWidth = BOARD_WIDTH - sideMargin * 2;
  const cols = Math.floor(usableWidth / spacingX);

  const positions = [];
  for (let row = 0; row < rows; row++) {
    const offset = row % 2 === 0 ? 0 : spacingX / 2;
    const y = topMargin + row * spacingY;
    for (let col = 0; col < cols; col++) {
      const x = sideMargin + offset + col * spacingX;
      if (x > BOARD_WIDTH - sideMargin) continue;
      positions.push({ x, y });
    }
  }

  const types = assignTypes(positions.length);

  positions.forEach(({ x, y }, i) => {
    const type = types[i];
    const peg = scene.add.circle(x, y, PHYSICS.peg.radius, type.color);
    scene.matter.add.gameObject(peg, {
      isStatic: true,
      restitution: type.restitution,
      friction: type.friction,
      frictionStatic: type.frictionStatic,
      shape: { type: 'circle', radius: PHYSICS.peg.radius },
      label: 'peg',
    });
    peg.setData('points', pointsFor(type));
    peg.setData('isSpecial', type !== BASE_TYPE);
    pegs.push(peg);
  });

  return pegs;
}
