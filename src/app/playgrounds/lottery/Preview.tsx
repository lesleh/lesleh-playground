"use client";

const BALLS = [7, 14, 23, 31, 42, 58];

export function LotteryPreview() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#fffef5] p-3">
      <div className="flex items-center gap-1.5">
        {BALLS.map((n) => (
          <span
            key={n}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-white font-mono text-[11px] font-bold tabular-nums shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            {n}
          </span>
        ))}
        <span className="px-0.5 font-mono text-[10px] text-black/40">+</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-amber-300 font-mono text-[11px] font-bold tabular-nums shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
          3
        </span>
      </div>
      <div className="text-center">
        <div className="font-roboto-slab text-3xl font-black leading-none text-black">
          £6.7M
        </div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-black/50">
          jackpot · 1 in 45,057,474
        </div>
      </div>
    </div>
  );
}
