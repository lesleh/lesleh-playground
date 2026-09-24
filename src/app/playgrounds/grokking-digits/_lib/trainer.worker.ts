import { parseDigits, type Digits } from "./data";
import type { WorkerRequest, WorkerResponse } from "./protocol";
import { MAX_STEPS, createTrainer, takeSnapshot, trainStep, type Trainer } from "./trainer";

// Train in slices so incoming messages get handled promptly, and post a
// snapshot after each slice.
const SLICE_MS = 80;

let data: Digits | null = null;
let trainer: Trainer | null = null;
let running = false;
let sent = 0;
let probe: Float32Array | null = null;
// Auto-pause once per run at MAX_STEPS; pressing play afterwards keeps going.
let autoPaused = false;
let timer: ReturnType<typeof setTimeout> | null = null;

function post(): void {
  if (!trainer) return;
  const snapshot = takeSnapshot(trainer, sent, probe);
  sent = trainer.history.length;
  const msg: WorkerResponse = { type: "snapshot", snapshot, running };
  self.postMessage(msg);
}

function loop(): void {
  timer = null;
  if (!trainer || !running) return;
  const end = performance.now() + SLICE_MS;
  do trainStep(trainer);
  while (performance.now() < end && (autoPaused || trainer.net.step < MAX_STEPS));
  if (!autoPaused && trainer.net.step >= MAX_STEPS) {
    autoPaused = true;
    running = false;
  }
  post();
  if (running) timer = setTimeout(loop, 0);
}

function schedule(): void {
  if (timer === null) timer = setTimeout(loop, 0);
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  switch (msg.type) {
    case "init":
      data = parseDigits(msg.bytes);
      trainer = createTrainer(msg.cfg, data);
      sent = 0;
      post();
      break;
    case "reset":
      if (!data) break;
      trainer = createTrainer(msg.cfg, data);
      sent = 0;
      autoPaused = false;
      post();
      if (running) schedule();
      break;
    case "play":
      running = true;
      schedule();
      break;
    case "pause":
      running = false;
      post();
      break;
    case "step":
      if (!trainer) break;
      for (let i = 0; i < msg.count; i++) trainStep(trainer);
      post();
      break;
    case "setWeightDecay":
      if (trainer) trainer.opt.weightDecay = msg.value;
      break;
    case "setLabelSmoothing":
      if (trainer) trainer.labelSmoothing = msg.value;
      break;
    case "probe":
      probe = msg.pixels;
      if (!running) post();
      break;
  }
};
