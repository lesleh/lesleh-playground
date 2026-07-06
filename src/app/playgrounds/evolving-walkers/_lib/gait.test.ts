import { HIP_HEIGHT, STANCE_END, referencePose } from "./gait";

describe("referencePose", () => {
  it("stays inside the leg joint limits over the whole cycle", () => {
    for (let p = 0; p < 1; p += 0.01) {
      const { hip, knee } = referencePose(p);
      expect(hip).toBeGreaterThan(-1.3);
      expect(hip).toBeLessThan(1.3);
      expect(knee).toBeGreaterThan(-2.2);
      expect(knee).toBeLessThanOrEqual(0);
    }
  });

  it("is periodic and phase-wraps", () => {
    const a = referencePose(0.3);
    const b = referencePose(1.3);
    expect(b.hip).toBeCloseTo(a.hip, 10);
    expect(b.knee).toBeCloseTo(a.knee, 10);
  });

  it("keeps the stance foot on the floor and lifts it in swing", () => {
    // Reconstruct foot height from the joint targets with forward kinematics.
    const footY = (p: number): number => {
      const { hip, knee } = referencePose(p);
      return -0.4 * Math.cos(hip) - 0.4 * Math.cos(hip + knee);
    };
    for (let p = 0.05; p < STANCE_END; p += 0.05) {
      expect(footY(p)).toBeCloseTo(-HIP_HEIGHT, 1);
    }
    const midSwing = footY(STANCE_END + (1 - STANCE_END) / 2);
    expect(midSwing).toBeGreaterThan(-HIP_HEIGHT + 0.08);
  });

  it("ramps to a standing crouch at zero amplitude", () => {
    const a = referencePose(0.1, 0);
    const b = referencePose(0.9, 0);
    expect(a.hip).toBeCloseTo(b.hip, 10);
    expect(a.knee).toBeCloseTo(b.knee, 10);
  });
});
