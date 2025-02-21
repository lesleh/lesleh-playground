"use client";

import { use, useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
}

interface GraphProps {
  numPoints?: number;
}

const COLORS = {
  POINT: "#000",
  CONNECTION: "#999",
} as const;

const SIZES = {
  POINT: 5,
  CONNECTION: 2,
} as const;

type Color = (typeof COLORS)[keyof typeof COLORS];
type Size = (typeof SIZES)[keyof typeof SIZES];

export function Graph({ numPoints = 16 }: GraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      draw(); // Move the draw call here to ensure it happens right after resize
    };

    const calculatePoints = (numPoints: number): Point[] => {
      const points: Point[] = [];
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.4;

      for (let i = 0; i < numPoints; i++) {
        const angle = (i * 2 * Math.PI) / numPoints;
        points.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        });
      }
      return points;
    };

    const drawPoints = (points: Point[]) => {
      if (!ctx) return;
      ctx.fillStyle = COLORS.POINT;
      points.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, SIZES.POINT, 0, 2 * Math.PI);
        ctx.fill();
      });
    };

    const drawConnections = (points: Point[]) => {
      if (!ctx) return;
      ctx.strokeStyle = COLORS.CONNECTION;
      ctx.lineWidth = SIZES.CONNECTION;

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }
    };

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const points = calculatePoints(numPoints);
      drawConnections(points);
      drawPoints(points);
    };

    resizeCanvas();
    draw();

    const controller = new AbortController();
    window.addEventListener(
      "resize",
      () => {
        console.log("resize");

        resizeCanvas();
        draw();
      },
      { signal: controller.signal },
    );

    return () => controller.abort();
  }, [numPoints]);

  return (
    <div className="w-full h-full min-h-[400px]">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
      />
    </div>
  );
}
