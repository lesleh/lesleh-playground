"use client";

import { useEffect, useRef } from "react";
import { useIntersectionObserver } from "../../_hooks";

export function SpirographPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isVisible) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Spirograph parameters
    const R = 80; // Fixed circle radius
    const r = 30; // Rolling circle radius
    const d = 50; // Distance from rolling circle center

    let t = 0;
    const points: { x: number; y: number }[] = [];

    function animate() {
      if (!ctx || !canvas) return;

      // Clear with fade effect
      ctx.fillStyle = "rgba(249, 250, 251, 0.1)";
      ctx.fillRect(0, 0, width, height);

      // Calculate spirograph point
      const x =
        centerX + (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
      const y =
        centerY + (R - r) * Math.sin(t) + d * Math.sin(((R - r) / r) * t);

      points.push({ x, y });

      // Keep last 500 points
      if (points.length > 500) {
        points.shift();
      }

      // Draw the spirograph
      if (points.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }

        ctx.stroke();
      }

      t += 0.05;

      // Reset after full cycle
      if (t > 100) {
        t = 0;
        points.length = 0;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" aria-hidden="true" />
    </div>
  );
}
