"use client";

import { useEffect, useRef } from "react";
import { label } from "../../_lib/dataset";

// RGB for each cell kind. Amber for train and mint for unseen, as in the
// accuracy chart. Wrong answers are dim: brown for train, red for unseen.
export const CELL = {
  trainRight: [214, 170, 52],
  trainWrong: [74, 60, 26],
  testRight: [70, 224, 173],
  testWrong: [84, 34, 38],
} as const;

// One pixel per (a, b) pair, scaled up with crisp edges. Rows are a, columns b.
// Clicking a cell picks that pair for the query box.
export function AnswerGrid({
  p,
  answer,
  isTrain,
  selected,
  onPick,
}: {
  p: number;
  answer: Uint16Array;
  isTrain: Uint8Array;
  selected: { a: number; b: number };
  onPick: (a: number, b: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx || answer.length !== p * p) return;
    const img = ctx.createImageData(p, p);
    for (let i = 0; i < p * p; i++) {
      const right = answer[i] === label(i, p);
      const rgb = isTrain[i] ? (right ? CELL.trainRight : CELL.trainWrong) : right ? CELL.testRight : CELL.testWrong;
      img.data[4 * i] = rgb[0];
      img.data[4 * i + 1] = rgb[1];
      img.data[4 * i + 2] = rgb[2];
      img.data[4 * i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [p, answer, isTrain]);

  const pick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clamp = (v: number) => Math.min(p - 1, Math.max(0, Math.floor(v * p)));
    onPick(clamp((e.clientY - rect.top) / rect.height), clamp((e.clientX - rect.left) / rect.width));
  };

  const cell = 100 / p;
  return (
    <div className="relative">
      <canvas
        ref={ref}
        width={p}
        height={p}
        onClick={pick}
        className="block aspect-square w-full cursor-crosshair"
        style={{ imageRendering: "pixelated" }}
        role="img"
        aria-label={`Grid of every sum a plus b mod ${p}, coloured by whether the network answers it correctly`}
      />
      <div
        className="pointer-events-none absolute outline outline-2 outline-white"
        style={{
          left: `${selected.b * cell}%`,
          top: `${selected.a * cell}%`,
          width: `${cell}%`,
          height: `${cell}%`,
        }}
        aria-hidden
      />
    </div>
  );
}

export function GridLegend() {
  const items: [string, readonly number[]][] = [
    ["Train, right", CELL.trainRight],
    ["Train, wrong", CELL.trainWrong],
    ["Unseen, right", CELL.testRight],
    ["Unseen, wrong", CELL.testWrong],
  ];
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
      {items.map(([label, rgb]) => (
        <span
          key={label}
          className="flex items-center gap-1.5 font-readout text-[9px] uppercase tracking-[0.18em] text-[var(--muted)]"
        >
          <span
            className="inline-block h-2.5 w-2.5 border border-[var(--line)]"
            style={{ background: `rgb(${rgb.join(",")})` }}
          />
          {label}
        </span>
      ))}
    </div>
  );
}
