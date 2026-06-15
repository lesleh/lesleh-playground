import { TIERS, type TierCounts } from "../../_lib/lottery";
import { count, money } from "../../_lib/format";

interface OddsTableProps {
  tierCounts: TierCounts;
}

export function OddsTable({ tierCounts }: OddsTableProps) {
  return (
    <div className="overflow-x-auto border-2 border-black bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-black font-mono text-[10px] uppercase tracking-widest text-black/50">
            <th className="px-3 py-2 text-left font-normal">Combination</th>
            <th className="px-3 py-2 text-right font-normal">Chance (x to 1)</th>
            <th className="px-3 py-2 text-right font-normal">Payout</th>
            <th className="px-3 py-2 text-right font-normal">Your wins</th>
          </tr>
        </thead>
        <tbody>
          {TIERS.map((tier) => {
            const wins = tierCounts[tier.id];
            return (
              <tr
                key={tier.id}
                className="border-b border-black/10 last:border-b-0 font-mono tabular-nums"
              >
                <td className="px-3 py-2 text-left font-roboto-slab font-bold">
                  {tier.label}
                </td>
                <td className="px-3 py-2 text-right text-black/70">
                  {count(tier.chance)}
                </td>
                <td className="px-3 py-2 text-right text-black/70">
                  {money(tier.payout)}
                </td>
                <td className="px-3 py-2 text-right font-bold">
                  {wins > 0 ? (
                    <span className="rounded bg-lime-300 px-1.5 py-0.5">
                      {count(wins)}
                    </span>
                  ) : (
                    <span className="text-black/30">0</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
