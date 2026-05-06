"use client";

import type { Body, SimParams } from "../../_lib/threeBody";
import { PRESETS, type PresetId } from "../../_lib/presets";
import { STAR_COLORS } from "../../_lib/colors";

interface Props {
  bodies: Body[];
  params: SimParams;
  presetId: PresetId;
  playing: boolean;
  onBodyChange: (i: number, key: BodyNumericKey, value: number) => void;
  onParamChange: (key: keyof SimParams, value: number) => void;
  onPresetChange: (id: PresetId) => void;
  onPlayPauseToggle: () => void;
  onReset: () => void;
}

type BodyNumericKey = "mass" | "x" | "y" | "vx" | "vy";

const BODY_SLIDERS: { key: BodyNumericKey; label: string; min: number; max: number; step: number }[] = [
  { key: "mass", label: "Mass (M☉)", min: 0.1, max: 5, step: 0.05 },
  { key: "x",    label: "X (AU)",     min: -5, max: 5, step: 0.05 },
  { key: "y",    label: "Y (AU)",     min: -5, max: 5, step: 0.05 },
  { key: "vx",   label: "Vx (AU/yr)", min: -10, max: 10, step: 0.1 },
  { key: "vy",   label: "Vy (AU/yr)", min: -10, max: 10, step: 0.1 },
];

const SIM_SLIDERS: { key: keyof SimParams; label: string; min: number; max: number; step: number }[] = [
  { key: "speed",       label: "Speed",  min: 0.1, max: 5,    step: 0.05 },
  { key: "trailLength", label: "Trail",  min: 0,   max: 2000, step: 50 },
  { key: "zoom",        label: "Zoom (AU)", min: 1, max: 20,  step: 0.5 },
];

export function Controls({
  bodies,
  params,
  presetId,
  playing,
  onBodyChange,
  onParamChange,
  onPresetChange,
  onPlayPauseToggle,
  onReset,
}: Props) {
  return (
    <div className="p-4 space-y-5 text-slate-300">
      <section className="space-y-3">
        <label className="block text-xs font-mono uppercase tracking-widest text-slate-500">
          Preset
        </label>
        <select
          value={presetId}
          onChange={(e) => onPresetChange(e.target.value as PresetId)}
          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-slate-500"
        >
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={onPlayPauseToggle}
            className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm font-mono"
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            onClick={onReset}
            className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm font-mono"
          >
            Reset
          </button>
        </div>
      </section>

      <Section title="Simulation">
        {SIM_SLIDERS.map(({ key, label, min, max, step }) => (
          <Slider
            key={key}
            label={label}
            value={params[key]}
            min={min}
            max={max}
            step={step}
            onChange={(v) => onParamChange(key, v)}
          />
        ))}
      </Section>

      {bodies.map((body, i) => (
        <Section
          key={i}
          title={`Body ${i + 1}`}
          accentColor={STAR_COLORS[i].label}
        >
          {BODY_SLIDERS.map(({ key, label, min, max, step }) => (
            <Slider
              key={key}
              label={label}
              value={body[key]}
              min={min}
              max={max}
              step={step}
              onChange={(v) => onBodyChange(i, key, v)}
            />
          ))}
        </Section>
      ))}
    </div>
  );
}

interface SectionProps {
  title: string;
  accentColor?: string;
  children: React.ReactNode;
}

function Section({ title, accentColor, children }: SectionProps) {
  return (
    <details open className="group">
      <summary className="flex items-center gap-2 cursor-pointer list-none text-xs font-mono uppercase tracking-widest text-slate-500 select-none py-1">
        <span className="text-slate-600 group-open:rotate-90 transition-transform">›</span>
        {accentColor && (
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: accentColor }}
          />
        )}
        <span>{title}</span>
      </summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function Slider({ label, value, min, max, step, onChange }: SliderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-slate-400 font-mono">
        <span>{label}</span>
        <span className="text-slate-300 tabular-nums">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-slate-300"
      />
    </div>
  );
}
