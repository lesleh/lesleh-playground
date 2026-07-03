"use client";

import { useEffect, useRef } from "react";
import { useIntersectionObserver } from "../../_hooks";
import { COLS, ROWS, START_ROW, GOAL_ROW, createLevel, advanceBikes } from "./_lib/game";
import { COLORS, drawChicken, drawBike } from "./_lib/sprites";

const STEP_MS = 520; // how often the demo chicken hops

export function ChickenCrossingPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isVisible = useIntersectionObserver(containerRef);

  useEffect(() => {
    if (!isVisible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    // Fit the board to the card, centred.
    const cell = Math.min(width / COLS, height / ROWS);
    const boardW = cell * COLS;
    const boardH = cell * ROWS;
    const ox = (width - boardW) / 2;
    const oy = (height - boardH) / 2;

    const state = createLevel(3);
    let raf = 0;
    let last = 0;
    let acc = 0;

    const frame = (now: number) => {
      if (!last) last = now;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      advanceBikes(state, dt);

      // Auto-hop the chicken up the board on a timer; loop at the top.
      acc += dt * 1000;
      if (acc >= STEP_MS) {
        acc = 0;
        state.chicken.row -= 1;
        if (state.chicken.row < GOAL_ROW) {
          state.chicken.row = START_ROW;
          state.chicken.col = 2 + Math.floor(Math.random() * (COLS - 4));
        }
      }

      ctx.fillStyle = COLORS.road;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(ox, oy);

      for (const lane of state.lanes) {
        const y = lane.row * cell;
        if (lane.type === "grass") {
          ctx.fillStyle = lane.row === 0 ? COLORS.goalGlow : COLORS.grass;
          ctx.fillRect(0, y, boardW, cell);
        } else {
          ctx.fillStyle = lane.row % 2 === 0 ? COLORS.road : COLORS.roadAlt;
          ctx.fillRect(0, y, boardW, cell);
          ctx.fillStyle = COLORS.laneMark;
          for (let c = 0; c < COLS; c++) {
            if (c % 2 === 0) ctx.fillRect(c * cell + cell / 2 - 3, y + cell / 2 - 1, 6, 2);
          }
        }
      }

      for (const bike of state.bikes) {
        drawBike(ctx, (bike.x + 0.5) * cell, (bike.row + 0.5) * cell, cell * 1.3, bike.row, bike.dir > 0);
      }

      drawChicken(ctx, (state.chicken.col + 0.5) * cell, (state.chicken.row + 0.5) * cell, cell);

      ctx.restore();
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [isVisible]);

  return (
    <div ref={containerRef} className="h-full w-full bg-[#14141c]">
      <canvas ref={canvasRef} className="h-full w-full [image-rendering:pixelated]" />
    </div>
  );
}
