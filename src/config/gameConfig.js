// Tunable constants. Edit freely during playtesting — no code restructuring needed.

export const BOARD_WIDTH = 480;
export const BOARD_HEIGHT = 720;

export const PHYSICS = {
  gravityY: 1,
  ball: { radius: 8, restitution: 0.85, friction: 0.01, frictionStatic: 0 },
  // frictionStatic: 0 keeps a slow-moving ball from pinning in the notch between two pegs.
  peg: { radius: 6, restitution: 0.7, friction: 0, frictionStatic: 0 },
};

export const PEG_FIELD = {
  rows: 8,
  spacingX: 40,
  spacingY: 40,
  topMargin: 140,
  sideMargin: 30,
};

export const SLOTS = {
  height: 60,
  // comboQualifies: true only for the higher-value zones — landing in a gutter/low zone breaks the streak.
  // grantsBonusBall: the outer edge zones — lowest-probability landings on a Galton-board-shaped
  // distribution funneling toward center — so a bonus ball there feels earned, not free.
  zones: [
    { value: 100, comboQualifies: false, grantsBonusBall: true },
    { value: 500, comboQualifies: false, grantsBonusBall: false },
    { value: 1000, comboQualifies: true, grantsBonusBall: false },
    { value: 5000, comboQualifies: true, grantsBonusBall: false },
    { value: 1000, comboQualifies: true, grantsBonusBall: false },
    { value: 500, comboQualifies: false, grantsBonusBall: false },
    { value: 100, comboQualifies: false, grantsBonusBall: true },
  ],
};

export const COMBO = {
  step: 0.5,
  max: 3,
};

export const JUICE = {
  shake: {
    peg: { duration: 40, intensity: 0.002 },
    score: { duration: 120, intensity: 0.004 }, // multiplied by current multiplier at call time
  },
  particle: {
    baseCount: 8,
    countPerMultiplier: 4,
    baseColor: 0x00d9ff,
    hotColor: 0xffe14d,
  },
  comboBreakFlash: { duration: 180, color: [255, 60, 60] },
  nearMissMargin: 14, // px from the top-zone boundary that still counts as "so close"
  bonusFlash: { duration: 150, color: [80, 255, 140] },
  bonusParticleCount: 14,
};

export const BONUS_BALLS = {
  scoreInterval: 500,
  comboTier: 3,
  maxPerSession: 5,
};

export const NARRATOR = {
  minDropsBetweenLines: 5,
  maxDropsBetweenLines: 8,
  scoreThreshold: 3000, // placeholder — set from playtest data
};

export const SESSION = {
  ballsPerSession: 10,
};

export const STORAGE_KEY = 'under-construction:highScore';
