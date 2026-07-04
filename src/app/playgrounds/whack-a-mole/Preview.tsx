"use client";

import { useEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "../../_hooks";
import { Mole } from "./_components/WhackAMole/Mole";

// A fixed 3-hole scene; the moles pop up in sequence to hint at the mechanic.
const HOLES = [0, 1, 2];

export function WhackAMolePreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef);
  const [active, setActive] = useState(1);

  useEffect(() => {
    if (!isVisible) return;
    const id = setInterval(() => setActive((a) => (a + 1) % HOLES.length), 700);
    return () => clearInterval(id);
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center bg-[#fffef5] p-5"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)
        `,
        backgroundSize: "20px 20px",
      }}
    >
      <div
        className="flex items-end justify-center gap-3 rounded-lg border-[3px] border-black p-4"
        style={{
          backgroundColor: "#8fb45f",
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.14) 1.5px, transparent 1.5px)",
          backgroundSize: "12px 12px",
        }}
      >
        {HOLES.map((i) => {
          const up = i === active;
          return (
            <div
              key={i}
              className="relative h-20 w-20 overflow-hidden rounded-2xl border-[3px] border-black"
              style={{ backgroundColor: "#d9b98c" }}
            >
              <div className="absolute inset-x-[16%] bottom-[14%] top-[46%] rounded-[50%] border-[3px] border-black bg-[#3a2a1a]" />
              <div
                className="absolute inset-x-[20%] bottom-[16%] transition-transform duration-200 ease-out"
                style={{ transform: up ? "translateY(0)" : "translateY(130%)" }}
              >
                <Mole hit={false} />
              </div>
              <div
                className="absolute inset-x-0 bottom-0 h-[20%] rounded-t-[50%] border-t-[3px] border-black"
                style={{ backgroundColor: "#c8a373" }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
