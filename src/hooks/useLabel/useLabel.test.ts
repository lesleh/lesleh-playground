/**
 * @jest-environment @happy-dom/jest-environment
 */

import { renderHook } from "@testing-library/react";
import { useLabel } from "./useLabel";

describe("useLabel", () => {
  it("should run without crashing", () => {
    renderHook(() => useLabel({ label: "test" }));
  });

  it("should warn if no label or aria-label or aria-labelledby is provided", () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    renderHook(() => useLabel({}));
    expect(console.warn).toHaveBeenCalled();
  });

  it("should return labelProps and fieldProps", () => {
    const { result } = renderHook(() => useLabel({ label: "test" }));
    expect(result.current).toHaveProperty("labelProps");
    expect(result.current).toHaveProperty("fieldProps");
  });

  it("should pass through the provided id", () => {
    const { result } = renderHook(() =>
      useLabel({ id: "test", label: "test" })
    );
    expect(result.current.fieldProps.id).toBe("test");
  });

  it("should generate an id if none is provided", () => {
    const { result } = renderHook(() => useLabel({ label: "test" }));
    expect(result.current.fieldProps.id).toBeDefined();
  });

  it("should pass through the provided aria-label", () => {
    const { result } = renderHook(() =>
      useLabel({ "aria-label": "test", label: "test" })
    );
    expect(result.current.fieldProps["aria-label"]).toBe("test");
  });

  it("should pass through the provided aria-labelledby", () => {
    const { result } = renderHook(() =>
      useLabel({ "aria-labelledby": "test", label: "test" })
    );
    expect(
      result.current.fieldProps["aria-labelledby"]
      // @ts-ignore custom matchers aren't working
    ).toContainSpaceSeparatedValue("test");
  });

  it("should combine the provided aria-labelledby with the generated label id", () => {
    const { result } = renderHook(() =>
      useLabel({ "aria-labelledby": "test", label: "test" })
    );
    expect(
      result.current.fieldProps["aria-labelledby"]
      // @ts-ignore custom matchers aren't working
    ).toContainSpaceSeparatedValue(result.current.labelProps.id);
  });

  it("should return labelProps with htmlFor if labelElementType is label", () => {
    const { result } = renderHook(() =>
      useLabel({ label: "test", labelElementType: "label" })
    );
    expect(result.current.labelProps.htmlFor).toBe(
      result.current.fieldProps.id
    );
  });

  it("should return labelProps with no htmlFor if labelElementType is span", () => {
    const { result } = renderHook(() =>
      useLabel({ label: "test", labelElementType: "span" })
    );
    console.log(result.current.labelProps);

    expect(result.current.labelProps.htmlFor).toBeUndefined();
  });
});
