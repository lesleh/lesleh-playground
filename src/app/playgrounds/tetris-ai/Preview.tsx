"use client";

import { useEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "../../_hooks";

const COLS = 10;
const ROWS = 8; // Smaller preview

const COLORS = [
  "bg-gray-800",
  "bg-cyan-400",
  "bg-yellow-400",
  "bg-purple-500",
  "bg-green-500",
  "bg-red-500",
  "bg-blue-500",
  "bg-orange-400",
];

export function TetrisAIPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef);
  const [grid, setGrid] = useState<number[][]>(() =>
    Array.from({ length: ROWS }, () => new Array(COLS).fill(0))
  );

  useEffect(() => {
    if (!isVisible) return;

    let step = 0;
    const interval = setInterval(() => {
      setGrid((prev) => {
        const next = prev.map((r) => [...r]);

        // Fill bottom row gradually, then clear
        const row = ROWS - 1 - Math.floor(step / COLS) % ROWS;
        const col = step % COLS;

        if (row >= 0 && row < ROWS) {
          next[row][col] = (step % 7) + 1;
        }

        // Clear full rows
        for (let r = 0; r < ROWS; r++) {
          if (next[r].every((c) => c !== 0)) {
            next.splice(r, 1);
            next.unshift(new Array(COLS).fill(0));
          }
        }

        step++;
        if (step >= ROWS * COLS) {
          step = 0;
          return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
        }

        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-gray-900"
    >
      <div className="grid gap-px bg-gray-700 p-1 rounded" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {grid.flat().map((cell, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm transition-colors duration-150 ${COLORS[cell]}`}
          />
        ))}
      </div>
    </div>
  );
}
