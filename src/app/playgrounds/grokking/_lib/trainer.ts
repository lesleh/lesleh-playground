import { makeDataset, type Dataset } from "./dataset";
import { fourierView, type FourierView } from "./fourier";
import {
  adamwStep,
  computeGradients,
  createModel,
  evaluate,
  weightNorm,
  type Model,
  type Predictions,
  type OptimConfig,
} from "./model";
import { mulberry32 } from "./rng";

export interface RunConfig {
  p: number;
  trainFraction: number;
  weightDecay: number;
  seed: number;
}

// Tuned in Node: with these settings the network memorises by about step 400
// and generalises around step 3000. Without weight decay it never generalises.
export const DEFAULT_RUN: RunConfig = {
  p: 59,
  trainFraction: 0.4,
  weightDecay: 1,
  seed: 1,
};

const MODEL = { embedDim: 24, hidden: 64, initScale: 1 };
const OPTIM: Omit<OptimConfig, "weightDecay"> = { lr: 3e-3, beta1: 0.9, beta2: 0.98, eps: 1e-8 };

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
  data: Dataset;
  model: Model;
  opt: OptimConfig;
  history: HistoryPoint[];
}

export function createTrainer(cfg: RunConfig): Trainer {
  const rand = mulberry32(cfg.seed);
  const data = makeDataset(cfg.p, cfg.trainFraction, rand);
  const model = createModel({ p: cfg.p, ...MODEL }, rand);
  return { cfg, data, model, opt: { ...OPTIM, weightDecay: cfg.weightDecay }, history: [] };
}

// Dense early (the log-scale chart spreads those steps out), sparse later.
export function shouldRecord(step: number): boolean {
  return step <= 100 || step % 10 === 0;
}

// One full-batch AdamW step. Records a history point on selected steps.
export function trainStep(t: Trainer): void {
  const train = computeGradients(t.model, t.data.train);
  adamwStep(t.model, t.opt);
  const step = t.model.step;
  if (!shouldRecord(step)) return;
  const test = evaluate(t.model, t.data.test);
  t.history.push({
    step,
    trainLoss: train.loss,
    trainAcc: train.acc,
    testLoss: test.loss,
    testAcc: test.acc,
    norm: weightNorm(t.model),
  });
}

export interface Snapshot {
  step: number;
  // New history points since the last snapshot.
  history: HistoryPoint[];
  // The network's answer for every pair, indexed by a * p + b.
  predictions: Predictions;
  isTrain: Uint8Array;
  fourier: FourierView;
}

export function takeSnapshot(t: Trainer, sinceIndex: number): Snapshot {
  const { p } = t.cfg;
  const all = new Int32Array(p * p);
  for (let i = 0; i < all.length; i++) all[i] = i;
  const predictions: Predictions = { answer: new Uint16Array(p * p), confidence: new Float32Array(p * p) };
  evaluate(t.model, all, predictions);
  return {
    step: t.model.step,
    history: t.history.slice(sinceIndex),
    predictions,
    isTrain: t.data.isTrain,
    fourier: fourierView(t.model),
  };
}

export type Phase = "memorising" | "memorised" | "grokking" | "grokked";

// Phase from the latest accuracies. Training accuracy leads, test lags.
export function phaseOf(point: HistoryPoint | undefined): Phase {
  if (!point || point.trainAcc < 0.99) return "memorising";
  if (point.testAcc >= 0.95) return "grokked";
  if (point.testAcc >= 0.1) return "grokking";
  return "memorised";
}

// Steps to keep training after unseen accuracy first reaches 100%. The
// weight norm and Fourier spectrum keep tidying up for about 1,500 steps.
export const SETTLE_STEPS = 2000;

// True once unseen accuracy has been perfect for SETTLE_STEPS.
export function hasSettled(history: HistoryPoint[]): boolean {
  const perfect = history.find((pt) => pt.testAcc >= 1);
  const last = history[history.length - 1];
  return !!perfect && !!last && last.step - perfect.step >= SETTLE_STEPS;
}
