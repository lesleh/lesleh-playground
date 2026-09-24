import {
  createTrainer,
  hasSettled,
  SETTLE_STEPS,
  phaseOf,
  shouldRecord,
  takeSnapshot,
  trainStep,
  type HistoryPoint,
} from "./trainer";

const point = (trainAcc: number, testAcc: number): HistoryPoint => ({
  step: 1,
  trainAcc,
  testAcc,
  trainLoss: 0,
  testLoss: 0,
  norm: 0,
});

describe("phaseOf", () => {
  it("follows train accuracy first, then unseen accuracy", () => {
    expect(phaseOf(undefined)).toBe("memorising");
    expect(phaseOf(point(0.5, 0))).toBe("memorising");
    expect(phaseOf(point(1, 0.02))).toBe("memorised");
    expect(phaseOf(point(1, 0.5))).toBe("grokking");
    expect(phaseOf(point(1, 0.97))).toBe("grokked");
  });
});

describe("shouldRecord", () => {
  it("records every early step, then every tenth", () => {
    expect(shouldRecord(1)).toBe(true);
    expect(shouldRecord(100)).toBe(true);
    expect(shouldRecord(101)).toBe(false);
    expect(shouldRecord(110)).toBe(true);
  });
});

describe("trainer", () => {
  it("records history and sends only new points in each snapshot", () => {
    const t = createTrainer({ p: 7, trainFraction: 0.5, weightDecay: 1, seed: 1 });
    for (let i = 0; i < 3; i++) trainStep(t);
    const first = takeSnapshot(t, 0);
    expect(first.step).toBe(3);
    expect(first.history.map((h) => h.step)).toEqual([1, 2, 3]);
    expect(first.predictions.answer.length).toBe(49);
    for (const c of first.predictions.confidence) {
      expect(c).toBeGreaterThan(0);
      expect(c).toBeLessThanOrEqual(1);
    }
    trainStep(t);
    expect(takeSnapshot(t, 3).history.map((h) => h.step)).toEqual([4]);
  });
});

describe("hasSettled", () => {
  const at = (step: number, testAcc: number): HistoryPoint => ({ ...point(1, testAcc), step });

  it("waits SETTLE_STEPS after unseen accuracy first reaches 100%", () => {
    expect(hasSettled([])).toBe(false);
    expect(hasSettled([at(100, 0.9), at(3000, 0.99)])).toBe(false);
    expect(hasSettled([at(3000, 1), at(3000 + SETTLE_STEPS - 10, 1)])).toBe(false);
    expect(hasSettled([at(3000, 1), at(3000 + SETTLE_STEPS, 1)])).toBe(true);
  });
});
