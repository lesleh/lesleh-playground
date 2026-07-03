"use client";

import { useEffect, useRef } from "react";
import {
  COLS,
  ROWS,
  POINTS_PER_ROW,
  createLevel,
  advanceBikes,
  tickTimer,
  hop,
  checkCollision,
  atGoal,
  type GameState,
  type Direction,
} from "../../_lib/game";
import { COLORS, drawChicken, drawBike } from "../../_lib/sprites";

export type Phase = "ready" | "playing" | "dead" | "levelComplete" | "gameOver";

// Internal pixels per grid cell. The canvas renders at this fixed resolution
// and is CSS-scaled up with pixelated rendering for the arcade look.
const CELL = 22;
const HOP_MS = 150;
const MAX_DT = 0.05;

function renderScene(
  ctx: CanvasRenderingContext2D,
  st: GameState,
  now: number,
  hopStart: number,
) {
  // Rows.
  for (const lane of st.lanes) {
    const y = lane.row * CELL;
    if (lane.type === "grass") {
      const isGoal = lane.row === 0;
      ctx.fillStyle = isGoal ? COLORS.goalGlow : COLORS.grass;
      ctx.fillRect(0, y, COLS * CELL, CELL);
      // Grass texture: alternating darker tufts.
      ctx.fillStyle = isGoal ? "rgba(255,255,255,0.18)" : COLORS.grassAlt;
      for (let c = 0; c < COLS; c++) {
        if ((c + lane.row) % 2 === 0) {
          ctx.fillRect(c * CELL + 4, y + CELL - 6, 6, 3);
        }
      }
      if (isGoal) {
        // Checkered finish strip along the bottom of the goal row.
        for (let c = 0; c < COLS; c++) {
          ctx.fillStyle = c % 2 === 0 ? "#1e1e24" : "#ffffff";
          ctx.fillRect(c * CELL, y + CELL - 5, CELL, 5);
        }
      }
    } else {
      ctx.fillStyle = lane.row % 2 === 0 ? COLORS.road : COLORS.roadAlt;
      ctx.fillRect(0, y, COLS * CELL, CELL);
      // Dashed centre line.
      ctx.fillStyle = COLORS.laneMark;
      for (let c = 0; c < COLS; c++) {
        if (c % 2 === 0) ctx.fillRect(c * CELL + CELL / 2 - 4, y + CELL / 2 - 1, 8, 2);
      }
    }
  }

  // Bikes.
  for (const bike of st.bikes) {
    const cx = (bike.x + bike.length / 2) * CELL;
    const cy = (bike.row + 0.5) * CELL;
    drawBike(ctx, cx, cy, CELL * 1.35, bike.row, bike.dir > 0);
  }

  // Chicken with a brief hop squash.
  const hopProgress = Math.max(0, 1 - (now - hopStart) / HOP_MS);
  const chx = (st.chicken.col + 0.5) * CELL;
  const chy = (st.chicken.row + 0.5) * CELL;
  drawChicken(ctx, chx, chy, CELL, hopProgress);

  // Timer bar across the very top.
  const frac = st.levelDuration > 0 ? st.timeLeft / st.levelDuration : 0;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, 0, COLS * CELL, 4);
  ctx.fillStyle = frac < 0.25 ? "#ff5964" : "#ffd23f";
  ctx.fillRect(0, 0, COLS * CELL * frac, 4);
}

interface Props {
  level: number;
  // Bumped whenever a fresh crossing should begin (new game, level up, respawn).
  epoch: number;
  phase: Phase;
  onCrash: () => void;
  onReachGoal: (timeLeft: number) => void;
  onScore: (points: number) => void;
  onTimeUp: () => void;
  onPrimaryAction: () => void;
}

