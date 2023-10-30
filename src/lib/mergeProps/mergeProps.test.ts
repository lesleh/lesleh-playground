import { mergeProps } from "./mergeProps";

describe("mergeProps", () => {
  it("should merge two objects", () => {
    const props = { foo: "foo" };
    const defaultProps = { bar: "bar" };
    const result = mergeProps(props, defaultProps);
    expect(result).toEqual({ foo: "foo", bar: "bar" });
  });

  it.todo("should merge classNames");

  it.todo("should merge style objects");

  it.todo("should merge event handlers");

  it.todo("should merge aria attributes");

  it.todo("should use last id if both objects have an id");
});
