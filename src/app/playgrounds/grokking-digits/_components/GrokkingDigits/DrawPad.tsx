"use client";

import { useEffect, useRef } from "react";
import { toNetworkInput } from "../../_lib/preprocess";

const SIZE = 280;
const BRUSH = 20;

// Draw a digit with mouse, pen or finger. After each stroke the drawing is
// converted to the network's 14x14 input and passed to onChange. When
// `shown` is set (a digit picked from the strip), the pad displays it instead.
export function DrawPad({
  shown,
  onChange,
}: {
  shown: Float32Array | null;
  onChange: (pixels: Float32Array | null) => void;
}) {
  const padRef = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const ctx = padRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, SIZE, SIZE);
  }, []);

  // Paint a picked strip digit. When `shown` goes back to null the user has
  // started drawing, so leave the canvas alone.
  useEffect(() => {
    const ctx = padRef.current?.getContext("2d");
    if (!ctx || !shown) return;
    const side = Math.sqrt(shown.length);
    const cell = SIZE / side;
    for (let i = 0; i < shown.length; i++) {
      const v = Math.round(shown[i] * 255);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect((i % side) * cell, Math.floor(i / side) * cell, cell, cell);
    }
  }, [shown]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * SIZE, y: ((e.clientY - rect.top) / rect.height) * SIZE };
  };

  const stroke = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const ctx = padRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = BRUSH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const emit = () => {
    const ctx = padRef.current?.getContext("2d");
    if (!ctx) return;
    const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
    const grey = new Float32Array(SIZE * SIZE);
    for (let i = 0; i < grey.length; i++) grey[i] = data[4 * i] / 255;
    onChange(toNetworkInput(grey, SIZE));
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Drawing over a digit picked from the strip starts a fresh drawing.
    if (shown) {
      const ctx = padRef.current?.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, SIZE, SIZE);
      }
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = point(e);
    last.current = p;
    stroke(p, p);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!last.current) return;
    const p = point(e);
    stroke(last.current, p);
    last.current = p;
  };

  const up = () => {
    if (!last.current) return;
    last.current = null;
    emit();
  };

  const clear = () => {
    const ctx = padRef.current?.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, SIZE, SIZE);
    }
    onChange(null);
  };

  return (
    <div>
      <canvas
        ref={padRef}
        width={SIZE}
        height={SIZE}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="block aspect-square w-full cursor-crosshair touch-none rounded-sm border border-[var(--line-2)]"
        style={shown ? { imageRendering: "pixelated" } : undefined}
        aria-label="Drawing pad: draw a digit"
      />
      <button
        type="button"
        onClick={clear}
        className="mt-2 w-full rounded-sm border border-[var(--line-2)] py-1.5 font-readout text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] transition-colors hover:border-[var(--mint)] hover:text-[var(--text)]"
      >
        Clear
      </button>
    </div>
  );
}

// The 14x14 image the network actually receives, scaled up.
export function NetworkView({ pixels }: { pixels: Float32Array | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(14, 14);
    for (let i = 0; i < 196; i++) {
      const v = pixels ? Math.round(pixels[i] * 255) : 0;
      img.data[4 * i] = v;
      img.data[4 * i + 1] = v;
      img.data[4 * i + 2] = v;
      img.data[4 * i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [pixels]);
  return (
    <canvas
      ref={ref}
      width={14}
      height={14}
      className="block aspect-square w-full rounded-sm border border-[var(--line)]"
      style={{ imageRendering: "pixelated" }}
      role="img"
      aria-label="The 14 by 14 image the network sees"
    />
  );
}
