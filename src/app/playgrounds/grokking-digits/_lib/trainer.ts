import type { Digits } from "./data";
import {
  adamwStep,
  computeGradients,
  createMlp,
  evaluate,
  forward,
  softmax,
  weightNorm,
  type Mlp,
  type OptimConfig,
} from "./mlp";
import { mulberry32 } from "./rng";

export interface RunConfig {
  initScale: number;
  weightDecay: number;
  labelSmoothing: number;
  seed: number;
}

// Tuned in Node on this data: with 16x starting weights the network memorises
// by step 1,000 at about 72% on unseen digits, then climbs past 90% by about
// step 5,600. With 1x weights it generalises straight away, with no grokking.
export const DEFAULT_RUN: RunConfig = {
  initScale: 16,
  weightDecay: 0.3,
  labelSmoothing: 0,
  seed: 1,
};

const HIDDEN = 128;
const BATCH = 200;
const OPTIM: Omit<OptimConfig, "weightDecay"> = { lr: 1e-3, beta1: 0.9, beta2: 0.99, eps: 1e-8 };

// Training pauses here. Test accuracy has flattened well before this.
export const MAX_STEPS = 10_000;

// Test digits shown in the strip, and so re-evaluated on every snapshot.
export const STRIP_SIZE = 120;

export interface HistoryPoint {
  step: number;
  trainLoss: number;
  trainAcc: number;
  testLoss: number;
  testAcc: number;
  norm: number;
}

export interface Trainer {
  cfg: RunConfig;
  data: Digits;
  net: Mlp;
  opt: OptimConfig;
  labelSmoothing: number;
  rand: () => number;
  history: HistoryPoint[];
}

export function createTrainer(cfg: RunConfig, data: Digits): Trainer {
  const rand = mulberry32(cfg.seed);
  const net = createMlp({ inputs: 196, hidden: HIDDEN, classes: 10, initScale: cfg.initScale }, rand);
  return {
    cfg,
    data,
    net,
    opt: { ...OPTIM, weightDecay: cfg.weightDecay },
    labelSmoothing: cfg.labelSmoothing,
    rand,
    history: [],
  };
}

// Full evaluation costs about 15 training steps, so record densely early (the
// log-scale chart spreads those steps out) and sparsely later.
export function shouldRecord(step: number): boolean {
  if (step === 1) return true;
  if (step <= 100) return step % 5 === 0;
  if (step <= 1000) return step % 25 === 0;
  return step % 50 === 0;
}

export function trainStep(t: Trainer): void {
  const { x, y, train, test } = t.data;
  const batch = new Int32Array(BATCH);
  for (let i = 0; i < BATCH; i++) batch[i] = train[Math.floor(t.rand() * train.length)];
  computeGradients(t.net, x, y, batch, t.labelSmoothing);
  adamwStep(t.net, t.opt);
  const step = t.net.step;
  if (!shouldRecord(step)) return;
  const tr = evaluate(t.net, x, y, train);
  const te = evaluate(t.net, x, y, test);
  t.history.push({
    step,
    trainLoss: tr.loss,
    trainAcc: tr.acc,
    testLoss: te.loss,
    testAcc: te.acc,
    norm: weightNorm(t.net),
  });
}

export interface Snapshot {
  step: number;
  // New history points since the last snapshot.
  history: HistoryPoint[];
  // Predicted digit for each strip digit, in strip order.
  stripAnswers: Uint8Array;
  // Probabilities for the probed image (the drawing pad), if any.
  probe: Float32Array | null;
}

export function stripIndices(data: Digits): Int32Array {
  return data.test.slice(0, STRIP_SIZE);
}

export function takeSnapshot(t: Trainer, sinceIndex: number, probe: Float32Array | null): Snapshot {
  const strip = stripIndices(t.data);
  const answers = new Uint8Array(t.data.y.length);
  evaluate(t.net, t.data.x, t.data.y, strip, answers);
  const stripAnswers = Uint8Array.from(strip, (n) => answers[n]);
  return {
    step: t.net.step,
    history: t.history.slice(sinceIndex),
    stripAnswers,
    probe: probe ? softmax(forward(t.net, probe)) : null,
  };
}

export type Phase = "memorising" | "memorised" | "grokking" | "generalised";

// Phase from the history. Unlike modular addition, test accuracy never sits
// at chance: memorising pictures generalises a little on its own. So the
// phases compare against the test accuracy at the moment it memorised.
export function phaseOf(history: HistoryPoint[]): Phase {
  const memo = history.find((pt) => pt.trainAcc >= 0.99);
  const last = history[history.length - 1];
  if (!memo || !last) return "memorising";
  if (last.testAcc >= 0.9) return "generalised";
  if (last.testAcc >= memo.testAcc + 0.03) return "grokking";
  return "memorised";
}
