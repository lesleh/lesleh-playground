"use client";

import { useEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "../../_hooks";

const COLS = 10;
const ROWS = 8;

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

// Tetrominoes defined as [row, col] offsets + color index
const PIECES: { cells: [number, number][]; color: number }[] = [
  { cells: [[0, 0], [0, 1], [0, 2], [0, 3]], color: 1 },        // I
  { cells: [[0, 0], [0, 1], [1, 0], [1, 1]], color: 2 },        // O
  { cells: [[0, 1], [1, 0], [1, 1], [1, 2]], color: 3 },        // T
  { cells: [[0, 1], [0, 2], [1, 0], [1, 1]], color: 4 },        // S
  { cells: [[0, 0], [0, 1], [1, 1], [1, 2]], color: 5 },        // Z
  { cells: [[0, 0], [1, 0], [1, 1], [1, 2]], color: 6 },        // J
  { cells: [[0, 2], [1, 0], [1, 1], [1, 2]], color: 7 },        // L
];

function canPlace(
  grid: number[][],
  piece: { cells: [number, number][]; color: number },
  row: number,
  col: number,
): boolean {
  for (const [dr, dc] of piece.cells) {
    const r = row + dr;
    const c = col + dc;
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || grid[r][c] !== 0) {
      return false;
    }
  }
  return true;
}

function dropPiece(
  grid: number[][],
  piece: { cells: [number, number][]; color: number },
  col: number,
): number[][] | null {
  let row = 0;
  while (canPlace(grid, piece, row + 1, col)) {
    row++;
  }
  if (!canPlace(grid, piece, row, col)) return null;

  const next = grid.map((r) => [...r]);
  for (const [dr, dc] of piece.cells) {
    next[row + dr][col + dc] = piece.color;
  }

  // Clear full rows
  for (let r = ROWS - 1; r >= 0; r--) {
    if (next[r].every((c) => c !== 0)) {
      next.splice(r, 1);
      next.unshift(new Array(COLS).fill(0));
    }
  }

  return next;
}

export function TetrisAIPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef);
  const [grid, setGrid] = useState<number[][]>(() =>
    Array.from({ length: ROWS }, () => new Array(COLS).fill(0)),
  );

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setGrid((prev) => {
        // Pick a random piece and column
        const piece = PIECES[Math.floor(Math.random() * PIECES.length)];
        const maxCol =
          COLS - Math.max(...piece.cells.map(([, dc]) => dc)) - 1;
        const col = Math.floor(Math.random() * (maxCol + 1));

        const result = dropPiece(prev, piece, col);
        if (result) return result;

        // Board is too full, reset
        return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-gray-900"
    >
      <div
        className="grid gap-px bg-gray-700 p-1 rounded"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
      >
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
