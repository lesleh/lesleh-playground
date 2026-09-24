import { toNetworkInput } from "./preprocess";

function canvasWith(size: number, draw: (x: number, y: number) => boolean): Float32Array {
  const g = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) g[y * size + x] = draw(x, y) ? 1 : 0;
  return g;
}

function centreOfMass(img: Float32Array, side: number): [number, number] {
  let m = 0;
  let cx = 0;
  let cy = 0;
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const v = img[y * side + x];
      m += v;
      cx += v * (x + 0.5);
      cy += v * (y + 0.5);
    }
  }
  return [cx / m, cy / m];
}

describe("toNetworkInput", () => {
  it("returns null for an empty drawing", () => {
    expect(toNetworkInput(new Float32Array(100 * 100), 100)).toBeNull();
  });

  it("centres a small off-centre stroke by its centre of mass", () => {
    // A vertical bar in the top-left corner of a 200px canvas.
    const out = toNetworkInput(
      canvasWith(200, (x, y) => x >= 10 && x < 30 && y >= 10 && y < 70),
      200,
    )!;
    expect(out).toHaveLength(196);
    const [cx, cy] = centreOfMass(out, 14);
    expect(cx).toBeCloseTo(7, 0);
    expect(cy).toBeCloseTo(7, 0);
  });

  it("scales the ink to about 20/28 of the frame", () => {
    // A 60px square scales to 20x20 in the 28 frame, so 10x10 at 14x14.
    const out = toNetworkInput(
      canvasWith(200, (x, y) => x >= 50 && x < 110 && y >= 50 && y < 110),
      200,
    )!;
    const inked = Array.from(out).filter((v) => v > 0.5).length;
    expect(inked).toBeGreaterThanOrEqual(81);
    expect(inked).toBeLessThanOrEqual(121);
    expect(Math.max(...out)).toBeLessThanOrEqual(1);
  });
});
