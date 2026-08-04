// All tunable constants in one place: board/physics dimensions, peg types and layout
// templates, scoring zones, carry multiplier tuning, progression thresholds, carnival
// palette, juice (camera shake/particles/flash) values, bonus ball rules, narrator timing,
// stall detection, and the storage key. Playtest tuning should happen here, not in scene code.

export const BOARD_WIDTH = 480;
// 9:16 portrait aspect ratio (the standard mobile/CrazyGames embed shape). Width is
// left untouched — PEG_FIELD spacing/margins and the peg templates' full-width rows
// are tuned against it, and shrinking it culls edge pegs off the two mandatory
// full-width rows, opening a straight vertical drop lane (see PEG_TEMPLATES above).
// Height is derived instead, so the extra portrait room only adds space below/around
// existing layout rather than compressing it.
export const BOARD_HEIGHT = Math.round((BOARD_WIDTH * 16) / 9);

// Phaser Text objects render their glyph canvas at 1x resolution by default (Phaser 4
// dropped the old game-config-wide text resolution fallback), so on any HiDPI display —
// or whenever Scale.FIT stretches the board canvas above its logical size — every text
// object comes out visibly blurry. Capped at 3x so an absurd devicePixelRatio can't blow
// up glyph-canvas memory for no visible gain.
export const TEXT_RESOLUTION = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 1;

export const PHYSICS = {
  gravityY: 1,
  // color: ivory rather than pure white so it doesn't clash with the white/cream carnival
  // chrome, and stays visually distinct from every peg tier.
  ball: { radius: 8, restitution: 0.85, friction: 0.01, frictionStatic: 0, color: 0xfaf6ec },
  peg: { radius: 6 },
};

