import { DIGITS_FILE_LAYOUT, parseDigits } from "./data";

describe("parseDigits", () => {
  const { pixels, train, test } = DIGITS_FILE_LAYOUT;
  const count = train + test;

  it("scales pixels, reads labels and splits train from test", () => {
    const bytes = new Uint8Array(count * pixels + count);
    bytes[0] = 255;
    bytes[pixels] = 51;
    bytes[count * pixels] = 7;
    bytes[count * pixels + count - 1] = 3;
    const d = parseDigits(bytes);
    expect(d.x[0]).toBe(1);
    expect(d.x[pixels]).toBeCloseTo(0.2);
    expect(d.y[0]).toBe(7);
    expect(d.y[count - 1]).toBe(3);
    expect(d.train).toHaveLength(train);
    expect(d.test[0]).toBe(train);
    expect(d.test).toHaveLength(test);
  });

  it("rejects a file of the wrong size", () => {
    expect(() => parseDigits(new Uint8Array(10))).toThrow(/Unexpected digits file size/);
  });
});
