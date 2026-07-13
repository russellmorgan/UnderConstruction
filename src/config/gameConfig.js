// Tunable constants. Edit freely during playtesting — no code restructuring needed.

export const BOARD_WIDTH = 480;
export const BOARD_HEIGHT = 720;

export const PHYSICS = {
  gravityY: 1,
  ball: { radius: 8, restitution: 0.65, friction: 0.01, frictionStatic: 0 },
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
  values: [100, 500, 1000, 5000, 1000, 500, 100],
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
