import { label, makeDataset } from "./dataset";
import { mulberry32 } from "./rng";

describe("makeDataset", () => {
  it("splits every pair into disjoint train and test sets", () => {
    const ds = makeDataset(11, 0.4, mulberry32(3));
    expect(ds.train.length).toBe(Math.round(121 * 0.4));
    expect(ds.train.length + ds.test.length).toBe(121);
    const seen = new Set([...ds.train, ...ds.test]);
    expect(seen.size).toBe(121);
    for (const i of ds.train) expect(ds.isTrain[i]).toBe(1);
    for (const i of ds.test) expect(ds.isTrain[i]).toBe(0);
  });

  it("is deterministic for a seed", () => {
    const a = makeDataset(11, 0.5, mulberry32(7));
    const b = makeDataset(11, 0.5, mulberry32(7));
    expect(Array.from(a.train)).toEqual(Array.from(b.train));
  });
});

describe("label", () => {
  it("is (a + b) mod p for pair index a * p + b", () => {
    expect(label(3 * 7 + 5, 7)).toBe(1);
    expect(label(0, 7)).toBe(0);
    expect(label(6 * 7 + 6, 7)).toBe(5);
  });
});
