// Tunable constants. Edit freely during playtesting — no code restructuring needed.

export const BOARD_WIDTH = 480;
export const BOARD_HEIGHT = 720;

export const PHYSICS = {
  gravityY: 1,
  ball: { radius: 8, restitution: 0.85, friction: 0.01, frictionStatic: 0 },
  // frictionStatic: 0 keeps a slow-moving ball from pinning in the notch between two pegs.
  peg: { radius: 6, restitution: 0.7, friction: 0, frictionStatic: 0 },
  wall: { restitution: 0.6, friction: 0, frictionStatic: 0 },
};

const PEG_JITTER = 5;
const PEG_RADIUS_RANGE = [4, 7];
// Worst case for two neighboring pegs: both at max radius, jittered toward each other.
// Spacing is derived so that case still leaves room for the ball (plus a margin) to pass through,
// so this stays correct if PHYSICS.ball.radius or the peg radius/jitter tuning above changes.
const PEG_CLEARANCE_MARGIN = 4;
const PEG_MIN_SPACING_X =
  PEG_JITTER * 2 + PEG_RADIUS_RANGE[1] * 2 + PHYSICS.ball.radius * 2 + PEG_CLEARANCE_MARGIN;

export const PEG_FIELD = {
  rows: 11,
  spacingX: PEG_MIN_SPACING_X,
  spacingY: 40,
  topMargin: 140,
  sideMargin: 30,
  // Per-peg randomization: position jitter (px), radius range, and restitution range.
  // Restitution is colored on a cold->hot gradient so players can read bounciness at a glance.
  jitter: PEG_JITTER,
  radiusRange: PEG_RADIUS_RANGE,
  restitutionRange: [0.4, 1.0],
  coldColor: 0x3355ff,
  hotColor: 0xff3355,
};

export const SLOTS = {
  height: 60,
  slotGap: 20, // px gap between zones; ball can fall through gaps and score 0
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
  wallBounceImpulse: 3, // horizontal velocity boost when hitting a side wall
  trail: {
    lifespan: 330,
    alpha: 0.4,
    scale: 0.7,
  },
  bonusFlash: { duration: 150, color: [80, 255, 140] },
  bonusParticleCount: 14,
};

export const BONUS_BALLS = {
  scoreInterval: 500,
  comboTier: 3,
  maxPerSession: 5,
};

export const NARRATOR = {
  minDropsBetweenLines: 2,
  maxDropsBetweenLines: 4,
  scoreThreshold: 3000, // placeholder — set from playtest data
};

// Each peg shrinks and fades out one by one (random order) after a ball resolves,
// before the next layout appears. Visual-only; physics bodies are removed after the tween.
export const PEG_TRANSITION = {
  pegFadeDuration: 80,
  staggerPerPeg: 7,
};

export const SESSION = {
  ballsPerSession: 10,
};

export const STORAGE_KEY = 'under-construction:highScore';
