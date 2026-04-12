"use client";

import { useEffect, useRef, useState } from "react";
import { ROWS, COLS } from "../_lib/game";
import { twMerge } from "tailwind-merge";

interface BoardProps {
  board: Int8Array;
  winningCells: [number, number][] | null;
  lastMove: number | null;
  disabled: boolean;
  onColumnClick: (col: number) => void;
}

interface DroppingPiece {
  row: number;
  col: number;
  key: number;
}

export function Board({ board, winningCells, lastMove, disabled, onColumnClick }: BoardProps) {
  const winSet = new Set(winningCells?.map(([r, c]) => `${r},${c}`) ?? []);
  const [dropping, setDropping] = useState<DroppingPiece | null>(null);
  const prevBoardRef = useRef<Int8Array>(new Int8Array(ROWS * COLS));
  const dropKeyRef = useRef(0);

  useEffect(() => {
    const prev = prevBoardRef.current;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        if (board[idx] !== 0 && prev[idx] === 0) {
          dropKeyRef.current++;
          setDropping({ row: r, col: c, key: dropKeyRef.current });
          const timer = setTimeout(() => setDropping(null), 350);
          prevBoardRef.current = new Int8Array(board);
          return () => clearTimeout(timer);
        }
      }
    }
    prevBoardRef.current = new Int8Array(board);
  }, [board]);

  return (
    <div
      className="grid gap-1 rounded-xl p-3 bg-blue-800 shadow-xl overflow-hidden"
      style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
    >
      {Array.from({ length: ROWS }, (_, r) =>
        Array.from({ length: COLS }, (_, c) => {
          const val = board[r * COLS + c];
          const isWinning = winSet.has(`${r},${c}`);
          const isLastMove = lastMove === c && val !== 0 &&
            (r === ROWS - 1 || board[(r + 1) * COLS + c] !== 0);
          const canClick = !disabled && board[c] === 0;
          const isDropping = dropping && dropping.row === r && dropping.col === c;

          return (
            <div
              key={`${r}-${c}`}
              className={twMerge(
                "flex items-center justify-center w-14 h-14",
                canClick && "cursor-pointer group"
              )}
              onClick={() => canClick && onColumnClick(c)}
            >
              <div
                className={twMerge(
                  "w-11 h-11 rounded-full transition-colors",
                  val === 0 && "bg-blue-950",
                  val === 1 && "bg-red-500 shadow-[inset_0_-3px_6px_rgba(0,0,0,0.2)]",
                  val === -1 && "bg-yellow-400 shadow-[inset_0_-3px_6px_rgba(0,0,0,0.2)]",
                  isWinning && "animate-pulse",
                  isLastMove && "ring-2 ring-white/50 ring-offset-1 ring-offset-blue-800",
                  canClick && val === 0 && "group-hover:bg-white/15",
                  isDropping && "animate-[drop_0.3s_ease-out]",
                )}
                style={isDropping ? {
                  "--drop-from": `${-(r + 1) * 60}px`,
                } as React.CSSProperties : undefined}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
