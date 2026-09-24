import { fourierView } from "./fourier";
import { createModel } from "./model";
import { mulberry32 } from "./rng";

describe("fourierView", () => {
  it("finds the frequency an embedding is built from and lays it on a circle", () => {
    const p = 13;
    const k = 4;
    const d = 3;
    const model = createModel({ p, embedDim: d, hidden: 2, initScale: 1 }, mulberry32(1));
    for (let a = 0; a < p; a++) {
      const theta = (2 * Math.PI * k * a) / p;
      model.params[a * d] = Math.cos(theta);
      model.params[a * d + 1] = Math.sin(theta);
      model.params[a * d + 2] = 0;
    }
    const view = fourierView(model);
    expect(view.spectrum.length).toBe(6);
    expect(view.topFreq).toBe(k);
    expect(view.spectrum[k - 1]).toBeCloseTo(1, 4);
    expect(view.top5Share).toBeCloseTo(1, 4);
    for (let a = 0; a < p; a++) {
      expect(Math.hypot(view.circle[2 * a], view.circle[2 * a + 1])).toBeCloseTo(1, 4);
    }
  });

  it("spreads energy across frequencies for random weights", () => {
    const model = createModel({ p: 59, embedDim: 24, hidden: 4, initScale: 1 }, mulberry32(9));
    const view = fourierView(model);
    const sum = view.spectrum.reduce((s, v) => s + v, 0);
    expect(sum).toBeCloseTo(1, 4);
    expect(view.top5Share).toBeLessThan(0.4);
  });
});
