"use client";

import { useEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "../../_hooks";

// The demo staggers a Markdown article's elements into view (the flagship post
// asks "Is Magenta a Real Colour?"). Hint at a heading + body fading/rising in.
const MAGENTA = "#d6006e";

export function AnimatePreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const id = setInterval(() => setPhase((p) => p + 1), 2400);
    return () => clearInterval(id);
  }, [isVisible]);

  // Faded in on even phases; resets between so the reveal loops.
  const shown = isVisible && phase % 2 === 0;

  const reveal = (i: number) => ({
    opacity: shown ? 1 : 0,
    transform: shown ? "translateY(0)" : "translateY(6px)",
    transition: "opacity 500ms ease, transform 500ms ease",
    transitionDelay: `${i * 150}ms`,
  });

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full flex-col justify-center gap-2.5 bg-white px-6"
    >
      <div
        className="h-4 w-3/4 rounded"
        style={{ backgroundColor: MAGENTA, ...reveal(0) }}
      />
      <div className="h-2.5 w-full rounded bg-black/15" style={reveal(1)} />
      <div className="h-2.5 w-11/12 rounded bg-black/15" style={reveal(2)} />
      <div className="flex items-center gap-2" style={reveal(3)}>
        <div
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: MAGENTA }}
        />
        <div className="h-2.5 w-2/3 rounded bg-black/15" />
      </div>
    </div>
  );
}
