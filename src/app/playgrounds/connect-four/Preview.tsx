"use client";

import { useEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "../../_hooks";

const ROWS = 6;
const COLS = 7;

export function ConnectFourPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef);
  const [board, setBoard] = useState<number[][]>(() =>
    Array(ROWS).fill(null).map(() => Array(COLS).fill(0))
  );

  useEffect(() => {
    if (!isVisible) return;

    let col = 3;
    let player = 1;
    let moveCount = 0;

    const interval = setInterval(() => {
      setBoard((prev) => {
        const next = prev.map((r) => [...r]);
        // Find lowest empty row in column
        for (let r = ROWS - 1; r >= 0; r--) {
          if (next[r][col] === 0) {
            next[r][col] = player;
            break;
          }
        }
        return next;
      });

      player = player === 1 ? -1 : 1;
      col = (col + (moveCount % 2 === 0 ? 1 : -2) + COLS) % COLS;
      moveCount++;

      if (moveCount >= 12) {
        moveCount = 0;
        col = 3;
        player = 1;
        setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(0)));
      }
    }, 600);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-slate-900"
    >
      <div className="grid grid-cols-7 gap-0.5 p-2 bg-blue-800 rounded-lg">
        {board.flat().map((val, i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full transition-colors duration-300 ${
              val === 1 ? "bg-red-500" : val === -1 ? "bg-yellow-400" : "bg-blue-950"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
