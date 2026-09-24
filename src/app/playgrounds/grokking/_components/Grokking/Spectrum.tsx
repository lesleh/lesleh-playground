"use client";

const W = 320;
const H = 130;
const PAD = { l: 4, r: 4, t: 8, b: 18 };

// Share of embedding energy per frequency. Noise spreads it evenly; the
// grokked network concentrates it on a handful of spikes.
export function Spectrum({ spectrum }: { spectrum: Float32Array }) {
  const n = spectrum.length;
  if (n === 0) return null;
  const ranked = Array.from(spectrum).sort((a, b) => b - a);
  const cutoff = ranked[Math.min(4, n - 1)];
  const max = Math.max(0.15, ranked[0]);
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const bw = iw / n;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Embedding energy per Fourier frequency">
      <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="var(--line-2)" />
      {Array.from(spectrum, (v, i) => {
        const h = (v / max) * ih;
        const top = v >= cutoff;
        return (
          <rect
            key={i}
            x={PAD.l + i * bw + bw * 0.15}
            y={H - PAD.b - h}
            width={bw * 0.7}
            height={h}
            fill={top ? "var(--mint)" : "rgba(150,180,205,0.35)"}
          />
        );
      })}
      {[1, 5, 10, 15, 20, 25].filter((k) => k <= n).map((k) => (
        <text
          key={k}
          x={PAD.l + (k - 0.5) * bw}
          y={H - 5}
          textAnchor="middle"
          className="fill-[var(--muted)] font-readout text-[8px]"
        >
          {k}
        </text>
      ))}
    </svg>
  );
}
