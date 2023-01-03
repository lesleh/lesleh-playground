import { useWindowEvent } from "./useWindowEvent";

export function useOnWindowResize(
  listener: (this: Window, ev: UIEvent) => any,
  options?: boolean | AddEventListenerOptions
) {
  const realOptions =
    typeof options === "boolean" ? { capture: options } : options;
  useWindowEvent("resize", listener, { ...realOptions, passive: true });
}
