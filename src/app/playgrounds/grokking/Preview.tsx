"use client";

import { useId, useRef } from "react";
import { useIntersectionObserver } from "../../_hooks";

// The classic grokking plot: train accuracy shoots up, unseen accuracy sits at
// zero, then jumps. The traces draw in on a loop while the card is on screen.
const TRAIN = "M 16 112 C 30 112, 36 30, 52 26 L 188 26";
const TEST = "M 16 112 L 120 111 C 134 110, 140 30, 156 26 L 188 26";

export function GrokkingPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef);

  // Both traces sit under one clip rect that sweeps left to right, so they
  // advance in lockstep along the step axis.
  const clipId = `grok-sweep-${useId().replace(/:/g, "")}`;

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center bg-[#0d0d0d]">
      <svg viewBox="0 0 200 140" className="h-full w-full">
        <defs>
          <clipPath id={clipId}>
            <rect x={10} y={0} width={isVisible ? 0 : 184} height={140}>
              {isVisible && (
                <animate
                  attributeName="width"
                  values="0;184;184"
                  keyTimes="0;0.6;1"
                  dur="4s"
                  repeatCount="indefinite"
                />
              )}
            </rect>
          </clipPath>
        </defs>
        {[26, 54, 83, 112].map((y) => (
          <line key={y} x1={16} x2={188} y1={y} y2={y} stroke="#1f2833" strokeWidth={1} />
        ))}
        <g clipPath={`url(#${clipId})`}>
          <path d={TRAIN} fill="none" stroke="#f7c948" strokeWidth={3} strokeLinecap="round" />
          <path d={TEST} fill="none" stroke="#46e0ad" strokeWidth={3} strokeLinecap="round" />
        </g>
        <text x={120} y={128} fill="#46e0ad" fontSize={9} fontFamily="monospace">
          (a + b) mod p
        </text>
      </svg>
    </div>
  );
}
