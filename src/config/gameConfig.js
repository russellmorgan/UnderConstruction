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
  jitter: 3, // max random px offset applied to each peg's x/y so templates don't look pixel-identical on repeat
};

// Board silhouettes. One is picked at random per game (and may be mirrored) so the
// peg field looks different every playthrough, not just the scoring-tier colors.
// Rows don't need to be the same length — createPegField bounds each row's columns by
// that row's own string length, so a row can be widened independently of its neighbors.
// 'X' = peg present, '.' = empty. Avoid 2+ consecutive fully-solid rows (the zigzag
// stagger can close the gaps enough to wall off the ball's path), and aim for at least
// ~20 open cells so all special peg tiers have room to spread out.
// Every row here is extended one peg past its own previous right edge (widening the row
// itself if it was already fully solid) versus the original 10-wide symmetric shapes —
// the un-widened field sat visibly left of board-center, since the staggered offset
// shifts odd rows right of even rows but both were bounded by the same 10-column cap.
export const PEG_TEMPLATES = [
  {
    id: 'full',
    rows: Array(8).fill('XXXXXXXXXXX'),
  },
  {
    id: 'diamond',
    rows: ['....XXX...', '...XXXXX..', '..XXXXXXX.', '.XXXXXXXXX', '.XXXXXXXXX', '..XXXXXXX.', '...XXXXX..', '....XXX...'],
  },
  {
    id: 'hourglass',
    rows: ['XXXXXXXXXXX', '.XXXXXXXXX', '..XXXXXXX.', '...XXXXX..', '...XXXXX..', '..XXXXXXX.', '.XXXXXXXXX', 'XXXXXXXXXXX'],
  },
  {
    id: 'funnel',
    rows: ['XXXXXXXXXXX', '.XXXXXXXXX', '..XXXXXXX.', '..XXXXXXX.', '...XXXXX..', '...XXXXX..', '....XXX...', '...XXXXX..'],
  },
  {
    id: 'zigzag',
    rows: ['XXXXXX....', '.XXXXXX...', '..XXXXXX..', '...XXXXXX.', '....XXXXXX', '.....XXXXXX', '....XXXXXX', '...XXXXXX.'],
  },
  {
    id: 'checkerboard',
    rows: [
      'X.X.X.X.XX',
      '.X.X.X.X.XX',
      'X.X.X.X.XX',
      '.X.X.X.X.XX',
      'X.X.X.X.XX',
      '.X.X.X.X.XX',
      'X.X.X.X.XX',
      '.X.X.X.X.XX',
    ],
  },
];

// Peg variants. Every peg not claimed by a count > 0 entry falls back to 'base'.
// score is flat points. scoreMultiplier no longer inflates a peg's points — it now
// drives a persistent "carry" multiplier (see CARRY): hitting a mult peg raises a
// boost that survives board transitions and scales slot payouts. Mult pegs award the
// flat base score for points; their value is the multiplier they grant.
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

// Endless-board progression. Each board is a fresh random shape; the player advances
// only if the score EARNED on that board reaches the level's threshold. The running
// game total carries across boards, but the gate is per-board earnings.
// thresholdForLevel(level) = round(baseThreshold * thresholdGrowth^(level-1))
export const PROGRESSION = {
  baseThreshold: 8000, // board 1 minimum earned to advance
  thresholdGrowth: 1.6, // × per board: 8000, 12800, 20480, 32768, ...
};

// How long the "BOARD CLEARED" interstitial holds before loading the next board.
export const BOARD_CLEARED = {
  delayMs: 3000,
};

// Carry multiplier: a durable, stacking multiplier collected from mult pegs. Separate
// from the fragile per-board COMBO streak — carry persists across boards and only ever
// climbs (capped), rewarding players who deliberately collect mult pegs.
export const CARRY = {
  start: 1, // multiplier at game start
  stepPerTier: 0.1, // added per (scoreMultiplier - 1) when a mult peg is hit: mult2 +0.1 ... mult5 +0.4
  max: 5, // cap
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

// Sparse peg templates can let a ball settle into a stable resting spot (balanced on
// an isolated peg, wedged in a narrow gap) with no peg/slot/floor collision left to
// resolve it, hanging the drop forever. This watchdog force-recovers: nudge once after
// a stretch of no downward progress, then give up and resolve as a 0-point floor hit.
export const BALL_STALL = {
  checkInterval: 400, // ms between stall checks
  minProgress: 3, // px of downward movement since the last check that counts as "still falling"
  nudgeAfter: 1200, // ms with no progress before applying a one-time horizontal nudge
  forceResolveAfter: 3200, // ms with no progress before giving up and resolving as a floor hit
  nudgeSpeed: 3, // horizontal speed applied by the nudge
};

export const STORAGE_KEY = 'midway-drop:highScore';
