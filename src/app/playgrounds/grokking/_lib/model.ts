import { label } from "./dataset";
import { gaussian } from "./rng";

// A small MLP for (a + b) mod p:
//   x = [E[a]; E[b]]  ->  h = relu(W1 x + b1)  ->  logits = W2 h + b2
// E is one embedding table shared by both operands, so the Fourier view has a
// single thing to analyse. All parameters live in one Float32Array so AdamW
// is a single loop.
export interface ModelConfig {
  p: number;
  embedDim: number;
  hidden: number;
  initScale: number;
}

export interface Model {
  cfg: ModelConfig;
  params: Float32Array;
  grads: Float32Array;
  m: Float32Array;
  v: Float32Array;
  step: number;
  // Offsets into params.
  oE: number;
  oW1: number;
  ob1: number;
  oW2: number;
  ob2: number;
}

export interface OptimConfig {
  lr: number;
  weightDecay: number;
  beta1: number;
  beta2: number;
  eps: number;
}

export function createModel(cfg: ModelConfig, rand: () => number): Model {
  const { p, embedDim: d, hidden: H, initScale } = cfg;
  const oE = 0;
  const oW1 = oE + p * d;
  const ob1 = oW1 + H * 2 * d;
  const oW2 = ob1 + H;
  const ob2 = oW2 + p * H;
  const size = ob2 + p;
  const params = new Float32Array(size);

  const fill = (off: number, n: number, std: number) => {
    for (let i = 0; i < n; i++) params[off + i] = gaussian(rand) * std * initScale;
  };
  fill(oE, p * d, 1);
  fill(oW1, H * 2 * d, 1 / Math.sqrt(2 * d));
  fill(oW2, p * H, 1 / Math.sqrt(H));

  return {
    cfg,
    params,
    grads: new Float32Array(size),
    m: new Float32Array(size),
    v: new Float32Array(size),
    step: 0,
    oE,
    oW1,
    ob1,
    oW2,
    ob2,
  };
}

// Scratch buffers reused across calls to avoid per-example allocation.
interface Scratch {
  x: Float32Array;
  z: Float32Array;
  h: Float32Array;
  logits: Float32Array;
  dh: Float32Array;
}

const scratchCache = new WeakMap<Model, Scratch>();
function scratch(model: Model): Scratch {
  let s = scratchCache.get(model);
  if (!s) {
    const { p, embedDim: d, hidden: H } = model.cfg;
    s = {
      x: new Float32Array(2 * d),
      z: new Float32Array(H),
      h: new Float32Array(H),
      logits: new Float32Array(p),
      dh: new Float32Array(H),
    };
    scratchCache.set(model, s);
  }
  return s;
}

// Forward pass for one pair. Fills s.x, s.z, s.h, s.logits.
function forward(model: Model, pair: number, s: Scratch): void {
  const { p, embedDim: d, hidden: H } = model.cfg;
  const P = model.params;
  const a = Math.floor(pair / p);
  const b = pair % p;
  const ea = model.oE + a * d;
  const eb = model.oE + b * d;
  for (let k = 0; k < d; k++) {
    s.x[k] = P[ea + k];
    s.x[d + k] = P[eb + k];
  }
  const d2 = 2 * d;
  for (let j = 0; j < H; j++) {
    let acc = P[model.ob1 + j];
    const row = model.oW1 + j * d2;
    for (let k = 0; k < d2; k++) acc += P[row + k] * s.x[k];
    s.z[j] = acc;
    s.h[j] = acc > 0 ? acc : 0;
  }
  for (let c = 0; c < p; c++) {
    let acc = P[model.ob2 + c];
    const row = model.oW2 + c * H;
    for (let j = 0; j < H; j++) acc += P[row + j] * s.h[j];
    s.logits[c] = acc;
  }
}

// Softmax in place; returns log-sum-exp for the loss.
function softmaxInPlace(logits: Float32Array): number {
  let max = -Infinity;
  for (let i = 0; i < logits.length; i++) if (logits[i] > max) max = logits[i];
  let sum = 0;
  for (let i = 0; i < logits.length; i++) {
    const e = Math.exp(logits[i] - max);
    logits[i] = e;
    sum += e;
  }
  for (let i = 0; i < logits.length; i++) logits[i] /= sum;
  return max + Math.log(sum);
}

