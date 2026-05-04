import { SpatialGrid } from "./spatialGrid";

export interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface BoidParams {
  separation: number;
  alignment: number;
  cohesion: number;
  speed: number;
}

export const DEFAULT_PARAMS: BoidParams = {
  separation: 1.0,
  alignment: 1.5,
  cohesion: 1.0,
  speed: 5.0,
};

export const VISUAL_RANGE = 100;
const SEPARATION_RANGE = 25;
const TOPOLOGICAL_N = 7;

// Pre-allocated buffers reused every frame — zero heap allocation in the hot path
const MAX_CANDIDATES = 512;
const _buf = new Int32Array(MAX_CANDIDATES);    // candidate indices (queryInto output, then compacted in-place)
const _dSq = new Float64Array(MAX_CANDIDATES);  // candidate distances²
const _nearIdx = new Int32Array(TOPOLOGICAL_N); // nearest-N indices
const _nearDSq = new Float64Array(TOPOLOGICAL_N); // nearest-N distances²

export function createBoids(count: number, width: number, height: number): Boid[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
  }));
}

export function updateBoids(
  boids: Boid[],
  grid: SpatialGrid,
  params: BoidParams,
  width: number,
  height: number
): void {
  let globalX = 0, globalY = 0;
  for (let i = 0; i < boids.length; i++) {
    globalX += boids[i].x;
    globalY += boids[i].y;
  }
  globalX /= boids.length;
  globalY /= boids.length;

  grid.clear();
  for (let i = 0; i < boids.length; i++) {
    grid.insert(i, boids[i].x, boids[i].y);
  }

  const vr2 = VISUAL_RANGE * VISUAL_RANGE;
  const sr2 = SEPARATION_RANGE * SEPARATION_RANGE;

  for (let i = 0; i < boids.length; i++) {
    const b = boids[i];

    // Write grid candidates into _buf with no allocation
    const candLen = grid.queryInto(b.x, b.y, _buf);

    // Filter by visual range, skipping self. Compact _buf in-place
    // (safe because visLen <= k always holds, so writes never overtake reads)
    let visLen = 0;
    for (let k = 0; k < candLen; k++) {
      const j = _buf[k];
      if (j === i) continue;
      const n = boids[j];
      const dx = b.x - n.x, dy = b.y - n.y;
      const d = dx * dx + dy * dy;
      if (d < vr2) {
        _buf[visLen] = j;
        _dSq[visLen] = d;
        visLen++;
      }
    }

    // Max-heap selection: find TOPOLOGICAL_N nearest with zero allocation.
    // Track the current worst slot in the heap so replacements are O(k).
    let nearLen = 0;
    let heapMax = 0;
    let heapMaxPos = 0;

    for (let k = 0; k < visLen; k++) {
      const d = _dSq[k];
      if (nearLen < TOPOLOGICAL_N) {
        _nearIdx[nearLen] = _buf[k];
        _nearDSq[nearLen] = d;
        nearLen++;
        if (d > heapMax) { heapMax = d; heapMaxPos = nearLen - 1; }
      } else if (d < heapMax) {
        _nearIdx[heapMaxPos] = _buf[k];
        _nearDSq[heapMaxPos] = d;
        heapMax = 0;
        for (let m = 0; m < TOPOLOGICAL_N; m++) {
          if (_nearDSq[m] > heapMax) { heapMax = _nearDSq[m]; heapMaxPos = m; }
        }
      }
    }

    let sepX = 0, sepY = 0;
    let avgVx = 0, avgVy = 0;
    let avgX = 0, avgY = 0;

    for (let k = 0; k < nearLen; k++) {
      const n = boids[_nearIdx[k]];
      const dx = b.x - n.x, dy = b.y - n.y;
      const d = _nearDSq[k];

      if (d < sr2 && d > 0) {
        const dist = Math.sqrt(d);
        sepX += (dx / dist) * params.separation * 0.15;
        sepY += (dy / dist) * params.separation * 0.15;
      }

      avgVx += n.vx;
      avgVy += n.vy;
      avgX += n.x;
      avgY += n.y;
    }

    b.vx += sepX;
    b.vy += sepY;

    if (nearLen > 0) {
      b.vx += (avgVx / nearLen - b.vx) * params.alignment * 0.2;
      b.vy += (avgVy / nearLen - b.vy) * params.alignment * 0.2;
      b.vx += (avgX / nearLen - b.x) * params.cohesion * 0.001;
      b.vy += (avgY / nearLen - b.y) * params.cohesion * 0.001;
    }

    b.vx += (globalX - b.x) * 0.00008;
    b.vy += (globalY - b.y) * 0.00008;

    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    const maxSpeed = params.speed;
    const minSpeed = maxSpeed * 0.6;

    if (speed > maxSpeed) {
      b.vx = (b.vx / speed) * maxSpeed;
      b.vy = (b.vy / speed) * maxSpeed;
    } else if (speed > 0 && speed < minSpeed) {
      b.vx = (b.vx / speed) * minSpeed;
      b.vy = (b.vy / speed) * minSpeed;
    }

    b.x = (b.x + b.vx + width) % width;
    b.y = (b.y + b.vy + height) % height;
  }
}
