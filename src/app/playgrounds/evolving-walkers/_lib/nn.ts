// A tiny fixed-topology MLP. The weights are the genome the genetic algorithm
// evolves; there is no backprop here, only mutation and crossover.

import { gaussian } from "./geometry";

export interface Layer {
  inSize: number;
  outSize: number;
  // Row-major weights, length outSize * inSize.
  w: number[];
  b: number[];
}

export interface Network {
  layers: Layer[];
}

// [inputs, ...hidden, outputs]. Every layer uses tanh, so outputs land in
// (-1, 1) ready to drive steering and throttle.
export type Shape = number[];

export function createNetwork(shape: Shape, rand: () => number): Network {
  const layers: Layer[] = [];
  for (let i = 0; i < shape.length - 1; i++) {
    const inSize = shape[i];
    const outSize = shape[i + 1];
    const w: number[] = new Array(inSize * outSize);
    const b: number[] = new Array(outSize);
    for (let k = 0; k < w.length; k++) w[k] = rand() * 2 - 1;
    for (let k = 0; k < b.length; k++) b[k] = rand() * 2 - 1;
    layers.push({ inSize, outSize, w, b });
  }
  return { layers };
}

export function forward(net: Network, input: number[]): number[] {
  let signal = input;
  for (const layer of net.layers) {
    const out = new Array(layer.outSize);
    for (let j = 0; j < layer.outSize; j++) {
      let sum = layer.b[j];
      const row = j * layer.inSize;
      for (let i = 0; i < layer.inSize; i++) {
        sum += layer.w[row + i] * signal[i];
      }
      out[j] = Math.tanh(sum);
    }
    signal = out;
  }
  return signal;
}

export function cloneNetwork(net: Network): Network {
  return {
    layers: net.layers.map((l) => ({
      inSize: l.inSize,
      outSize: l.outSize,
      w: l.w.slice(),
      b: l.b.slice(),
    })),
  };
}

// Perturb each gene with probability `rate` by a gaussian step of scale
// `strength`. Mutates a fresh clone so the parent is left untouched.
export function mutate(
  net: Network,
  rate: number,
  strength: number,
  rand: () => number,
): Network {
  const child = cloneNetwork(net);
  for (const layer of child.layers) {
    for (let k = 0; k < layer.w.length; k++) {
      if (rand() < rate) layer.w[k] += gaussian(rand) * strength;
    }
    for (let k = 0; k < layer.b.length; k++) {
      if (rand() < rate) layer.b[k] += gaussian(rand) * strength;
    }
  }
  return child;
}

// Uniform crossover: each gene is taken from one parent or the other at random.
export function crossover(a: Network, b: Network, rand: () => number): Network {
  const child = cloneNetwork(a);
  for (let li = 0; li < child.layers.length; li++) {
    const layer = child.layers[li];
    const other = b.layers[li];
    for (let k = 0; k < layer.w.length; k++) {
      if (rand() < 0.5) layer.w[k] = other.w[k];
    }
    for (let k = 0; k < layer.b.length; k++) {
      if (rand() < 0.5) layer.b[k] = other.b[k];
    }
  }
  return child;
}

// Total number of tunable parameters, handy for display and tests.
export function genomeLength(net: Network): number {
  return net.layers.reduce((n, l) => n + l.w.length + l.b.length, 0);
}

// Number of weights a network of the given shape holds.
export function weightCount(shape: Shape): number {
  let n = 0;
  for (let i = 0; i < shape.length - 1; i++) n += shape[i] * shape[i + 1] + shape[i + 1];
  return n;
}

// Flatten every weight and bias into one vector (row-major, layer by layer),
// and the inverse: rebuild a network of `shape` from such a vector. Lets an
// optimiser treat the controller as a plain point in weight space.
export function flattenWeights(net: Network): number[] {
  const out: number[] = [];
  for (const l of net.layers) {
    for (const w of l.w) out.push(w);
    for (const b of l.b) out.push(b);
  }
  return out;
}

export function netFromWeights(shape: Shape, weights: number[]): Network {
  const layers: Layer[] = [];
  let i = 0;
  for (let li = 0; li < shape.length - 1; li++) {
    const inSize = shape[li];
    const outSize = shape[li + 1];
    const w = new Array(inSize * outSize);
    const b = new Array(outSize);
    for (let k = 0; k < w.length; k++) w[k] = weights[i++];
    for (let k = 0; k < b.length; k++) b[k] = weights[i++];
    layers.push({ inSize, outSize, w, b });
  }
  return { layers };
}
