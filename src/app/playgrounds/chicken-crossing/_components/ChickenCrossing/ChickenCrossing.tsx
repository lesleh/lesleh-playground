"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameCanvas, type Phase } from "../GameCanvas";
import { HudBar, GameOverlay } from "../HUD";
import { LEVEL_CLEAR_BONUS, timeBonus } from "../../_lib/game";
import { useBestScore } from "../../_lib/useBestScore";

const START_LIVES = 3;
const DEATH_PAUSE_MS = 850;

export function ChickenCrossing() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(START_LIVES);
  const [score, setScore] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const [deathReason, setDeathReason] = useState<"crash" | "time" | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);

  const { best, saveIfBest } = useBestScore();

  // Refs let the canvas's imperative callbacks read/update fresh values without
  // stale closures, and drive phase-dependent branching synchronously.
  const livesRef = useRef(START_LIVES);
  const scoreRef = useRef(0);
  const phaseRef = useRef<Phase>("ready");
  useEffect(() => {
    phaseRef.current = phase;
  });

  const startGame = useCallback(() => {
    livesRef.current = START_LIVES;
    scoreRef.current = 0;
    setLives(START_LIVES);
    setScore(0);
    setLevel(1);
    setDeathReason(null);
    setIsNewBest(false);
    setEpoch((e) => e + 1);
    setPhase("playing");
  }, []);

  const nextLevel = useCallback(() => {
    setLevel((l) => l + 1);
    setEpoch((e) => e + 1);
    setPhase("playing");
  }, []);

  const loseLife = useCallback((reason: "crash" | "time") => {
    setDeathReason(reason);
    const remaining = livesRef.current - 1;
    livesRef.current = remaining;
    setLives(remaining);
    setPhase(remaining <= 0 ? "gameOver" : "dead");
  }, []);

  const handleScore = useCallback((points: number) => {
    scoreRef.current += points;
    setScore(scoreRef.current);
  }, []);

  const handleReachGoal = useCallback((timeLeft: number) => {
    scoreRef.current += LEVEL_CLEAR_BONUS + timeBonus(timeLeft);
    setScore(scoreRef.current);
    setPhase("levelComplete");
  }, []);

  const handleCrash = useCallback(() => loseLife("crash"), [loseLife]);
  const handleTimeUp = useCallback(() => loseLife("time"), [loseLife]);

  // Primary action (button / space / tap) means different things per phase.
  const handlePrimaryAction = useCallback(() => {
    const p = phaseRef.current;
    if (p === "ready" || p === "gameOver") startGame();
    else if (p === "levelComplete") nextLevel();
  }, [startGame, nextLevel]);

  // After a non-fatal death, pause briefly then respawn on the same level.
  useEffect(() => {
    if (phase !== "dead") return;
    const id = setTimeout(() => {
      setEpoch((e) => e + 1);
      setPhase("playing");
    }, DEATH_PAUSE_MS);
    return () => clearTimeout(id);
  }, [phase]);

  // Record the score once the run is over.
  useEffect(() => {
    if (phase === "gameOver") setIsNewBest(saveIfBest(scoreRef.current));
  }, [phase, saveIfBest]);

  return (
    <div className="flex h-full flex-col bg-[#14141c] text-white">
      <HudBar level={level} lives={lives} score={score} best={best} />

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-2">
        {/* CRT scanline veil, purely cosmetic. */}
        <div
          className="pointer-events-none absolute inset-0 z-30 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.5) 1px, transparent 1px, transparent 3px)",
          }}
        />
        {/* Canvas box: height-driven so the portrait board fits the viewport. */}
        <div className="relative h-full max-h-full">
          <GameCanvas
            level={level}
            epoch={epoch}
            phase={phase}
            onCrash={handleCrash}
            onReachGoal={handleReachGoal}
            onScore={handleScore}
            onTimeUp={handleTimeUp}
            onPrimaryAction={handlePrimaryAction}
          />
          <GameOverlay
            phase={phase}
            level={level}
            lives={lives}
            score={score}
            best={best}
            isNewBest={isNewBest}
            deathReason={deathReason}
            onPrimaryAction={handlePrimaryAction}
          />
        </div>
      </div>
    </div>
  );
}
