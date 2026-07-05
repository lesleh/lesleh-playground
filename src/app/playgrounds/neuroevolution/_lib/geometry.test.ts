import { gaussian, mulberry32, rayHit, segmentsIntersect } from "./geometry";

describe("mulberry32", () => {
  it("is deterministic for a given seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("stays within [0, 1)", () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("gaussian", () => {
  it("has roughly zero mean over many samples", () => {
    const r = mulberry32(1);
    let sum = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) sum += gaussian(r);
    expect(Math.abs(sum / n)).toBeLessThan(0.05);
  });
});

describe("rayHit", () => {
  it("hits a segment straight ahead and returns the distance", () => {
    // Ray from origin pointing +x, wall crossing x=5.
    expect(rayHit(0, 0, 1, 0, 5, -5, 5, 5)).toBeCloseTo(5);
  });

  it("misses a segment behind the ray", () => {
    expect(rayHit(0, 0, 1, 0, -5, -5, -5, 5)).toBe(Infinity);
  });

  it("misses a segment the ray does not cross", () => {
    expect(rayHit(0, 0, 1, 0, 5, 2, 5, 8)).toBe(Infinity);
  });

  it("returns Infinity when parallel", () => {
    expect(rayHit(0, 0, 1, 0, 0, 1, 10, 1)).toBe(Infinity);
  });
});

describe("segmentsIntersect", () => {
  it("detects a clean crossing", () => {
    expect(segmentsIntersect(0, 0, 10, 10, 0, 10, 10, 0)).toBe(true);
  });

  it("returns false for disjoint segments", () => {
    expect(segmentsIntersect(0, 0, 1, 1, 5, 5, 6, 6)).toBe(false);
  });

  it("returns false for parallel segments", () => {
    expect(segmentsIntersect(0, 0, 10, 0, 0, 1, 10, 1)).toBe(false);
  });
});
