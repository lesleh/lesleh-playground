"use client";

// The demo grades food on the NOVA processing scale (1 green → 4 red) with a
// health-score bar. Preview a Group 4 badge, the traffic-light bar, and a
// couple of ingredient pills.
const PILLS = ["Sugar", "Emulsifier", "Flavouring"];

export function FoodAnalyzerPreview() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white p-4">
      <div className="w-full max-w-[240px] rounded-lg border border-black/10 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="rounded border-2 border-red-500 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-red-600">
            NOVA · Group 4
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wide text-black/40">
            score
          </span>
        </div>

        <div
          className="relative mt-2.5 h-2 w-full rounded-full"
          style={{
            background:
              "linear-gradient(90deg,#22c55e,#eab308,#f97316,#ef4444)",
          }}
        >
          <div
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black bg-white"
            style={{ left: "82%" }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {PILLS.map((pill) => (
            <span
              key={pill}
              className="rounded-full bg-black/5 px-2 py-0.5 text-[9px] text-black/60"
            >
              {pill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
