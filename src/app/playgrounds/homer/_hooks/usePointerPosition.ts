import { useEffect, useState } from "react";

export interface PointerPosition {
  x: number;
  y: number;
}

// Tracks the mouse or the active touch point. Returns null until the first
// input arrives, so the caller can show a sensible default (e.g. eyes looking
// straight ahead) rather than pinning to the top-left on touch devices where
// no mousemove ever fires. Touch moves are captured non-passively so we can
// suppress the page scrolling while dragging.
export function usePointerPosition(): PointerPosition | null {
  const [position, setPosition] = useState<PointerPosition | null>(null);

  useEffect(() => {
    const handleMouse = (event: MouseEvent) => {
      setPosition({ x: event.clientX, y: event.clientY });
    };

    const handleTouch = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      setPosition({ x: touch.clientX, y: touch.clientY });
      event.preventDefault(); // keep the page from scrolling while dragging
    };

    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("touchstart", handleTouch, { passive: false });
    window.addEventListener("touchmove", handleTouch, { passive: false });

    return () => {
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("touchstart", handleTouch);
      window.removeEventListener("touchmove", handleTouch);
    };
  }, []);

  return position;
}
