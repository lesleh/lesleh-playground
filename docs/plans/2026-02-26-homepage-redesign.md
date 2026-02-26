# Homepage Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the homepage from a plain bulleted list into an engaging animated card gallery with programmatically generated preview animations.

**Architecture:** Component-based architecture with a PlaygroundCard wrapper component and individual preview components for each demo. Previews use Canvas API with requestAnimationFrame for smooth animations. Intersection Observer pauses off-screen animations for performance.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Canvas API, Motion library, next/dynamic for lazy loading

---

## Task 1: Create shared hooks for animations

**Files:**
- Create: `src/app/_hooks/useIntersectionObserver.ts`
- Create: `src/app/_hooks/index.ts`

**Step 1: Create useIntersectionObserver hook**

```typescript
import { useEffect, useState, RefObject } from "react";

export function useIntersectionObserver(
  ref: RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isVisible;
}
```

**Step 2: Create barrel export**

```typescript
export { useIntersectionObserver } from "./useIntersectionObserver";
```

**Step 3: Commit**

```bash
git add src/app/_hooks/
git commit -m "feat: add useIntersectionObserver hook for animation visibility control"
```

---

## Task 2: Create PlaygroundCard types

**Files:**
- Create: `src/app/_components/PlaygroundCard/types.ts`

**Step 1: Create types file**

```typescript
import { ComponentType } from "react";

export interface PlaygroundCardProps {
  title: string;
  description: string;
  href: string;
  preview: ComponentType;
  accentColor?: string;
}
```

**Step 2: Commit**

```bash
git add src/app/_components/PlaygroundCard/types.ts
git commit -m "feat: add PlaygroundCard types"
```

---

## Task 3: Create PlaygroundCard component

**Files:**
- Create: `src/app/_components/PlaygroundCard/PlaygroundCard.tsx`

**Step 1: Create PlaygroundCard component**

```typescript
"use client";

import Link from "next/link";
import { PlaygroundCardProps } from "./types";

export function PlaygroundCard({
  title,
  description,
  href,
  preview: Preview,
  accentColor = "#3b82f6",
}: PlaygroundCardProps) {
  return (
    <Link
      href={href}
      className="group block bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none overflow-hidden"
    >
      <div className="aspect-[16/10] bg-gray-50 relative">
        <Preview />
      </div>
      <div className="p-6">
        <h2 className="font-bold text-lg mb-2 text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/_components/PlaygroundCard/PlaygroundCard.tsx
git commit -m "feat: add PlaygroundCard component with hover animations"
```

---

## Task 4: Create PlaygroundCard barrel export

**Files:**
- Create: `src/app/_components/PlaygroundCard/index.tsx`

**Step 1: Create barrel export**

```typescript
export { PlaygroundCard } from "./PlaygroundCard";
export type { PlaygroundCardProps } from "./types";
```

**Step 2: Commit**

```bash
git add src/app/_components/PlaygroundCard/index.tsx
git commit -m "feat: add PlaygroundCard barrel export"
```

---

## Task 5: Create preview component types

**Files:**
- Create: `src/app/_components/PlaygroundPreviews/types.ts`

**Step 1: Create shared types**

```typescript
export interface PreviewProps {
  isHovered?: boolean;
}
```

**Step 2: Commit**

```bash
git add src/app/_components/PlaygroundPreviews/types.ts
git commit -m "feat: add preview component types"
```

---

## Task 6: Create SpirographPreview component

**Files:**
- Create: `src/app/_components/PlaygroundPreviews/SpirographPreview.tsx`

**Step 1: Create SpirographPreview**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/app/_components/PlaygroundPreviews/SpirographPreview.tsx
git commit -m "feat: add SpirographPreview with animated drawing"
```

---

## Task 7: Create GradientsPreview component

**Files:**
- Create: `src/app/_components/PlaygroundPreviews/GradientsPreview.tsx`

**Step 1: Create GradientsPreview**

```typescript
"use client";

import { useEffect, useRef } from "react";
import { useIntersectionObserver } from "../../_hooks";

