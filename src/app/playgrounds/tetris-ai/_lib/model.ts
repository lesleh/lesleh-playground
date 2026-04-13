import { MLP } from "./mlp";

let model: MLP | null = null;

export async function loadModel(): Promise<void> {
  if (model) return;
  const response = await fetch("/tetris-model.json");
  const json = await response.text();
  model = MLP.deserialize(json);
}

export async function scorePlacements(
  features: number[][]
): Promise<number[]> {
  if (!model) throw new Error("Model not loaded");
  return features.map((f) => model!.forward(f));
}

export function isLoaded(): boolean {
  return model !== null;
}
