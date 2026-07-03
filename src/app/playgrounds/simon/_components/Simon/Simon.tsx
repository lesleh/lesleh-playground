"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Disc } from "../Disc";
import { extend, isInputCorrect, type Pad } from "../../_lib/game";
import {
  playPad,
  playError,
  resumeAudio,
  setMuted,
  startPad,
  stopPad,
  stopAllPads,
} from "../../_lib/sound";
import { useBestScore } from "../../_lib/useBestScore";

type Phase = "idle" | "playback" | "input" | "wrong" | "gameOver";

const START_LIVES = 3;
const LIT_MS = 420; // how long each pad glows during playback
const GAP_MS = 200; // silence between playback flashes
const FIRST_DELAY = 450; // pause before a sequence starts playing
const ROUND_PAUSE = 650; // pause after a round is cleared, before the next
const WRONG_PAUSE = 950; // pause after a mistake, before the replay

export function Simon() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [sequence, setSequence] = useState<Pad[]>([]);
  const [lives, setLives] = useState(START_LIVES);
  const [lit, setLit] = useState<number | null>(null);
  const [muted, setMutedState] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);

  const { best, saveIfBest } = useBestScore();

  const timers = useRef<number[]>([]);
  const inputIndex = useRef(0);
  const livesRef = useRef(START_LIVES);
  const phaseRef = useRef<Phase>("idle");
  const seqRef = useRef<Pad[]>([]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    seqRef.current = sequence;
  }, [sequence]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    timers.current.push(id);
  }, []);

  // Clear any pending timers and silence held tones on unmount.
  useEffect(
    () => () => {
      clearTimers();
      stopAllPads();
    },
    [clearTimers],
  );

  // Flash the whole sequence, then hand control to the player.
  const playback = useCallback(
    (seq: Pad[]) => {
      clearTimers();
      setPhase("playback");
      setLit(null);
      inputIndex.current = 0;
      let t = FIRST_DELAY;
      for (const pad of seq) {
        schedule(() => {
          setLit(pad);
          playPad(pad, LIT_MS / 1000);
        }, t);
        schedule(() => setLit(null), t + LIT_MS);
        t += LIT_MS + GAP_MS;
      }
      schedule(() => setPhase("input"), t);
    },
    [clearTimers, schedule],
  );

  const startGame = useCallback(() => {
    resumeAudio();
    livesRef.current = START_LIVES;
    setLives(START_LIVES);
    setIsNewBest(false);
    const seq = extend([]);
    setSequence(seq);
    playback(seq);
  }, [playback]);

  const handleWrong = useCallback(() => {
    playError();
    const remaining = livesRef.current - 1;
    livesRef.current = remaining;
    setLives(remaining);
    if (remaining <= 0) {
      clearTimers();
      setPhase("gameOver");
      // Completed rounds = sequence length minus the one they just failed.
      setIsNewBest(saveIfBest(Math.max(0, seqRef.current.length - 1)));
    } else {
      setPhase("wrong");
      schedule(() => playback(seqRef.current), WRONG_PAUSE);
    }
  }, [clearTimers, schedule, playback, saveIfBest]);

  const handlePress = useCallback(
    (pad: number) => {
      if (phaseRef.current !== "input") return;
      resumeAudio();
      setLit(pad);
      startPad(pad); // rings until the pad is released

      const idx = inputIndex.current;
      if (!isInputCorrect(seqRef.current, idx, pad as Pad)) {
        handleWrong();
        return;
      }
      inputIndex.current = idx + 1;
      if (inputIndex.current >= seqRef.current.length) {
        // Round cleared: block input, grow the sequence, replay.
        setPhase("playback");
        const nextSeq = extend(seqRef.current);
        setSequence(nextSeq);
        schedule(() => playback(nextSeq), ROUND_PAUSE);
      }
    },
    [schedule, playback, handleWrong],
  );

  const handleRelease = useCallback((pad: number) => {
    stopPad(pad);
    setLit((cur) => (cur === pad ? null : cur));
  }, []);

  const toggleMute = useCallback(() => {
    setMutedState((m) => {
      const next = !m;
      setMuted(next);
      return next;
    });
  }, []);

  const round = sequence.length;
  const playing = phase !== "idle" && phase !== "gameOver";

  const hubLabel: Record<Phase, string> = {
    idle: "",
    playback: "Watch",
    input: "Your turn",
    wrong: "Oops",
    gameOver: "",
  };

  return (
    <div
      className="flex h-full flex-col items-center select-none bg-[#0b0b12] text-white"
      style={{ WebkitTouchCallout: "none", WebkitTapHighlightColor: "transparent" }}
    >
      {/* Status bar */}
      <div className="flex w-full max-w-md items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-5">
          <Stat label="Round" value={playing || phase === "gameOver" ? round : 0} />
          <Stat label="Best" value={best} />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: START_LIVES }, (_, i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: i < lives ? "#f87171" : "rgba(255,255,255,0.15)" }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={toggleMute}
            className="font-mono text-[10px] uppercase tracking-widest text-white/50 transition-colors hover:text-white"
          >
            {muted ? "Sound off" : "Sound on"}
          </button>
        </div>
      </div>

      {/* Disc + overlays */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4">
        <Disc
          lit={lit}
          onPad={handlePress}
          onRelease={handleRelease}
          disabled={phase !== "input"}
          hub={
            playing ? (
              <>
                <span className="font-roboto-slab text-3xl font-black leading-none text-white">
                  {round}
                </span>
                <span className="mt-1 font-mono text-[8px] uppercase tracking-widest text-white/50">
                  {hubLabel[phase]}
                </span>
              </>
            ) : null
          }
        />

        {(phase === "idle" || phase === "gameOver") && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
            <div className="flex flex-col items-center rounded-2xl bg-black/55 px-8 py-6 backdrop-blur-sm">
              {phase === "idle" ? (
                <>
                  <h1 className="font-roboto-slab text-4xl font-black text-white sm:text-5xl">
                    Echo
                  </h1>
                  <p className="mt-2 max-w-[16rem] font-mono text-xs leading-relaxed text-white/60">
                    Watch the pattern, then tap it back. It grows every round.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-roboto-slab text-4xl font-black text-[#f87171]">Game over</h2>
                  <p className="mt-2 font-mono text-sm text-white/70">
                    You reached round{" "}
                    <span className="font-bold text-white">{Math.max(0, round - 1)}</span>
                  </p>
                  {isNewBest && (
                    <p className="mt-1 font-mono text-xs font-bold uppercase tracking-widest text-[#fde047]">
                      ★ New best ★
                    </p>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={startGame}
                className="mt-4 rounded-full border-2 border-white bg-white px-7 py-2 font-mono text-sm font-bold uppercase tracking-widest text-[#0b0b12] transition-transform hover:scale-105 active:scale-95"
              >
                {phase === "idle" ? "Start" : "Play again"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col leading-none">
      <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">{label}</span>
      <span className="font-mono text-lg font-bold tabular-nums text-white">{value}</span>
    </div>
  );
}
