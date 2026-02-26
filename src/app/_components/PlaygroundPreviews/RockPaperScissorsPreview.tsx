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
