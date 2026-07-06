"use client";

const W = 240;
const H = 64;
const CYAN = "#5ad3e2";

// Best distance per generation, drawn as an oscilloscope trace: further is
// higher. Distance only ratchets up (elitism keeps the champion), so this is a
// climbing curve that flattens as the gait converges.
export function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) {
    return (
      <div className="flex h-16 items-center justify-center font-readout text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
        evolving…
      </div>
    );
  }

  let lo = Math.min(...data);
  let hi = Math.max(...data);
  if (hi - lo < 1) hi = lo + 1; // keep a flat line readable
  const pad = (hi - lo) * 0.12;
  lo -= pad;
  hi += pad;

  const n = data.length;
  const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * W);
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * H; // further -> higher

  const path = data.map((v, i) => `${x(i)},${y(v).toFixed(1)}`);
  const line = `M ${path.join(" L ")}`;
  const area = `${line} L ${x(n - 1)},${H} L ${x(0)},${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-16 w-full"
      role="img"
      aria-label="Best distance per generation"
    >
      <defs>
        <linearGradient id="walk-trace-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CYAN} stopOpacity={0.22} />
          <stop offset="100%" stopColor={CYAN} stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={0} y1={H * f} x2={W} y2={H * f} stroke="rgba(150,180,205,0.10)" strokeWidth={1} />
      ))}
      <path d={area} fill="url(#walk-trace-fill)" />
      <path
        d={line}
        fill="none"
        stroke={CYAN}
        strokeWidth={1.75}
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 2px ${CYAN})` }}
      />
      <circle cx={x(n - 1)} cy={y(data[n - 1])} r={2.4} fill={CYAN} />
    </svg>
  );
}
