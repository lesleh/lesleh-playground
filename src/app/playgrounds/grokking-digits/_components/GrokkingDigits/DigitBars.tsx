"use client";

// Probability of each digit 0 to 9, with the percentage above each bar. The
// top guess is mint; when a true label is known and the guess is wrong, the
// guess is red and the true digit is outlined.
export function DigitBars({ probs, truth }: { probs: Float32Array | null; truth?: number }) {
  let top = -1;
  if (probs) for (let i = 0; i < probs.length; i++) if (top < 0 || probs[i] > probs[top]) top = i;

  return (
    <div className="grid grid-cols-10 items-end gap-1" role="img" aria-label="Probability of each digit">
      {Array.from({ length: 10 }, (_, d) => {
        const p = probs ? probs[d] : 0;
        const isTop = d === top;
        const wrong = isTop && truth !== undefined && truth !== top;
        const colour = isTop ? (wrong ? "var(--red)" : "var(--mint)") : "rgba(150,180,205,0.45)";
        return (
          <div key={d} className="flex flex-col items-center gap-1">
            <span className="font-readout text-[9px] tabular-nums text-[var(--muted)]">
              {probs ? formatPct(p) : ""}
            </span>
            <div className="relative h-28 w-full rounded-sm bg-[rgba(150,180,205,0.06)]">
              <div
                className="absolute inset-x-0 bottom-0 rounded-sm transition-[height] duration-150"
                style={{ height: `${p * 100}%`, background: colour }}
              />
              {truth === d && (
                <div className="absolute inset-0 rounded-sm border border-dashed border-[var(--mint)]" aria-hidden />
              )}
            </div>
            <span
              className="font-telemetry text-lg font-semibold leading-none"
              style={{ color: isTop ? colour : "var(--text)" }}
            >
              {d}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function formatPct(p: number): string {
  if (p >= 0.995) return "100";
  if (p >= 0.1) return (p * 100).toFixed(0);
  if (p >= 0.01) return (p * 100).toFixed(1);
  return "<1";
}
