import type { RunConfig, Snapshot } from "./trainer";

// Messages between the page and the training worker.
export type WorkerRequest =
  | { type: "init"; bytes: Uint8Array; cfg: RunConfig }
  | { type: "reset"; cfg: RunConfig }
  | { type: "play" }
  | { type: "pause" }
  | { type: "setWeightDecay"; value: number }
  | { type: "setLabelSmoothing"; value: number }
  | { type: "probe"; pixels: Float32Array | null };

export type WorkerResponse = { type: "snapshot"; snapshot: Snapshot; running: boolean };
