"use client";

import { useRef, useState } from "react";
import { useList } from "./_hooks/useList";
import { ColorList } from "./_components/ColorList";

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
  type: "linear" | "radial" | "conic" = "linear",
): string {
  if (type === "radial") {
    return `radial-gradient(circle, ${stops
      .map(({ color, stop }) => `${color} ${(stop * 100).toFixed(3)}%`)
      .join(", ")})`;
  }
  if (type === "conic") {
    return `conic-gradient(from ${(angle * 360).toFixed(3)}deg, ${stops
      .map(({ color, stop }) => `${color} ${(stop * 100).toFixed(3)}%`)
      .join(", ")})`;
  }
  return `linear-gradient(${(angle * 360).toFixed(3)}deg, ${stops
    .map(({ color, stop }) => `${color} ${(stop * 100).toFixed(3)}%`)
    .join(", ")})`;
}

export default function GradientsPage() {
  const outputRef = useRef<HTMLDivElement>(null);
  const [angle, setAngle] = useState(0.25);
  const {
    list: colors,
    set: setColors,
    removeAt: removeColor,
    setValueAt: setColorAt,
    add: addColor,
  } = useList(["#FF0000", "#00FF00", "#0000FF"]);
  const [gradientType, setGradientType] = useState<
    "linear" | "radial" | "conic"
  >("linear");

  const stops = makeGradientStops(colors);
  const gradient = makeGradient(stops, angle, gradientType);

  return (
    <div className="grid grid-cols-[300px,1fr] h-full">
      <div className="p-4 overflow-y-auto">
        <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 items-center">
          <label htmlFor="gradient-type" className="text-right">
            Type
          </label>
          <select
            id="gradient-type"
            className="w-full p-2 rounded"
            value={gradientType}
            onChange={(e) =>
              setGradientType(e.target.value as "linear" | "radial" | "conic")
            }
          >
            <option value="linear">Linear</option>
            <option value="radial">Radial</option>
            <option value="conic">Conic</option>
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
        </div>
        <ColorList
          colors={colors}
          onRemove={(index: number) => removeColor(index)}
          onColorChange={(index: number, color: string) =>
            setColorAt(index, color)
          }
          addColor={(color: string) => addColor(color)}
        />
      </div>
      <div
        ref={outputRef}
        style={{
          backgroundImage: gradient,
        }}
      ></div>
    </div>
  );
}
