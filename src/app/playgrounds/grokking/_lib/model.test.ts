import { makeDataset } from "./dataset";
import { adamwStep, computeGradients, createModel, evaluate, type Model } from "./model";
import { mulberry32 } from "./rng";

const cfg = { p: 5, embedDim: 3, hidden: 4, initScale: 1 };

function lossAt(model: Model, pairs: Int32Array): number {
  return evaluate(model, pairs).loss;
}

describe("computeGradients", () => {
  it("matches finite differences", () => {
    const model = createModel(cfg, mulberry32(1));
    const pairs = new Int32Array([0, 3, 7, 12, 19, 24]);
    computeGradients(model, pairs);
    const analytic = model.grads.slice();
    // Float32 params, so a coarse step and a loose tolerance.
    const h = 1e-2;
    for (let i = 0; i < model.params.length; i++) {
      const orig = model.params[i];
      model.params[i] = orig + h;
      const up = lossAt(model, pairs);
      model.params[i] = orig - h;
      const down = lossAt(model, pairs);
      model.params[i] = orig;
      const numeric = (up - down) / (2 * h);
      expect(analytic[i]).toBeCloseTo(numeric, 2);
    }
  });
});

describe("adamwStep", () => {
  it("shrinks weights by lr * weightDecay when the gradient is zero", () => {
    const model = createModel(cfg, mulberry32(2));
    const before = model.params.slice();
    model.grads.fill(0);
    adamwStep(model, { lr: 0.1, weightDecay: 0.5, beta1: 0.9, beta2: 0.98, eps: 1e-8 });
    for (let i = 0; i < before.length; i++) expect(model.params[i]).toBeCloseTo(before[i] * 0.95, 5);
  });

  it("drives training loss down", () => {
    const rand = mulberry32(4);
    const ds = makeDataset(7, 0.6, rand);
    const model = createModel({ p: 7, embedDim: 8, hidden: 16, initScale: 1 }, rand);
    const opt = { lr: 3e-3, weightDecay: 0, beta1: 0.9, beta2: 0.98, eps: 1e-8 };
    const start = computeGradients(model, ds.train).loss;
    for (let s = 0; s < 300; s++) {
      computeGradients(model, ds.train);
      adamwStep(model, opt);
    }
    const end = evaluate(model, ds.train);
    expect(end.loss).toBeLessThan(start * 0.2);
    expect(end.acc).toBe(1);
  });
});