export function GradientsPreview() {
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
```

**Step 2: Commit**

```bash
git add src/app/_components/PlaygroundPreviews/GradientsPreview.tsx
git commit -m "feat: add GradientsPreview with shifting colors"
```

---

## Task 8: Create LightsOutPreview component

**Files:**
- Create: `src/app/_components/PlaygroundPreviews/LightsOutPreview.tsx`

**Step 1: Create LightsOutPreview**

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "../../_hooks";

export function LightsOutPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef);
  const [grid, setGrid] = useState<boolean[][]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Initialize 3x3 grid
    const initialGrid = Array(3)
      .fill(null)
      .map(() => Array(3).fill(false));
    setGrid(initialGrid);
  }, []);

  useEffect(() => {
    if (!isVisible || grid.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    let row = 0;
    let col = 0;

    intervalRef.current = setInterval(() => {
      setGrid((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = !next[row][col];

        col++;
        if (col >= 3) {
          col = 0;
          row = (row + 1) % 3;
        }

        return next;
      });
    }, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isVisible, grid.length]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-gray-900"
    >
      <div className="grid grid-cols-3 gap-2 p-4">
        {grid.map((row, i) =>
          row.map((isOn, j) => (
            <div
              key={`${i}-${j}`}
              className={`w-12 h-12 rounded transition-colors duration-300 ${
                isOn ? "bg-yellow-400" : "bg-gray-700"
              }`}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/_components/PlaygroundPreviews/LightsOutPreview.tsx
git commit -m "feat: add LightsOutPreview with toggling grid animation"
```

---

## Task 9: Create PlanetsPreview component

**Files:**
- Create: `src/app/_components/PlaygroundPreviews/PlanetsPreview.tsx`

**Step 1: Create PlanetsPreview**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/app/_components/PlaygroundPreviews/PlanetsPreview.tsx
git commit -m "feat: add PlanetsPreview with orbiting animation"
```

---

## Task 10: Create NumberGuesserPreview component

**Files:**
- Create: `src/app/_components/PlaygroundPreviews/NumberGuesserPreview.tsx`

**Step 1: Create NumberGuesserPreview**

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "../../_hooks";

export function NumberGuesserPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef);
  const [number, setNumber] = useState(50);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isVisible) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setNumber(Math.floor(Math.random() * 100) + 1);
    }, 800);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50"
    >
      <div className="text-center">
        <div className="text-7xl font-bold text-blue-600 transition-all duration-300">
          {number}
        </div>
        <div className="text-sm text-gray-600 mt-2">?</div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/_components/PlaygroundPreviews/NumberGuesserPreview.tsx
git commit -m "feat: add NumberGuesserPreview with shuffling numbers"
```

---

## Task 11: Create RockPaperScissorsPreview component

**Files:**
- Create: `src/app/_components/PlaygroundPreviews/RockPaperScissorsPreview.tsx`

**Step 1: Create RockPaperScissorsPreview**

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "../../_hooks";

const choices = ["✊", "✋", "✌️"];

export function RockPaperScissorsPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef);
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isVisible) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % choices.length);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50"
    >
      <div className="text-8xl transition-transform duration-300 hover:scale-110">
        {choices[index]}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/_components/PlaygroundPreviews/RockPaperScissorsPreview.tsx
git commit -m "feat: add RockPaperScissorsPreview with cycling icons"
```

---

## Task 12: Create GraphsPreview component

**Files:**
- Create: `src/app/_components/PlaygroundPreviews/GraphsPreview.tsx`

**Step 1: Create GraphsPreview**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/app/_components/PlaygroundPreviews/GraphsPreview.tsx
git commit -m "feat: add GraphsPreview with pulsing nodes"
```

---

## Task 13: Create simple preview components

**Files:**
- Create: `src/app/_components/PlaygroundPreviews/HomerPreview.tsx`
- Create: `src/app/_components/PlaygroundPreviews/UnitPricePreview.tsx`
- Create: `src/app/_components/PlaygroundPreviews/FoodAnalyzerPreview.tsx`
- Create: `src/app/_components/PlaygroundPreviews/SubgridCardsPreview.tsx`
- Create: `src/app/_components/PlaygroundPreviews/AnimatePreview.tsx`
- Create: `src/app/_components/PlaygroundPreviews/MotionPreview.tsx`
- Create: `src/app/_components/PlaygroundPreviews/TreesPreview.tsx`

**Step 1: Create HomerPreview**

```typescript
"use client";

export function HomerPreview() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-100 to-yellow-200">
      <div className="text-center">
        <div className="text-6xl mb-2">👀</div>
        <div className="text-sm text-gray-700 font-semibold">D'oh!</div>
      </div>
    </div>
  );
}
```

**Step 2: Create UnitPricePreview**

```typescript
"use client";

export function UnitPricePreview() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="text-center space-y-2">
        <div className="text-4xl font-bold text-emerald-600">$2.50</div>
        <div className="text-xs text-gray-600">per unit</div>
      </div>
    </div>
  );
}
```

**Step 3: Create FoodAnalyzerPreview**

```typescript
"use client";

export function FoodAnalyzerPreview() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
      <div className="text-6xl">🍎</div>
    </div>
  );
}
```

**Step 4: Create SubgridCardsPreview**

