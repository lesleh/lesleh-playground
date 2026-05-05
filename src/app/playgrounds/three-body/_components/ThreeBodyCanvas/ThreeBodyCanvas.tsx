"use client";

import { useEffect, useRef } from "react";
import {
  step,
  BASE_DT,
  SUBSTEPS,
  type Body,
  type SimParams,
} from "../../_lib/threeBody";
import { STAR_COLORS } from "../../_lib/colors";

const MAX_TRAIL = 2000;
const TRAIL_BINS = 10;

interface Props {
  liveBodiesRef: React.RefObject<Body[]>;
  initialBodiesRef: React.RefObject<Body[]>;
  paramsRef: React.RefObject<SimParams>;
  playingRef: React.RefObject<boolean>;
  resetSignalRef: React.RefObject<number>;
  clearSignalRef: React.RefObject<number>;
}

export function ThreeBodyCanvas({
  liveBodiesRef,
  initialBodiesRef,
  paramsRef,
  playingRef,
  resetSignalRef,
  clearSignalRef,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let lastReset = resetSignalRef.current;
    let lastClear = clearSignalRef.current;

    const sizeFor = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      return { w: rect.width, h: rect.height, dpr };
    };

    let { w, h, dpr } = sizeFor();
    ctx.scale(dpr, dpr);

    const fillBg = () => {
      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, w, h);
    };
    fillBg();

    // Ring-buffer trails: each body keeps the last MAX_TRAIL positions in AU. Trails are
    // redrawn cleanly every frame, so there's no accumulated halo tint or persistence blur.
    const bodyCount = liveBodiesRef.current.length;
    const trailX: Float64Array[] = Array.from(
      { length: bodyCount },
      () => new Float64Array(MAX_TRAIL)
    );
    const trailY: Float64Array[] = Array.from(
      { length: bodyCount },
      () => new Float64Array(MAX_TRAIL)
    );
    let trailHead = 0;
    let trailCount = 0;

    const resetTrails = () => {
      trailHead = 0;
      trailCount = 0;
    };

    const ro = new ResizeObserver(() => {
      const next = sizeFor();
      w = next.w;
      h = next.h;
      dpr = next.dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fillBg();
    });
    ro.observe(canvas);

    let animId = 0;

    const frame = () => {
      const params = paramsRef.current;
      const halfW = params.zoom;
      const halfH = (params.zoom * h) / w;
      const toPx = (au: number) => ((au + halfW) / (2 * halfW)) * w;
      const toPy = (au: number) => ((halfH - au) / (2 * halfH)) * h;

      if (resetSignalRef.current !== lastReset) {
        const init = initialBodiesRef.current;
        const live = liveBodiesRef.current;
        for (let i = 0; i < init.length; i++) {
          live[i].x = init[i].x;
          live[i].y = init[i].y;
          live[i].vx = init[i].vx;
          live[i].vy = init[i].vy;
          live[i].mass = init[i].mass;
        }
        lastReset = resetSignalRef.current;
        resetTrails();
      }

      if (clearSignalRef.current !== lastClear) {
        lastClear = clearSignalRef.current;
        resetTrails();
      }

      const bodies = liveBodiesRef.current;

      if (playingRef.current) {
        const dt = (BASE_DT * params.speed) / SUBSTEPS;
        for (let s = 0; s < SUBSTEPS; s++) step(bodies, dt);
      }

      // Append current positions to ring buffer.
      for (let i = 0; i < bodies.length; i++) {
        trailX[i][trailHead] = bodies[i].x;
        trailY[i][trailHead] = bodies[i].y;
      }
      trailHead = (trailHead + 1) % MAX_TRAIL;
      if (trailCount < MAX_TRAIL) trailCount++;

      // Clean slate every frame — crisp, no persistence blur.
      fillBg();

      // Trails. Discrete N points per body, drawn as a polyline split into TRAIL_BINS
      // age groups. Older bins use lower globalAlpha for the fade effect. Each bin is
      // a single beginPath/stroke so we draw at most TRAIL_BINS × bodies strokes/frame.
      const trailLen = Math.min(trailCount, params.trailLength);
      if (trailLen > 1) {
        ctx.lineWidth = 1.2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const start = (trailHead - trailLen + MAX_TRAIL) % MAX_TRAIL;
        for (let bin = 0; bin < TRAIL_BINS; bin++) {
          const binStart = Math.floor((bin / TRAIL_BINS) * trailLen);
          const binEnd = Math.floor(((bin + 1) / TRAIL_BINS) * trailLen);
          if (binEnd <= binStart) continue;
          // Older bins (lower index) are dimmer.
          ctx.globalAlpha = ((bin + 1) / TRAIL_BINS) ** 1.4;
          for (let i = 0; i < bodies.length; i++) {
            ctx.strokeStyle = STAR_COLORS[i].trailSolid;
            ctx.beginPath();
            const seg0 = (start + binStart) % MAX_TRAIL;
            ctx.moveTo(toPx(trailX[i][seg0]), toPy(trailY[i][seg0]));
            for (let k = binStart + 1; k <= binEnd; k++) {
              const idx = (start + k) % MAX_TRAIL;
              ctx.lineTo(toPx(trailX[i][idx]), toPy(trailY[i][idx]));
            }
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      }

      // Bodies. Tight glow + hard bright core for a sharp, star-like look.
      for (let i = 0; i < bodies.length; i++) {
        const px = toPx(bodies[i].x);
        const py = toPy(bodies[i].y);
        if (px < -50 || px > w + 50 || py < -50 || py > h + 50) continue;
        // Linear-ish scaling for visual drama (real stars are M^0.7, but that's too tame
        // at this slider range). Clamps keep tiny bodies visible and giants from blowing up.
        const radius = Math.max(1.8, Math.min(18, 4.5 * bodies[i].mass));
        const c = STAR_COLORS[i];

        // Soft halo (kept tight so it doesn't smear).
        const haloR = radius * 2.2;
        const grad = ctx.createRadialGradient(px, py, radius * 0.5, px, py, haloR);
        grad.addColorStop(0, c.bright);
        grad.addColorStop(0.6, c.mid);
        grad.addColorStop(1, c.rim);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, haloR, 0, Math.PI * 2);
        ctx.fill();

        // Hard bright disc.
        ctx.fillStyle = c.bright;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();

        // White-hot core.
        ctx.fillStyle = c.core;
        ctx.beginPath();
        ctx.arc(px, py, radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [
    liveBodiesRef,
    initialBodiesRef,
    paramsRef,
    playingRef,
    resetSignalRef,
    clearSignalRef,
  ]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}
