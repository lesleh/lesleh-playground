"use client";

const W = 240;
const H = 64;
const AMBER = "#f7c948";
const MINT = "#35d6a0";

// Best finish time per generation (seconds; 0 = no finisher that gen), drawn as
// an oscilloscope trace so faster is higher. The track optimum is a dashed line.
export function Sparkline({
  data,
  optimum,
}: {
  data: number[];
  optimum: number;
}) {
  const points = data.map((t, i) => ({ i, t })).filter((p) => p.t > 0);

  if (points.length < 2) {
    return (
      <div className="flex h-16 items-center justify-center font-readout text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
        no finishers yet…
      </div>
    );
  }

  const times = points.map((p) => p.t);
  const hasOpt = optimum > 0;
  let lo = Math.min(...times, hasOpt ? optimum : Infinity);
  let hi = Math.max(...times);
  if (hi - lo < 0.2) hi = lo + 0.2; // keep a flat, converged line readable
  const pad = (hi - lo) * 0.12;
  lo -= pad;
  hi += pad;

  const n = data.length;
  const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * W);
  // Faster time -> nearer the top.
  const y = (t: number) => ((t - lo) / (hi - lo)) * H;

  const path = points.map((p) => `${x(p.i)},${y(p.t).toFixed(1)}`);
  const line = `M ${path.join(" L ")}`;
  const last = points[points.length - 1];
  const area = `${line} L ${x(last.i)},${H} L ${x(points[0].i)},${H} Z`;
  const optY = hasOpt ? y(optimum) : 0;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-16 w-full"
      role="img"
      aria-label="Best run time per generation"
    >
      <defs>
        <linearGradient id="neuro-trace-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={AMBER} stopOpacity={0.22} />
          <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* faint gridlines */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={0}
          y1={H * f}
          x2={W}
          y2={H * f}
          stroke="rgba(150,180,205,0.10)"
          strokeWidth={1}
        />
      ))}

      <path d={area} fill="url(#neuro-trace-fill)" />
      <path
        d={line}
        fill="none"
        stroke={AMBER}
        strokeWidth={1.75}
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 2px ${AMBER})` }}
      />
      {/* leading marker at the latest generation */}
      <circle cx={x(last.i)} cy={y(last.t)} r={2.4} fill={AMBER} />

      {hasOpt && optY >= 0 && optY <= H && (
        <line
          x1={0}
          y1={optY}
          x2={W}
          y2={optY}
          stroke={MINT}
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      )}
    </svg>
  );
}
