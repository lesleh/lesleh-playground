"use client";

import { useRef, useState } from "react";
import { Link } from "../../../components/Link";
import { useElementSize } from "./_hooks/useElementSize";

function makeGradientStops(
  colors: string[],
): { color: string; stop: number }[] {
  const stops = [];
  const step = 1 / colors.length;
  for (let i = 0; i < colors.length; i++) {
    const color = colors[i];
    const start = i * step;
    const end = (i + 1) * step;
    stops.push({ color, stop: start });
    stops.push({ color, stop: end });
  }
  return stops;
}

function makeGradient(
  stops: { color: string; stop: number }[],
  angle: number,
  type: "linear" | "radial" = "linear",
): string {
  if (type === "radial") {
    return `radial-gradient(circle, ${stops
      .map(({ color, stop }) => `${color} ${(stop * 100).toFixed(3)}%`)
      .join(", ")})`;
  }
  return `linear-gradient(${(angle * 360).toFixed(3)}deg, ${stops
    .map(({ color, stop }) => `${color} ${(stop * 100).toFixed(3)}%`)
    .join(", ")})`;
}

export default function GradientsPage() {
  const outputRef = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(outputRef);
  const [angle, setAngle] = useState(0.25);
  const [gradientType, setGradientType] = useState<"linear" | "radial">(
    "linear",
  );

  const colors = [
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "indigo",
    "violet",
  ];

  const stops = makeGradientStops(colors);
  const gradient = makeGradient(stops, angle, gradientType);

  return (
    <div className="grid grid-cols-[300px,1fr] grid-rows-[auto,1fr] h-full">
      <div className="p-2 col-span-2">
        <Link href="/">Home</Link>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 items-center">
          <label htmlFor="gradient-type" className="text-right">
            Type
          </label>
          <select
            id="gradient-type"
            className="w-full"
            value={gradientType}
            onChange={(e) =>
              setGradientType(e.target.value as "linear" | "radial")
            }
          >
            <option value="linear">Linear</option>
            <option value="radial">Radial</option>
          </select>
          <label htmlFor="angle" className="text-right">
            Angle
          </label>
          <input
            className="w-full"
            id="angle"
            type="range"
            min="0"
            max="1"
            step="0.0027777777"
            value={angle}
            onChange={(e) => setAngle(parseFloat(e.target.value))}
            disabled={gradientType === "radial"}
          />
          <label htmlFor="gradient-code" className="text-right">
            Code
          </label>
          <textarea
            id="gradient-code"
            className="w-full"
            value={gradient}
            readOnly
          ></textarea>
        </div>
      </div>
      <div
        ref={outputRef}
        style={{
          backgroundImage: gradient,
          backgroundSize: `${width}px ${height}px`,
        }}
      ></div>
    </div>
  );
}
