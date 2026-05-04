export class SpatialGrid {
  private cells: Map<number, number[]> = new Map();
  private cellSize: number;
  private cols: number;

  constructor(width: number, height: number, cellSize: number) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
  }

  private key(cx: number, cy: number): number {
    return cy * this.cols + cx;
  }

  clear(): void {
    this.cells.clear();
  }

  insert(index: number, x: number, y: number): void {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const k = this.key(cx, cy);
    const cell = this.cells.get(k);
    if (cell) cell.push(index);
    else this.cells.set(k, [index]);
  }

  query(x: number, y: number): number[] {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const result: number[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cell = this.cells.get(this.key(cx + dx, cy + dy));
        if (cell) result.push(...cell);
      }
    }
    return result;
  }

  // Zero-allocation variant — writes into a caller-provided typed array, returns count
  queryInto(x: number, y: number, out: Int32Array): number {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    let len = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cell = this.cells.get(this.key(cx + dx, cy + dy));
        if (cell) {
          for (let k = 0; k < cell.length; k++) {
            if (len < out.length) out[len++] = cell[k];
          }
        }
      }
    }
    return len;
  }
}
