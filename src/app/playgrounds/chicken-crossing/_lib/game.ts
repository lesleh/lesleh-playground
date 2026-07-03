// Pure, DOM-free game logic for "Fowl Play" — a chicken crossing the road,
// dodging bikes. Grid model: the chicken hops cell-to-cell; bikes slide
// continuously along a lane and wrap around. All positions are in *cell units*
// so rendering can pick whatever pixel size fits the container.

export const COLS = 13;
export const ROWS = 15;

// Row 0 is the goal (top), row ROWS-1 is the start (bottom). Everything between
// is either a road lane or a grass "safe strip".
export const GOAL_ROW = 0;
export const START_ROW = ROWS - 1;

export type Direction = "up" | "down" | "left" | "right";
export type RowType = "grass" | "road";

export interface Lane {
  row: number;
  type: RowType;
  // Travel direction for road rows: +1 = rightward, -1 = leftward. 0 for grass.
  dir: -1 | 0 | 1;
}

export interface Bike {
  row: number;
  x: number; // left edge, in cell units, may sit off-grid mid-wrap
  speed: number; // cells/sec, always positive (direction comes from the lane)
  dir: -1 | 1;
  length: number; // in cells
}

export interface Chicken {
  col: number;
  row: number;
}

export interface GameState {
  level: number;
  lanes: Lane[];
  bikes: Bike[];
  chicken: Chicken;
  timeLeft: number; // seconds remaining in the crossing
  levelDuration: number;
  // Lowest row index the chicken has reached this crossing (row 0 = top/goal),
  // used to award points only for fresh forward progress.
  bestRow: number;
}

export type Rng = () => number;

// --- Scoring ---------------------------------------------------------------

export const POINTS_PER_ROW = 10;
export const LEVEL_CLEAR_BONUS = 100;
// Each whole second left on the clock when the goal is reached.
export const TIME_BONUS_PER_SEC = 5;

export function timeBonus(timeLeft: number): number {
  return Math.max(0, Math.floor(timeLeft)) * TIME_BONUS_PER_SEC;
}

// --- Level shaping ---------------------------------------------------------

// Number of grass safe strips sitting between goal and start. Starts generous
// and dries up as levels climb, so the road becomes one long gauntlet.
export function safeStripCount(level: number): number {
  return Math.max(0, 2 - Math.floor((level - 1) / 2));
}

// Base bike speed (cells/sec) ramps with level.
export function baseSpeed(level: number): number {
  return 2 + (level - 1) * 0.6;
}

// Bikes per lane grows slowly with level; more bikes = less daylight.
export function bikesPerLane(level: number): number {
  return Math.min(2 + Math.floor((level - 1) / 2), 4);
}

export function levelDurationFor(level: number): number {
  // Tighter clock as things speed up, but never punishing.
  return Math.max(20, 45 - (level - 1) * 2);
}

// Build the lane layout for a level. The middle rows (between goal and start)
// are road by default, with `safeStripCount` of them converted to grass,
// spaced roughly evenly so the player gets breathers.
export function buildLanes(level: number): Lane[] {
  const lanes: Lane[] = [];
  const middleRows: number[] = [];
  for (let row = 0; row < ROWS; row++) {
    if (row === GOAL_ROW || row === START_ROW) {
      lanes.push({ row, type: "grass", dir: 0 });
    } else {
      middleRows.push(row);
      lanes.push({ row, type: "road", dir: row % 2 === 0 ? 1 : -1 });
    }
  }

  const strips = Math.min(safeStripCount(level), middleRows.length);
  for (let i = 0; i < strips; i++) {
    // Evenly distribute safe strips across the middle band.
    const idx = Math.round(((i + 1) * middleRows.length) / (strips + 1)) - 1;
    const row = middleRows[Math.max(0, Math.min(middleRows.length - 1, idx))];
    lanes[row] = { row, type: "grass", dir: 0 };
  }

  return lanes;
}

// Populate a lane with evenly spaced bikes, jittered so lanes don't march in
// lockstep. All bikes in a lane share one speed (so they never bunch up), but
// that speed varies from lane to lane for texture.
function spawnBikes(lane: Lane, level: number, rng: Rng): Bike[] {
  if (lane.type !== "road") return [];
  const count = bikesPerLane(level);
  const gap = COLS / count;
  const speed = baseSpeed(level) * (0.7 + rng() * 0.9); // 0.7x–1.6x of base, per lane
  const length = 1;
  const jitter = rng() * gap;
  const bikes: Bike[] = [];
  for (let i = 0; i < count; i++) {
    const x = (i * gap + jitter) % COLS;
    bikes.push({ row: lane.row, x, speed, dir: lane.dir === -1 ? -1 : 1, length });
  }
  return bikes;
}

export function createLevel(level: number, rng: Rng = Math.random): GameState {
  const lanes = buildLanes(level);
  const bikes = lanes.flatMap((lane) => spawnBikes(lane, level, rng));
  const levelDuration = levelDurationFor(level);
  return {
    level,
    lanes,
    bikes,
    chicken: { col: Math.floor(COLS / 2), row: START_ROW },
    timeLeft: levelDuration,
    levelDuration,
    bestRow: START_ROW,
  };
}

// Reset the chicken to the start row after a crash, keeping the same level.
export function respawn(state: GameState): void {
  state.chicken = { col: Math.floor(COLS / 2), row: START_ROW };
  state.bestRow = START_ROW;
}

// --- Per-frame simulation (mutating for performance) -----------------------

// Advance every bike by dt seconds and wrap it around the play field.
export function advanceBikes(state: GameState, dt: number): void {
  for (const bike of state.bikes) {
    bike.x += bike.dir * bike.speed * dt;
    if (bike.dir > 0 && bike.x >= COLS) {
      bike.x -= COLS + bike.length;
    } else if (bike.dir < 0 && bike.x + bike.length <= 0) {
      bike.x += COLS + bike.length;
    }
  }
}

export function tickTimer(state: GameState, dt: number): void {
  state.timeLeft = Math.max(0, state.timeLeft - dt);
}

// Move the chicken one cell, clamped to the grid. Returns the number of rows
// of *fresh* forward progress made (0 or 1) so the caller can award points.
export function hop(state: GameState, dir: Direction): number {
  const { chicken } = state;
  switch (dir) {
    case "up":
      chicken.row = Math.max(GOAL_ROW, chicken.row - 1);
      break;
    case "down":
      chicken.row = Math.min(START_ROW, chicken.row + 1);
      break;
    case "left":
      chicken.col = Math.max(0, chicken.col - 1);
      break;
    case "right":
      chicken.col = Math.min(COLS - 1, chicken.col + 1);
      break;
  }
  if (chicken.row < state.bestRow) {
    const gained = state.bestRow - chicken.row;
    state.bestRow = chicken.row;
    return gained;
  }
  return 0;
}

// Forgiving hitbox: shave the edges so a near-miss reads as a miss.
const HIT_INSET = 0.2;

export function checkCollision(state: GameState): boolean {
  const { chicken, bikes } = state;
  const cLeft = chicken.col + HIT_INSET;
  const cRight = chicken.col + 1 - HIT_INSET;
  for (const bike of bikes) {
    if (bike.row !== chicken.row) continue;
    const bLeft = bike.x + HIT_INSET;
    const bRight = bike.x + bike.length - HIT_INSET;
    if (cLeft < bRight && cRight > bLeft) return true;
  }
  return false;
}

export function atGoal(state: GameState): boolean {
  return state.chicken.row === GOAL_ROW;
}
