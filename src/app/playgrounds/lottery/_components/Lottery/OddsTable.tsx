import { TIERS, type TierCounts } from "../../_lib/lottery";
import { count, money } from "../../_lib/format";

interface OddsTableProps {
  tierCounts: TierCounts;
}

export function OddsTable({ tierCounts }: OddsTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e9c66a]/25 bg-[#0f0b14]/70 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-[#e9c66a]/20 px-5 py-3">
        <h3 className="font-ticker text-[11px] uppercase tracking-[0.3em] text-[#e9c66a]/70">
          Prize Structure
        </h3>
        <span className="font-ticker text-[10px] uppercase tracking-[0.2em] text-[#f3e9d2]/35">
          odds · x&nbsp;to&nbsp;1
        </span>
      </div>
      <table className="w-full border-collapse">
        <tbody>
          {TIERS.map((tier) => {
            const wins = tierCounts[tier.id];
            return (
              <tr
                key={tier.id}
                className="border-b border-dashed border-[#f3e9d2]/10 last:border-b-0"
              >
                <td className="px-5 py-3 text-left">
                  <span className="font-marquee text-base italic text-[#f3e9d2]">
                    {tier.label}
                  </span>
                </td>
                <td className="px-3 py-3 text-right font-ticker text-xs tabular-nums text-[#f3e9d2]/45">
                  {count(tier.chance)}
                </td>
                <td className="px-3 py-3 text-right font-ticker text-xs tabular-nums text-[#f6e3a1]/90">
                  {money(tier.payout)}
                </td>
                <td className="px-5 py-3 text-right">
                  {wins > 0 ? (
                    <span className="gold-foil font-ticker text-sm font-bold tabular-nums">
                      {count(wins)}
                    </span>
                  ) : (
                    <span className="font-ticker text-xs tabular-nums text-[#f3e9d2]/20">
                      0
                    </span>
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
