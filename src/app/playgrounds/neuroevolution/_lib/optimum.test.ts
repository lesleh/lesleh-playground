import { LAPS_TO_FINISH } from "./car";
import { mulberry32 } from "./geometry";
import { idealLapTicks, idealRunTicks } from "./optimum";
import { buildTrack } from "./track";

const track = buildTrack({ width: 900, height: 600 }, mulberry32(1));

describe("idealLapTicks", () => {
  it("is a positive, finite tick count", () => {
    const t = idealLapTicks(track);
    expect(t).toBeGreaterThan(0);
    expect(Number.isFinite(t)).toBe(true);
  });

  it("lands in a sane range (a handful of seconds per lap)", () => {
    const seconds = idealLapTicks(track) / 60;
    expect(seconds).toBeGreaterThan(3);
    expect(seconds).toBeLessThan(15);
  });
});

describe("idealRunTicks", () => {
  it("is the lap estimate times the lap target", () => {
    expect(idealRunTicks(track)).toBeCloseTo(idealLapTicks(track) * LAPS_TO_FINISH);
  });
});
