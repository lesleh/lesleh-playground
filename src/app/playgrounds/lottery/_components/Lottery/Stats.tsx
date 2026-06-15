import { twMerge } from "tailwind-merge";
import { count, money, signedMoney } from "../../_lib/format";

export interface StatsData {
  draws: number;
  spent: number;
  won: number;
  biggestWin: number;
}

interface StatBoxProps {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "bad";
}

function StatBox({ label, value, tone = "neutral" }: StatBoxProps) {
  return (
    <div
      className={twMerge(
        "border-2 border-black px-3 py-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
        tone === "good" && "bg-lime-300",
        tone === "bad" && "bg-red-300",
        tone === "neutral" && "bg-white"
      )}
    >
      <div className="font-mono text-[10px] uppercase tracking-widest text-black/50">
        {label}
      </div>
      <div className="font-roboto-slab text-xl font-black tabular-nums leading-tight">
        {value}
      </div>
    </div>
  );
}

export function Stats({ draws, spent, won, biggestWin }: StatsData) {
  const net = won - spent;
  const returnPct = spent > 0 ? (won / spent) * 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <StatBox label="Tickets bought" value={count(draws)} />
      <StatBox label="Total spent" value={money(spent)} />
      <StatBox label="Total won" value={money(won)} />
      <StatBox
        label="Net"
        value={signedMoney(net)}
        tone={net > 0 ? "good" : net < 0 ? "bad" : "neutral"}
      />
      <StatBox
        label="Return"
        value={draws > 0 ? `${returnPct.toFixed(1)}%` : "—"}
      />
      <StatBox label="Biggest win" value={money(biggestWin)} />
    </div>
  );
}
