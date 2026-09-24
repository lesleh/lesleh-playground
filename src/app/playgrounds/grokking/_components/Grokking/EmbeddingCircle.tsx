"use client";

const SIZE = 320;
const R = SIZE / 2 - 22;

// Each number's embedding projected onto the top Fourier frequency. Once the
// network groks, the numbers sit on a circle, and a -> a + 1 is a fixed turn.
export function EmbeddingCircle({ p, circle }: { p: number; circle: Float32Array }) {
  if (circle.length !== 2 * p) return null;
  let maxR = 1e-6;
  for (let a = 0; a < p; a++) maxR = Math.max(maxR, Math.hypot(circle[2 * a], circle[2 * a + 1]));
  const pos = (a: number) => [
    SIZE / 2 + (circle[2 * a] / maxR) * R,
    SIZE / 2 - (circle[2 * a + 1] / maxR) * R,
  ];

  const path = Array.from({ length: p + 1 }, (_, i) => pos(i % p).map((v) => v.toFixed(1)).join(",")).join(" L ");

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full" role="img" aria-label="Number embeddings projected onto the top Fourier frequency">
      <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="rgba(150,180,205,0.12)" strokeDasharray="2 4" />
      <path d={`M ${path}`} fill="none" stroke="rgba(150,180,205,0.18)" strokeWidth={0.75} />
      {Array.from({ length: p }, (_, a) => {
        const [cx, cy] = pos(a);
        const hue = (a / p) * 360;
        return (
          <g key={a}>
            <circle cx={cx} cy={cy} r={3.2} fill={`hsl(${hue} 80% 62%)`} />
            <text
              x={cx + (cx - SIZE / 2) * 0.09}
              y={cy + (cy - SIZE / 2) * 0.09 + 2.5}
              textAnchor="middle"
              className="font-readout text-[7px]"
              fill={`hsl(${hue} 60% 75%)`}
            >
              {a}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
