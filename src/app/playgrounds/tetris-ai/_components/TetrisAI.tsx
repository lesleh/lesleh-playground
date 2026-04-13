"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TetrisGame } from "../_lib/tetris";
import { loadModel, scorePlacements, isLoaded } from "../_lib/model";
import { Board, PIECE_COLORS } from "./Board";
import { Heading } from "../../../../components/Heading";

const PIECE_NAMES = ["I", "O", "T", "S", "Z", "J", "L"];

const SPEED_OPTIONS = [
  { label: "Slow", value: 500 },
  { label: "Normal", value: 200 },
  { label: "Fast", value: 50 },
  { label: "Instant", value: 0 },
];

export function TetrisAI() {
  const [game, setGame] = useState<TetrisGame | null>(null);
  const [board, setBoard] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(200);
  const [stats, setStats] = useState({ pieces: 0, lines: 0, score: 0 });
  const gameRef = useRef<TetrisGame | null>(null);
  const runningRef = useRef(false);
  const speedRef = useRef(speed);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    loadModel()
      .then(() => setLoading(false))
      .catch((err) => {
        console.error("Failed to load model:", err);
        setLoading(false);
      });
  }, []);

  const step = useCallback(async () => {
    const g = gameRef.current;
    if (!g || g.gameOver) return false;

    const placements = g.getValidPlacements();
    if (placements.length === 0) return false;

    const features = placements.map((p) => p.features);
    const scores = await scorePlacements(features);

    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < scores.length; i++) {
      if (scores[i] > bestScore) {
        bestScore = scores[i];
        bestIdx = i;
      }
    }

    g.executePlacement(placements[bestIdx]);
    setBoard(g.board.map((r) => [...r]));
    setStats({ pieces: g.piecesPlaced, lines: g.linesCleared, score: g.score });

    return !g.gameOver;
  }, []);

  const runGame = useCallback(async () => {
    const g = new TetrisGame();
    gameRef.current = g;
    setGame(g);
    setBoard(g.board.map((r) => [...r]));
    setStats({ pieces: 0, lines: 0, score: 0 });
    setRunning(true);
    runningRef.current = true;

    while (runningRef.current) {
      const alive = await step();
      if (!alive) break;
      if (speedRef.current > 0) {
        await new Promise((r) => setTimeout(r, speedRef.current));
      }
    }

    setRunning(false);
    runningRef.current = false;
  }, [step]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
  }, []);

  const nextPieceGrid = game
    ? TETROMINOES[game.nextPiece][0]
    : null;

  return (
    <div className="flex flex-col items-center pt-4 pb-6">
      <Heading level={1} className="my-0 mb-4">Tetris AI</Heading>

      {loading ? (
        <p className="text-lg">Loading AI model...</p>
      ) : (
        <>
          <div className="flex gap-8 items-start">
            <Board board={board.length ? board : Array.from({ length: 20 }, () => new Array(10).fill(0))} />

            <div className="flex flex-col gap-4 min-w-32">
              <div>
                <p className="text-sm text-gray-500 font-mono">Next</p>
                <div className="grid gap-px mt-1 w-[84px] h-[84px]" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                  {Array.from({ length: 16 }, (_, i) => {
                    const r = Math.floor(i / 4);
                    const c = i % 4;
                    const filled = nextPieceGrid && r < nextPieceGrid.length && c < nextPieceGrid[0].length && nextPieceGrid[r][c];
                    const colorIdx = game ? game.nextPiece + 1 : 0;
                    return (
                      <div
                        key={i}
                        className={`w-5 h-5 rounded-sm ${filled ? PIECE_COLORS[colorIdx] : "bg-transparent"}`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="font-mono text-sm space-y-1">
                <p>Pieces: {stats.pieces}</p>
                <p>Lines: {stats.lines}</p>
                <p>Score: {stats.score}</p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-sm text-gray-500 font-mono">Speed</p>
                {SPEED_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`px-3 py-1 text-sm rounded border transition-colors ${
                      speed === opt.value
                        ? "bg-gray-700 border-gray-500 text-white"
                        : "border-gray-600 text-gray-400 hover:bg-gray-800"
                    }`}
                    onClick={() => setSpeed(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {!running ? (
                <button
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium transition-colors"
                  onClick={runGame}
                  disabled={!isLoaded()}
                >
                  {game?.gameOver ? "New Game" : "Start"}
                </button>
              ) : (
                <button
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
                  onClick={stop}
                >
                  Stop
                </button>
              )}
            </div>
          </div>

          {game?.gameOver && (
            <p className="mt-4 text-lg font-bold">
              Game Over! {stats.lines} lines cleared in {stats.pieces} pieces
            </p>
          )}
        </>
      )}
    </div>
  );
}
