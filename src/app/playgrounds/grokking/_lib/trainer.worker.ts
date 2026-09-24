import type { WorkerRequest, WorkerResponse } from "./protocol";
import { createTrainer, hasSettled, takeSnapshot, trainStep, type Trainer } from "./trainer";

// Train in slices so incoming messages (pause, weight decay) get handled
// promptly, and post a snapshot after each slice.
const SLICE_MS = 80;

let trainer: Trainer | null = null;
let running = false;
// Auto-pause once per run; pressing play afterwards keeps training.
let autoPaused = false;
let sent = 0;
let probePair = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

function post(): void {
  if (!trainer) return;
  const snapshot = takeSnapshot(trainer, sent, probePair);
  sent = trainer.history.length;
  const msg: WorkerResponse = { type: "snapshot", snapshot, running };
  self.postMessage(msg);
}

function loop(): void {
  timer = null;
  if (!trainer || !running) return;
  const end = performance.now() + SLICE_MS;
  do trainStep(trainer);
  while (performance.now() < end);
  if (!autoPaused && hasSettled(trainer.history)) {
    autoPaused = true;
    running = false;
  }
  post();
  if (!running) return;
  timer = setTimeout(loop, 0);
}

function schedule(): void {
  if (timer === null) timer = setTimeout(loop, 0);
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  switch (msg.type) {
    case "reset":
      trainer = createTrainer(msg.cfg);
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
    case "probe":
      probePair = msg.pair;
      // While running, the next slice picks it up; when paused, answer now.
      if (!running) post();
      break;
    case "setWeightDecay":
      if (trainer) trainer.opt.weightDecay = msg.value;
      break;
  }
};
