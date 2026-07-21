import { BOARD_WIDTH, PEG_FIELD, PEG_TEMPLATES, PEG_TYPES, PHYSICS } from '../config/gameConfig.js';

const BASE_TYPE = PEG_TYPES.find((t) => t.count === 'rest');
const TOTAL_SPECIAL_PEGS = PEG_TYPES.reduce((sum, t) => sum + (t.count === 'rest' ? 0 : t.count), 0);

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

function pickTemplate() {
  return PEG_TEMPLATES[Math.floor(Math.random() * PEG_TEMPLATES.length)];
}

// Mirrors the boolean mask itself (row-by-row string reversal) rather than mirroring
// already-computed pixel positions, which would also need to correct for the
// per-row stagger offset.
function maybeMirror(rows) {
  if (Math.random() >= 0.5) return rows;
  return rows.map((row) => row.split('').reverse().join(''));
}

function jitter(value) {
  return value + (Math.random() * 2 - 1) * PEG_FIELD.jitter;
}

// Staggered grid: alternating rows offset by half spacing. Only cells marked 'X' in
// the chosen template get a peg, so the board's silhouette varies game to game.
export function createPegField(scene) {
  const pegs = [];
  const { rows, spacingX, spacingY, topMargin, sideMargin } = PEG_FIELD;
  const template = maybeMirror(pickTemplate().rows);

  const positions = [];
  for (let row = 0; row < rows; row++) {
    const offset = row % 2 === 0 ? 0 : spacingX / 2;
    const y = topMargin + row * spacingY;
    for (let col = 0; col < template[row].length; col++) {
      if (template[row][col] !== 'X') continue;
      const x = sideMargin + offset + col * spacingX;
      if (x > BOARD_WIDTH - sideMargin) continue;
      positions.push({ x: jitter(x), y: jitter(y) });
    }
  }

  if (positions.length < TOTAL_SPECIAL_PEGS) {
    throw new Error(
      `Peg template has ${positions.length} open cells, fewer than the ${TOTAL_SPECIAL_PEGS} special pegs PEG_TYPES needs to place.`
    );
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
