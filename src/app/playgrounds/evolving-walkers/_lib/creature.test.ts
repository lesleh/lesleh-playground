import {
  CTRL_SHAPE,
  FIXED_MORPH,
  cloneGenome,
  createWalker,
  genomeFromWeights,
  randomGenome,
  referenceControl,
  stepWalker,
} from "./creature";
import { mulberry32 } from "./geometry";
import { flattenWeights, weightCount } from "./nn";

describe("FIXED_MORPH", () => {
  it("is a bilaterally symmetric two-legged humanoid", () => {
    const [backLeg, frontLeg, backArm, frontArm] = FIXED_MORPH.limbs;
    expect(FIXED_MORPH.limbs).toHaveLength(4);
    expect(backLeg.attach).toBeLessThan(0.5); // legs at the hip
    expect(frontArm.attach).toBeGreaterThanOrEqual(0.5); // arms at the shoulder
    // Matched pairs: same segment lengths, mirrored splay, antiphase.
    expect(backLeg.upperLen).toBe(frontLeg.upperLen);
    expect(backLeg.lowerLen).toBe(frontLeg.lowerLen);
    expect(backLeg.dir).toBeCloseTo(-frontLeg.dir);
    expect(backArm.upperLen).toBe(frontArm.upperLen);
  });
});

describe("genomeFromWeights", () => {
  it("round-trips a controller weight vector", () => {
    const dim = weightCount(CTRL_SHAPE);
    const weights = Array.from({ length: dim }, (_, i) => Math.sin(i));
    const g = genomeFromWeights(weights);
    expect(flattenWeights(g.net)).toEqual(weights);
    const shape = [g.net.layers[0].inSize, ...g.net.layers.map((l) => l.outSize)];
    expect(shape).toEqual(CTRL_SHAPE);
  });
});

describe("createWalker", () => {
  it("builds a standing rigid-body robot with four limbs", () => {
    const w = createWalker(randomGenome(mulberry32(3)), 0);
    expect(w.limbs).toHaveLength(4);
    expect(w.grounded).toHaveLength(4);
    expect(w.torso.getPosition().y).toBeGreaterThan(0);
    expect(w.alive).toBe(true);
  });
});

describe("stepWalker", () => {
  it("advances ticks and keeps fitness finite and non-negative", () => {
    const w = createWalker(randomGenome(mulberry32(2)), 0);
    for (let i = 0; i < 90 && w.alive; i++) stepWalker(w);
    expect(w.ticks).toBeGreaterThan(0);
    expect(w.fitness).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(w.fitness)).toBe(true);
    expect(Number.isFinite(w.torso.getPosition().x)).toBe(true);
  });

  // The invariant the whole playground rests on: the hand-authored stride,
  // tracked directly (no network), must actually walk this body.
  it("walks forward upright when driven by the reference stride", () => {
    const w = createWalker(randomGenome(mulberry32(1)), 0);
    w.control = referenceControl;
    for (let t = 0; t < 600 && w.alive; t++) stepWalker(w);
    expect(w.alive).toBe(true);
    expect(w.torso.getPosition().x - w.startX).toBeGreaterThan(4); // metres
    expect(w.torso.getPosition().y).toBeGreaterThan(0.8); // still on its feet
    const legs = w.limbs.filter((l) => l.isLeg);
    const lc = w.contact[legs[0].index] / w.ticks;
    const rc = w.contact[legs[1].index] / w.ticks;
    expect(lc).toBeGreaterThan(0.3); // both legs share the load
    expect(rc).toBeGreaterThan(0.3);
  });

  it("is deterministic: a cloned genome yields an identical trajectory", () => {
    const g = randomGenome(mulberry32(7));
    const a = createWalker(cloneGenome(g), 0);
    const b = createWalker(cloneGenome(g), 0);
    for (let i = 0; i < 80; i++) {
      stepWalker(a);
      stepWalker(b);
    }
    expect(a.torso.getPosition().x).toBeCloseTo(b.torso.getPosition().x, 6);
    expect(a.fitness).toBeCloseTo(b.fitness, 6);
  });
});
