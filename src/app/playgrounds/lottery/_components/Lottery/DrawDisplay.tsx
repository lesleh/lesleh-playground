import { twMerge } from "tailwind-merge";
import { Ball } from "./Ball";
import { money } from "../../_lib/format";
import { TIER_BY_ID, type DrawResult } from "../../_lib/lottery";

interface DrawDisplayProps {
  draw: DrawResult | null;
  ticket: number[];
  /** Bumped on every new single draw to retrigger the drop animation. */
  drawKey: number;
}

export function DrawDisplay({ draw, ticket, drawKey }: DrawDisplayProps) {
  if (!draw) {
    return (
      <div className="flex h-[120px] flex-col items-center justify-center gap-2">
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="h-12 w-12 rounded-full border border-dashed border-[#f3e9d2]/20"
            />
          ))}
        </div>
        <p className="font-ticker text-xs uppercase tracking-[0.3em] text-[#f3e9d2]/35">
          awaiting the draw
        </p>
      </div>
    );
  }

  const ticketSet = new Set(ticket);
  const won = draw.tier !== null;
  const tierLabel = draw.tier ? TIER_BY_ID[draw.tier].label : null;

  return (
    <div className="flex flex-col items-center gap-5" key={drawKey}>
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5">
        {draw.main.map((n, i) => {
          const hit = ticketSet.has(n);
          return (
            <Ball
              key={n}
              value={n}
              matched={hit}
              faded={!hit}
              dropIndex={i}
            />
          );
        })}
        <span
          aria-hidden
          className="mx-1 h-12 w-px bg-gradient-to-b from-transparent via-[#e9c66a]/60 to-transparent"
        />
        <Ball
          value={draw.bonus}
          bonus
          matched={ticketSet.has(draw.bonus)}
          faded={!ticketSet.has(draw.bonus)}
          dropIndex={draw.main.length}
        />
      </div>

      <div
        className={twMerge(
          "font-ticker text-center text-sm uppercase tracking-[0.18em]",
          won ? "text-[#f6e3a1]" : "text-[#f3e9d2]/45"
        )}
      >
        {won ? (
          <span>
            {tierLabel} — <span className="gold-foil font-bold">{money(draw.payout)}</span>
          </span>
        ) : (
          <span>
            {draw.matchCount === 1 ? "one ball" : `${draw.matchCount} balls`} · no prize
          </span>
        )}
      </div>
    </div>
  );
}
