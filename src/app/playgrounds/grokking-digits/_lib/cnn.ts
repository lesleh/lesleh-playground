import { gaussian } from "./rng";

// A small convolutional network for 14x14 digits:
//   conv 3x3 (C1) -> ReLU -> max pool 2 -> 7x7
//   conv 3x3 (C2) -> ReLU -> max pool 2 -> 3x3
//   dense (C2*9 -> H) -> ReLU -> dense (H -> 10)
// Filters slide across the image, so a stroke is recognised wherever it sits.
// All parameters live in one Float32Array so AdamW is a single loop.
export interface CnnConfig {
  c1: number;
  c2: number;
  hidden: number;
  initScale: number;
}

export interface OptimConfig {
  lr: number;
  weightDecay: number;
  beta1: number;
  beta2: number;
  eps: number;
}

const S = 14; // input side
const P1 = 7; // side after the first pool
const P2 = 3; // side after the second pool (floor of 7 / 2)
const CLASSES = 10;

export interface Cnn {
  cfg: CnnConfig;
  params: Float32Array;
  grads: Float32Array;
  m: Float32Array;
  v: Float32Array;
  step: number;
  // Offsets into params. Weight blocks are listed in `weightBlocks` for the norm.
  o: { w1: number; b1: number; w2: number; b2: number; w3: number; b3: number; w4: number; b4: number };
  weightBlocks: [number, number][];
  // Per-example activations, reused.
  s: Scratch;
}

interface Scratch {
  x: Float32Array; // 14x14
  z1: Float32Array; // C1 x 14 x 14, pre-activation
  p1: Float32Array; // C1 x 7 x 7
  p1Arg: Int32Array; // index into z1 of each pooled max
  z2: Float32Array; // C2 x 7 x 7
  p2: Float32Array; // C2 x 3 x 3 (the flattened dense input)
  p2Arg: Int32Array;
  z3: Float32Array; // H
  logits: Float32Array; // 10
  // Gradients of the same shapes.
  dLogits: Float32Array;
  dZ3: Float32Array;
  dP2: Float32Array;
  dZ2: Float32Array;
  dP1: Float32Array;
  dZ1: Float32Array;
}

export function createCnn(cfg: CnnConfig, rand: () => number): Cnn {
  const { c1, c2, hidden: H } = cfg;
  const flat = c2 * P2 * P2;
  let off = 0;
  const take = (n: number) => {
    const at = off;
    off += n;
    return at;
  };
  const o = {
    w1: take(c1 * 9),
    b1: take(c1),
    w2: take(c2 * c1 * 9),
    b2: take(c2),
    w3: take(H * flat),
    b3: take(H),
    w4: take(CLASSES * H),
    b4: take(CLASSES),
  };
  const params = new Float32Array(off);
  const weightBlocks: [number, number][] = [
    [o.w1, c1 * 9],
    [o.w2, c2 * c1 * 9],
    [o.w3, H * flat],
    [o.w4, CLASSES * H],
  ];
  const fanIn = [9, c1 * 9, flat, H];
  weightBlocks.forEach(([at, n], i) => {
    const std = Math.sqrt(2 / fanIn[i]) * cfg.initScale;
    for (let k = 0; k < n; k++) params[at + k] = gaussian(rand) * std;
  });
  return {
    cfg,
    params,
    grads: new Float32Array(off),
    m: new Float32Array(off),
    v: new Float32Array(off),
    step: 0,
    o,
    weightBlocks,
    s: {
      x: new Float32Array(S * S),
      z1: new Float32Array(c1 * S * S),
      p1: new Float32Array(c1 * P1 * P1),
      p1Arg: new Int32Array(c1 * P1 * P1),
      z2: new Float32Array(c2 * P1 * P1),
      p2: new Float32Array(flat),
      p2Arg: new Int32Array(flat),
      z3: new Float32Array(H),
      logits: new Float32Array(CLASSES),
      dLogits: new Float32Array(CLASSES),
      dZ3: new Float32Array(H),
      dP2: new Float32Array(flat),
      dZ2: new Float32Array(c2 * P1 * P1),
      dP1: new Float32Array(c1 * P1 * P1),
      dZ1: new Float32Array(c1 * S * S),
    },
  };
}

