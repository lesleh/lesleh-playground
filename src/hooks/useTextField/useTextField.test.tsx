/**
 * @jest-environment @happy-dom/jest-environment
 */

import { render, renderHook, screen } from "@testing-library/react";
import { useTextField } from "./useTextField";

describe("useTextField", () => {
  it("should run without crashing", () => {
    const { result } = renderHook(() => useTextField({ label: "test" }));
    expect(result.current).toHaveProperty("labelProps");
    expect(result.current).toHaveProperty("inputProps");
  });

  describe("uncontrolled value", () => {
    const WrapperComponent = () => {
      const { inputProps } = useTextField({ label: "test" });
      return <input {...inputProps} />;
    };

    it("should set the value to the default value", () => {
      render(<WrapperComponent />);

      expect(screen.getByLabelText("test")).toHaveValue("");
    });
    it.todo(
      "should set the value to the default value on the next render if the initial value is undefined"
    );
    it.todo("should not update the value if the initial value is defined");
  });
});
