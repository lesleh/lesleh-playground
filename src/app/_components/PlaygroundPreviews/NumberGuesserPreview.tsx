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
