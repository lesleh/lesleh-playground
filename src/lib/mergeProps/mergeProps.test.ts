import { mergeProps } from "./mergeProps";

describe("mergeProps", () => {
  it("should merge two objects", () => {
    const props = { foo: "foo" };
    const defaultProps = { bar: "bar" };
    const result = mergeProps(props, defaultProps);
    expect(result).toEqual({ foo: "foo", bar: "bar" });
  });

  it("should merge classNames", () => {
    const props = { className: "foo" };
    const defaultProps = { className: "bar" };
    const result = mergeProps(props, defaultProps);
    expect(result.className).toBe("bar foo");
  });

  it("should merge style objects", () => {
    const props = { style: { color: "red", fontSize: "16px" } };
    const defaultProps = { style: { color: "blue", fontWeight: "bold" } };
    const result = mergeProps(props, defaultProps);
    expect(result.style).toEqual({
      color: "red",
      fontWeight: "bold",
      fontSize: "16px",
    });
  });

  it("should merge event handlers", () => {
    const onClickDefault = jest.fn();
    const onClickProps = jest.fn();
    const props = { onClick: onClickProps };
    const defaultProps = { onClick: onClickDefault };
    const result = mergeProps(props, defaultProps);

    result.onClick();

    expect(onClickDefault).toHaveBeenCalledTimes(1);
    expect(onClickProps).toHaveBeenCalledTimes(1);
  });

  it("should merge aria attributes", () => {
    const props = { "aria-labelledby": { foo: "foo" } };
    const defaultProps = { "aria-labelledby": { bar: "bar" } };
    const result = mergeProps(props, defaultProps);
    expect(result["aria-labelledby"]).toEqual({ bar: "bar", foo: "foo" });
  });

  it("should use last id if both objects have an id", () => {
    const props = { id: "props-id" };
    const defaultProps = { id: "default-id" };
    const result = mergeProps(props, defaultProps);
    expect(result.id).toBe("props-id");
  });
});
