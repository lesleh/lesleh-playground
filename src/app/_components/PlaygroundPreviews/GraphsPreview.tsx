"use client";

import { useEffect, useRef } from "react";
import { useIntersectionObserver } from "../../_hooks";

export function GraphsPreview() {
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

    const nodes = [
      { x: width * 0.2, y: height * 0.3 },
      { x: width * 0.5, y: height * 0.2 },
      { x: width * 0.8, y: height * 0.4 },
      { x: width * 0.3, y: height * 0.7 },
      { x: width * 0.7, y: height * 0.8 },
    ];

    const connections = [
      [0, 1],
      [1, 2],
      [0, 3],
      [3, 4],
      [2, 4],
    ];

    let pulse = 0;

    function animate() {
      if (!ctx) return;

      ctx.fillStyle = "#f9fafb";
      ctx.fillRect(0, 0, width, height);

      // Draw connections
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;

      connections.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      });

      // Draw nodes with pulse effect
      const pulseSize = Math.sin(pulse) * 3 + 8;

      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = "#3b82f6";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize + 4, 0, Math.PI * 2);
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      pulse += 0.05;

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
