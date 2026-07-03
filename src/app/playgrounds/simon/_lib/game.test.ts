import { PAD_COUNT, nextStep, extend, isInputCorrect, type Pad } from "./game";

describe("nextStep", () => {
  it("returns a pad in range", () => {
    // Sweep the rng across its [0, 1) domain.
    for (let i = 0; i < 100; i++) {
      const pad = nextStep(() => i / 100);
      expect(pad).toBeGreaterThanOrEqual(0);
      expect(pad).toBeLessThan(PAD_COUNT);
    }
  });

  it("maps rng buckets to distinct pads", () => {
    expect(nextStep(() => 0)).toBe(0);
    expect(nextStep(() => 0.3)).toBe(1);
    expect(nextStep(() => 0.6)).toBe(2);
    expect(nextStep(() => 0.9)).toBe(3);
  });
});

describe("extend", () => {
  it("grows the sequence by exactly one, without mutating the original", () => {
    const seq: Pad[] = [0, 2];
    const next = extend(seq, () => 0.9);
    expect(next).toHaveLength(3);
    expect(next).toEqual([0, 2, 3]);
    expect(seq).toEqual([0, 2]); // original untouched
  });

  it("builds a valid sequence from empty via repeated calls", () => {
    let seq: Pad[] = [];
    const rng = () => 0.5; // always pad 2
    for (let i = 0; i < 5; i++) seq = extend(seq, rng);
    expect(seq).toEqual([2, 2, 2, 2, 2]);
  });
});

describe("isInputCorrect", () => {
  const seq: Pad[] = [1, 3, 0];

  it("is true when the pad matches the expected step", () => {
    expect(isInputCorrect(seq, 0, 1)).toBe(true);
    expect(isInputCorrect(seq, 1, 3)).toBe(true);
    expect(isInputCorrect(seq, 2, 0)).toBe(true);
  });

  it("is false on a mismatch", () => {
    expect(isInputCorrect(seq, 0, 2)).toBe(false);
    expect(isInputCorrect(seq, 1, 0)).toBe(false);
  });
});
