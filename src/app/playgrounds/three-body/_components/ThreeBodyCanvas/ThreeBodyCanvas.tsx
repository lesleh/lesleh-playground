"use client";

import { useEffect, useRef } from "react";
import {
  step,
  tryMerge,
  BASE_DT,
  SUBSTEPS,
  type Body,
  type SimParams,
} from "../../_lib/threeBody";
import { STAR_COLORS } from "../../_lib/colors";

const MAX_TRAIL = 2000;
const TRAIL_BINS = 10;
// Frames a merger flash lasts. ~0.6 seconds at 60fps — long enough to see, short enough
// to feel like a discrete event rather than persistent UI.
const FLASH_FRAMES = 36;

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

    // Ring-buffer trails. Each body has its own head/count so that when a body dies
    // (after a merger) we just stop advancing its head; its existing trail stays
    // visible as-is, untouched, as a memorial.
    const bodyCount = liveBodiesRef.current.length;
    const trailX: Float64Array[] = Array.from(
      { length: bodyCount },
      () => new Float64Array(MAX_TRAIL)
    );
    const trailY: Float64Array[] = Array.from(
      { length: bodyCount },
      () => new Float64Array(MAX_TRAIL)
    );
    const trailHead = new Int32Array(bodyCount);
    const trailCount = new Int32Array(bodyCount);

    interface Flash {
      x: number;
      y: number;
      mass: number;
      age: number;
    }
    const flashes: Flash[] = [];

    const resetTrails = () => {
      trailHead.fill(0);
      trailCount.fill(0);
      flashes.length = 0;
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
    // Effective zoom auto-widens past the slider value if any body escapes the view.
    // Initialised from the slider; reset signals snap it back so a fresh preset starts framed.
    let effectiveZoom = paramsRef.current.zoom;

    const frame = () => {
      const params = paramsRef.current;
      const bodies = liveBodiesRef.current;

      // Auto-fit: widen if any alive body needs more room. Slider value is the minimum.
      let needed = params.zoom;
      const aspect = w / h;
      for (const b of bodies) {
        if (!b.alive) continue;
        const fromX = Math.abs(b.x);
        const fromY = Math.abs(b.y) * aspect;
        const r = Math.max(fromX, fromY) * 1.1;
        if (r > needed) needed = r;
      }
      // Asymmetric lerp: fast zoom-out (catch escapes), slow zoom-in (avoid jitter).
      const lerp = needed > effectiveZoom ? 0.15 : 0.02;
      effectiveZoom += (needed - effectiveZoom) * lerp;

      const halfW = effectiveZoom;
      const halfH = (effectiveZoom * h) / w;
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
          live[i].alive = init[i].alive;
        }
        lastReset = resetSignalRef.current;
        resetTrails();
        // Snap zoom so a fresh preset frames immediately rather than zooming in.
        effectiveZoom = params.zoom;
      }

      if (clearSignalRef.current !== lastClear) {
        lastClear = clearSignalRef.current;
        resetTrails();
      }

      if (playingRef.current) {
        const dt = (BASE_DT * params.speed) / SUBSTEPS;
        for (let s = 0; s < SUBSTEPS; s++) {
          step(bodies, dt);
          // Check for mergers between substeps so close passes can't tunnel through
          // each other in a single frame. tryMerge mutates bodies in place.
          const events = tryMerge(bodies);
          for (const e of events) {
            flashes.push({ x: e.x, y: e.y, mass: e.mass, age: 0 });
          }
        }
      }

      // Append to per-body ring buffer. Dead bodies don't advance — their trail freezes
      // wherever it was at the moment of merger.
      for (let i = 0; i < bodies.length; i++) {
        if (!bodies[i].alive) continue;
        trailX[i][trailHead[i]] = bodies[i].x;
        trailY[i][trailHead[i]] = bodies[i].y;
        trailHead[i] = (trailHead[i] + 1) % MAX_TRAIL;
        if (trailCount[i] < MAX_TRAIL) trailCount[i]++;
      }

      // Clean slate every frame — crisp, no persistence blur.
      fillBg();

      // Trails. Each body renders its own polyline split into TRAIL_BINS age groups.
      // Older bins use lower globalAlpha for the fade effect.
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let i = 0; i < bodies.length; i++) {
        const len = Math.min(trailCount[i], params.trailLength);
        if (len <= 1) continue;
        const start = (trailHead[i] - len + MAX_TRAIL) % MAX_TRAIL;
        ctx.strokeStyle = STAR_COLORS[i].trailSolid;
        for (let bin = 0; bin < TRAIL_BINS; bin++) {
          const binStart = Math.floor((bin / TRAIL_BINS) * len);
          const binEnd = Math.floor(((bin + 1) / TRAIL_BINS) * len);
          if (binEnd <= binStart) continue;
          ctx.globalAlpha = ((bin + 1) / TRAIL_BINS) ** 1.4;
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

      // Bodies. Tight glow + hard bright core for a sharp, star-like look.
      for (let i = 0; i < bodies.length; i++) {
        if (!bodies[i].alive) continue;
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

      // Merger flashes. Bright white burst that expands outward and fades over
      // FLASH_FRAMES; mass scales the initial radius so bigger mergers look bigger.
      for (let f = flashes.length - 1; f >= 0; f--) {
        const flash = flashes[f];
        const t = flash.age / FLASH_FRAMES;
        if (t >= 1) {
          flashes.splice(f, 1);
          continue;
        }
        const baseR = Math.max(8, 20 * Math.sqrt(flash.mass));
        const r = baseR * (1 + t * 3);
        const alpha = (1 - t) ** 1.5;
        const px = toPx(flash.x);
        const py = toPy(flash.y);
        const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
        grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        grad.addColorStop(0.4, `rgba(255, 240, 200, ${alpha * 0.6})`);
        grad.addColorStop(1, "rgba(255, 200, 120, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
        flash.age++;
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
