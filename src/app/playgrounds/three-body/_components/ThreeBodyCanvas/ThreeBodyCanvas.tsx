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

    const prev: { x: number; y: number }[] = liveBodiesRef.current.map((b) => ({
      x: b.x,
      y: b.y,
    }));

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

      // Reset signal: snap live bodies back to initial state and clear trails.
      if (resetSignalRef.current !== lastReset) {
        const init = initialBodiesRef.current;
        const live = liveBodiesRef.current;
        for (let i = 0; i < init.length; i++) {
          live[i].x = init[i].x;
          live[i].y = init[i].y;
          live[i].vx = init[i].vx;
          live[i].vy = init[i].vy;
          live[i].mass = init[i].mass;
          prev[i].x = init[i].x;
          prev[i].y = init[i].y;
        }
        lastReset = resetSignalRef.current;
        fillBg();
      }

      // Clear-only signal: wipe trails but keep the simulation running (e.g. zoom change).
      if (clearSignalRef.current !== lastClear) {
        lastClear = clearSignalRef.current;
        const live = liveBodiesRef.current;
        for (let i = 0; i < live.length; i++) {
          prev[i].x = live[i].x;
          prev[i].y = live[i].y;
        }
        fillBg();
      }

      // Persistence-canvas trail: low-alpha black overlay each frame fades old strokes.
      // Fade rate maps trail length to (1 - 0.05)^L ≈ 0.05 → α ≈ 3/L.
      const fadeAlpha = Math.min(0.4, 3 / params.trailLength);
      ctx.fillStyle = `rgba(13, 13, 13, ${fadeAlpha})`;
      ctx.fillRect(0, 0, w, h);

      const bodies = liveBodiesRef.current;

      if (playingRef.current) {
        const dt = (BASE_DT * params.speed) / SUBSTEPS;
        for (let s = 0; s < SUBSTEPS; s++) step(bodies, dt);
      }

      // Trail segments.
      ctx.lineWidth = 1.4;
      ctx.lineCap = "round";
      for (let i = 0; i < bodies.length; i++) {
        ctx.strokeStyle = STAR_COLORS[i].trail;
        ctx.beginPath();
        ctx.moveTo(toPx(prev[i].x), toPy(prev[i].y));
        ctx.lineTo(toPx(bodies[i].x), toPy(bodies[i].y));
        ctx.stroke();
        prev[i].x = bodies[i].x;
        prev[i].y = bodies[i].y;
      }

      // Glowing bodies.
      for (let i = 0; i < bodies.length; i++) {
        const px = toPx(bodies[i].x);
        const py = toPy(bodies[i].y);
        if (px < -50 || px > w + 50 || py < -50 || py > h + 50) continue;
        const radius = 3 + 2 * Math.cbrt(bodies[i].mass);
        const haloR = radius * 4;
        const c = STAR_COLORS[i];
        const grad = ctx.createRadialGradient(px, py, 0, px, py, haloR);
        grad.addColorStop(0, c.core);
        grad.addColorStop(0.15, c.bright);
        grad.addColorStop(0.4, c.mid);
        grad.addColorStop(1, c.rim);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, haloR, 0, Math.PI * 2);
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
