"use client";

// The demo compares grocery products by unit price (£ per 100g/ml) so the
// cheapest wins whatever the pack size. Preview a mini comparison table with
// the best-value row highlighted.
const ROWS = [
  { name: "Beans", price: "£0.80", unit: "£0.53", best: false },
  { name: "Rice", price: "£1.20", unit: "£0.24", best: true },
  { name: "Pasta", price: "£0.95", unit: "£0.48", best: false },
];

export function UnitPricePreview() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white p-4">
      <div className="w-full max-w-[240px] rounded-lg border border-black/10 bg-white p-2.5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-wide text-black/50">
            per 100g
          </span>
          <span className="rounded bg-blue-500 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
            + Add
          </span>
        </div>

        <div className="space-y-1">
          {ROWS.map((row) => (
            <div
              key={row.name}
              className={`grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded px-1.5 py-1 text-[10px] ${
                row.best ? "bg-emerald-50" : ""
              }`}
            >
              <span className="font-medium text-black/80">{row.name}</span>
              <span className="tabular-nums text-black/40">{row.price}</span>
              <span
                className={`justify-self-end font-bold tabular-nums ${
                  row.best ? "text-emerald-600" : "text-black/70"
                }`}
              >
                {row.unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
