import { adamwStep, computeGradients, createMlp, evaluate, forward, softmax } from "./mlp";
import { mulberry32 } from "./rng";

const cfg = { inputs: 4, hidden: 5, classes: 3, initScale: 1 };

function smoothedLoss(net: ReturnType<typeof createMlp>, x: Float32Array, y: Uint8Array, batch: number[], ls: number) {
  let loss = 0;
  for (const n of batch) {
    const p = softmax(forward(net, x, n * cfg.inputs));
    for (let c = 0; c < cfg.classes; c++) {
      const target = ls / cfg.classes + (c === y[n] ? 1 - ls : 0);
      loss -= target * Math.log(p[c]);
    }
  }
  return loss / batch.length;
}

describe("computeGradients", () => {
  it("matches finite differences, with label smoothing", () => {
    const rand = mulberry32(3);
    const net = createMlp(cfg, rand);
    const x = Float32Array.from({ length: 4 * 4 }, () => rand());
    const y = new Uint8Array([0, 2, 1, 2]);
    const batch = [0, 1, 2, 3];
    computeGradients(net, x, y, batch, 0.2);
    const analytic = net.grads.slice();
    // Small enough not to cross a ReLU kink, which a step of 1e-2 does here.
    const h = 1e-3;
    for (let i = 0; i < net.params.length; i++) {
      const orig = net.params[i];
      net.params[i] = orig + h;
      const up = smoothedLoss(net, x, y, batch, 0.2);
      net.params[i] = orig - h;
      const down = smoothedLoss(net, x, y, batch, 0.2);
      net.params[i] = orig;
      expect(analytic[i]).toBeCloseTo((up - down) / (2 * h), 2);
    }
  });
});

describe("training", () => {
  it("fits a small separable problem", () => {
    const rand = mulberry32(5);
    const net = createMlp(cfg, rand);
    // Class is the index of the largest of the first three inputs.
    const n = 30;
    const x = Float32Array.from({ length: n * 4 }, () => rand());
    const y = Uint8Array.from({ length: n }, (_, i) => {
      const row = x.subarray(i * 4, i * 4 + 3);
      return row.indexOf(Math.max(...row));
    });
    const all = Int32Array.from({ length: n }, (_, i) => i);
    const opt = { lr: 1e-2, weightDecay: 0, beta1: 0.9, beta2: 0.99, eps: 1e-8 };
    for (let s = 0; s < 500; s++) {
      computeGradients(net, x, y, all, 0);
      adamwStep(net, opt);
    }
    expect(evaluate(net, x, y, all).acc).toBeGreaterThan(0.9);
  });
});
