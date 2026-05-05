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
    const ctx = canvas.getContext("2d", { alpha: false });
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

      // Single path + one fill() call — orders of magnitude faster than fill() per boid.
      // Isoceles triangles pointing along velocity: longer front, shorter back, narrow base.
      const FRONT = 5;
      const BACK = 3;
      const HALF_BASE = 2;
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.beginPath();
      for (const b of boids) {
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        const fx = speed > 0 ? b.vx / speed : 1;
        const fy = speed > 0 ? b.vy / speed : 0;
        const px = -fy;
        const py = fx;
        const tipX = b.x + fx * FRONT;
        const tipY = b.y + fy * FRONT;
        const blX = b.x - fx * BACK + px * HALF_BASE;
        const blY = b.y - fy * BACK + py * HALF_BASE;
        const brX = b.x - fx * BACK - px * HALF_BASE;
        const brY = b.y - fy * BACK - py * HALF_BASE;
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(blX, blY);
        ctx.lineTo(brX, brY);
        ctx.closePath();
      }
      ctx.fill();

      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [paramsRef]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
