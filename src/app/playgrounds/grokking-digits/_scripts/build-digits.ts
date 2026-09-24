// Builds public/grokking-digits.bin from the MNIST test set (CC BY-SA 3.0,
// Yann LeCun, Corinna Cortes and Christopher J.C. Burges).
//
// Usage: pnpm tsx src/app/playgrounds/grokking-digits/_scripts/build-digits.ts <dir>
// where <dir> holds the unzipped t10k-images-idx3-ubyte and t10k-labels-idx1-ubyte.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { mulberry32 } from "../_lib/rng";
import { DIGITS_FILE_LAYOUT as L } from "../_lib/data";

const dir = process.argv[2];
if (!dir) throw new Error("Pass the directory holding the unzipped MNIST test files");

const images = readFileSync(join(dir, "t10k-images-idx3-ubyte"));
const labels = readFileSync(join(dir, "t10k-labels-idx1-ubyte"));
const N = 10000;
if (images.readUInt32BE(4) !== N || labels.readUInt32BE(4) !== N) throw new Error("Unexpected MNIST header");

const order = Array.from({ length: N }, (_, i) => i);
const rand = mulberry32(1);
for (let i = N - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1));
  [order[i], order[j]] = [order[j], order[i]];
}

const count = L.train + L.test;
const out = Buffer.alloc(count * L.pixels + count);
for (let k = 0; k < count; k++) {
  const n = order[k];
  // 2x2 average pool from 28x28 to 14x14.
  for (let r = 0; r < L.side; r++) {
    for (let c = 0; c < L.side; c++) {
      let sum = 0;
      for (let dr = 0; dr < 2; dr++) {
        for (let dc = 0; dc < 2; dc++) sum += images[16 + n * 784 + (2 * r + dr) * 28 + 2 * c + dc];
      }
      out[k * L.pixels + r * L.side + c] = Math.round(sum / 4);
    }
  }
  out[count * L.pixels + k] = labels[8 + n];
}

const target = join(process.cwd(), "public", "grokking-digits.bin");
writeFileSync(target, out);
console.log(`Wrote ${count} digits (${out.length} bytes) to ${target}`);