// 3x3 convolution with zero padding over `cin` channels of side `n`, into
// pre-activations `z` (cout x n x n).
function conv(
  P: Float32Array,
  w: number,
  b: number,
  input: Float32Array,
  cin: number,
  cout: number,
  n: number,
  z: Float32Array,
): void {
  for (let co = 0; co < cout; co++) {
    const bias = P[b + co];
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        let sum = bias;
        for (let ci = 0; ci < cin; ci++) {
          const wBase = w + (co * cin + ci) * 9;
          const iBase = ci * n * n;
          for (let ky = 0; ky < 3; ky++) {
            const yy = y + ky - 1;
            if (yy < 0 || yy >= n) continue;
            for (let kx = 0; kx < 3; kx++) {
              const xx = x + kx - 1;
              if (xx < 0 || xx >= n) continue;
              sum += P[wBase + ky * 3 + kx] * input[iBase + yy * n + xx];
            }
          }
        }
        z[co * n * n + y * n + x] = sum;
      }
    }
  }
}

// ReLU then 2x2 max pool (floor), recording which input won each window.
function reluPool(z: Float32Array, c: number, n: number, out: Float32Array, arg: Int32Array): void {
  const m = Math.floor(n / 2);
  for (let ch = 0; ch < c; ch++) {
    for (let y = 0; y < m; y++) {
      for (let x = 0; x < m; x++) {
        let best = 0;
        let bestAt = -1;
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const at = ch * n * n + (2 * y + dy) * n + 2 * x + dx;
            if (z[at] > best) {
              best = z[at];
              bestAt = at;
            }
          }
        }
        const k = ch * m * m + y * m + x;
        out[k] = best; // max of ReLU outputs; 0 when every input is negative
        arg[k] = bestAt; // -1 means no gradient flows back
      }
    }
  }
}

// Forward pass on one 14x14 image at `offset` in `x`. Returns the logits.
export function forward(net: Cnn, x: Float32Array, offset = 0): Float32Array {
  const { c1, c2, hidden: H } = net.cfg;
  const P = net.params;
  const { o, s } = net;
  s.x.set(x.subarray(offset, offset + S * S));
  conv(P, o.w1, o.b1, s.x, 1, c1, S, s.z1);
  reluPool(s.z1, c1, S, s.p1, s.p1Arg);
  conv(P, o.w2, o.b2, s.p1, c1, c2, P1, s.z2);
  reluPool(s.z2, c2, P1, s.p2, s.p2Arg);
  const flat = s.p2.length;
  for (let h = 0; h < H; h++) {
    let sum = P[o.b3 + h];
    const row = o.w3 + h * flat;
    for (let i = 0; i < flat; i++) sum += P[row + i] * s.p2[i];
    s.z3[h] = sum;
  }
  for (let c = 0; c < CLASSES; c++) {
    let sum = P[o.b4 + c];
    const row = o.w4 + c * H;
    for (let h = 0; h < H; h++) {
      const a = s.z3[h];
      if (a > 0) sum += P[row + h] * a;
    }
    s.logits[c] = sum;
  }
  return s.logits;
}

// Gradient of a 3x3 padded convolution: accumulates weight and bias grads,
// and writes the gradient with respect to its input into `dInput` if given.
function convBackward(
  P: Float32Array,
  G: Float32Array,
  w: number,
  b: number,
  input: Float32Array,
  dZ: Float32Array,
  cin: number,
  cout: number,
  n: number,
  dInput: Float32Array | null,
): void {
  if (dInput) dInput.fill(0);
  for (let co = 0; co < cout; co++) {
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const d = dZ[co * n * n + y * n + x];
        if (d === 0) continue;
        G[b + co] += d;
        for (let ci = 0; ci < cin; ci++) {
          const wBase = w + (co * cin + ci) * 9;
          const iBase = ci * n * n;
          for (let ky = 0; ky < 3; ky++) {
            const yy = y + ky - 1;
            if (yy < 0 || yy >= n) continue;
            for (let kx = 0; kx < 3; kx++) {
              const xx = x + kx - 1;
              if (xx < 0 || xx >= n) continue;
              G[wBase + ky * 3 + kx] += d * input[iBase + yy * n + xx];
              if (dInput) dInput[iBase + yy * n + xx] += d * P[wBase + ky * 3 + kx];
            }
          }
        }
      }
    }
  }
}

