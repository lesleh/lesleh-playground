import { mulberry32 } from "./geometry";
import { buildTrack } from "./track";

const cfg = { width: 800, height: 600, points: 48 };

describe("buildTrack", () => {
  it("produces matching centreline, walls and gates counts", () => {
    const t = buildTrack(cfg, mulberry32(1));
    expect(t.centerline).toHaveLength(48);
    expect(t.inner).toHaveLength(48);
    expect(t.outer).toHaveLength(48);
    expect(t.walls).toHaveLength(96); // inner + outer per segment
    expect(t.gates).toHaveLength(48);
  });

  it("numbers gates in order", () => {
    const t = buildTrack(cfg, mulberry32(2));
    t.gates.forEach((g, i) => expect(g.index).toBe(i));
  });

  it("keeps the outer wall further from centre than the inner wall", () => {
    const t = buildTrack(cfg, mulberry32(3));
    const cx = cfg.width / 2;
    const cy = cfg.height / 2;
    for (let i = 0; i < t.centerline.length; i++) {
      const inD = Math.hypot(t.inner[i].x - cx, t.inner[i].y - cy);
      const outD = Math.hypot(t.outer[i].x - cx, t.outer[i].y - cy);
      expect(outD).toBeGreaterThan(inD);
    }
  });

  it("starts on the first gate", () => {
    const t = buildTrack(cfg, mulberry32(4));
    expect(t.start.x).toBeCloseTo(t.centerline[0].x);
    expect(t.start.y).toBeCloseTo(t.centerline[0].y);
  });

  it("varies with the seed", () => {
    const a = buildTrack(cfg, mulberry32(5));
    const b = buildTrack(cfg, mulberry32(6));
    expect(a.centerline).not.toEqual(b.centerline);
  });
});