export const PEG_FIELD = {
  rows: 10,
  spacingX: 40,
  spacingY: 40,
  topMargin: 180, // one full spacingY below the old 140 — centers the 10-row field between the header rail and the slots
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
// createPegField now centers each template's own bounding box on BOARD_WIDTH before
// placing pegs, so uneven row lengths/stagger no longer bias the field toward one side
// — templates don't need to be hand-balanced left-to-right to render centered.
// Every template must keep at least two full-width 'XXXXXXXXXXX' rows at different
// depths (rows 2 and 7 by convention in the 10-row field). Without them, funnel/pyramid
// shapes leave an empty column on each edge and the ball can fall from the drop line
// straight into a slot without touching a single peg — the one outcome the board must
// never allow.
export const PEG_TEMPLATES = [
  {
    id: 'full',
    rows: Array(10).fill('XXXXXXXXXXX'),
  },
  {
    id: 'diamond',
    rows: ['....XXX...', '...XXXXX..', 'XXXXXXXXXXX', '.XXXXXXXXX', '.XXXXXXXXX', '.XXXXXXXXX', '..XXXXXXX.', 'XXXXXXXXXXX', '...XXXXX..', '....XXX...'],
  },
  {
    id: 'hourglass',
    rows: ['XXXXXXXXXXX', '.XXXXXXXXX', 'XXXXXXXXXXX', '...XXXXX..', '...XXXXX..', '...XXXXX..', '..XXXXXXX.', 'XXXXXXXXXXX', '.XXXXXXXXX', 'XXXXXXXXXXX'],
  },
  {
    id: 'pyramid',
    rows: ['...XXXXX..', '....XXXX..', 'XXXXXXXXXXX', '...XXXXXX..', '..XXXXXXX.', '..XXXXXXX.', '.XXXXXXXXX', 'XXXXXXXXXXX', '.XXXXXXXXX', '.XXXXXXXXX'],
  },
  {
    id: 'zigzag',
    rows: ['.XXXXXX.X.', '..XX.XXX.X.', 'XXXXXXXXXXX', '...XXXXXX.', '....XXXXXX', '.....XXXXXX', '....XXXXXX', 'XXXXXXXXXXX', '...XXXXXX.', '..XX.XXX.X.'],
  },
  {
    id: 'checkerboard',
    rows: [
      'X.X.X.X.XX',
      '.X.X.X.X.XX',
      'XXXXXXXXXXX',
      '.X.X.X.X.XX',
      'X.X.X.X.XX',
      '.X.X.X.X.XX',
      'X.X.X.X.XX',
      'XXXXXXXXXXX',
      '.X.X.X.X.XX',
      'X.X.X.X.XX',
    ],
  },
  {
    id: 'chevron',
    rows: ['XXXX.X.XXXX', 'XXX.XXX.XXX', 'XXXXXXXXXXX', 'XX.XXXXX.XX', 'X.XX.X.XX.X', 'XX.XXXXX.XX', 'XXX.XXX.XXX', 'XXXXXXXXXXX', 'XXX.XXX.XXX', 'XXXX.X.XXXX'],
  },
  {
    id: 'lattice',
    rows: ['XXX.XXX.XXX', 'XXXXXXXXXXX', 'X.XXX.XXX.X', 'XXXXX.XXXXX', 'X.XXX.XXX.X', 'XXXXXXXXXXX', 'XXX.XXX.XXX', 'XX.XXXXX.XX', 'X.XXX.XXX.X', 'XXX.XXX.XXX'],
  },
  {
    id: 'ribs',
    rows: ['XXXXXXXXXXX', 'X.X.XXX.X.X', 'XXX.XXX.XXX', 'XXXXXXXXXXX', 'X.XXX.XXX.X', 'XX.XXXXX.XX', 'XXXX.X.XXXX', 'XXXXXXXXXXX', 'X.X.XXX.X.X', 'XXX.XXX.XXX'],
  },
  {
    id: 'honeycomb',
    rows: ['XX.XXX.XXXX', 'XXXXXXXXXXX', 'X.XXX.XXX.X', 'XXX.XXX.XXX', 'XXXXXXXXXXX', 'X.XXX.XXX.X', 'XXX.XXX.XXX', 'XX.XXXXX.XX', 'X.XXX.XXX.X', 'XXX.XXX.XXX'],
  },
];

// Dev override: set to a PEG_TEMPLATES id (e.g. 'diamond') to always load that exact
// board — unmirrored — instead of a random one, so you can iterate on one layout at a
// time without rerolling. Leave null for normal random selection + mirroring. Never
// commit this set to a non-null value.
export const DEV_FORCE_TEMPLATE_ID = null;

// Peg variants. Every peg not claimed by a count > 0 entry falls back to 'base'.
// score is flat points. scoreMultiplier no longer inflates a peg's points — it now
// drives a persistent "carry" multiplier (see CARRY): hitting a mult peg raises a
// boost that survives board transitions and scales slot payouts. Mult pegs award the
// flat base score for points; their value is the multiplier they grant.
// frictionStatic: 0 keeps a slow-moving ball from pinning in the notch between two pegs.
//
// Color logic, end to end: base pegs are muted antique brass so the ~70 of them sit
// back. The four mult tiers used to be a metal ladder (bronze/silver/gold/diamond), but
// bronze and gold were close enough to the brass base that players couldn't tell what
// to aim for — the tiers were only legible side by side, and on the board they never
// are. So the mult tiers are now saturated neon that shares no hue with brass at all:
// lime → magenta → amber → diamond-cyan. Rank still climbs by `ring`/`glow` intensity
// rather than by hue, since the job of the color is "aim here", and only the job of the
// glow is "this one's worth more". Keep any new reward tier off the brass hue range
// (roughly 25-45° hue) or it disappears into the field again.
//
// The penalty peg is `hazard: true` and drawn by a completely different generator
// (makeHazardPegTexture, see PegField.pegTextureFor) — spiked mine silhouette, black/
// yellow warning stripe, pulsing red glow, a shiver tween. It's the one peg that ends
// a drop outright (see GameScene.failDrop), so it has to read as dangerous from across
// the board, not just on contact — and it must never share the reward family's palette,
// which is why no reward tier is red or black.
export const PEG_TYPES = [
  { id: 'base', score: 5, color: 0xb98a4b, restitution: 0.7, friction: 0, frictionStatic: 0, count: 'rest' },
  { id: 'mult2', scoreMultiplier: 2, color: 0x5cf24a, ring: 0xbdffb0, glow: 1.0, restitution: 0.8, friction: 0, frictionStatic: 0, count: 4 }, // lime
  { id: 'mult3', scoreMultiplier: 3, color: 0xff5fd2, ring: 0xffc2ef, glow: 1.15, restitution: 0.85, friction: 0, frictionStatic: 0, count: 2 }, // magenta
  { id: 'mult4', scoreMultiplier: 4, color: 0xffd21f, ring: 0xfff3a8, glow: 1.3, restitution: 0.9, friction: 0, frictionStatic: 0, count: 2 }, // amber
  { id: 'mult5', scoreMultiplier: 5, color: 0x6feaff, ring: 0xffffff, glow: 1.5, restitution: 0.95, friction: 0, frictionStatic: 0, count: 2 }, // diamond-cyan
  { id: 'penalty', score: -20, color: 0x1a1414, hazard: true, restitution: 0.4, friction: 0.05, frictionStatic: 0.05, count: 2 },
];

export const SLOTS = {
  height: 60,
  // Outer zones are the lowest-probability landings on a Galton-board-shaped distribution
  // funneling toward center, so they pay a small consolation rather than nothing.
  zones: [
    { value: 100 },
    { value: 500 },
    { value: 1000 },
    { value: 2000 },
    { value: 1000 },
    { value: 500 },
    { value: 100 },
  ],
};

// Endless-board progression. Each board is a fresh random shape; the player advances
// only if the score EARNED on that board reaches the level's threshold. The running
// game total carries across boards, but the gate is per-board earnings.
// thresholdForLevel(level) = round(baseThreshold * thresholdGrowth^(level-1))
export const PROGRESSION = {
  baseThreshold: 5000, // board 1 minimum earned to advance
  thresholdGrowth: 1.6, // × per board: 2500, 4000, 6400, 10240, ...
};

// How long the "BOARD CLEARED" interstitial holds before loading the next board.
export const BOARD_CLEARED = {
  delayMs: 3000,
  popInMs: 700, // sign scale-up bounce duration on entry
};

// How long the game pauses after the last ball before showing the round results.
export const RESULTS = {
  delayMs: 3000,
};

// Carry multiplier: a durable, stacking multiplier collected from mult pegs. It is the
// sole multiplier applied to slot scoring, and it is deliberately weak in three ways so
// that maxing it early can't outrun PROGRESSION.thresholdGrowth:
//   1. repeatHitFactor — a peg's full boost is paid once per board; re-hits pay a quarter,
//      so the cap is collected, not ground out on one diamond peg.
//   2. payoutFraction — the multiplier applies sublinearly to a slot's value, so it never
//      multiplies the jackpot zone outright.
//   3. carryOverFraction — half the accumulated boost survives a board clear, so stacking
//      is still rewarded but a board-1 max isn't permanent.
export const CARRY = {
  start: 1, // multiplier at game start
  // Added per (scoreMultiplier - 1) on a peg's first hit: mult2 +0.06 ... mult5 +0.24.
  // Deliberately sized so one hit on each of the 10 mult pegs sums to +1.32 — short of
  // the +1.5 headroom to `max`. Without that gap the cap is reached on a single clean
  // pass and repeatHitFactor never binds.
  stepPerTier: 0.06,
  repeatHitFactor: 0.25, // fraction of the full boost paid on 2nd+ hit of the same peg this board
  payoutFraction: 0.5, // slot payout = points * (1 + (carry - 1) * payoutFraction)
  carryOverFraction: 0.5, // next board starts at 1 + (carry - 1) * carryOverFraction
  max: 2.5, // cap
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
  // Bounce pop on the score text whenever a drop lands in a scoring zone.
  scoreBounce: { duration: 260, scale: 1.35 },
  pegFlash: { duration: 90, tint: 0x7ef7ff },
  particle: {
    baseCount: 16,
    countPerMultiplier: 4,
    baseColor: 0x00d9ff,
    hotColor: 0xffe14d,
  },
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
  bonusFlash: { color: [80, 255, 140] },
  bonusParticleCount: 14,
};

// Bonus balls are gated on a fraction of the CURRENT BOARD'S target rather than an
// absolute score, so an inflated economy (high carry, big slots, late boards) can't
// auto-max the cap on the first few drops the way a flat interval did.
// Zone landings (the hardest shot on the board) are never capped — they're rare enough
// to be self-limiting. Only the score-threshold source, which fires on ordinary play,
// has a cap, so it can't crowd out the zone bonus before a player ever reaches it.
export const BONUS_BALLS = {
  targetFraction: 0.25, // one ball per 25% of the board target earned on that board
  maxFromThreshold: 3,
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
