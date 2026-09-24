import type { RunConfig, Snapshot } from "./trainer";

// Messages between the page and the training worker.
export type WorkerRequest =
  | { type: "reset"; cfg: RunConfig }
  | { type: "play" }
  | { type: "pause" }
  | { type: "step"; count: number }
  | { type: "setWeightDecay"; value: number }
  | { type: "probe"; pair: number };

export type WorkerResponse = { type: "snapshot"; snapshot: Snapshot; running: boolean };
