import { adamwStep, computeGradients, createCnn, evaluate, forward, softmax } from "./cnn";
import { mulberry32 } from "./rng";

const cfg = { c1: 2, c2: 3, hidden: 4, initScale: 1 };

function smoothedLoss(net: ReturnType<typeof createCnn>, x: Float32Array, y: Uint8Array, batch: number[], ls: number) {
  let loss = 0;
  for (const n of batch) {
    const p = softmax(forward(net, x, n * 196));
    for (let c = 0; c < 10; c++) loss -= (ls / 10 + (c === y[n] ? 1 - ls : 0)) * Math.log(p[c]);
  }
  return loss / batch.length;
}

describe("cnn computeGradients", () => {
  it("matches finite differences through conv, pool and dense layers", () => {
    const rand = mulberry32(7);
    const net = createCnn(cfg, rand);
    const x = Float32Array.from({ length: 3 * 196 }, () => rand());
    const y = new Uint8Array([3, 7, 1]);
    const batch = [0, 1, 2];
    computeGradients(net, x, y, batch, 0.1);
    const analytic = net.grads.slice();
    // Small enough to rarely cross a ReLU or max-pool switch; allow a few
    // mismatches where it does.
    const h = 1e-3;
    let mismatches = 0;
    for (let i = 0; i < net.params.length; i++) {
      const orig = net.params[i];
      net.params[i] = orig + h;
      const up = smoothedLoss(net, x, y, batch, 0.1);
      net.params[i] = orig - h;
      const down = smoothedLoss(net, x, y, batch, 0.1);
      net.params[i] = orig;
      if (Math.abs((up - down) / (2 * h) - analytic[i]) > 5e-3) mismatches++;
    }
    expect(mismatches).toBeLessThanOrEqual(2);
  });
});

describe("cnn training", () => {
  it("tells a vertical bar from a horizontal one wherever it sits", () => {
    const rand = mulberry32(11);
    const net = createCnn({ c1: 4, c2: 4, hidden: 8, initScale: 1 }, rand);
    const n = 40;
    const x = new Float32Array(n * 196);
    const y = new Uint8Array(n);
    for (let k = 0; k < n; k++) {
      const vertical = k % 2 === 0;
      const pos = 2 + Math.floor(rand() * 10);
      for (let t = 3; t < 11; t++) x[k * 196 + (vertical ? t * 14 + pos : pos * 14 + t)] = 1;
      y[k] = vertical ? 1 : 0;
    }
    const all = Int32Array.from({ length: n }, (_, i) => i);
    const opt = { lr: 1e-2, weightDecay: 0, beta1: 0.9, beta2: 0.99, eps: 1e-8 };
    for (let s = 0; s < 150; s++) {
      computeGradients(net, x, y, all, 0);
      adamwStep(net, opt);
    }
    expect(evaluate(net, x, y, all).acc).toBe(1);
  });
});
