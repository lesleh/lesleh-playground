"use client";

import { useEffect, useRef } from "react";

const COLS = 20;
const SCALE = 2;
const GAP = 3;
const CELL = 14 * SCALE + GAP * 2;

const RIGHT = [70, 224, 173];
const WRONG = [255, 106, 92];

// Unseen test digits, each framed mint when the network reads it right and
// red when wrong. Click a digit to load it into the probe.
export function DigitStrip({
  pixels,
  labels,
  answers,
  selected,
  onPick,
}: {
  pixels: Float32Array; // 196 values per digit, in strip order
  labels: Uint8Array;
  answers: Uint8Array | null;
  selected: number | null;
  onPick: (index: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const count = labels.length;
  const rows = Math.ceil(count / COLS);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const w = COLS * CELL;
    const h = rows * CELL;
    const img = ctx.createImageData(w, h);
    const put = (x: number, y: number, rgb: readonly number[], a = 255) => {
      const i = 4 * (y * w + x);
      img.data[i] = rgb[0];
      img.data[i + 1] = rgb[1];
      img.data[i + 2] = rgb[2];
      img.data[i + 3] = a;
    };
    for (let k = 0; k < count; k++) {
      const ox = (k % COLS) * CELL;
      const oy = Math.floor(k / COLS) * CELL;
      const frame =
        k === selected ? [255, 255, 255] : answers ? (answers[k] === labels[k] ? RIGHT : WRONG) : [60, 70, 80];
      // A 2px frame inside the gap, faint when right so the wrong ones stand out.
      const alpha = k === selected || (answers && answers[k] !== labels[k]) ? 255 : 110;
      for (let y = 0; y < CELL; y++) {
        for (let x = 0; x < CELL; x++) {
          if (x < 2 || y < 2 || x >= CELL - 2 || y >= CELL - 2) put(ox + x, oy + y, frame, alpha);
        }
      }
      for (let py = 0; py < 14 * SCALE; py++) {
        for (let px = 0; px < 14 * SCALE; px++) {
          const v = Math.round(pixels[k * 196 + Math.floor(py / SCALE) * 14 + Math.floor(px / SCALE)] * 255);
          put(ox + GAP + px, oy + GAP + py, [v, v, v]);
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [pixels, labels, answers, selected, count, rows]);

  const pick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const col = Math.floor(((e.clientX - rect.left) / rect.width) * COLS);
    const row = Math.floor(((e.clientY - rect.top) / rect.height) * rows);
    const k = row * COLS + col;
    if (k >= 0 && k < count) onPick(k);
  };

  return (
    <canvas
      ref={ref}
      width={COLS * CELL}
      height={rows * CELL}
      onClick={pick}
      className="block h-auto w-full cursor-pointer"
      style={{ imageRendering: "pixelated" }}
      role="img"
      aria-label="Unseen test digits, framed by whether the network reads them correctly"
    />
  );
}
