import {
  step,
  totalEnergy,
  totalMomentum,
  angularMomentum,
  cloneBodies,
  type Body,
} from "./threeBody";
import { buildPreset } from "./presets";

describe("step", () => {
  it("conserves total energy approximately on the figure-8 orbit", () => {
    const bodies = buildPreset("figure-eight");
    const e0 = totalEnergy(bodies).total;
    for (let i = 0; i < 2000; i++) step(bodies, 0.001);
    const e1 = totalEnergy(bodies).total;
    expect(Math.abs((e1 - e0) / e0)).toBeLessThan(0.02);
  });

  it("conserves total linear momentum to machine precision", () => {
    const bodies = buildPreset("lagrange");
    const p0 = totalMomentum(bodies);
    for (let i = 0; i < 1000; i++) step(bodies, 0.001);
    const p1 = totalMomentum(bodies);
    expect(Math.abs(p1.px - p0.px)).toBeLessThan(1e-9);
    expect(Math.abs(p1.py - p0.py)).toBeLessThan(1e-9);
  });

  it("conserves total angular momentum approximately", () => {
    const bodies = buildPreset("lagrange");
    const l0 = angularMomentum(bodies);
    for (let i = 0; i < 1000; i++) step(bodies, 0.001);
    const l1 = angularMomentum(bodies);
    expect(Math.abs((l1 - l0) / l0)).toBeLessThan(1e-6);
  });
});

describe("cloneBodies", () => {
  it("returns an independent copy", () => {
    const original: Body[] = [{ x: 1, y: 2, vx: 3, vy: 4, mass: 5 }];
    const copy = cloneBodies(original);
    copy[0].x = 99;
    expect(original[0].x).toBe(1);
  });
});