// Accumulates the mean cross-entropy gradient over `pairs` into model.grads.
// Returns mean loss and accuracy on those pairs.
export function computeGradients(model: Model, pairs: Int32Array): { loss: number; acc: number } {
  const { p, embedDim: d, hidden: H } = model.cfg;
  const P = model.params;
  const G = model.grads;
  G.fill(0);
  const s = scratch(model);
  const inv = 1 / pairs.length;
  const d2 = 2 * d;
  let loss = 0;
  let correct = 0;

  for (let n = 0; n < pairs.length; n++) {
    const pair = pairs[n];
    const y = label(pair, p);
    forward(model, pair, s);

    let argmax = 0;
    for (let c = 1; c < p; c++) if (s.logits[c] > s.logits[argmax]) argmax = c;
    if (argmax === y) correct++;
    const logit = s.logits[y];
    const lse = softmaxInPlace(s.logits);
    loss += lse - logit;

    // s.logits now holds probabilities; turn it into dL/dlogits.
    s.logits[y] -= 1;
    s.dh.fill(0);
    for (let c = 0; c < p; c++) {
      const g = s.logits[c] * inv;
      if (g === 0) continue;
      G[model.ob2 + c] += g;
      const row = model.oW2 + c * H;
      for (let j = 0; j < H; j++) {
        G[row + j] += g * s.h[j];
        s.dh[j] += g * P[row + j];
      }
    }

    const a = Math.floor(pair / p);
    const b = pair % p;
    const ea = model.oE + a * d;
    const eb = model.oE + b * d;
    for (let j = 0; j < H; j++) {
      if (s.z[j] <= 0) continue;
      const g = s.dh[j];
      G[model.ob1 + j] += g;
      const row = model.oW1 + j * d2;
      for (let k = 0; k < d; k++) {
        G[row + k] += g * s.x[k];
        G[row + d + k] += g * s.x[d + k];
        G[ea + k] += g * P[row + k];
        G[eb + k] += g * P[row + d + k];
      }
    }
  }
  return { loss: loss * inv, acc: correct * inv };
}

// Decoupled weight decay (AdamW), applied to every parameter.
export function adamwStep(model: Model, opt: OptimConfig): void {
  model.step++;
  const { lr, weightDecay, beta1, beta2, eps } = opt;
  const bc1 = 1 - Math.pow(beta1, model.step);
  const bc2 = 1 - Math.pow(beta2, model.step);
  const P = model.params;
  const G = model.grads;
  const M = model.m;
  const V = model.v;
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

// The network's answer and its probability, indexed by pair (a * p + b).
export interface Predictions {
  answer: Uint16Array;
  confidence: Float32Array;
}

// Loss and accuracy over `pairs`. When `out` is given, also records each
// pair's predicted answer and confidence for the grid and the query box.
export function evaluate(model: Model, pairs: Int32Array, out?: Predictions): EvalResult {
  const { p } = model.cfg;
  const s = scratch(model);
  let loss = 0;
  let correct = 0;
  for (let n = 0; n < pairs.length; n++) {
    const pair = pairs[n];
    const y = label(pair, p);
    forward(model, pair, s);
    let argmax = 0;
    for (let c = 1; c < p; c++) if (s.logits[c] > s.logits[argmax]) argmax = c;
    const ok = argmax === y;
    if (ok) correct++;
    const logit = s.logits[y];
    loss += softmaxInPlace(s.logits) - logit;
    if (out) {
      out.answer[pair] = argmax;
      out.confidence[pair] = s.logits[argmax];
    }
  }
  return { loss: loss / pairs.length, acc: correct / pairs.length };
}

// L2 norm of every parameter. Weight decay drives this down after memorising.
export function weightNorm(model: Model): number {
  let sum = 0;
  const P = model.params;
  for (let i = 0; i < P.length; i++) sum += P[i] * P[i];
  return Math.sqrt(sum);
}
