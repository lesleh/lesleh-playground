"use client";

import type { BoidParams } from "../../_lib/boids";

const SLIDERS: { label: string; key: keyof BoidParams; min: number; max: number; step: number }[] = [
  { label: "Separation", key: "separation", min: 0, max: 3, step: 0.05 },
  { label: "Alignment",  key: "alignment",  min: 0, max: 3, step: 0.05 },
  { label: "Cohesion",   key: "cohesion",   min: 0, max: 3, step: 0.05 },
  { label: "Speed",      key: "speed",      min: 1, max: 8, step: 0.1 },
];

interface Props {
  params: BoidParams;
  onChange: (key: keyof BoidParams, value: number) => void;
}

export function Controls({ params, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-6 justify-center px-6 py-4 bg-slate-900 border-t border-slate-800">
      {SLIDERS.map(({ label, key, min, max, step }) => (
        <div key={key} className="flex flex-col gap-1.5 min-w-36">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>{label}</span>
            <span>{params[key].toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={params[key]}
            onChange={(e) => onChange(key, parseFloat(e.target.value))}
            className="w-full accent-slate-300"
          />
        </div>
      ))}
    </div>
  );
}