// Routes pooled gradients back to the winning inputs. ReLU is folded in: a
// window whose max was not positive has arg -1 and passes nothing back.
function poolBackward(dOut: Float32Array, arg: Int32Array, dZ: Float32Array): void {
  dZ.fill(0);
  for (let k = 0; k < dOut.length; k++) if (arg[k] >= 0) dZ[arg[k]] += dOut[k];
}

function backward(net: Cnn): void {
  const { c1, c2, hidden: H } = net.cfg;
  const P = net.params;
  const G = net.grads;
  const { o, s } = net;
  const flat = s.p2.length;

  s.dZ3.fill(0);
  for (let c = 0; c < CLASSES; c++) {
    const d = s.dLogits[c];
    if (d === 0) continue;
    G[o.b4 + c] += d;
    const row = o.w4 + c * H;
    for (let h = 0; h < H; h++) {
      const a = s.z3[h];
      if (a <= 0) continue;
      G[row + h] += d * a;
      s.dZ3[h] += d * P[row + h];
    }
  }

  s.dP2.fill(0);
  for (let h = 0; h < H; h++) {
    const d = s.z3[h] > 0 ? s.dZ3[h] : 0;
    if (d === 0) continue;
    G[o.b3 + h] += d;
    const row = o.w3 + h * flat;
    for (let i = 0; i < flat; i++) {
      G[row + i] += d * s.p2[i];
      s.dP2[i] += d * P[row + i];
    }
  }

  poolBackward(s.dP2, s.p2Arg, s.dZ2);
  convBackward(P, G, o.w2, o.b2, s.p1, s.dZ2, c1, c2, P1, s.dP1);
  poolBackward(s.dP1, s.p1Arg, s.dZ1);
  convBackward(P, G, o.w1, o.b1, s.x, s.dZ1, 1, c1, S, null);
}

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

// Mean cross-entropy gradient over the batch into net.grads. With label
// smoothing the target is 1 - smoothing on the label, the rest spread evenly.
export function computeGradients(
  net: Cnn,
  x: Float32Array,
  y: Uint8Array,
  batch: ArrayLike<number>,
  labelSmoothing: number,
): number {
  net.grads.fill(0);
  const scale = 1 / batch.length;
  const off = labelSmoothing / CLASSES;
  let loss = 0;
  for (let k = 0; k < batch.length; k++) {
    const n = batch[k];
    const probs = softmax(forward(net, x, n * S * S));
    for (let c = 0; c < CLASSES; c++) {
      const target = off + (c === y[n] ? 1 - labelSmoothing : 0);
      loss -= target * Math.log(Math.max(probs[c], 1e-30));
      net.s.dLogits[c] = (probs[c] - target) * scale;
    }
    backward(net);
  }
  return loss * scale;
}

// Decoupled weight decay (AdamW), applied to every parameter.
export function adamwStep(net: Cnn, opt: OptimConfig): void {
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
export function evaluate(net: Cnn, x: Float32Array, y: Uint8Array, set: Int32Array, answers?: Uint8Array): EvalResult {
  let loss = 0;
  let correct = 0;
  for (const n of set) {
    const logits = forward(net, x, n * S * S);
    let top = 0;
    for (let c = 1; c < CLASSES; c++) if (logits[c] > logits[top]) top = c;
    if (top === y[n]) correct++;
    if (answers) answers[n] = top;
    loss -= Math.log(Math.max(softmax(logits)[y[n]], 1e-30));
  }
  return { loss: loss / set.length, acc: correct / set.length };
}

// L2 norm of every weight (biases excluded).
export function weightNorm(net: Cnn): number {
  let sum = 0;
  for (const [at, n] of net.weightBlocks) for (let k = 0; k < n; k++) sum += net.params[at + k] ** 2;
  return Math.sqrt(sum);
}
