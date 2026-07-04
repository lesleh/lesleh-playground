import {
  GAME_MS,
  LIFETIME_END_MS,
  LIFETIME_START_MS,
  MAX_MULTIPLIER,
  SPAWN_END_MS,
  SPAWN_START_MS,
  moleLifetime,
  multiplier,
  pickHole,
  progress,
  spawnInterval,
} from "./game";

describe("progress", () => {
  it("is 0 at the start and 1 at the end", () => {
    expect(progress(0)).toBe(0);
    expect(progress(GAME_MS)).toBe(1);
  });

  it("clamps outside the round", () => {
    expect(progress(-1000)).toBe(0);
    expect(progress(GAME_MS * 2)).toBe(1);
  });
});

describe("spawnInterval", () => {
  it("starts slow and finishes fast", () => {
    expect(spawnInterval(0)).toBe(SPAWN_START_MS);
    expect(spawnInterval(GAME_MS)).toBe(SPAWN_END_MS);
  });

  it("never increases as the round goes on", () => {
    let prev = Infinity;
    for (let t = 0; t <= GAME_MS; t += GAME_MS / 10) {
      const value = spawnInterval(t);
      expect(value).toBeLessThanOrEqual(prev);
      expect(value).toBeGreaterThanOrEqual(SPAWN_END_MS);
      prev = value;
    }
  });
});

describe("moleLifetime", () => {
  it("starts generous and finishes stingy", () => {
    expect(moleLifetime(0)).toBe(LIFETIME_START_MS);
    expect(moleLifetime(GAME_MS)).toBe(LIFETIME_END_MS);
  });

  it("stays within bounds across the round", () => {
    for (let t = 0; t <= GAME_MS; t += GAME_MS / 10) {
      const value = moleLifetime(t);
      expect(value).toBeLessThanOrEqual(LIFETIME_START_MS);
      expect(value).toBeGreaterThanOrEqual(LIFETIME_END_MS);
    }
  });
});

describe("multiplier", () => {
  it("is 1x for no streak and the first tier of hits", () => {
    expect(multiplier(0)).toBe(1);
    expect(multiplier(1)).toBe(1);
    expect(multiplier(5)).toBe(1);
  });

  it("steps up once per COMBO_STEP hits", () => {
    expect(multiplier(6)).toBe(2);
    expect(multiplier(11)).toBe(3);
  });

  it("caps at MAX_MULTIPLIER", () => {
    expect(multiplier(1000)).toBe(MAX_MULTIPLIER);
  });
});

describe("pickHole", () => {
  it("only ever returns an empty hole", () => {
    const occupied = [true, false, true, false, true];
    // rand pinned to the top of the range picks the last free hole.
    expect(pickHole(occupied, () => 0.999)).toBe(3);
    // rand at the bottom picks the first free hole.
    expect(pickHole(occupied, () => 0)).toBe(1);
  });

  it("returns -1 when the board is full", () => {
    expect(pickHole([true, true, true])).toBe(-1);
  });
});
