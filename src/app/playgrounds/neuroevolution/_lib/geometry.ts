// Small geometry + RNG toolkit for the simulation. The ray/segment cores take
// primitive numbers rather than objects: they run tens of thousands of times
// per tick, so we keep them allocation-free.

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

// Distance a ray (origin o, unit direction d) travels before hitting segment
// a-b, or Infinity if it misses. Assumes (dx, dy) is normalised.
export function rayHit(
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const sx = bx - ax;
  const sy = by - ay;
  const denom = sx * dy - sy * dx;
  if (Math.abs(denom) < 1e-9) return Infinity; // parallel
  // Solve o + t*d = a + u*s. rx/ry is (a - o).
  const rx = ax - ox;
  const ry = ay - oy;
  const u = (dx * ry - dy * rx) / denom; // position along the segment
  if (u < 0 || u > 1) return Infinity;
  const t = (sx * ry - sy * rx) / denom; // distance along the ray
  return t >= 0 ? t : Infinity;
}

// Whether segments p1-p2 and p3-p4 cross. Used for collisions and gate passing.
export function segmentsIntersect(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  p3x: number,
  p3y: number,
  p4x: number,
  p4y: number,
): boolean {
  const d1 = orient(p3x, p3y, p4x, p4y, p1x, p1y);
  const d2 = orient(p3x, p3y, p4x, p4y, p2x, p2y);
  const d3 = orient(p1x, p1y, p2x, p2y, p3x, p3y);
  const d4 = orient(p1x, p1y, p2x, p2y, p4x, p4y);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  return false;
}

// Signed area sign of triangle (ax,ay)-(bx,by)-(cx,cy).
function orient(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(bx - ax, by - ay);
}
