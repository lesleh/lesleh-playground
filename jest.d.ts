declare global {
  namespace jest {
    interface Matchers<R, T = {}> {
      toContainSpaceSeparatedValue(expected: string): R;
    }
  }
}

export {};
