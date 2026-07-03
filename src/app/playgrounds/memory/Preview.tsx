"use client";

import { useEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "../../_hooks";
import { ShapeIcon, type ShapeKey } from "./_lib/icons";

// A fixed mini-board; two cells flip on a loop to hint at the mechanic.
const CELLS: ShapeKey[] = ["star", "heart", "bolt", "diamond", "ring", "triangle"];
const FLIPPERS = [1, 4];

export function MemoryPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    const id = setInterval(() => setFlipped((f) => !f), 1400);
    return () => clearInterval(id);
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center bg-[#fffef5] p-4"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)
        `,
        backgroundSize: "20px 20px",
      }}
    >
      <div className="grid grid-cols-3 gap-2">
        {CELLS.map((shape, i) => {
          const faceUp = FLIPPERS.includes(i) ? flipped : i % 2 === 0;
          return (
            <div key={i} className="h-12 w-12 [perspective:600px]">
              <div
                className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]"
                style={{ transform: faceUp ? "rotateY(180deg)" : "rotateY(0deg)" }}
              >
                <div className="absolute inset-0 flex items-center justify-center rounded-md border-2 border-black bg-black text-[#fffef5] [backface-visibility:hidden]">
                  <span className="font-roboto-slab text-lg font-black">?</span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center rounded-md border-2 border-black bg-[#fffef5] p-2 text-black [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <ShapeIcon shape={shape} className="h-full w-full" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
