"use client";

const W = 240;
const H = 64;

// Best finish time per generation (seconds; 0 = no finisher that gen), drawn
// so faster is higher. The track optimum is shown as a dashed reference line.
export function Sparkline({
  data,
  optimum,
}: {
  data: number[];
  optimum: number;
}) {
  const points = data
    .map((t, i) => ({ i, t }))
    .filter((p) => p.t > 0);

  if (points.length < 2) {
    return (
      <div className="flex h-16 items-center justify-center font-mono text-[11px] uppercase tracking-widest text-white/30">
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
    <svg viewBox={`0 0 ${W} ${H}`} className="h-16 w-full" role="img" aria-label="Best run time per generation">
      <path d={area} fill="#f7c948" fillOpacity={0.15} />
      <path d={line} fill="none" stroke="#f7c948" strokeWidth={2} strokeLinejoin="round" />
      {hasOpt && optY >= 0 && optY <= H && (
        <line
          x1={0}
          y1={optY}
          x2={W}
          y2={optY}
          stroke="#34d399"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      )}
    </svg>
  );
}
