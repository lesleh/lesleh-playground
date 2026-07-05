import { BRAIN_SHAPE } from "./car";
import { mulberry32 } from "./geometry";
import { createNetwork } from "./nn";
import { parseBrain, serializeBrain } from "./brainIO";

const net = createNetwork(BRAIN_SHAPE, mulberry32(1));

describe("brain round-trip", () => {
  it("parses back a serialized brain identically", () => {
    const parsed = parseBrain(serializeBrain(net, { generation: 5 }));
    expect(parsed).toEqual(net);
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
