"use client";

import { useEffect, useRef } from "react";
import { useIntersectionObserver } from "../../_hooks";

export function GradientsPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isVisible) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;

    let hue = 0;

    function animate() {
      if (!ctx) return;

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, `hsl(${hue}, 70%, 60%)`);
      gradient.addColorStop(0.5, `hsl(${(hue + 60) % 360}, 70%, 60%)`);
      gradient.addColorStop(1, `hsl(${(hue + 120) % 360}, 70%, 60%)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      hue = (hue + 0.5) % 360;

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
