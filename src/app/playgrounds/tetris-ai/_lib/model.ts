import * as ort from "onnxruntime-web";

let session: ort.InferenceSession | null = null;

export async function loadModel(): Promise<void> {
  if (session) return;
  session = await ort.InferenceSession.create("/tetris-model.onnx", {
    executionProviders: ["wasm"],
  });
}

export async function scorePlacements(
  features: [number, number, number, number][]
): Promise<number[]> {
  if (!session) throw new Error("Model not loaded");

  const flat = new Float32Array(features.length * 4);
  for (let i = 0; i < features.length; i++) {
    flat[i * 4] = features[i][0];
    flat[i * 4 + 1] = features[i][1];
    flat[i * 4 + 2] = features[i][2];
    flat[i * 4 + 3] = features[i][3];
  }

  const input = new ort.Tensor("float32", flat, [features.length, 4]);
  const results = await session.run({ input: input });
  const scores = results.output.data as Float32Array;

  return Array.from(scores);
}

export function isLoaded(): boolean {
  return session !== null;
}
