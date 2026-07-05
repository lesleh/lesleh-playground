"use client";

import { useRef } from "react";
import { useIntersectionObserver } from "../../_hooks";

// An elliptical track with a handful of cars looping around via SVG motion.
// Cars only animate while the card is on screen.
const ELLIPSE =
  "M 22,70 a 78,48 0 1,0 156,0 a 78,48 0 1,0 -156,0";

const CARS = [
  { color: "#38bdf8", begin: "0s" },
  { color: "#38bdf8", begin: "-1.6s" },
  { color: "#38bdf8", begin: "-3.1s" },
  { color: "#f7c948", begin: "-4.4s" },
];

export function NeuroevolutionPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef);

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center bg-[#0d0d0d]"
    >
      <svg viewBox="0 0 200 140" className="h-full w-full">
        {/* road band */}
        <path d={ELLIPSE} fill="none" stroke="#191920" strokeWidth={20} />
        <path d={ELLIPSE} fill="none" stroke="#4b5563" strokeWidth={1.5} />
        {/* start gate */}
        <line x1="22" y1="60" x2="22" y2="80" stroke="#34d399" strokeWidth={2.5} />

        {CARS.map((car, i) => (
          <g key={i}>
            <polygon points="0,-3 7,0 0,3" fill={car.color} />
            {isVisible && (
              <animateMotion
                dur="5s"
                begin={car.begin}
                repeatCount="indefinite"
                rotate="auto"
                path={ELLIPSE}
              />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
