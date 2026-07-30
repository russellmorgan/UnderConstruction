// All tunable constants in one place: board/physics dimensions, peg types and layout
// templates, scoring zones, combo/carry multiplier tuning, progression thresholds, carnival
// palette, juice (camera shake/particles/flash) values, bonus ball rules, narrator timing,
// stall detection, and the storage key. Playtest tuning should happen here, not in scene code.

export const BOARD_WIDTH = 480;
export const BOARD_HEIGHT = 720;

export const PHYSICS = {
  gravityY: 1,
  // color: ivory rather than pure white so it doesn't clash with the white/cream carnival
  // chrome, and stays visually distinct from every peg tier.
  ball: { radius: 8, restitution: 0.85, friction: 0.01, frictionStatic: 0, color: 0xfaf6ec },
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

// Experimental drop style: when enabled, the drop indicator sweeps back and forth on
// its own and the player just times a tap/click/space to release — no drag-to-aim.
export const TIMED_DROP = {
  enabled: true,
  sweepMs: 1400, // time for one full left-to-right sweep
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
    rows: ['.XXXXXX.X.', '..XX.XXX.X.', '..XXXXXX..', '...XXXXXX.', '....XXXXXX', '.....XXXXXX', '....XXXXXX', '...XXXXXX.'],
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
//
// Color logic, end to end: base pegs are muted antique brass so the ~60 of them sit
// back. The four mult tiers read as a prize-shelf ladder — bronze → silver → gold →
// diamond — a metaphor most players already know, so "which peg is worth more" is
// legible without reading a number. `ring`/`glow` intensify with tier so the rarer
// pegs are visibly juicier, not just differently colored. Diamond is the one reward
// peg that breaks from warm-brass into cool cyan-white — a deliberate palette break so
// the jackpot tier still pops even after a player's eye has adapted to the ladder.
//
// The penalty peg is `hazard: true` and drawn by a completely different generator
// (makeHazardPegTexture, see PegField.pegTextureFor) — spiked mine silhouette, black/
// yellow warning stripe, pulsing red glow, a shiver tween. It's the one peg that ends
// a drop outright (see GameScene.failDrop), so it has to read as dangerous from across
// the board, not just on contact — and it must never share the reward family's palette,
// which is why no reward tier is red or black.
export const PEG_TYPES = [
  { id: 'base', score: 5, color: 0xb98a4b, restitution: 0.7, friction: 0, frictionStatic: 0, count: 'rest' },
  { id: 'mult2', scoreMultiplier: 2, color: 0xb5732f, ring: 0x7a4a1e, glow: 0.85, restitution: 0.8, friction: 0, frictionStatic: 0, count: 4 }, // bronze
  { id: 'mult3', scoreMultiplier: 3, color: 0xcdd7e0, ring: 0x8b97a3, glow: 0.7, restitution: 0.85, friction: 0, frictionStatic: 0, count: 2 }, // silver
  { id: 'mult4', scoreMultiplier: 4, color: 0xf2b134, ring: 0xad7a10, glow: 0.9, restitution: 0.9, friction: 0, frictionStatic: 0, count: 2 }, // gold
  { id: 'mult5', scoreMultiplier: 5, color: 0xa8e8ff, ring: 0x5fd0f2, glow: 1.15, restitution: 0.95, friction: 0, frictionStatic: 0, count: 2 }, // diamond
  { id: 'penalty', score: -20, color: 0x1a1414, hazard: true, restitution: 0.4, friction: 0.05, frictionStatic: 0.05, count: 3 },
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
  baseThreshold: 20000, // board 1 minimum earned to advance
  thresholdGrowth: 1.6, // × per board: 8000, 12800, 20480, 32768, ...
};

// How long the "BOARD CLEARED" interstitial holds before loading the next board.
export const BOARD_CLEARED = {
  delayMs: 3000,
};

// How long the game pauses after the last ball before showing the round results.
export const RESULTS = {
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

// Carnival/midway UI palette + chrome tuning. Applies to UI chrome ONLY — the ball and
// pegs stay on their original clean palette (see PHYSICS/PEG_TYPES) so the play field
// never reads as "styled into broken".
export const CARNIVAL = {
  night: 0x2b1733,
  nightDeep: 0x140b1c,
  canvasRed: 0xb5392c,
  canvasCream: 0xecd7ab,
  panelRed: 0x8c2318,
  panelRedDark: 0x4d1610,
  wood: 0x6b4423,
  woodDark: 0x35200f,
  gold: 0xf2b134,
  goldLight: 0xffd97a,
  wire: 0x3a2a1a,
  bulbOn: 0xffffff,
  bulbRadius: 4.2,
  ink: 0x2a1108,
  boardTop: 0x1b1026,
  boardBottom: 0x0d0714,
  // Hazard family — reserved for the one dangerous peg. Never reused for a reward so
  // the "avoid this" signal stays unambiguous.
  hazardBlack: 0x14100e,
  hazardYellow: 0xf5c518,
  hazardRed: 0xe8362b,
  // string colors for text objects
  cream: '#f4e3c1',
  goldText: '#ffcf5c',
  inkText: '#2a1108',
  dimText: '#b79a72',
  greenText: '#8fe08a',
  // idle animation
  swayDegrees: 1.4,
  swayDuration: 2000,
  flickerMin: 600,
  flickerMax: 2200,
};

export const JUICE = {
  shake: {
    peg: { duration: 40, intensity: 0.003 },
    score: { duration: 120, intensity: 0.004 }, // multiplied by current multiplier at call time
  },
  particle: {
    baseCount: 16,
    countPerMultiplier: 4,
    baseColor: 0x00d9ff,
    hotColor: 0xffe14d,
  },
  comboBreakFlash: { duration: 180, color: [255, 60, 60] },
  // Reward-tier (mult peg) popup: scales with the peg's carry-boost tier (0 = bronze,
  // 1 = diamond). Color rides the same warm→cool ladder as the peg palette itself
  // (gold at low tiers, icy diamond-white at max) rather than an arbitrary hot color,
  // so the popup and the peg always agree about what "better" looks like.
  rewardPopup: {
    baseFontSize: 18,
    maxFontSize: 28,
    floatDistance: 90,
    popInMs: 240,
    holdMs: 500,
    fadeMs: 240,
    wobbleDegrees: 5,
    colorLow: 0xffe14d,
    colorHigh: 0xbdfaff,
  },
  // The hazard peg is the one danger in the game — ends the drop outright — so its
  // feedback is deliberately the loudest thing in JUICE: a real shockwave ring, a
  // two-tone (red/black) burst well above the reward-peg particle counts, a hard
  // camera hit, and a popup that shakes instead of gently floating.
  pegFail: {
    colorCore: 0xe8362b,
    colorSpark: 0x1a1414,
    count: 26,
    shake: { duration: 260, intensity: 0.012 },
    flash: { duration: 240, color: [232, 54, 43] },
    shockwave: { duration: 380, startScale: 0.5, endScale: 2.6 },
    popup: {
      fontSize: 26,
      floatDistance: 40,
      popInMs: 140,
      holdMs: 420,
      fadeMs: 320,
      shakeAmplitude: 5,
      shakeCount: 6,
      color: '#ffdd57',
    },
  },
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
  minDropsBetweenLines: 2,
  maxDropsBetweenLines: 6,
  scoreThreshold: 1000, // placeholder — set from playtest data
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
