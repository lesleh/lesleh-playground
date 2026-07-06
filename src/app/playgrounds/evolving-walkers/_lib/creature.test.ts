import {
  CTRL_SHAPE,
  FIXED_MORPH,
  cloneGenome,
  createWalker,
  genomeFromWeights,
  randomGenome,
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
