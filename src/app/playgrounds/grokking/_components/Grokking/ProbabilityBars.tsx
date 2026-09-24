"use client";

const W = 320;
const H = 120;
const PAD = { l: 2, r: 30, t: 6, b: 16 };
// Log scale from 100% down to 1e-20. Softmax squashes wrong answers to ~0% on
// a linear scale; on a log scale the grokked network's waves show.
const DECADES = 20;
const TICKS = [0, 5, 10, 15, 20];

export function ProbabilityBars({ probs, truth }: { probs: Float32Array; truth: number }) {
  const n = probs.length;
  let top = 0;
  for (let i = 1; i < n; i++) if (probs[i] > probs[top]) top = i;
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const bw = iw / n;
  const cx = (i: number) => PAD.l + (i + 0.5) * bw;
  const barHeight = (v: number) => (Math.max(0, DECADES + Math.log10(Math.max(v, 1e-30))) / DECADES) * ih;
  const base = H - PAD.b;
  const outline = Array.from(probs, (v, i) => `${cx(i).toFixed(1)},${(base - barHeight(v)).toFixed(1)}`).join(" L ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Probability of every possible answer, log scale"
    >
      {TICKS.map((d) => {
        const y = base - ((DECADES - d) / DECADES) * ih;
        return (
          <g key={d}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="rgba(150,180,205,0.10)" />
            <text x={W - PAD.r + 4} y={y + 3} className="fill-[var(--muted)] font-readout text-[7px]">
              {d === 0 ? "100%" : `1e-${d}`}
            </text>
          </g>
        );
      })}
      <line x1={PAD.l} x2={W - PAD.r} y1={base} y2={base} stroke="var(--line-2)" />
      {Array.from(probs, (v, i) => {
        const h = barHeight(v);
        const fill =
          i === top
            ? top === truth
              ? "var(--mint)"
              : "var(--red)"
            : i === truth
              ? "var(--mint)"
              : "rgba(150,180,205,0.45)";
        return <rect key={i} x={PAD.l + i * bw + bw * 0.12} y={base - h} width={bw * 0.76} height={h} fill={fill} />;
      })}
      <path d={`M ${outline}`} fill="none" stroke="rgba(226,234,240,0.35)" strokeWidth={0.75} />
      <path d={`M ${cx(truth)} ${base + 3} l -3.5 5 h 7 z`} fill="var(--mint)" />
      {[0, 10, 20, 30, 40, 50]
        .filter((k) => k < n)
        .map((k) => (
          <text key={k} x={cx(k)} y={H - 2} textAnchor="middle" className="fill-[var(--muted)] font-readout text-[7px]">
            {k}
          </text>
        ))}
    </svg>
  );
}

// The three most likely answers, most likely first.
export function topAnswers(probs: Float32Array, count = 3): { answer: number; p: number }[] {
  return Array.from(probs, (p, answer) => ({ answer, p }))
    .sort((x, y) => y.p - x.p)
    .slice(0, count);
}
