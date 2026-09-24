import type { Model } from "./model";

export interface FourierView {
  // Share of embedding energy at each frequency k = 1..floor(p/2). Sums to 1.
  spectrum: Float32Array;
  // Frequency with the most energy.
  topFreq: number;
  // Each number's embedding projected onto the plane of the top frequency.
  // Interleaved x, y for a = 0..p-1.
  circle: Float32Array;
  // Share of energy held by the top 5 frequencies. Near 5/(p/2) for noise,
  // near 1 once the network uses a handful of frequencies.
  top5Share: number;
}

// Discrete Fourier transform of the embedding table over the token index.
// A grokked network represents each number a as cos/sin(2 pi k a / p) for a
// few k, so its energy collapses onto those frequencies.
export function fourierView(model: Model): FourierView {
  const { p, embedDim: d } = model.cfg;
  const P = model.params;
  const nFreq = Math.floor(p / 2);

  const mean = new Float32Array(d);
  for (let a = 0; a < p; a++) for (let j = 0; j < d; j++) mean[j] += P[model.oE + a * d + j] / p;

  const cos = new Float32Array(nFreq * d);
  const sin = new Float32Array(nFreq * d);
  const power = new Float32Array(nFreq);
  let total = 0;
  for (let k = 1; k <= nFreq; k++) {
    const off = (k - 1) * d;
    for (let a = 0; a < p; a++) {
      const theta = (2 * Math.PI * k * a) / p;
      const c = Math.cos(theta);
      const s = Math.sin(theta);
      const row = model.oE + a * d;
      for (let j = 0; j < d; j++) {
        const e = P[row + j] - mean[j];
        cos[off + j] += e * c;
        sin[off + j] += e * s;
      }
    }
    let pw = 0;
    for (let j = 0; j < d; j++) pw += cos[off + j] ** 2 + sin[off + j] ** 2;
    power[k - 1] = pw;
    total += pw;
  }

  const spectrum = new Float32Array(nFreq);
  let topFreq = 1;
  for (let i = 0; i < nFreq; i++) {
    spectrum[i] = total > 0 ? power[i] / total : 0;
    if (spectrum[i] > spectrum[topFreq - 1]) topFreq = i + 1;
  }
  const top5Share = Array.from(spectrum)
    .sort((x, y) => y - x)
    .slice(0, 5)
    .reduce((sum, x) => sum + x, 0);

  // Orthonormal basis (u, v) for the plane spanned by the top frequency.
  const off = (topFreq - 1) * d;
  const u = cos.slice(off, off + d);
  const v = sin.slice(off, off + d);
  normalise(u);
  let dot = 0;
  for (let j = 0; j < d; j++) dot += u[j] * v[j];
  for (let j = 0; j < d; j++) v[j] -= dot * u[j];
  normalise(v);

  const circle = new Float32Array(2 * p);
  for (let a = 0; a < p; a++) {
    const row = model.oE + a * d;
    let x = 0;
    let y = 0;
    for (let j = 0; j < d; j++) {
      const e = P[row + j] - mean[j];
      x += e * u[j];
      y += e * v[j];
    }
    circle[2 * a] = x;
    circle[2 * a + 1] = y;
  }

  return { spectrum, topFreq, circle, top5Share };
}

function normalise(vec: Float32Array): void {
  let n = 0;
  for (let i = 0; i < vec.length; i++) n += vec[i] * vec[i];
  n = Math.sqrt(n) || 1;
  for (let i = 0; i < vec.length; i++) vec[i] /= n;
}
