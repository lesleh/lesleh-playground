"use client";

import { useEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "../../_hooks";

// The demo slides paragraphs in from the left as they scroll into view. Hint
// at that with text-like bars that repeatedly slide-and-fade in, staggered.
const LINES = ["88%", "72%", "94%", "64%"];

export function MotionPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const id = setInterval(() => setPhase((p) => p + 1), 2000);
    return () => clearInterval(id);
  }, [isVisible]);

  // Slid-in on even phases; resets between so the reveal loops.
  const shown = isVisible && phase % 2 === 0;

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full flex-col justify-center gap-3 bg-white px-6"
    >
      {LINES.map((width, i) => (
        <div
          key={i}
          className="h-3 rounded-full bg-black/80 transition-all duration-500 ease-out"
          style={{
            width,
            opacity: shown ? 1 : 0,
            transform: shown ? "translateX(0)" : "translateX(-16%)",
            transitionDelay: `${i * 110}ms`,
          }}
        />
      ))}
    </div>
  );
}
