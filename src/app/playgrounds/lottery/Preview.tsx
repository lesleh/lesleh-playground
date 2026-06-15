"use client";

import { display } from "./_lib/fonts";
import { ballColor, INK } from "./_lib/ballColors";

const BALLS = [7, 14, 23, 38, 49, 58];

export function LotteryPreview() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-3 p-3"
      style={{
        backgroundColor: "#08060d",
        backgroundImage:
          "radial-gradient(110% 80% at 50% -10%, rgba(150,110,55,0.4), rgba(8,6,12,0) 65%)",
      }}
    >
      <div className="flex items-center gap-1">
        {BALLS.map((n) => {
          const c = ballColor(n);
          return (
            <span
              key={n}
              className="relative grid h-6 w-6 place-items-center rounded-full text-[9px] font-bold tabular-nums"
              style={{
                backgroundImage: `radial-gradient(circle at 34% 28%, ${c.from} 0%, ${c.to} 70%)`,
                color: INK,
                boxShadow: "0 2px 5px rgba(0,0,0,0.5)",
                fontFamily: "var(--font-mono), monospace",
              }}
            >
              <span className="absolute left-[20%] top-[16%] h-[26%] w-[30%] rounded-full bg-white/70 blur-[1px]" />
              <span className="relative">{n}</span>
            </span>
          );
        })}
      </div>
      <div className="text-center">
        <div
          className={`${display.className} gold-foil text-[28px] font-black italic leading-none`}
        >
          £6.7M
        </div>
        <div
          className="mt-0.5 text-[7px] uppercase tracking-[0.3em] text-[#f3e9d2]/45"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          one in 45,057,474
        </div>
      </div>
    </div>
  );
}
