import { twMerge } from "tailwind-merge";
import { Ball } from "./Ball";
import { money } from "../../_lib/format";
import { TIER_BY_ID, type DrawResult } from "../../_lib/lottery";

interface DrawDisplayProps {
  draw: DrawResult | null;
  ticket: number[];
  /** Bumped on every new single draw to retrigger the pop-in animation. */
  drawKey: number;
}

export function DrawDisplay({ draw, ticket, drawKey }: DrawDisplayProps) {
  if (!draw) {
    return (
      <div className="flex h-28 items-center justify-center border-2 border-dashed border-black/30">
        <p className="font-mono text-sm text-black/40">No draw yet — press Play.</p>
      </div>
    );
  }

  const ticketSet = new Set(ticket);
  const won = draw.tier !== null;
  const tierLabel = draw.tier ? TIER_BY_ID[draw.tier].label : null;

  return (
    <div className="space-y-3" key={drawKey}>
      <div className="flex flex-wrap items-center gap-2">
        {draw.main.map((n, i) => (
          <Ball
            key={n}
            value={n}
            variant={ticketSet.has(n) ? "matched" : "default"}
            popIndex={i}
          />
        ))}
        <span className="px-1 font-mono text-xs text-black/40">+</span>
        <Ball
          value={draw.bonus}
          variant={ticketSet.has(draw.bonus) ? "bonusMatched" : "bonus"}
          popIndex={draw.main.length}
        />
      </div>

      <div
        className={twMerge(
          "border-2 border-black px-3 py-2 font-mono text-sm font-bold",
          won ? "bg-lime-300" : "bg-white"
        )}
      >
        {won ? (
          <span>
            {tierLabel} matched — won {money(draw.payout)}!
          </span>
        ) : (
          <span className="text-black/60">
            {draw.matchCount === 1
              ? "1 ball matched. No prize."
              : `${draw.matchCount} balls matched. No prize.`}
          </span>
        )}
      </div>
    </div>
  );
}
