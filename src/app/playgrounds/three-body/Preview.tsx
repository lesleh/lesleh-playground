"use client";

import { useEffect, useRef } from "react";
import { useIntersectionObserver } from "../../_hooks";
import { step, BASE_DT, SUBSTEPS, cloneBodies } from "./_lib/threeBody";
import { buildPreset } from "./_lib/presets";
import { STAR_COLORS } from "./_lib/colors";

const TRAIL_LEN = 240;
const TRAIL_BINS = 8;

export function ThreeBodyPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isVisible = useIntersectionObserver(containerRef);

  useEffect(() => {
    if (!isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;
    const halfW = 1.6;
    const halfH = (halfW * h) / w;
    const toPx = (au: number) => ((au + halfW) / (2 * halfW)) * w;
    const toPy = (au: number) => ((halfH - au) / (2 * halfH)) * h;

    const bodies = cloneBodies(buildPreset("figure-eight"));
    const trailX = bodies.map(() => new Float64Array(TRAIL_LEN));
    const trailY = bodies.map(() => new Float64Array(TRAIL_LEN));
    let trailHead = 0;
    let trailCount = 0;

    let animId = 0;
    const frame = () => {
      const dt = BASE_DT / SUBSTEPS;
      for (let s = 0; s < SUBSTEPS; s++) step(bodies, dt);

      for (let i = 0; i < bodies.length; i++) {
        trailX[i][trailHead] = bodies[i].x;
        trailY[i][trailHead] = bodies[i].y;
      }
      trailHead = (trailHead + 1) % TRAIL_LEN;
      if (trailCount < TRAIL_LEN) trailCount++;

      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, w, h);

      if (trailCount > 1) {
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const start = (trailHead - trailCount + TRAIL_LEN) % TRAIL_LEN;
        for (let bin = 0; bin < TRAIL_BINS; bin++) {
          const binStart = Math.floor((bin / TRAIL_BINS) * trailCount);
          const binEnd = Math.floor(((bin + 1) / TRAIL_BINS) * trailCount);
          if (binEnd <= binStart) continue;
          ctx.globalAlpha = ((bin + 1) / TRAIL_BINS) ** 1.4;
          for (let i = 0; i < bodies.length; i++) {
            ctx.strokeStyle = STAR_COLORS[i].trailSolid;
            ctx.beginPath();
            const seg0 = (start + binStart) % TRAIL_LEN;
            ctx.moveTo(toPx(trailX[i][seg0]), toPy(trailY[i][seg0]));
            for (let k = binStart + 1; k <= binEnd; k++) {
              const idx = (start + k) % TRAIL_LEN;
              ctx.lineTo(toPx(trailX[i][idx]), toPy(trailY[i][idx]));
            }
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      }

      for (let i = 0; i < bodies.length; i++) {
        const px = toPx(bodies[i].x);
        const py = toPy(bodies[i].y);
        const radius = 4;
        const c = STAR_COLORS[i];

        const haloR = radius * 2.2;
        const grad = ctx.createRadialGradient(px, py, radius * 0.5, px, py, haloR);
        grad.addColorStop(0, c.bright);
        grad.addColorStop(0.6, c.mid);
        grad.addColorStop(1, c.rim);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, haloR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = c.bright;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = c.core;
        ctx.beginPath();
        ctx.arc(px, py, radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(frame);
    };
    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [isVisible]);

  return (
    <div ref={containerRef} className="w-full h-full bg-[#0d0d0d]">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