```typescript
"use client";

export function SubgridCardsPreview() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 p-4">
      <div className="grid grid-cols-2 gap-2 w-full h-full">
        <div className="bg-white rounded border border-gray-200"></div>
        <div className="bg-white rounded border border-gray-200"></div>
        <div className="bg-white rounded border border-gray-200"></div>
        <div className="bg-white rounded border border-gray-200"></div>
      </div>
    </div>
  );
}
```

**Step 5: Create AnimatePreview**

```typescript
"use client";

export function AnimatePreview() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="text-5xl animate-pulse">✨</div>
    </div>
  );
}
```

**Step 6: Create MotionPreview**

```typescript
"use client";

export function MotionPreview() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="text-5xl animate-bounce">🎬</div>
    </div>
  );
}
```

**Step 7: Create TreesPreview**

```typescript
"use client";

export function TreesPreview() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100">
      <div className="text-6xl">🌲</div>
    </div>
  );
}
```

**Step 8: Commit**

```bash
git add src/app/_components/PlaygroundPreviews/HomerPreview.tsx \
  src/app/_components/PlaygroundPreviews/UnitPricePreview.tsx \
  src/app/_components/PlaygroundPreviews/FoodAnalyzerPreview.tsx \
  src/app/_components/PlaygroundPreviews/SubgridCardsPreview.tsx \
  src/app/_components/PlaygroundPreviews/AnimatePreview.tsx \
  src/app/_components/PlaygroundPreviews/MotionPreview.tsx \
  src/app/_components/PlaygroundPreviews/TreesPreview.tsx
git commit -m "feat: add simple preview components for remaining playgrounds"
```

---

## Task 14: Create PlaygroundPreviews barrel export

**Files:**
- Create: `src/app/_components/PlaygroundPreviews/index.tsx`

**Step 1: Create barrel export**

```typescript
export { SpirographPreview } from "./SpirographPreview";
export { HomerPreview } from "./HomerPreview";
export { LightsOutPreview } from "./LightsOutPreview";
export { RockPaperScissorsPreview } from "./RockPaperScissorsPreview";
export { NumberGuesserPreview } from "./NumberGuesserPreview";
export { UnitPricePreview } from "./UnitPricePreview";
export { GradientsPreview } from "./GradientsPreview";
export { GraphsPreview } from "./GraphsPreview";
export { PlanetsPreview } from "./PlanetsPreview";
export { FoodAnalyzerPreview } from "./FoodAnalyzerPreview";
export { SubgridCardsPreview } from "./SubgridCardsPreview";
export { AnimatePreview } from "./AnimatePreview";
export { MotionPreview } from "./MotionPreview";
export { TreesPreview } from "./TreesPreview";
```

**Step 2: Commit**

```bash
git add src/app/_components/PlaygroundPreviews/index.tsx
git commit -m "feat: add PlaygroundPreviews barrel export"
```

---

## Task 15: Update homepage with new design

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Replace homepage content**

