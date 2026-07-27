import { BOARD_WIDTH, CARNIVAL, CARRY, PEG_FIELD, PEG_TEMPLATES, PEG_TYPES, PHYSICS } from '../config/gameConfig.js';
import { PEG_TEXTURE_SCALE, makeHazardPegTexture, makePegTexture } from '../ui/carnival.js';

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
  return type.scoreMultiplier ? BASE_TYPE.score : type.score;
}

function carryBoostFor(type) {
  return type.scoreMultiplier ? (type.scoreMultiplier - 1) * CARRY.stepPerTier : 0;
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

// Scoring (mult-tier) pegs get their own ring/glow color and intensity per PEG_TYPES
// (the bronze/silver/gold/diamond ladder); base pegs stay flat so the tiers are the
// only thing that catches the eye. The hazard peg is a wholly different generator.
function pegTextureFor(scene, type) {
  if (type.hazard) {
    return makeHazardPegTexture(scene, `peg-${type.id}`, { radius: PHYSICS.peg.radius });
  }
  const special = Boolean(type.ring);
  return makePegTexture(scene, `peg-${type.id}`, type.color, {
    radius: PHYSICS.peg.radius,
    ring: type.ring ?? null,
    glow: type.glow ?? 0,
    // Base pegs get a flatter finish so a field of ~60 of them doesn't out-shout the
    // handful of scoring tiers.
    highlight: special ? 0.42 : 0.2,
    specular: special ? 0.5 : 0.28,
  });
}

// A pulsing red halo behind the peg (so it's visible before the ball ever gets close)
// plus a constant low-amplitude shiver on the peg itself. Both are scene-owned tweens —
// GameScene fully restarts each board, so there's nothing to manually tear down.
function addHazardTells(scene, peg, x, y) {
  const glow = scene.add.circle(x, y, PHYSICS.peg.radius * 2.4, CARNIVAL.hazardRed, 0.32).setDepth(-0.5);
  scene.tweens.add({
    targets: glow,
    alpha: { from: 0.16, to: 0.5 },
    scale: { from: 0.85, to: 1.2 },
    duration: 850,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
  scene.tweens.add({
    targets: peg,
    angle: { from: -4, to: 4 },
    duration: 220,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
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
    const peg = scene.add.image(x, y, pegTextureFor(scene, type)).setScale(PEG_TEXTURE_SCALE);
    scene.matter.add.gameObject(peg, {
      isStatic: true,
      restitution: type.restitution,
      friction: type.friction,
      frictionStatic: type.frictionStatic,
      shape: { type: 'circle', radius: PHYSICS.peg.radius },
      label: 'peg',
    });
    peg.setData('points', pointsFor(type));
    peg.setData('carryBoost', carryBoostFor(type));
    peg.setData('isSpecial', type !== BASE_TYPE);
    if (type.hazard) addHazardTells(scene, peg, x, y);
    pegs.push(peg);
  });

  return pegs;
}
