// A set of bold, monochrome geometric glyphs drawn with SVG primitives.
// Everything uses currentColor so a card can recolour its icon by setting
// `color`. 16 shapes: enough for the 15-pair hard board with one to spare.

import type { ReactElement } from "react";

export type ShapeKey =
  | "circle"
  | "square"
  | "triangle"
  | "diamond"
  | "star"
  | "plus"
  | "ring"
  | "hexagon"
  | "heart"
  | "droplet"
  | "bolt"
  | "crescent"
  | "arrow"
  | "cross"
  | "sun"
  | "flower";

export const SHAPE_KEYS: ShapeKey[] = [
  "circle",
  "square",
  "triangle",
  "diamond",
  "star",
  "plus",
  "ring",
  "hexagon",
  "heart",
  "droplet",
  "bolt",
  "crescent",
  "arrow",
  "cross",
  "sun",
  "flower",
];

const SHAPES: Record<ShapeKey, ReactElement> = {
  circle: <circle cx="50" cy="50" r="33" fill="currentColor" />,
  square: <rect x="18" y="18" width="64" height="64" rx="7" fill="currentColor" />,
  triangle: <polygon points="50,14 87,82 13,82" fill="currentColor" />,
  diamond: <polygon points="50,9 91,50 50,91 9,50" fill="currentColor" />,
  star: (
    <polygon
      points="50,7 61,38 92,38 67,58 77,90 50,70 23,90 33,58 8,38 39,38"
      fill="currentColor"
    />
  ),
  plus: (
    <path
      d="M41 14 h18 v27 h27 v18 h-27 v27 h-18 v-27 h-27 v-18 h27 z"
      fill="currentColor"
    />
  ),
  ring: (
    <circle
      cx="50"
      cy="50"
      r="30"
      fill="none"
      stroke="currentColor"
      strokeWidth="16"
    />
  ),
  hexagon: (
    <polygon points="50,8 86,29 86,71 50,92 14,71 14,29" fill="currentColor" />
  ),
  heart: (
    <path
      d="M50 85 C14 60 10 34 28 23 C41 15 50 24 50 33 C50 24 59 15 72 23 C90 34 86 60 50 85 Z"
      fill="currentColor"
    />
  ),
  droplet: (
    <path
      d="M50 10 C50 10 20 46 20 64 a30 30 0 1 0 60 0 C80 46 50 10 50 10 Z"
      fill="currentColor"
    />
  ),
  bolt: (
    <polygon points="58,7 25,55 47,55 40,93 78,42 55,42" fill="currentColor" />
  ),
  crescent: (
    <path
      d="M66 12 a40 40 0 1 0 0 76 a30 30 0 1 1 0 -76 Z"
      fill="currentColor"
    />
  ),
  arrow: (
    <polygon
      points="50,9 86,48 65,48 65,91 35,91 35,48 14,48"
      fill="currentColor"
    />
  ),
  cross: (
    <path
      d="M28 18 L50 40 L72 18 L82 28 L60 50 L82 72 L72 82 L50 60 L28 82 L18 72 L40 50 L18 28 Z"
      fill="currentColor"
    />
  ),
  sun: (
    <g stroke="currentColor" strokeWidth="8" strokeLinecap="round">
      <circle cx="50" cy="50" r="17" fill="currentColor" stroke="none" />
      <line x1="50" y1="8" x2="50" y2="22" />
      <line x1="50" y1="78" x2="50" y2="92" />
      <line x1="8" y1="50" x2="22" y2="50" />
      <line x1="78" y1="50" x2="92" y2="50" />
      <line x1="20" y1="20" x2="30" y2="30" />
      <line x1="70" y1="70" x2="80" y2="80" />
      <line x1="80" y1="20" x2="70" y2="30" />
      <line x1="30" y1="70" x2="20" y2="80" />
    </g>
  ),
  flower: (
    <g fill="currentColor">
      <circle cx="50" cy="26" r="15" />
      <circle cx="50" cy="74" r="15" />
      <circle cx="26" cy="50" r="15" />
      <circle cx="74" cy="50" r="15" />
      <circle cx="50" cy="50" r="12" fill="#fffef5" />
    </g>
  ),
};

export function ShapeIcon({
  shape,
  className,
}: {
  shape: ShapeKey;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {SHAPES[shape]}
    </svg>
  );
}
