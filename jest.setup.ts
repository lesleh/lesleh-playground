import "@testing-library/jest-dom";

expect.extend({
  toContainSpaceSeparatedValue(received: string, expected: string) {
    const values = received.split(/\s+/);
    const pass = values.includes(expected);
    if (pass) {
      return {
        message: () =>
          `expected '${received}' not to contain space-separated value '${expected}'`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected '${received}' to contain space-separated value '${expected}'`,
        pass: false,
      };
    }
  },
});
