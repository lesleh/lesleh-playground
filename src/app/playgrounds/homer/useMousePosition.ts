import { useState } from "react";
import { useOnWindowResize } from "./useOnWindowResize";
import { useWindowEvent } from "./useWindowEvent";

export function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useWindowEvent("mousemove", (event) => {
    setPosition({ x: event.clientX, y: event.clientY });
  });

  return position;
}
