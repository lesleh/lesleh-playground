"use client";

import { useEffect, useRef } from "react";
import { createBoids, updateBoids, VISUAL_RANGE } from "../../_lib/boids";
import { SpatialGrid } from "../../_lib/spatialGrid";
import type { BoidParams } from "../../_lib/boids";

const BOID_COUNT = 3000;

interface Props {
  paramsRef: React.RefObject<BoidParams>;
}

export function BoidsCanvas({ paramsRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    const boids = createBoids(BOID_COUNT, width, height);
    const grid = new SpatialGrid(width, height, VISUAL_RANGE);
    let animId: number;

    const frame = () => {
      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      updateBoids(boids, grid, paramsRef.current, canvas.width, canvas.height);

      // Single path + one fill() call — orders of magnitude faster than fill() per boid
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.beginPath();
      for (const b of boids) {
        ctx.moveTo(b.x + 2.5, b.y);
        ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
      }
      ctx.fill();

      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [paramsRef]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
