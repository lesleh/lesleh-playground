"use client";

import { useRef } from "react";
import { useIntersectionObserver } from "../../_hooks";

// 3x5 pixel-art digits. Their frames sit red (wrong), then flip to mint one by
// one: the plateau, then the jump. Animates only while the card is on screen.
const GLYPHS: Record<number, string[]> = {
  0: ["###", "#.#", "#.#", "#.#", "###"],
  2: ["###", "..#", "###", "#..", "###"],
  3: ["###", "..#", "###", "..#", "###"],
  4: ["#.#", "#.#", "###", "..#", "..#"],
  5: ["###", "#..", "###", "..#", "###"],
  7: ["###", "..#", ".#.", ".#.", ".#."],
  8: ["###", "#.#", "###", "#.#", "###"],
  9: ["###", "#.#", "###", "..#", "###"],
};
const DIGITS = [7, 2, 0, 4, 9, 5, 3, 8];
const PX = 6;

export function GrokkingDigitsPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef);

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center bg-[#0d0d0d]">
      <svg viewBox="0 0 200 140" className="h-full w-full">
        {DIGITS.map((d, k) => {
          const x = 14 + (k % 4) * 46;
          const y = 16 + Math.floor(k / 4) * 58;
          // Flip moments spread over the second half of the loop.
          const flip = (0.45 + k * 0.05).toFixed(2);
          return (
            <g key={k} transform={`translate(${x} ${y})`}>
              <rect x={0} y={0} width={34} height={46} fill="none" strokeWidth={2} stroke="#46e0ad">
                {isVisible && (
                  <animate
                    attributeName="stroke"
                    values="#ff6a5c;#ff6a5c;#46e0ad;#46e0ad"
                    keyTimes={`0;${flip};${(Number(flip) + 0.02).toFixed(2)};1`}
                    dur="6s"
                    repeatCount="indefinite"
                  />
                )}
              </rect>
              {GLYPHS[d].flatMap((row, r) =>
                [...row].map((ch, c) =>
                  ch === "#" ? (
                    <rect key={`${r}-${c}`} x={8 + c * PX} y={8 + r * PX} width={PX} height={PX} fill="#e6edf3" />
                  ) : null,
                ),
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
