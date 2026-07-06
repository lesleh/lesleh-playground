// Small RNG toolkit for the simulation. Copied from the neuroevolution
// playground so this one stays self-contained; the two share no code at runtime.

export interface Vec {
  x: number;
  y: number;
}

// Deterministic PRNG so a given seed replays identically (used in tests, and
// lets the UI reset to a repeatable run). Returns a function in [0, 1).
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Standard-normal sample via Box-Muller, drawing from the supplied uniform RNG.
export function gaussian(rand: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