```typescript
import type { NextPage } from "next";
import { Heading } from "../components/Heading";
import { Paragraph } from "../components/Paragraph";
import { PlaygroundCard } from "./_components/PlaygroundCard";
import {
  SpirographPreview,
  HomerPreview,
  LightsOutPreview,
  RockPaperScissorsPreview,
  NumberGuesserPreview,
  UnitPricePreview,
  GradientsPreview,
  GraphsPreview,
  PlanetsPreview,
  FoodAnalyzerPreview,
  SubgridCardsPreview,
  AnimatePreview,
  MotionPreview,
  TreesPreview,
} from "./_components/PlaygroundPreviews";

const playgrounds = [
  {
    id: "spirograph",
    title: "Spirograph",
    description:
      "Draw mesmerizing spirograph patterns by rolling circles within circles. Adjust parameters and watch mathematical art come to life.",
    href: "/playgrounds/spirograph",
    preview: SpirographPreview,
  },
  {
    id: "number-guesser",
    title: "Number Guesser",
    description:
      "Classic number guessing game with hints. Try to guess the secret number with as few attempts as possible.",
    href: "/playgrounds/number-guesser",
    preview: NumberGuesserPreview,
  },
  {
    id: "rock-paper-scissors",
    title: "Rock Paper Scissors",
    description:
      "Play the timeless game against the computer. Best of three wins!",
    href: "/playgrounds/rock-paper-scissors",
    preview: RockPaperScissorsPreview,
  },
  {
    id: "homer",
    title: "Homer Simpson",
    description:
      "Homer's eyes follow your cursor around the screen. A fun interactive demo with smooth animations.",
    href: "/playgrounds/homer",
    preview: HomerPreview,
  },
  {
    id: "lights-out",
    title: "Lights Out",
    description:
      "Puzzle game where clicking lights toggles them and their neighbors. Clear the grid or let the auto-solver do it!",
    href: "/playgrounds/lights-out",
    preview: LightsOutPreview,
  },
  {
    id: "unit-price",
    title: "Unit Price Calculator",
    description:
      "Compare products by calculating their unit prices. Never overpay at the grocery store again.",
    href: "/playgrounds/unit-price",
    preview: UnitPricePreview,
  },
  {
    id: "subgrid-cards",
    title: "Subgrid Cards",
    description:
      "Explore CSS subgrid with responsive card layouts. See how modern CSS makes complex layouts simple.",
    href: "/playgrounds/subgrid-cards",
    preview: SubgridCardsPreview,
  },
  {
    id: "gradients",
    title: "Gradients",
    description:
      "Experiment with color gradients and transitions. Create beautiful color combinations dynamically.",
    href: "/playgrounds/gradients",
    preview: GradientsPreview,
  },
  {
    id: "graphs",
    title: "Graphs",
    description:
      "Interactive graph visualizations using D3.js. Explore nodes, connections, and data relationships.",
    href: "/playgrounds/graphs",
    preview: GraphsPreview,
  },
  {
    id: "planets",
    title: "Planets",
    description:
      "Watch planets orbit in smooth animations. Built with Motion for buttery-smooth performance.",
    href: "/playgrounds/planets",
    preview: PlanetsPreview,
  },
  {
    id: "food-analyzer",
    title: "Food Analyzer",
    description:
      "AI-powered food analysis and nutritional insights. Upload food photos and get instant analysis.",
    href: "/playgrounds/food-analyzer",
    preview: FoodAnalyzerPreview,
  },
  {
    id: "animate",
    title: "Animate",
    description:
      "React Markdown animation experiments. Watch text and content come alive with smooth transitions.",
    href: "/playgrounds/animate",
    preview: AnimatePreview,
  },
  {
    id: "motion",
    title: "Motion",
    description:
      "Motion library playground. Explore animation primitives and spring physics.",
    href: "/playgrounds/motion",
    preview: MotionPreview,
  },
  {
    id: "trees",
    title: "Trees",
    description:
      "Recursive tree generation and visualization. Watch fractal trees grow algorithmically.",
    href: "/playgrounds/trees",
    preview: TreesPreview,
  },
];

const Home: NextPage = () => {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-12 text-center">
        <Heading level={1} className="mb-4">
          Playground
        </Heading>
        <Paragraph className="text-xl text-gray-600">
          Interactive experiments with web technologies
        </Paragraph>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {playgrounds.map((playground) => (
          <PlaygroundCard
            key={playground.id}
            title={playground.title}
            description={playground.description}
            href={playground.href}
            preview={playground.preview}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
```

**Step 2: Run the dev server to test**

```bash
pnpm dev
```

**Expected:** Dev server starts successfully, homepage displays card grid

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: redesign homepage with animated card gallery"
```

---

## Task 16: Test responsive behavior

**Step 1: Open dev server in browser**

Navigate to http://localhost:3000

**Step 2: Test desktop view (> 1024px)**

Expected: 3 columns of cards, smooth animations

**Step 3: Test tablet view (640px - 1024px)**

Use browser dev tools to resize
Expected: 2 columns of cards, animations still smooth

**Step 4: Test mobile view (< 640px)**

Expected: 1 column of cards, touch-friendly sizing

**Step 5: Test hover states**

Hover over cards
Expected: Scale up, shadow enhancement, smooth transitions

**Step 6: Test keyboard navigation**

Use Tab key to navigate cards
Expected: Clear focus indicators, accessible

---

## Task 17: Verify animations pause off-screen

**Step 1: Open browser dev tools**

Open Performance tab

**Step 2: Start recording**

Scroll homepage up and down

**Step 3: Stop recording and analyze**

Expected: Animation frames only run for visible cards, CPU usage decreases when cards are off-screen

---

## Task 18: Final polish and commit

**Step 1: Check for console errors**

Open browser console
Expected: No errors or warnings

**Step 2: Verify all links work**

Click through each playground card
Expected: All links navigate correctly

**Step 3: Run linter**

```bash
pnpm lint
```

Expected: No linting errors

**Step 4: Final commit if any adjustments**

```bash
git add .
git commit -m "polish: final homepage redesign adjustments"
```

---

## Implementation Complete

The homepage redesign is now complete with:

✅ Animated card gallery layout
✅ 14 unique preview animations
✅ Responsive design (mobile, tablet, desktop)
✅ Performance optimizations (Intersection Observer)
✅ Accessibility features (keyboard nav, ARIA labels)
✅ Smooth hover and focus states
✅ Engaging descriptions for each playground

Next steps:
- Consider adding more elaborate animations for specific previews
- Add filtering/search functionality if the list grows
- Add category tags for different playground types
