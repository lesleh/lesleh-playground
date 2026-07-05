// A uniform spatial grid over the track walls. Sensors and collision only need
// the handful of walls near a car, not all ~150, so this buckets walls by cell
// and returns the candidates overlapping a query box. It's a broad-phase cull:
// it never drops a wall that could be within range, so results are identical to
// testing every wall, just far cheaper.

import type { Wall } from "./track";

const DEFAULT_CELL = 80;

export class WallGrid {
  private readonly cell: number;
  private readonly cols: number;
  private readonly rows: number;
  private readonly buckets: number[][];
  private readonly walls: Wall[];
  // Per-wall "seen this query" stamp, to dedupe walls spanning several cells
  // without allocating a Set each query.
  private readonly stamp: Int32Array;
  private epoch = 0;

  constructor(walls: Wall[], width: number, height: number, cell = DEFAULT_CELL) {
    this.walls = walls;
    this.cell = cell;
    this.cols = Math.max(1, Math.ceil(width / cell));
    this.rows = Math.max(1, Math.ceil(height / cell));
    this.buckets = Array.from({ length: this.cols * this.rows }, () => []);
    this.stamp = new Int32Array(walls.length).fill(-1);

    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      const c0 = this.col(Math.min(w.ax, w.bx));
      const c1 = this.col(Math.max(w.ax, w.bx));
      const r0 = this.row(Math.min(w.ay, w.by));
      const r1 = this.row(Math.max(w.ay, w.by));
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) this.buckets[r * this.cols + c].push(i);
      }
    }
  }

  private col(x: number): number {
    return Math.min(this.cols - 1, Math.max(0, Math.floor(x / this.cell)));
  }
  private row(y: number): number {
    return Math.min(this.rows - 1, Math.max(0, Math.floor(y / this.cell)));
  }

  // Fill `out` with walls whose cell overlaps the box [x±r, y±r]; return count.
  // `out` is a caller-owned scratch array, reused to avoid per-call allocation.
  query(x: number, y: number, r: number, out: Wall[]): number {
    const c0 = this.col(x - r);
    const c1 = this.col(x + r);
    const r0 = this.row(y - r);
    const r1 = this.row(y + r);
    this.epoch++;
    let n = 0;
    for (let rr = r0; rr <= r1; rr++) {
      for (let cc = c0; cc <= c1; cc++) {
        const bucket = this.buckets[rr * this.cols + cc];
        for (let k = 0; k < bucket.length; k++) {
          const i = bucket[k];
          if (this.stamp[i] !== this.epoch) {
            this.stamp[i] = this.epoch;
            out[n++] = this.walls[i];
          }
        }
      }
    }
    return n;
  }
}
