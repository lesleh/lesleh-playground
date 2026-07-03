"use client";

import { useEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "../../_hooks";
import { Disc } from "./_components/Disc";

const DEMO_SEQUENCE = [0, 1, 3, 2, 1, 0, 2, 3];
const LIT_MS = 360;
const STEP_MS = 560;

export function SimonPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef);
  const [lit, setLit] = useState<number | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    const timers: number[] = [];
    let i = 0;

    const tick = () => {
      setLit(DEMO_SEQUENCE[i % DEMO_SEQUENCE.length]);
      timers.push(window.setTimeout(() => setLit(null), LIT_MS));
      timers.push(
        window.setTimeout(() => {
          i += 1;
          tick();
        }, STEP_MS),
      );
    };
    tick();

    return () => {
      timers.forEach((id) => clearTimeout(id));
      setLit(null);
    };
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center bg-[#0b0b12] p-6"
    >
      <Disc lit={lit} onPad={() => {}} disabled />
    </div>
  );
}
