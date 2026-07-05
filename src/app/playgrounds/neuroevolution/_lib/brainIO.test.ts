import { readFileSync } from "fs";
import { join } from "path";
import { BRAIN_SHAPE } from "./car";
import { mulberry32 } from "./geometry";
import { createNetwork } from "./nn";
import { buildTrack } from "./track";
import { parseBrain, serializeBrain } from "./brainIO";

const net = createNetwork(BRAIN_SHAPE, mulberry32(1));

describe("brain round-trip", () => {
  it("parses back a serialized brain identically (no track)", () => {
    const parsed = parseBrain(serializeBrain(net, { generation: 5 }));
    expect(parsed.net).toEqual(net);
    expect(parsed.track).toBeNull();
  });

  it("round-trips a bundled specialist track", () => {
    const track = buildTrack({ width: 900, height: 600 }, mulberry32(9));
    const parsed = parseBrain(serializeBrain(net, {}, track));
    expect(parsed.net).toEqual(net);
    expect(parsed.track).toEqual(track);
  });
});

describe("parseBrain validation", () => {
  it("rejects non-JSON", () => {
    expect(() => parseBrain("nope")).toThrow(/JSON/);
  });

  it("rejects the wrong format", () => {
    expect(() => parseBrain(JSON.stringify({ hello: 1 }))).toThrow(/brain file/);
  });

  it("rejects a mismatched shape", () => {
    const wrong = createNetwork([3, 3, 2], mulberry32(2));
    expect(() => parseBrain(serializeBrain(wrong))).toThrow(/shape/);
  });

  it("rejects a layer whose weights are the wrong length", () => {
    const broken = createNetwork(BRAIN_SHAPE, mulberry32(3));
    broken.layers[0].w.pop(); // now w.length !== inSize * outSize
    expect(() => parseBrain(serializeBrain(broken))).toThrow(/malformed layer/);
  });
});

describe("bundled generalist", () => {
  it("loads and matches the current network shape", () => {
    const text = readFileSync(join(__dirname, "../_brains/generalist.json"), "utf8");
    const { net } = parseBrain(text); // throws if shape drifts from BRAIN_SHAPE
    const shape = [net.layers[0].inSize, ...net.layers.map((l) => l.outSize)];
    expect(shape).toEqual(BRAIN_SHAPE);
  });
});
