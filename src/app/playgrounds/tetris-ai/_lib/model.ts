import * as ort from "onnxruntime-web";

let session: ort.InferenceSession | null = null;

export async function loadModel(): Promise<void> {
  if (session) return;
  session = await ort.InferenceSession.create("/tetris-model.onnx", {
    executionProviders: ["wasm"],
  });
}

export async function scorePlacements(
  features: [number, number, number, number, number][]
): Promise<number[]> {
  if (!session) throw new Error("Model not loaded");

  const numFeatures = 5;
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
