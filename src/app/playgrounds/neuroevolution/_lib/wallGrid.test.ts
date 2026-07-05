import { mulberry32, rayHit } from "./geometry";
import { buildTrack, type Wall } from "./track";
import { WallGrid } from "./wallGrid";

const RANGE = 260;

function bruteNearest(
  walls: Wall[],
  x: number,
  y: number,
  dx: number,
  dy: number,
): number {
  let nearest = RANGE;
  for (const w of walls) {
    const t = rayHit(x, y, dx, dy, w.ax, w.ay, w.bx, w.by);
    if (t < nearest) nearest = t;
  }
  return nearest;
}

describe("WallGrid", () => {
  const track = buildTrack({ width: 900, height: 600 }, mulberry32(1));
  const grid = new WallGrid(track.walls, 900, 600);

  it("gives identical nearest-wall distances to testing every wall", () => {
    const rand = mulberry32(2);
    const out: Wall[] = [];
    for (let s = 0; s < 4000; s++) {
      const x = rand() * 900;
      const y = rand() * 600;
      const a = rand() * Math.PI * 2;
      const dx = Math.cos(a);
      const dy = Math.sin(a);

      const n = grid.query(x, y, RANGE, out);
      let gridNearest = RANGE;
      for (let i = 0; i < n; i++) {
        const w = out[i];
        const t = rayHit(x, y, dx, dy, w.ax, w.ay, w.bx, w.by);
        if (t < gridNearest) gridNearest = t;
      }

      expect(gridNearest).toBe(bruteNearest(track.walls, x, y, dx, dy));
    }
  });

  it("returns candidates without duplicates", () => {
    const out: Wall[] = [];
    const n = grid.query(450, 300, RANGE, out);
    expect(new Set(out.slice(0, n)).size).toBe(n);
  });
});
