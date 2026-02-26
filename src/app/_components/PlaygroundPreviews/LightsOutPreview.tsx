"use client";

import { useEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "../../_hooks";

export function LightsOutPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef);
  const [grid, setGrid] = useState<boolean[][]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Initialize 3x3 grid
    const initialGrid = Array(3)
      .fill(null)
      .map(() => Array(3).fill(false));
    setGrid(initialGrid);
  }, []);

  useEffect(() => {
    if (!isVisible || grid.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    let row = 0;
    let col = 0;

    intervalRef.current = setInterval(() => {
      setGrid((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = !next[row][col];

        col++;
        if (col >= 3) {
          col = 0;
          row = (row + 1) % 3;
        }

        return next;
      });
    }, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isVisible, grid.length]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-gray-900"
    >
      <div className="grid grid-cols-3 gap-2 p-4">
        {grid.map((row, i) =>
          row.map((isOn, j) => (
            <div
              key={`${i}-${j}`}
              className={`w-12 h-12 rounded transition-colors duration-300 ${
                isOn ? "bg-yellow-400" : "bg-gray-700"
              }`}
            />
          ))
        )}
      </div>
    </div>
  );
}
