import { twMerge } from "tailwind-merge";
import { count, money, signedMoney } from "../../_lib/format";

export interface StatsData {
  draws: number;
  spent: number;
  won: number;
  biggestWin: number;
}

function LedgerRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-[#f3e9d2]/12 py-2 last:border-b-0">
      <span className="font-ticker text-[11px] uppercase tracking-[0.22em] text-[#f3e9d2]/45">
        {label}
      </span>
      <span
        className={twMerge(
          "font-ticker tabular-nums",
          emphasis ? "text-sm text-[#f3e9d2]" : "text-xs text-[#f3e9d2]/75"
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function Stats({ draws, spent, won, biggestWin }: StatsData) {
  const net = won - spent;
  const returnPct = spent > 0 ? (won / spent) * 100 : 0;
  // The verdict only lands once you've played enough to be unambiguously down.
  const houseWins = draws >= 20 && net < 0;

  return (
    <div className="relative overflow-hidden rounded-lg border border-[#e9c66a]/25 bg-[#0f0b14]/70 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-ticker text-[11px] uppercase tracking-[0.3em] text-[#e9c66a]/70">
          The Ledger
        </h3>
        <span className="font-ticker text-[11px] tabular-nums text-[#f3e9d2]/40">
          {count(draws)} {draws === 1 ? "line" : "lines"}
        </span>
      </div>

      <div className="grid gap-x-10 gap-y-1 sm:grid-cols-2">
        <LedgerRow label="Total staked" value={money(spent)} />
        <LedgerRow label="Total returned" value={money(won)} />
        <LedgerRow
          label="Return rate"
          value={draws > 0 ? `${returnPct.toFixed(1)}%` : "—"}
        />
        <LedgerRow label="Biggest win" value={money(biggestWin)} />
      </div>

      {/* The net — the whole point. */}
      <div className="mt-5 flex items-end justify-between gap-4 border-t border-[#e9c66a]/20 pt-4">
        <span className="font-ticker text-xs uppercase tracking-[0.28em] text-[#f3e9d2]/50">
          Net position
        </span>
        <span
          className="font-marquee text-4xl font-black italic tabular-nums leading-none sm:text-5xl"
          style={{
            color: net > 0 ? "#5fd99a" : net < 0 ? "#e0556a" : "#f3e9d2",
            textShadow:
              net < 0
                ? "0 0 24px rgba(224,85,106,0.35)"
                : net > 0
                  ? "0 0 24px rgba(95,217,154,0.35)"
                  : "none",
          }}
        >
          {signedMoney(net)}
        </span>
      </div>

      {houseWins && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 animate-[stamp-in_0.4s_cubic-bezier(0.2,0.8,0.3,1.2)_both]"
        >
          <div className="rotate-[-13deg] rounded border-[3px] border-[#e0556a]/80 px-3 py-1.5 text-center mix-blend-screen">
            <div className="font-marquee text-lg font-black uppercase italic leading-none tracking-wide text-[#e0556a]">
              The House
            </div>
            <div className="font-ticker text-[9px] uppercase tracking-[0.3em] text-[#e0556a]/90">
              always wins
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
