"use client";

import { useRef } from "react";
import { useIntersectionObserver } from "../../_hooks";

// A humanoid robot striding across the ground: head, torso, swinging arms and
// legs in a gait cycle. Only animates while the card is on screen.
export function EvolvingWalkersPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef);

  const swing = (values: string, dur = "0.7s") =>
    isVisible ? (
      <animateTransform
        attributeName="transform"
        type="rotate"
        values={values}
        dur={dur}
        repeatCount="indefinite"
        additive="sum"
      />
    ) : null;

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center bg-[#0d0d0d]"
    >
      <svg viewBox="0 0 200 140" className="h-full w-full">
        {[30, 80, 130, 180].map((x) => (
          <line key={x} x1={x} y1={116} x2={x} y2={122} stroke="#2a3340" strokeWidth={1.5} />
        ))}
        <line x1="0" y1="116" x2="200" y2="116" stroke="#4b5563" strokeWidth={1.5} />

        <g>
          {isVisible && (
            <animateTransform
              attributeName="transform"
              type="translate"
              from="-30 0"
              to="210 0"
              dur="7s"
              repeatCount="indefinite"
            />
          )}
          {/* body, hip at local (60, 76) */}
          <g transform="translate(60 40)">
            {/* back limbs (drawn first, dimmer) */}
            <g transform="translate(0 36)">
              <line x1="0" y1="0" x2="0" y2="36" stroke="#2f7d8a" strokeWidth={4} strokeLinecap="round" />
              <circle cx="0" cy="36" r="3" fill="#46e0ad" />
              {swing("18;-18;18")}
            </g>
            <g transform="translate(0 2)">
              <line x1="0" y1="0" x2="0" y2="26" stroke="#2f7d8a" strokeWidth={3.5} strokeLinecap="round" />
              {swing("-16;16;-16")}
            </g>

            {/* torso + head */}
            <line x1="0" y1="2" x2="0" y2="36" stroke="#38bdf8" strokeWidth={5} strokeLinecap="round" />
            <circle cx="0" cy="-8" r="8" fill="#0d1016" stroke="#5ad3e2" strokeWidth={2.5} />
            <circle cx="3" cy="-8" r="2" fill="#f7c948" />

            {/* front limbs (drawn last, brighter) */}
            <g transform="translate(0 2)">
              <line x1="0" y1="0" x2="0" y2="26" stroke="#5ad3e2" strokeWidth={3.5} strokeLinecap="round" />
              <circle cx="0" cy="26" r="2.5" fill="#5ad3e2" />
              {swing("16;-16;16")}
            </g>
            <g transform="translate(0 36)">
              <line x1="0" y1="0" x2="0" y2="36" stroke="#5ad3e2" strokeWidth={4} strokeLinecap="round" />
              <circle cx="0" cy="36" r="3" fill="#46e0ad" />
              {swing("-18;18;-18")}
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
