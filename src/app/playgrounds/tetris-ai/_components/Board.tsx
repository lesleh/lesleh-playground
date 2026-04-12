"use client";

import { ROWS, COLS } from "../_lib/tetris";

export const PIECE_COLORS: Record<number, string> = {
  0: "bg-gray-800",
  1: "bg-cyan-400",    // I
  2: "bg-yellow-400",  // O
  3: "bg-purple-500",  // T
  4: "bg-green-500",   // S
  5: "bg-red-500",     // Z
  6: "bg-blue-500",    // J
  7: "bg-orange-400",  // L
};

interface BoardProps {
  board: number[][];
  clearingRows?: Set<number>;
}

export function Board({ board, clearingRows }: BoardProps) {
  return (
    <div className="grid gap-px bg-gray-700 p-1 rounded-lg" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
      {board.flatMap((row, r) =>
        row.map((cell, c) => {
          const isClearing = clearingRows?.has(r);
          return (
            <div
              key={`${r}-${c}`}
              className={`w-6 h-6 rounded-sm transition-all duration-150 ${
                PIECE_COLORS[cell] || PIECE_COLORS[0]
              } ${isClearing ? "animate-pulse brightness-150" : ""}`}
            />
          );
        })
      )}
    </div>
  );
}
