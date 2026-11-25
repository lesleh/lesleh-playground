import type * as Ort from "onnxruntime-web/wasm";

// Imported on first load: the WASM build resolves URLs at import time, which fails during SSR.
let ort: typeof Ort | null = null;
let session: Ort.InferenceSession | null = null;

export async function loadModel(): Promise<void> {
  if (session) return;
  ort ??= await import("onnxruntime-web/wasm");
  session = await ort.InferenceSession.create("/connect-four-model.onnx", {
    executionProviders: ["wasm"],
  });
}

export async function predict(
  encoded: Float32Array
): Promise<{ policy: Float32Array; value: number }> {
  if (!session || !ort) throw new Error("Model not loaded");

  const input = new ort.Tensor("float32", encoded, [1, 2, 6, 7]);
  const results = await session.run({ board: input });

  const logits = results.policy_logits.data as Float32Array;
  const value = (results.value.data as Float32Array)[0];

  let maxLogit = -Infinity;
  for (let i = 0; i < logits.length; i++) {
    if (logits[i] > maxLogit) maxLogit = logits[i];
  }
  const exps = new Float32Array(logits.length);
  let sum = 0;
  for (let i = 0; i < logits.length; i++) {
    exps[i] = Math.exp(logits[i] - maxLogit);
    sum += exps[i];
  }
  const policy = new Float32Array(logits.length);
  for (let i = 0; i < logits.length; i++) {
    policy[i] = exps[i] / sum;
  }

  return { policy, value };
}

export function isLoaded(): boolean {
  return session !== null;
}
