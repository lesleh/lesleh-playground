import { DIGITS_FILE_LAYOUT } from "./data";

// Turns a square greyscale drawing (values 0 to 1, row major) into the 14x14
// input the network expects, the way MNIST was prepared: the ink is scaled to
// fit a 20x20 box inside 28x28, centred by its centre of mass, then pooled
// down to 14x14. Returns null when nothing has been drawn.
export function toNetworkInput(grey: Float32Array, size: number): Float32Array | null {
  let minX = size;
  let minY = size;
  let maxX = -1;
  let maxY = -1;
  let mass = 0;
  let mx = 0;
  let my = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = grey[y * size + x];
      if (v <= 0.05) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      mass += v;
      mx += v * x;
      my += v * y;
    }
  }
  if (maxX < 0) return null;
  mx /= mass;
  my /= mass;

  // Splat each source pixel into the 28x28 frame. A source pixel covers s^2
  // target pixels, so adding v * s^2 keeps the average ink level.
  const s = 20 / Math.max(maxX - minX + 1, maxY - minY + 1);
  const frame = new Float32Array(28 * 28);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const v = grey[y * size + x];
      if (v <= 0) continue;
      const tx = Math.floor((x + 0.5 - mx) * s + 14);
      const ty = Math.floor((y + 0.5 - my) * s + 14);
      if (tx < 0 || ty < 0 || tx >= 28 || ty >= 28) continue;
      frame[ty * 28 + tx] += v * s * s;
    }
  }

  const { side } = DIGITS_FILE_LAYOUT;
  const out = new Float32Array(side * side);
  for (let r = 0; r < side; r++) {
    for (let c = 0; c < side; c++) {
      let sum = 0;
      for (let dr = 0; dr < 2; dr++) for (let dc = 0; dc < 2; dc++) sum += frame[(2 * r + dr) * 28 + 2 * c + dc];
      out[r * side + c] = Math.min(1, sum / 4);
    }
  }
  return out;
}
