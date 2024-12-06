import { useState, useLayoutEffect } from "react";

export function useClientBoundingRect<T extends HTMLElement>(
  ref: React.RefObject<T>
): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    function updateRect() {
      if (ref.current) {
        setRect(ref.current.getBoundingClientRect());
      }
    }
    updateRect();

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
    };
  }, [ref]);

  return rect;
}
