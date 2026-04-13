"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Connect4, COLS } from "../_lib/game";
import { mctsSearch } from "../_lib/mcts";
import { loadModel, isLoaded, predict } from "../_lib/model";
import { Board } from "./Board";
import { Heading } from "../../../../components/Heading";

type GameResult = "win" | "loss" | "draw" | null;

const SIM_OPTIONS = [
  { label: "Beginner", value: 0 },
  { label: "Easy", value: -1 },
  { label: "Medium", value: 20 },
  { label: "Hard", value: 50 },
] as const;

export function ConnectFour() {
  const [game, setGame] = useState(() => new Connect4());
  const [thinking, setThinking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<GameResult>(null);
  const [humanPlayer, setHumanPlayer] = useState<1 | -1>(1);
  const [numSims, setNumSims] = useState(20);
  const [visits, setVisits] = useState<Float32Array | null>(null);

  useEffect(() => {
    loadModel()
      .then(() => setLoading(false))
      .catch((err) => {
        console.error("Failed to load model:", err);
        setLoading(false);
      });
  }, []);

  const checkResult = useCallback(
    (g: Connect4): GameResult => {
      if (!g.isTerminal()) return null;
      const w = g.winner();
      if (w === null) return "draw";
      return w === humanPlayer ? "win" : "loss";
    },
    [humanPlayer]
  );

  const aiMove = useCallback(
    async (g: Connect4) => {
      setThinking(true);
      await new Promise((r) => setTimeout(r, 10));

      let bestCol: number;
      if (numSims <= 0) {
        const { policy } = await predict(g.encode());
        const legal = g.legalMoves();
        const masked = new Float32Array(COLS);
        for (const c of legal) masked[c] = policy[c];
        setVisits(masked);
        if (numSims === 0 && Math.random() < 0.4) {
          bestCol = legal[Math.floor(Math.random() * legal.length)];
        } else {
          bestCol = legal[0];
          let bestProb = 0;
          for (const c of legal) {
            if (masked[c] > bestProb) {
              bestProb = masked[c];
              bestCol = c;
            }
          }
        }
      } else {
        const { visits: v } = await mctsSearch(g, numSims);
        setVisits(v);
        bestCol = 0;
        let bestVisits = 0;
        for (let c = 0; c < COLS; c++) {
          if (v[c] > bestVisits) {
            bestVisits = v[c];
            bestCol = c;
          }
        }
      }

      const next = g.copy();
      next.play(bestCol);
      setGame(next);
      setThinking(false);

      const r = checkResult(next);
      if (r) setResult(r);
      return next;
    },
    [numSims, checkResult]
  );

  useEffect(() => {
    if (!loading && isLoaded() && game.currentPlayer !== humanPlayer && !result && !thinking) {
      aiMove(game);
    }
  }, [loading, game, humanPlayer, result, thinking, aiMove]);

  const handleColumnClick = useCallback(
    async (col: number) => {
      if (thinking || result || loading) return;
      if (game.currentPlayer !== humanPlayer) return;
      if (game.board[col] !== 0) return;

      const next = game.copy();
      next.play(col);
      setGame(next);
      setVisits(null);

      const r = checkResult(next);
      if (r) {
        setResult(r);
        return;
      }

      aiMove(next);
    },
    [game, humanPlayer, thinking, result, loading, checkResult, aiMove]
  );

  const newGame = useCallback(
    (player: 1 | -1) => {
      setHumanPlayer(player);
      setGame(new Connect4());
      setResult(null);
      setVisits(null);
      setThinking(false);
    },
    []
  );

  const winningCells = game.winningCells();
  const totalVisits = visits ? Array.from(visits).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="flex flex-col items-center pt-4 pb-6 bg-slate-900 text-slate-200">
      <Heading level={1} className="text-white my-0 mb-4">Connect 4</Heading>

      {loading ? (
        <p className="text-lg">Loading AI model...</p>
      ) : (
        <>
          <p className="text-lg mb-4 min-h-7">
            {result === "win" && "You win!"}
            {result === "loss" && "AI wins!"}
            {result === "draw" && "Draw!"}
            {!result && thinking && "AI is thinking..."}
            {!result && !thinking && `Your turn (${humanPlayer === 1 ? "Red" : "Yellow"})`}
          </p>

          <Board
            board={game.board}
            winningCells={winningCells}
            lastMove={game.lastMove}
            disabled={thinking || result !== null || game.currentPlayer !== humanPlayer}
            onColumnClick={handleColumnClick}
          />

          {visits && totalVisits > 0 && (
            <div
              className="grid gap-1 h-14 mt-3"
              style={{ gridTemplateColumns: `repeat(${COLS}, 3.5rem)` }}
            >
              {Array.from(visits).map((v, i) => (
                <div key={i} className="flex flex-col items-center justify-end">
                  <div
                    className="w-8 rounded-t bg-white/20 transition-all duration-300"
                    style={{ height: `${(v / totalVisits) * 100}%`, minHeight: v > 0 ? 2 : 0 }}
                  />
                  <span className="text-xs text-white/40 mt-0.5">
                    {v > 0 ? Math.round((v / totalVisits) * 100) : ""}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/50">Difficulty:</span>
              {SIM_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    numSims === opt.value
                      ? "bg-blue-800 border-blue-500"
                      : "border-white/20 hover:bg-white/10"
                  }`}
                  onClick={() => setNumSims(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                className="px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-sm"
                onClick={() => newGame(1)}
              >
                New Game (Play Red)
              </button>
              <button
                className="px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-sm"
                onClick={() => newGame(-1)}
              >
                New Game (Play Yellow)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
