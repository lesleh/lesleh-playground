import {
  COLS,
  ROWS,
  GOAL_ROW,
  START_ROW,
  createLevel,
  respawn,
  advanceBikes,
  tickTimer,
  hop,
  checkCollision,
  atGoal,
  buildLanes,
  safeStripCount,
  baseSpeed,
  bikesPerLane,
  timeBonus,
  type GameState,
  type Bike,
} from "./game";

// Deterministic rng for reproducible level generation.
const fixedRng = () => 0.5;

describe("createLevel", () => {
  it("places the chicken on the start row, centred", () => {
    const s = createLevel(1, fixedRng);
    expect(s.chicken.row).toBe(START_ROW);
    expect(s.chicken.col).toBe(Math.floor(COLS / 2));
    expect(s.bestRow).toBe(START_ROW);
  });

  it("gives one lane per row with grass at goal and start", () => {
    const s = createLevel(1, fixedRng);
    expect(s.lanes).toHaveLength(ROWS);
    expect(s.lanes[GOAL_ROW].type).toBe("grass");
    expect(s.lanes[START_ROW].type).toBe("grass");
  });

  it("only spawns bikes on road lanes", () => {
    const s = createLevel(3, fixedRng);
    const roadRows = new Set(
      s.lanes.filter((l) => l.type === "road").map((l) => l.row),
    );
    for (const bike of s.bikes) {
      expect(roadRows.has(bike.row)).toBe(true);
    }
  });

  it("sets a per-level countdown", () => {
    const s = createLevel(1, fixedRng);
    expect(s.timeLeft).toBe(s.levelDuration);
    expect(s.levelDuration).toBeGreaterThan(0);
  });
});

describe("level progression", () => {
  it("fewer safe strips as levels climb", () => {
    expect(safeStripCount(1)).toBeGreaterThanOrEqual(safeStripCount(5));
    expect(safeStripCount(10)).toBe(0);
  });

  it("faster bikes at higher levels", () => {
    expect(baseSpeed(5)).toBeGreaterThan(baseSpeed(1));
  });

  it("more bikes per lane at higher levels, capped", () => {
    expect(bikesPerLane(1)).toBeLessThanOrEqual(bikesPerLane(9));
    expect(bikesPerLane(99)).toBeLessThanOrEqual(4);
  });

  it("adjacent road lanes travel in opposite directions", () => {
    const lanes = buildLanes(1).filter((l) => l.type === "road");
    for (let i = 1; i < lanes.length; i++) {
      if (lanes[i].row === lanes[i - 1].row + 1) {
        expect(lanes[i].dir).not.toBe(lanes[i - 1].dir);
      }
    }
  });
});

describe("hop", () => {
  it("moves up and awards a row of progress", () => {
    const s = createLevel(1, fixedRng);
    const gained = hop(s, "up");
    expect(s.chicken.row).toBe(START_ROW - 1);
    expect(gained).toBe(1);
    expect(s.bestRow).toBe(START_ROW - 1);
  });

  it("does not award points for retreading old ground", () => {
    const s = createLevel(1, fixedRng);
    hop(s, "up");
    expect(hop(s, "down")).toBe(0); // back down: no progress
    expect(hop(s, "up")).toBe(0); // returning to a row already reached: no progress
  });

  it("clamps at the grid edges", () => {
    const s = createLevel(1, fixedRng);
    s.chicken = { col: 0, row: GOAL_ROW };
    hop(s, "up");
    expect(s.chicken.row).toBe(GOAL_ROW);
    hop(s, "left");
    expect(s.chicken.col).toBe(0);
    s.chicken = { col: COLS - 1, row: START_ROW };
    hop(s, "down");
    expect(s.chicken.row).toBe(START_ROW);
    hop(s, "right");
    expect(s.chicken.col).toBe(COLS - 1);
  });
});

describe("advanceBikes", () => {
  const makeState = (bike: Bike): GameState => ({
    level: 1,
    lanes: [],
    bikes: [bike],
    chicken: { col: 0, row: 5 },
    timeLeft: 10,
    levelDuration: 10,
    bestRow: START_ROW,
  });

  it("moves a rightward bike forward", () => {
    const s = makeState({ row: 5, x: 2, speed: 3, dir: 1, length: 1 });
    advanceBikes(s, 1);
    expect(s.bikes[0].x).toBeCloseTo(5);
  });

  it("wraps a rightward bike back near the left edge", () => {
    const s = makeState({ row: 5, x: COLS - 0.5, speed: 2, dir: 1, length: 1 });
    advanceBikes(s, 1);
    // 12.5 -> 14.5, wraps by (COLS + length) to reappear from the left.
    expect(s.bikes[0].x).toBeLessThan(1);
    expect(s.bikes[0].x).toBeGreaterThanOrEqual(-1);
  });

  it("wraps a leftward bike back near the right edge", () => {
    const s = makeState({ row: 5, x: -0.5, speed: 2, dir: -1, length: 1 });
    advanceBikes(s, 1);
    // -0.5 -> -2.5, wraps by (COLS + length) to reappear from the right.
    expect(s.bikes[0].x).toBeGreaterThan(COLS - 2);
    expect(s.bikes[0].x).toBeLessThanOrEqual(COLS);
  });
});

describe("checkCollision", () => {
  const baseState = (chickenCol: number, chickenRow: number, bikes: Bike[]): GameState => ({
    level: 1,
    lanes: [],
    bikes,
    chicken: { col: chickenCol, row: chickenRow },
    timeLeft: 10,
    levelDuration: 10,
    bestRow: START_ROW,
  });

  it("detects an overlapping bike in the same row", () => {
    const s = baseState(5, 3, [{ row: 3, x: 5, speed: 1, dir: 1, length: 1 }]);
    expect(checkCollision(s)).toBe(true);
  });

  it("ignores a bike in a different row", () => {
    const s = baseState(5, 3, [{ row: 4, x: 5, speed: 1, dir: 1, length: 1 }]);
    expect(checkCollision(s)).toBe(false);
  });

  it("treats an adjacent-but-not-overlapping bike as a miss", () => {
    const s = baseState(5, 3, [{ row: 3, x: 6.5, speed: 1, dir: 1, length: 1 }]);
    expect(checkCollision(s)).toBe(false);
  });
});

describe("atGoal", () => {
  it("is true only on the goal row", () => {
    const s = createLevel(1, fixedRng);
    expect(atGoal(s)).toBe(false);
    s.chicken.row = GOAL_ROW;
    expect(atGoal(s)).toBe(true);
  });
});

describe("respawn", () => {
  it("returns the chicken to the start and resets progress", () => {
    const s = createLevel(1, fixedRng);
    hop(s, "up");
    hop(s, "up");
    respawn(s);
    expect(s.chicken.row).toBe(START_ROW);
    expect(s.bestRow).toBe(START_ROW);
  });
});

describe("tickTimer", () => {
  it("counts down and floors at zero", () => {
    const s = createLevel(1, fixedRng);
    s.timeLeft = 1;
    tickTimer(s, 0.4);
    expect(s.timeLeft).toBeCloseTo(0.6);
    tickTimer(s, 5);
    expect(s.timeLeft).toBe(0);
  });
});

describe("timeBonus", () => {
  it("awards points per whole second remaining", () => {
    expect(timeBonus(0)).toBe(0);
    expect(timeBonus(3.9)).toBe(3 * 5);
  });
});
