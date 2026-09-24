// Layout of public/grokking-digits.bin: every image's pixels (uint8, row
// major), then every label. The first `train` digits are the training set.
export const DIGITS_FILE_LAYOUT = { side: 14, pixels: 196, train: 1000, test: 2000 } as const;

export interface Digits {
  // Pixels scaled to [0, 1], one row of 196 per digit.
  x: Float32Array;
  y: Uint8Array;
  train: Int32Array;
  test: Int32Array;
}

export function parseDigits(bytes: Uint8Array): Digits {
  const { pixels, train, test } = DIGITS_FILE_LAYOUT;
  const count = train + test;
  if (bytes.length !== count * pixels + count) throw new Error(`Unexpected digits file size ${bytes.length}`);
  const x = new Float32Array(count * pixels);
  for (let i = 0; i < x.length; i++) x[i] = bytes[i] / 255;
  const y = bytes.slice(count * pixels);
  const range = (from: number, n: number) => Int32Array.from({ length: n }, (_, i) => from + i);
  return { x, y, train: range(0, train), test: range(train, test) };
}
