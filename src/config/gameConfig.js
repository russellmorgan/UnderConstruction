// Tunable constants. Edit freely during playtesting — no code restructuring needed.

export const BOARD_WIDTH = 480;
export const BOARD_HEIGHT = 720;

export const PHYSICS = {
  gravityY: 1,
  ball: { radius: 8, restitution: 0.85, friction: 0.01, frictionStatic: 0 },
  peg: { radius: 6 },
};

export const PEG_FIELD = {
  rows: 8,
  spacingX: 40,
  spacingY: 40,
  topMargin: 140,
  sideMargin: 30,
};

// Peg variants. Every peg not claimed by a count > 0 entry falls back to 'base'.
// score is flat points; scoreMultiplier is × the base entry's score.
// frictionStatic: 0 keeps a slow-moving ball from pinning in the notch between two pegs.
export const PEG_TYPES = [
  { id: 'base', score: 5, color: 0x00d9ff, restitution: 0.7, friction: 0, frictionStatic: 0, count: 'rest' },
  { id: 'mult2', scoreMultiplier: 2, color: 0x9d4edd, restitution: 0.8, friction: 0, frictionStatic: 0, count: 2 },
  { id: 'mult3', scoreMultiplier: 3, color: 0xffb703, restitution: 0.85, friction: 0, frictionStatic: 0, count: 2 },
  { id: 'mult4', scoreMultiplier: 4, color: 0xfb8500, restitution: 0.9, friction: 0, frictionStatic: 0, count: 2 },
  { id: 'mult5', scoreMultiplier: 5, color: 0xff006e, restitution: 0.95, friction: 0, frictionStatic: 0, count: 2 },
  // white keeps this visually out of the purple/gold/orange/pink reward family entirely.
  { id: 'penalty', score: -20, color: 0xffffff, restitution: 0.4, friction: 0.05, frictionStatic: 0.05, count: 1 },
];

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
  pegPopup: { riseDistance: 24, duration: 450, positiveColor: '#7cff7c', negativeColor: '#ff5c5c' },
  pegFail: { color: 0xff3333, count: 12 },
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
