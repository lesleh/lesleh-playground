"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GAME_MS,
  GAME_SECONDS,
  HOLES,
  moleLifetime,
  multiplier,
  pickHole,
  spawnInterval,
} from "../../_lib/game";
import { createSounds, type Sounds } from "../../_lib/audio";
import { useHighScore } from "../../_lib/useHighScore";
import { Mole } from "./Mole";

type Status = "idle" | "playing" | "over";
type Phase = "up" | "hit";
type Hole = { id: number; phase: Phase } | null;
type Float = { id: number; idx: number; points: number };

// How long a bonked mole shows its dazed face before dropping.
const HIT_MS = 350;
// A breather after the round ends before "Play again" accepts a tap, so a
// stray whack landing on the overlay doesn't instantly restart.
const RESTART_LOCK_MS = 900;

const emptyBoard = (): Hole[] => Array.from({ length: HOLES }, () => null);
const INDICES = Array.from({ length: HOLES }, (_, i) => i);

export function WhackAMole() {
  const [status, setStatus] = useState<Status>("idle");
  const [holes, setHoles] = useState<Hole[]>(emptyBoard);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [floats, setFloats] = useState<Float[]>([]);
  const [newHigh, setNewHigh] = useState(false);
  const [canRestart, setCanRestart] = useState(true);
  const [muted, setMuted] = useState(false);
  const [summary, setSummary] = useState({
    hits: 0,
    accuracy: 100,
    bestStreak: 0,
  });
  const { high, saveIfHigh } = useHighScore();

  // The board is driven imperatively by timers, so we keep a ref mirror as the
  // source of truth and push it into state purely for rendering. Scheduling
  // timeouts inside a setState updater would double-fire under StrictMode.
  const holesRef = useRef<Hole[]>(emptyBoard());
  const statusRef = useRef<Status>("idle");
  const mutedRef = useRef(false);
  const startRef = useRef<number | null>(null);
  const idRef = useRef(0);
  const floatIdRef = useRef(0);

  // Live tallies read by timer callbacks and the end screen.
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const bestStreakRef = useRef(0);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);

  const spawnRef = useRef<number | null>(null);
  const clockRef = useRef<number | null>(null);
  const restartRef = useRef<number | null>(null);
  const hideRef = useRef(new Map<number, number>());
  const bonkRef = useRef(new Map<number, number>());
  const floatTimersRef = useRef(new Set<number>());
  const soundsRef = useRef<Sounds | null>(null);

  const commit = useCallback((idx: number, value: Hole) => {
    const next = holesRef.current.slice();
    next[idx] = value;
    holesRef.current = next;
    setHoles(next);
  }, []);

  const clearAllTimers = useCallback(() => {
    if (spawnRef.current !== null) window.clearTimeout(spawnRef.current);
    if (clockRef.current !== null) window.clearInterval(clockRef.current);
    if (restartRef.current !== null) window.clearTimeout(restartRef.current);
    spawnRef.current = null;
    clockRef.current = null;
    restartRef.current = null;
    hideRef.current.forEach((t) => window.clearTimeout(t));
    bonkRef.current.forEach((t) => window.clearTimeout(t));
    floatTimersRef.current.forEach((t) => window.clearTimeout(t));
    hideRef.current.clear();
    bonkRef.current.clear();
    floatTimersRef.current.clear();
  }, []);

  const elapsed = useCallback(
    () => (startRef.current === null ? 0 : Date.now() - startRef.current),
    [],
  );

  const popMole = useCallback(() => {
    if (statusRef.current !== "playing") return;
    const occupied = holesRef.current.map((h) => h !== null);
    const idx = pickHole(occupied);
    if (idx === -1) return;

    const id = ++idRef.current;
    commit(idx, { id, phase: "up" });

    // Duck back on its own if it isn't whacked in time (a miss: resets streak).
    hideRef.current.set(
      idx,
      window.setTimeout(() => {
        hideRef.current.delete(idx);
        const current = holesRef.current[idx];
        if (current && current.id === id) {
          commit(idx, null);
          comboRef.current = 0;
          setCombo(0);
          missesRef.current += 1;
          if (!mutedRef.current) soundsRef.current?.miss();
        }
      }, moleLifetime(elapsed())),
    );
  }, [commit, elapsed]);

  const scheduleSpawn = useCallback(() => {
    // Self-scheduling loop: each spawn queues the next at the current tempo,
    // which tightens as the round wears on.
    const loop = () => {
      spawnRef.current = window.setTimeout(() => {
        if (statusRef.current !== "playing") return;
        popMole();
        loop();
      }, spawnInterval(elapsed()));
    };
    loop();
  }, [popMole, elapsed]);

  const endGame = useCallback(() => {
    if (statusRef.current !== "playing") return;
    clearAllTimers();
    holesRef.current = emptyBoard();
    setHoles(holesRef.current);
    setFloats([]);
    statusRef.current = "over";
    setStatus("over");
    setTimeLeft(0);
    const shots = hitsRef.current + missesRef.current;
    setSummary({
      hits: hitsRef.current,
      accuracy: shots === 0 ? 100 : Math.round((hitsRef.current / shots) * 100),
      bestStreak: bestStreakRef.current,
    });
    setNewHigh(saveIfHigh(scoreRef.current));
    // Lock the "Play again" button briefly against end-of-round mashing.
    setCanRestart(false);
    restartRef.current = window.setTimeout(
      () => setCanRestart(true),
      RESTART_LOCK_MS,
    );
  }, [clearAllTimers, saveIfHigh]);

  const whack = useCallback(
    (idx: number) => {
      if (statusRef.current !== "playing") return;
      const hole = holesRef.current[idx];
      if (!hole || hole.phase !== "up") return;

      const hideTimer = hideRef.current.get(idx);
      if (hideTimer !== undefined) {
        window.clearTimeout(hideTimer);
        hideRef.current.delete(idx);
      }

      commit(idx, { id: hole.id, phase: "hit" });

      comboRef.current += 1;
      if (comboRef.current > bestStreakRef.current) {
        bestStreakRef.current = comboRef.current;
      }
      const points = multiplier(comboRef.current);
      scoreRef.current += points;
      hitsRef.current += 1;
      setScore(scoreRef.current);
      setCombo(comboRef.current);
      if (!mutedRef.current) soundsRef.current?.hit(points);

      // Floating "+N" over the whacked hole.
      const fid = ++floatIdRef.current;
      setFloats((prev) => [...prev, { id: fid, idx, points }]);
      const floatTimer = window.setTimeout(() => {
        floatTimersRef.current.delete(floatTimer);
        setFloats((prev) => prev.filter((f) => f.id !== fid));
      }, 650);
      floatTimersRef.current.add(floatTimer);

      bonkRef.current.set(
        idx,
        window.setTimeout(() => {
          bonkRef.current.delete(idx);
          const current = holesRef.current[idx];
          if (current && current.id === hole.id) commit(idx, null);
        }, HIT_MS),
      );
    },
    [commit],
  );

  const start = useCallback(() => {
    clearAllTimers();
    holesRef.current = emptyBoard();
    setHoles(holesRef.current);
    setFloats([]);
    idRef.current = 0;
    scoreRef.current = 0;
    comboRef.current = 0;
    bestStreakRef.current = 0;
    hitsRef.current = 0;
    missesRef.current = 0;
    setScore(0);
    setCombo(0);
    setTimeLeft(GAME_SECONDS);
    setNewHigh(false);
    setCanRestart(true);
    startRef.current = Date.now();
    statusRef.current = "playing";
    setStatus("playing");

    // Unlock audio on this user gesture so the first hit isn't silent.
    if (!soundsRef.current) soundsRef.current = createSounds();
    if (!mutedRef.current) soundsRef.current.unlock();

    // A wall-clock tick keeps the countdown honest even if a frame is dropped,
    // and ends the round without side-effecting inside a state updater.
    clockRef.current = window.setInterval(() => {
      const remaining = Math.max(0, GAME_SECONDS - Math.floor(elapsed() / 1000));
      setTimeLeft(remaining);
      if (elapsed() >= GAME_MS) endGame();
    }, 200);

    popMole();
    scheduleSpawn();
  }, [clearAllTimers, elapsed, endGame, popMole, scheduleSpawn]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      mutedRef.current = !m;
      return !m;
    });
  }, []);

  // Tidy up any live timers if the component unmounts mid-round.
  useEffect(() => clearAllTimers, [clearAllTimers]);

  const playing = status === "playing";
  const over = status === "over";
  const mult = multiplier(combo);

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
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-4 h-1 bg-black" />
          <div>
            <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.3em] text-black/50">
              they get faster · you get flustered
            </p>
            <h1 className="font-roboto-slab text-[clamp(3rem,10vw,5.5rem)] font-black leading-[0.85] tracking-tight text-black">
              Whack-a-Mole
            </h1>
          </div>
        </header>

        {/* Stat bar */}
        <div className="mb-6 grid grid-cols-3 gap-px overflow-hidden rounded-md border-[3px] border-black bg-black">
          <Stat label="Score" value={String(score)} />
          <Stat
            label="Time"
            value={`${timeLeft}s`}
            accent={playing && timeLeft <= 5}
          />
          <Stat label="Best" value={String(high)} />
        </div>

        {/* Board */}
        <div className="relative">
          {/* Field: dirt holes sitting in the grass. */}
          <div
            className="rounded-lg border-[3px] border-black p-3 sm:p-4"
            style={{
              backgroundColor: "#8fb45f",
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.14) 1.5px, transparent 1.5px)",
              backgroundSize: "14px 14px",
            }}
          >
            <div
              className={`grid grid-cols-3 gap-3 sm:gap-4 ${
                playing ? "" : "pointer-events-none"
              }`}
            >
              {holes.map((hole, i) => (
                <HoleCell key={i} hole={hole} onWhack={() => whack(i)} />
              ))}
            </div>
          </div>

          {/* Score floats, aligned to the field with matching padding + grid. */}
          <div className="pointer-events-none absolute inset-0 p-3 sm:p-4">
            <div className="grid h-full grid-cols-3 gap-3 sm:gap-4">
              {INDICES.map((i) => (
                <div key={i} className="relative">
                  {floats
                    .filter((f) => f.idx === i)
                    .map((f) => (
                      <span
                        key={f.id}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 font-roboto-slab text-2xl font-black text-[#fffef5] sm:text-3xl"
                        style={{
                          animation: "score-float 0.65s ease-out forwards",
                          textShadow: "2px 2px 0 rgba(0,0,0,0.9)",
                        }}
                      >
                        +{f.points}
                      </span>
                    ))}
                </div>
              ))}
            </div>
          </div>

          {/* Streak badge */}
          {playing && combo >= 2 && (
            <div
              key={combo}
              className="pointer-events-none absolute -top-3 right-2 z-20 rounded-md border-[3px] border-black bg-[#ef3d2f] px-3 py-1 text-center shadow-[3px_3px_0_rgba(0,0,0,1)]"
              style={{ animation: "combo-pop 0.25s ease-out" }}
            >
              <div className="font-mono text-[9px] uppercase tracking-widest text-[#fffef5]/80">
                streak {combo}
              </div>
              <div className="font-roboto-slab text-lg font-black leading-none text-[#fffef5]">
                {mult}&times;
              </div>
            </div>
          )}

          {/* Idle overlay */}
          {status === "idle" && (
            <Overlay>
              <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.3em] text-[#ef3d2f]">
                {GAME_SECONDS} seconds
              </p>
              <h2 className="mb-3 font-roboto-slab text-4xl font-black leading-none text-black">
                Ready?
              </h2>
              <p className="mb-4 font-mono text-sm text-black/70">
                Bonk every mole that pokes its head out. Chain hits for a
                multiplier. They speed up the longer you last.
              </p>
              <PrimaryButton onClick={start}>Start</PrimaryButton>
            </Overlay>
          )}

          {/* Game over overlay */}
          {over && (
            <Overlay>
              <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.3em] text-[#ef3d2f]">
                time&apos;s up
              </p>
              <h2 className="mb-1 font-roboto-slab text-5xl font-black leading-none text-black">
                {score}
              </h2>
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-black/50">
                points
              </p>
              <p className="mb-4 font-mono text-sm text-black/70">
                {summary.hits} hits · {summary.accuracy}% on target · best streak{" "}
                {summary.bestStreak}
                {newHigh && (
                  <span className="mt-1 block font-bold text-[#ef3d2f]">
                    new high score!
                  </span>
                )}
              </p>
              <PrimaryButton onClick={start} disabled={!canRestart}>
                {canRestart ? "Play again" : "…"}
              </PrimaryButton>
            </Overlay>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={start}
            className="rounded-md border-[3px] border-black bg-transparent px-4 py-2 font-mono text-xs uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-[#fffef5]"
          >
            {playing ? "Restart" : "New game"}
          </button>
          <button
            type="button"
            onClick={toggleMute}
            aria-pressed={muted}
            className="rounded-md border-[3px] border-black bg-transparent px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-black/60 transition-colors hover:bg-black hover:text-[#fffef5]"
          >
            {muted ? "sound off" : "sound on"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HoleCell({ hole, onWhack }: { hole: Hole; onWhack: () => void }) {
  const up = hole !== null;
  const hit = hole?.phase === "hit";

  return (
    <button
      type="button"
      // pointerdown beats click for a twitchy game, and cuts the tap delay on
      // touch. preventDefault stops long-press selection while mashing.
      onPointerDown={(e) => {
        e.preventDefault();
        onWhack();
      }}
      className="relative aspect-square touch-none select-none overflow-hidden rounded-2xl border-[3px] border-black"
      style={{
        backgroundColor: "#d9b98c",
        backgroundImage:
          "radial-gradient(rgba(0,0,0,0.08) 1.2px, transparent 1.2px)",
        backgroundSize: "10px 10px",
        cursor: up ? "pointer" : "default",
      }}
      aria-label={up ? "Whack the mole" : "Empty hole"}
    >
      {/* the hole itself */}
      <div className="absolute inset-x-[16%] bottom-[14%] top-[46%] rounded-[50%] border-[3px] border-black bg-[#3a2a1a]" />

      {/* mole rises out of the hole, clipped by the cell on the way down */}
      <div
        className="absolute inset-x-[20%] bottom-[16%] transition-transform duration-150 ease-out"
        style={{
          transform: up ? "translateY(0)" : "translateY(130%)",
          animation: hit ? "mole-bonk 0.35s ease-in forwards" : undefined,
        }}
      >
        <Mole hit={hit} />
      </div>

      {/* impact flash on a clean whack */}
      {hit && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, rgba(247,201,72,0.75), transparent 60%)",
          }}
        />
      )}

      {/* front lip of the mound, drawn over the mole to hide its feet */}
      <div
        className="absolute inset-x-0 bottom-0 h-[20%] rounded-t-[50%] border-t-[3px] border-black"
        style={{ backgroundColor: "#c8a373" }}
      />
    </button>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#fffef5] px-3 py-3 text-center sm:py-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-black/50">
        {label}
      </div>
      <div
        className={`font-roboto-slab text-2xl font-black leading-tight sm:text-3xl ${
          accent ? "text-[#ef3d2f]" : "text-black"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
      <div
        className="w-full max-w-sm rounded-lg border-[3px] border-black bg-[#fffef5] p-6 text-center shadow-[8px_8px_0_rgba(0,0,0,1)]"
        style={{ animation: "matchpop 0.35s ease-out" }}
      >
        {children}
      </div>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-md border-[3px] border-black bg-black px-4 py-3 font-mono text-xs uppercase tracking-widest text-[#fffef5] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
    >
      {children}
    </button>
  );
}
