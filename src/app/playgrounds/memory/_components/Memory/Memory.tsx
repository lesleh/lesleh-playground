"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  DIFFICULTIES,
  PREVIEW_SECONDS,
  buildDeck,
  createInitialState,
  gameReducer,
  type Difficulty,
} from "../../_lib/game";
import { useBestScore } from "../../_lib/useBestScore";
import { Card } from "./Card";

const GRID_CLASS: Record<Difficulty, string> = {
  easy: "grid-cols-3 sm:grid-cols-4",
  medium: "grid-cols-4 sm:grid-cols-5",
  hard: "grid-cols-5 sm:grid-cols-6",
};

const ORDER: Difficulty[] = ["easy", "medium", "hard"];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Memory() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [state, dispatch] = useReducer(
    gameReducer,
    "easy",
    createInitialState,
  );

  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState(PREVIEW_SECONDS);
  const [newBest, setNewBest] = useState(false);
  const { best, saveIfBest } = useBestScore(difficulty);
  const startRef = useRef<number | null>(null);
  const savedRef = useRef(false);

  const started = state.moves > 0 || state.firstPick !== null;
  const { pairs } = DIFFICULTIES[state.difficulty];

  const newGame = useCallback((d: Difficulty) => {
    startRef.current = null;
    savedRef.current = false;
    setElapsed(0);
    setCountdown(PREVIEW_SECONDS);
    setNewBest(false);
    setDifficulty(d);
    dispatch({ type: "NEW_GAME", difficulty: d, cards: buildDeck(d) });
  }, []);

  // Preview: reveal the whole board, count down, then hide it and start play.
  // Re-runs per deal (cards identity changes) so a new game restarts the peek.
  // The countdown itself is reset in newGame (and via initial state on mount).
  useEffect(() => {
    if (state.status !== "preview") return;
    const tick = window.setInterval(
      () => setCountdown((c) => Math.max(0, c - 1)),
      1000,
    );
    const done = window.setTimeout(
      () => dispatch({ type: "START_PLAY" }),
      PREVIEW_SECONDS * 1000,
    );
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(done);
    };
  }, [state.status, state.cards]);

  // Clock: ticks from the first flip until the board is won.
  useEffect(() => {
    if (!started || state.status === "won") return;
    if (startRef.current === null) {
      startRef.current = Date.now() - elapsed * 1000;
    }
    const id = window.setInterval(() => {
      if (startRef.current !== null) {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [started, state.status, elapsed]);

  // Flip a mismatched pair back after a beat so the player can read it.
  useEffect(() => {
    if (state.firstPick !== null && state.secondPick !== null) {
      const id = window.setTimeout(
        () => dispatch({ type: "CLEAR_MISMATCH" }),
        850,
      );
      return () => window.clearTimeout(id);
    }
  }, [state.firstPick, state.secondPick]);

  // Win: fire confetti and record a personal best.
  useEffect(() => {
    if (state.status !== "won" || savedRef.current) return;
    savedRef.current = true;

    const record = saveIfBest({ moves: state.moves, time: elapsed });

    import("canvas-confetti").then(({ default: confetti }) => {
      const burst = (x: number) =>
        confetti({
          particleCount: 90,
          spread: 75,
          startVelocity: 45,
          origin: { x, y: 0.65 },
          colors: ["#000000", "#ef3d2f", "#f7c948", "#fffef5"],
        });
      burst(0.25);
      burst(0.75);
      window.setTimeout(() => burst(0.5), 250);
      setNewBest(record);
    });
  }, [state.status, state.moves, elapsed, saveIfBest]);

  const won = state.status === "won";
  const preview = state.status === "preview";

  return (
    <div
      className="min-h-full"
      style={{
        backgroundColor: "#fffef5",
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)
        `,
        backgroundSize: "32px 32px",
      }}
    >
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-4 h-1 bg-black" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.3em] text-black/50">
                match the pairs
              </p>
              <h1 className="font-roboto-slab text-[clamp(3rem,10vw,5.5rem)] font-black leading-[0.85] tracking-tight text-black">
                Recall
              </h1>
            </div>

            {/* Difficulty selector */}
            <div className="flex w-full overflow-hidden rounded-md border-[3px] border-black sm:w-auto">
              {ORDER.map((d) => {
                const active = difficulty === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => newGame(d)}
                    className={`flex-1 px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors sm:flex-none sm:px-4 ${
                      active
                        ? "bg-black text-[#fffef5]"
                        : "bg-transparent text-black hover:bg-black/10"
                    } ${d !== "easy" ? "border-l-[3px] border-black" : ""}`}
                  >
                    {DIFFICULTIES[d].label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Stat bar */}
        <div className="mb-6 grid grid-cols-3 gap-px overflow-hidden rounded-md border-[3px] border-black bg-black">
          <Stat label="Moves" value={String(state.moves)} />
          <Stat label="Time" value={formatTime(elapsed)} />
          <Stat label="Pairs" value={`${state.matched} / ${pairs}`} />
        </div>

        {/* Status strip: always present so the board never jumps between
            phases. Bold black bar while memorising, a calm hint during play. */}
        <div
          className={`mb-6 flex items-center justify-between gap-3 rounded-md border-[3px] border-black px-4 py-3 transition-colors ${
            preview ? "bg-black text-[#fffef5]" : "bg-[#fffef5] text-black"
          }`}
          style={preview ? { animation: "matchpop 0.35s ease-out" } : undefined}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.3em]">
            {preview
              ? "memorise the board"
              : won
                ? "board cleared"
                : "find the pairs"}
          </p>
          <p className="font-roboto-slab text-2xl font-black leading-none tabular-nums">
            {preview ? `${countdown}s` : won ? "done" : `${pairs - state.matched} left`}
          </p>
        </div>

        {/* Board */}
        <div className="relative">
          <div
            className={`grid gap-2 sm:gap-3 ${GRID_CLASS[state.difficulty]} ${
              won ? "pointer-events-none" : ""
            }`}
          >
            {state.cards.map((card, i) => (
              <div
                key={card.id}
                style={{
                  animation: "deal-in 0.4s ease-out both",
                  animationDelay: `${Math.min(i * 25, 500)}ms`,
                }}
              >
                <Card
                  card={card}
                  disabled={state.locked}
                  preview={preview}
                  onFlip={(id) => dispatch({ type: "FLIP", id })}
                />
              </div>
            ))}
          </div>

          {/* Win overlay */}
          {won && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
              <div
                className="w-full max-w-sm rounded-lg border-[3px] border-black bg-[#fffef5] p-6 text-center shadow-[8px_8px_0_rgba(0,0,0,1)]"
                style={{ animation: "matchpop 0.35s ease-out" }}
              >
                <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.3em] text-[#ef3d2f]">
                  cleared
                </p>
                <h2 className="mb-3 font-roboto-slab text-4xl font-black leading-none text-black">
                  Total Recall
                </h2>
                <p className="mb-4 font-mono text-sm text-black/70">
                  {state.moves} moves · {formatTime(elapsed)}
                  {newBest && (
                    <span className="ml-1 text-[#ef3d2f]">· new best!</span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => newGame(state.difficulty)}
                  className="w-full rounded-md border-[3px] border-black bg-black px-4 py-3 font-mono text-xs uppercase tracking-widest text-[#fffef5] transition-transform hover:-translate-y-0.5"
                >
                  Play again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => newGame(state.difficulty)}
            className="rounded-md border-[3px] border-black bg-transparent px-4 py-2 font-mono text-xs uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-[#fffef5]"
          >
            New deal
          </button>
          <p className="font-mono text-[11px] uppercase tracking-widest text-black/50">
            {best ? `best: ${best.moves} moves · ${formatTime(best.time)}` : "no record yet"}
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#fffef5] px-3 py-3 text-center sm:py-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-black/50">
        {label}
      </div>
      <div className="font-roboto-slab text-2xl font-black leading-tight text-black sm:text-3xl">
        {value}
      </div>
    </div>
  );
}
