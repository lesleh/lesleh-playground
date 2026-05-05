"use client";

import { useEffect, useRef } from "react";
import { useIntersectionObserver } from "../../_hooks";
import { step, BASE_DT, SUBSTEPS, cloneBodies } from "./_lib/threeBody";
import { buildPreset } from "./_lib/presets";
import { STAR_COLORS } from "./_lib/colors";

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
    canvas.width = rect.width;
    canvas.height = rect.height;
    const w = rect.width;
    const h = rect.height;
    const halfW = 1.6;
    const halfH = (halfW * h) / w;
    const toPx = (au: number) => ((au + halfW) / (2 * halfW)) * w;
    const toPy = (au: number) => ((halfH - au) / (2 * halfH)) * h;

    const bodies = cloneBodies(buildPreset("figure-eight"));
    const prev = bodies.map((b) => ({ x: b.x, y: b.y }));

    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, w, h);

    let animId = 0;
    const frame = () => {
      ctx.fillStyle = "rgba(13, 13, 13, 0.04)";
      ctx.fillRect(0, 0, w, h);

      const dt = BASE_DT / SUBSTEPS;
      for (let s = 0; s < SUBSTEPS; s++) step(bodies, dt);

      ctx.lineWidth = 1.2;
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

      for (let i = 0; i < bodies.length; i++) {
        const px = toPx(bodies[i].x);
        const py = toPy(bodies[i].y);
        const c = STAR_COLORS[i];
        const haloR = 12;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, haloR);
        grad.addColorStop(0, c.core);
        grad.addColorStop(0.2, c.bright);
        grad.addColorStop(0.5, c.mid);
        grad.addColorStop(1, c.rim);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, haloR, 0, Math.PI * 2);
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