export function GameCanvas({
  level,
  epoch,
  phase,
  onCrash,
  onReachGoal,
  onScore,
  onTimeUp,
  onPrimaryAction,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createLevel(1));
  const phaseRef = useRef<Phase>(phase);
  const resolvedRef = useRef(false);
  const hopStartRef = useRef(0);

  // Keep the latest callbacks/phase in refs so the rAF loop never restarts.
  const cbRef = useRef({ onCrash, onReachGoal, onScore, onTimeUp, onPrimaryAction });
  useEffect(() => {
    cbRef.current = { onCrash, onReachGoal, onScore, onTimeUp, onPrimaryAction };
    phaseRef.current = phase;
  });

  // Start a fresh crossing whenever the level or epoch changes.
  useEffect(() => {
    stateRef.current = createLevel(level);
    resolvedRef.current = false;
  }, [level, epoch]);

  // Single animation loop for the component's lifetime. Bikes always move (so
  // the board stays alive under overlays); game logic only runs while playing.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;

    let raf = 0;
    let last = 0;

    const frame = (now: number) => {
      if (!last) last = now;
      const dt = Math.min((now - last) / 1000, MAX_DT);
      last = now;

      const st = stateRef.current;
      advanceBikes(st, dt);

      if (phaseRef.current === "playing") {
        tickTimer(st, dt);
        if (!resolvedRef.current) {
          if (checkCollision(st)) {
            resolvedRef.current = true;
            cbRef.current.onCrash();
          } else if (atGoal(st)) {
            resolvedRef.current = true;
            cbRef.current.onReachGoal(st.timeLeft);
          } else if (st.timeLeft <= 0) {
            resolvedRef.current = true;
            cbRef.current.onTimeUp();
          }
        }
      }

      renderScene(ctx, st, now, hopStartRef.current);
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Keyboard: movement while playing, primary action (start/next/retry) otherwise.
  useEffect(() => {
    const move = (dir: Direction) => {
      if (phaseRef.current !== "playing" || resolvedRef.current) return;
      const gained = hop(stateRef.current, dir);
      hopStartRef.current = performance.now();
      if (gained > 0) cbRef.current.onScore(gained * POINTS_PER_ROW);
    };

    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          move("up");
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          move("down");
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          move("left");
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          move("right");
          break;
        case " ":
        case "Enter":
          e.preventDefault();
          if (phaseRef.current !== "playing") cbRef.current.onPrimaryAction();
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Touch: swipe to steer, tap to hop forward (or to trigger the primary action
  // when not mid-game).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let sx = 0;
    let sy = 0;
    let stime = 0;

    const move = (dir: Direction) => {
      if (phaseRef.current !== "playing" || resolvedRef.current) return;
      const gained = hop(stateRef.current, dir);
      hopStartRef.current = performance.now();
      if (gained > 0) cbRef.current.onScore(gained * POINTS_PER_ROW);
    };

    const onStart = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      sx = t.clientX;
      sy = t.clientY;
      stime = performance.now();
    };

    const onMove = (e: TouchEvent) => {
      if (phaseRef.current === "playing") e.preventDefault();
    };

    const onEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      const dist = Math.hypot(dx, dy);

      if (phaseRef.current !== "playing") {
        if (performance.now() - stime < 500) cbRef.current.onPrimaryAction();
        return;
      }

      if (dist < 24) {
        // Tap: hop toward where you tapped, relative to the chicken. Tap ahead
        // to go up, tap to either side to go left/right, tap behind to go down.
        const rect = canvas.getBoundingClientRect();
        const tapCol = ((t.clientX - rect.left) / rect.width) * COLS;
        const tapRow = ((t.clientY - rect.top) / rect.height) * ROWS;
        const ch = stateRef.current.chicken;
        const tdx = tapCol - (ch.col + 0.5);
        const tdy = tapRow - (ch.row + 0.5);
        if (Math.abs(tdx) > Math.abs(tdy)) {
          move(tdx > 0 ? "right" : "left");
        } else {
          move(tdy > 0 ? "down" : "up");
        }
      } else if (Math.abs(dx) > Math.abs(dy)) {
        move(dx > 0 ? "right" : "left");
      } else {
        move(dy > 0 ? "down" : "up");
      }
    };

    canvas.addEventListener("touchstart", onStart, { passive: true });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-auto max-w-full touch-none rounded-sm [image-rendering:pixelated]"
      style={{ aspectRatio: `${COLS} / ${ROWS}` }}
    />
  );
}
