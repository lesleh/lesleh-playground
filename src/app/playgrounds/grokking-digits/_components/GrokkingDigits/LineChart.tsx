"use client";

import type { HistoryPoint } from "../../_lib/trainer";

const PAD = { l: 38, r: 22, t: 10, b: 22 };

export interface Series {
  key: keyof HistoryPoint;
  colour: string;
  label: string;
}

export interface Marker {
  step: number;
  label: string;
  colour: string;
}

// Log-scale step axis: the classic grokking plot, where memorising and
// generalising sit decades apart. "fit" is a linear y axis fitted to the data.
export function LineChart({
  history,
  series,
  yScale,
  markers = [],
  xMax,
  ariaLabel,
  width: W = 560,
  height: H = 180,
}: {
  history: HistoryPoint[];
  series: Series[];
  yScale: "unit" | "log" | "fit";
  markers?: Marker[];
  xMax: number;
  ariaLabel: string;
  width?: number;
  height?: number;
}) {
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const logMax = Math.log10(xMax);
  const x = (step: number) => PAD.l + (Math.log10(Math.max(1, step)) / logMax) * iw;

  let lo = Infinity;
  let hi = -Infinity;
  for (const pt of history) {
    for (const s of series) {
      const v = pt[s.key];
      if (v > 0) {
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
    }
  }
  if (!Number.isFinite(lo)) {
    lo = 1e-3;
    hi = 10;
  }

  let yLo = 0;
  let yHi = 1;
  let yTicks = [0, 0.25, 0.5, 0.75, 1];
  if (yScale === "log") {
    yLo = Math.floor(Math.log10(Math.max(lo, 1e-6)));
    yHi = Math.max(yLo + 1, Math.ceil(Math.log10(hi)));
    // Thin the decade ticks so they stay legible.
    const every = Math.ceil((yHi - yLo + 1) / 5);
    yTicks = [];
    for (let e = yHi; e >= yLo; e -= every) yTicks.push(10 ** e);
  } else if (yScale === "fit") {
    const stepSize = niceStep((hi - lo) / 4 || 1);
    yLo = Math.floor(lo / stepSize) * stepSize;
    yHi = Math.max(yLo + stepSize, Math.ceil(hi / stepSize) * stepSize);
    yTicks = [];
    for (let v = yLo; v <= yHi + stepSize / 2; v += stepSize) yTicks.push(v);
  }
  const y = (v: number) => {
    const t = yScale === "log" ? (Math.log10(Math.max(v, 10 ** yLo)) - yLo) / (yHi - yLo) : (v - yLo) / (yHi - yLo);
    return PAD.t + (1 - t) * ih;
  };

  const xTicks: number[] = [];
  for (let e = 0; e <= Math.floor(logMax); e++) xTicks.push(10 ** e);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="rgba(150,180,205,0.10)" />
          <text x={PAD.l - 6} y={y(v) + 3} textAnchor="end" className="fill-[var(--muted)] font-readout text-[9px]">
            {yScale === "log" ? formatPow(v) : yScale === "fit" ? String(Math.round(v)) : `${Math.round(v * 100)}%`}
          </text>
        </g>
      ))}
      {xTicks.map((v) => (
        <g key={v}>
          <line x1={x(v)} x2={x(v)} y1={PAD.t} y2={H - PAD.b} stroke="rgba(150,180,205,0.10)" />
          <text x={x(v)} y={H - 6} textAnchor="middle" className="fill-[var(--muted)] font-readout text-[9px]">
            {v.toLocaleString("en-GB")}
          </text>
        </g>
      ))}

      {markers.map((m, i) => {
        // Flip the label to the left of its line near the right edge, and
        // stack labels so markers close together do not overlap.
        const flip = x(m.step) > PAD.l + (W - PAD.l - PAD.r) * 0.75;
        return (
          <g key={m.label}>
            <line
              x1={x(m.step)}
              x2={x(m.step)}
              y1={PAD.t}
              y2={H - PAD.b}
              stroke={m.colour}
              strokeDasharray="3 3"
              opacity={0.7}
            />
            <text
              x={x(m.step) + (flip ? -4 : 4)}
              y={PAD.t + 9 + i * 12}
              textAnchor={flip ? "end" : "start"}
              className="font-readout text-[9px]"
              fill={m.colour}
            >
              {m.label}
            </text>
          </g>
        );
      })}

      {history.length > 1 &&
        series.map((s) => (
          <path
            key={s.key}
            d={`M ${history.map((pt) => `${x(pt.step).toFixed(1)},${y(pt[s.key]).toFixed(1)}`).join(" L ")}`}
            fill="none"
            stroke={s.colour}
            strokeWidth={1.75}
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 2px ${s.colour})` }}
          />
        ))}
    </svg>
  );
}

function niceStep(raw: number): number {
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
}

function formatPow(v: number): string {
  if (v >= 1) return String(Math.round(v));
  return `1e${Math.round(Math.log10(v))}`;
}

export function Legend({ series }: { series: Series[] }) {
  return (
    <div className="flex gap-4">
      {series.map((s) => (
        <span
          key={s.key}
          className="flex items-center gap-1.5 font-readout text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]"
        >
          <span className="inline-block h-0.5 w-4" style={{ background: s.colour }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}
