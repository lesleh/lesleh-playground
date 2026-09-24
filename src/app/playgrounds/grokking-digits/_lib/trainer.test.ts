import { DIGITS_FILE_LAYOUT, parseDigits } from "./data";
import {
  MAX_STEPS,
  STRIP_SIZE,
  createTrainer,
  phaseOf,
  shouldRecord,
  takeSnapshot,
  trainStep,
  type HistoryPoint,
} from "./trainer";

const pt = (step: number, trainAcc: number, testAcc: number): HistoryPoint => ({
  step,
  trainAcc,
  testAcc,
  trainLoss: 0,
  testLoss: 0,
  norm: 0,
});

describe("phaseOf", () => {
  it("measures grokking against test accuracy at the moment it memorised", () => {
    expect(phaseOf([])).toBe("memorising");
    expect(phaseOf([pt(1, 0.5, 0.4)])).toBe("memorising");
    expect(phaseOf([pt(1000, 1, 0.72), pt(2000, 1, 0.73)])).toBe("memorised");
    expect(phaseOf([pt(1000, 1, 0.72), pt(4000, 1, 0.8)])).toBe("grokking");
    expect(phaseOf([pt(1000, 1, 0.72), pt(6000, 1, 0.91)])).toBe("generalised");
  });
});

describe("shouldRecord", () => {
  it("records densely early and sparsely later", () => {
    expect(shouldRecord(1)).toBe(true);
    expect(shouldRecord(5)).toBe(true);
    expect(shouldRecord(6)).toBe(false);
    expect(shouldRecord(125)).toBe(true);
    expect(shouldRecord(1025)).toBe(false);
    expect(shouldRecord(1050)).toBe(true);
    expect(shouldRecord(MAX_STEPS)).toBe(true);
  });
});

describe("trainer", () => {
  it("snapshots the strip and the probe", () => {
    const { pixels, train, test } = DIGITS_FILE_LAYOUT;
    const count = train + test;
    const bytes = new Uint8Array(count * pixels + count);
    for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 37) % 256;
    for (let k = 0; k < count; k++) bytes[count * pixels + k] = k % 10;
    const t = createTrainer({ initScale: 1, weightDecay: 0.3, labelSmoothing: 0, seed: 1 }, parseDigits(bytes));
    trainStep(t);
    const snap = takeSnapshot(t, 0, new Float32Array(pixels).fill(0.5));
    expect(snap.step).toBe(1);
    expect(snap.history.map((h) => h.step)).toEqual([1]);
    expect(snap.stripAnswers).toHaveLength(STRIP_SIZE);
    expect(snap.probe).toHaveLength(10);
    expect(Array.from(snap.probe!).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
    expect(takeSnapshot(t, 0, null).probe).toBeNull();
  });
});
