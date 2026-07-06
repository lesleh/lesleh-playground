import { mulberry32 } from "./geometry";
import {
  cloneNetwork,
  createNetwork,
  crossover,
  forward,
  genomeLength,
  mutate,
} from "./nn";

const shape = [6, 8, 2];

describe("createNetwork", () => {
  it("builds layers matching the shape", () => {
    const net = createNetwork(shape, mulberry32(1));
    expect(net.layers).toHaveLength(2);
    expect(net.layers[0]).toMatchObject({ inSize: 6, outSize: 8 });
    expect(net.layers[1]).toMatchObject({ inSize: 8, outSize: 2 });
    expect(net.layers[0].w).toHaveLength(48);
    expect(net.layers[0].b).toHaveLength(8);
  });

  it("reports the total genome length", () => {
    const net = createNetwork(shape, mulberry32(1));
    expect(genomeLength(net)).toBe(48 + 8 + 16 + 2);
  });
});

describe("forward", () => {
  it("produces one tanh-bounded value per output", () => {
    const net = createNetwork(shape, mulberry32(2));
    const out = forward(net, [0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);
    expect(out).toHaveLength(2);
    for (const v of out) {
      expect(v).toBeGreaterThan(-1);
      expect(v).toBeLessThan(1);
    }
  });

  it("is deterministic for the same net and input", () => {
    const net = createNetwork(shape, mulberry32(3));
    const input = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4];
    expect(forward(net, input)).toEqual(forward(net, input));
  });
});

describe("mutate", () => {
  it("leaves the parent untouched", () => {
    const parent = createNetwork(shape, mulberry32(4));
    const before = parent.layers[0].w.slice();
    mutate(parent, 1, 0.5, mulberry32(5));
    expect(parent.layers[0].w).toEqual(before);
  });

  it("changes genes at rate 1 and none at rate 0", () => {
    const parent = createNetwork(shape, mulberry32(6));
    const changed = mutate(parent, 1, 0.5, mulberry32(7));
    expect(changed.layers[0].w).not.toEqual(parent.layers[0].w);

    const same = mutate(parent, 0, 0.5, mulberry32(8));
    expect(same.layers[0].w).toEqual(parent.layers[0].w);
  });
});

describe("crossover", () => {
  it("only ever takes genes from one of the two parents", () => {
    const a = createNetwork(shape, mulberry32(9));
    const b = createNetwork(shape, mulberry32(10));
    const child = crossover(a, b, mulberry32(11));
    child.layers.forEach((layer, li) => {
      layer.w.forEach((gene, k) => {
        expect([a.layers[li].w[k], b.layers[li].w[k]]).toContain(gene);
      });
    });
  });
});

describe("cloneNetwork", () => {
  it("deep-copies so edits do not leak back", () => {
    const net = createNetwork(shape, mulberry32(12));
    const clone = cloneNetwork(net);
    clone.layers[0].w[0] = 999;
    expect(net.layers[0].w[0]).not.toBe(999);
  });
});
