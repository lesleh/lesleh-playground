"use client";

import { useEffect, useRef } from "react";
import { useIntersectionObserver } from "../../_hooks";
import { createBoids, updateBoids, DEFAULT_PARAMS, VISUAL_RANGE } from "./_lib/boids";
import { SpatialGrid } from "./_lib/spatialGrid";

const PREVIEW_COUNT = 150;

export function BoidsPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isVisible = useIntersectionObserver(containerRef);

  useEffect(() => {
    if (!isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    const boids = createBoids(PREVIEW_COUNT, width, height);
    const grid = new SpatialGrid(width, height, VISUAL_RANGE);
    let animId: number;

    const frame = () => {
      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      updateBoids(boids, grid, DEFAULT_PARAMS, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      for (const b of boids) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [isVisible]);

  return (
    <div ref={containerRef} className="w-full h-full bg-[#0d0d0d]">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
