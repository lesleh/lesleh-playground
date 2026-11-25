import type * as Ort from "onnxruntime-web/wasm";

// Imported on first load: the WASM build resolves URLs at import time, which fails during SSR.
let ort: typeof Ort | null = null;
let session: Ort.InferenceSession | null = null;

export async function loadModel(): Promise<void> {
  if (session) return;
  ort ??= await import("onnxruntime-web/wasm");
  session = await ort.InferenceSession.create("/tetris-model.onnx", {
    executionProviders: ["wasm"],
  });
}

export async function scorePlacements(
  features: number[][]
): Promise<number[]> {
  if (!session || !ort) throw new Error("Model not loaded");

  const numFeatures = features[0].length;
  const flat = new Float32Array(features.length * numFeatures);
  for (let i = 0; i < features.length; i++) {
    for (let j = 0; j < numFeatures; j++) {
      flat[i * numFeatures + j] = features[i][j];
    }
  }

  const input = new ort.Tensor("float32", flat, [features.length, numFeatures]);
  const results = await session.run({ input: input });
  const scores = results.output.data as Float32Array;

  return Array.from(scores);
}

export function isLoaded(): boolean {
  return session !== null;
}
