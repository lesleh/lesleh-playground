"use client";

import { useEffect, useRef } from "react";
import { useIntersectionObserver } from "../../_hooks";

export function PlanetsPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef);
  const animationFrameRef = useRef<number>();

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
    const centerX = width / 2;
    const centerY = height / 2;

    let angle = 0;

    const planets = [
      { radius: 40, speed: 0.02, size: 8, color: "#3b82f6" },
      { radius: 70, speed: 0.015, size: 6, color: "#8b5cf6" },
      { radius: 100, speed: 0.01, size: 10, color: "#ec4899" },
    ];

    function animate() {
      if (!ctx || !canvas) return;

      ctx.fillStyle = "rgba(17, 24, 39, 0.1)";
      ctx.fillRect(0, 0, width, height);

      // Draw sun
      ctx.beginPath();
      ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
      ctx.fillStyle = "#fbbf24";
      ctx.fill();

      // Draw planets
      planets.forEach((planet) => {
        const x = centerX + Math.cos(angle * planet.speed) * planet.radius;
        const y = centerY + Math.sin(angle * planet.speed) * planet.radius;

        // Draw orbit trail
        ctx.beginPath();
        ctx.arc(centerX, centerY, planet.radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw planet
        ctx.beginPath();
        ctx.arc(x, y, planet.size, 0, Math.PI * 2);
        ctx.fillStyle = planet.color;
        ctx.fill();
      });

      angle += 1;

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    // Initial dark background
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, width, height);

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible]);

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-900">
      <canvas ref={canvasRef} className="w-full h-full" aria-hidden="true" />
    </div>
  );
}
