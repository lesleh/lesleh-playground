import { gaussian } from "./rng";

// A 196 -> H -> H -> 10 ReLU network. All parameters live in one Float32Array
// so AdamW is a single loop. Large initScale makes it memorise first and
// generalise later (Liu et al., 2022, "Omnigrok").
export interface MlpConfig {
  inputs: number;
  hidden: number;
  classes: number;
  initScale: number;
}

export interface OptimConfig {
  lr: number;
  weightDecay: number;
  beta1: number;
  beta2: number;
  eps: number;
}

interface Layer {
  inputs: number;
  outputs: number;
  w: number; // offset of the weights, outputs x inputs, row major
  b: number; // offset of the biases
}

export interface Mlp {
  cfg: MlpConfig;
  layers: Layer[];
  params: Float32Array;
  grads: Float32Array;
  m: Float32Array;
  v: Float32Array;
  step: number;
  // Activations and deltas per layer boundary, reused across examples.
  acts: Float32Array[];
  deltas: Float32Array[];
}

export function createMlp(cfg: MlpConfig, rand: () => number): Mlp {
  const sizes = [cfg.inputs, cfg.hidden, cfg.hidden, cfg.classes];
  const layers: Layer[] = [];
  let offset = 0;
  for (let l = 0; l < 3; l++) {
    const layer = { inputs: sizes[l], outputs: sizes[l + 1], w: offset, b: offset + sizes[l] * sizes[l + 1] };
    offset = layer.b + layer.outputs;
    layers.push(layer);
  }
  const params = new Float32Array(offset);
  for (const layer of layers) {
    const std = Math.sqrt(2 / layer.inputs) * cfg.initScale;
    for (let i = 0; i < layer.inputs * layer.outputs; i++) params[layer.w + i] = gaussian(rand) * std;
  }
  return {
    cfg,
    layers,
    params,
    grads: new Float32Array(offset),
    m: new Float32Array(offset),
    v: new Float32Array(offset),
    step: 0,
    acts: sizes.map((s) => new Float32Array(s)),
    deltas: sizes.map((s) => new Float32Array(s)),
  };
}

// Forward pass on one input row. Returns the logits (owned by the network).
export function forward(net: Mlp, x: Float32Array, offset = 0): Float32Array {
  const P = net.params;
  net.acts[0].set(x.subarray(offset, offset + net.cfg.inputs));
  for (let l = 0; l < 3; l++) {
    const { inputs, outputs, w, b } = net.layers[l];
    const inp = net.acts[l];
    const out = net.acts[l + 1];
    for (let o = 0; o < outputs; o++) {
      let s = P[b + o];
      const row = w + o * inputs;
      for (let i = 0; i < inputs; i++) s += P[row + i] * inp[i];
      out[o] = l < 2 && s < 0 ? 0 : s;
    }
  }
  return net.acts[3];
}

// Softmax of the logits into a new array.
export function softmax(logits: Float32Array): Float32Array {
  let max = -Infinity;
  for (const v of logits) if (v > max) max = v;
  const out = new Float32Array(logits.length);
  let sum = 0;
  for (let i = 0; i < logits.length; i++) {
    out[i] = Math.exp(logits[i] - max);
    sum += out[i];
  }
  for (let i = 0; i < out.length; i++) out[i] /= sum;
  return out;
}

function backward(net: Mlp): void {
  const P = net.params;
  const G = net.grads;
  for (let l = 2; l >= 0; l--) {
    const { inputs, outputs, w, b } = net.layers[l];
    const dOut = net.deltas[l + 1];
    const inp = net.acts[l];
    const dIn = net.deltas[l];
    dIn.fill(0);
    for (let o = 0; o < outputs; o++) {
      const d = dOut[o];
      if (d === 0) continue;
      G[b + o] += d;
      const row = w + o * inputs;
      for (let i = 0; i < inputs; i++) {
        G[row + i] += d * inp[i];
        dIn[i] += d * P[row + i];
      }
    }
    // ReLU gate: hidden units that were off pass no gradient back.
    if (l > 0) for (let i = 0; i < inputs; i++) if (inp[i] <= 0) dIn[i] = 0;
  }
}

// Mean cross-entropy gradient over the batch into net.grads. With label
// smoothing the target is 1 - smoothing on the label, the rest spread evenly.
export function computeGradients(
  net: Mlp,
  x: Float32Array,
  y: Uint8Array,
  batch: ArrayLike<number>,
  labelSmoothing: number,
): number {
  const C = net.cfg.classes;
  const D = net.cfg.inputs;
  net.grads.fill(0);
  const scale = 1 / batch.length;
  const off = labelSmoothing / C;
  let loss = 0;
  for (let k = 0; k < batch.length; k++) {
    const n = batch[k];
    const probs = softmax(forward(net, x, n * D));
    const g = net.deltas[3];
    for (let c = 0; c < C; c++) {
      const target = off + (c === y[n] ? 1 - labelSmoothing : 0);
      loss -= target * Math.log(Math.max(probs[c], 1e-30));
      g[c] = (probs[c] - target) * scale;
    }
    backward(net);
  }
  return loss * scale;
}

// Decoupled weight decay (AdamW), applied to every parameter.
export function adamwStep(net: Mlp, opt: OptimConfig): void {
  net.step++;
  const { lr, weightDecay, beta1, beta2, eps } = opt;
  const bc1 = 1 - beta1 ** net.step;
  const bc2 = 1 - beta2 ** net.step;
  const P = net.params;
  const G = net.grads;
  const M = net.m;
  const V = net.v;
  const decay = 1 - lr * weightDecay;
  for (let i = 0; i < P.length; i++) {
    const g = G[i];
    M[i] = beta1 * M[i] + (1 - beta1) * g;
    V[i] = beta2 * V[i] + (1 - beta2) * g * g;
    P[i] = P[i] * decay - (lr * (M[i] / bc1)) / (Math.sqrt(V[i] / bc2) + eps);
  }
}

export interface EvalResult {
  loss: number;
  acc: number;
}

// Plain cross-entropy and accuracy over `set`. Writes each digit's predicted
// class into `answers` (indexed by digit) when given.
export function evaluate(net: Mlp, x: Float32Array, y: Uint8Array, set: Int32Array, answers?: Uint8Array): EvalResult {
  const C = net.cfg.classes;
  const D = net.cfg.inputs;
  let loss = 0;
  let correct = 0;
  for (const n of set) {
    const logits = forward(net, x, n * D);
    let top = 0;
    for (let c = 1; c < C; c++) if (logits[c] > logits[top]) top = c;
    if (top === y[n]) correct++;
    if (answers) answers[n] = top;
    loss -= Math.log(Math.max(softmax(logits)[y[n]], 1e-30));
  }
  return { loss: loss / set.length, acc: correct / set.length };
}

// L2 norm of every weight (biases excluded).
export function weightNorm(net: Mlp): number {
  let sum = 0;
  for (const { inputs, outputs, w } of net.layers) {
    for (let i = 0; i < inputs * outputs; i++) sum += net.params[w + i] ** 2;
  }
  return Math.sqrt(sum);
}
