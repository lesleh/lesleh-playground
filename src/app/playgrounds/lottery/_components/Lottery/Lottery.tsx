"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import {
  singleDraw,
  runBatch,
  luckyDip,
  emptyTierCounts,
  PICK,
  TICKET_PRICE,
  type DrawResult,
  type TierCounts,
} from "../../_lib/lottery";
import { money, count } from "../../_lib/format";
import { Ball } from "./Ball";
import { NumberPicker } from "./NumberPicker";
import { DrawDisplay } from "./DrawDisplay";
import { OddsTable } from "./OddsTable";
import { Stats, type StatsData } from "./Stats";

const ZERO_STATS: StatsData = { draws: 0, spent: 0, won: 0, biggestWin: 0 };
const CHUNK_SIZE = 50_000;

// A fixed starter ticket keeps SSR and client markup identical; Lucky Dip
// randomises it after mount.
const DEFAULT_TICKET = [3, 11, 19, 27, 38, 49];

const BATCHES = [
  { label: "×100", n: 100 },
  { label: "×10k", n: 10_000 },
  { label: "×1M", n: 1_000_000 },
];

function mergeTierCounts(a: TierCounts, b: TierCounts): TierCounts {
  const out = { ...a };
  for (const key of Object.keys(b) as (keyof TierCounts)[]) {
    out[key] += b[key];
  }
  return out;
}

export function Lottery() {
  const [ticket, setTicket] = useState<number[]>(DEFAULT_TICKET);
  const [lastDraw, setLastDraw] = useState<DrawResult | null>(null);
  const [drawKey, setDrawKey] = useState(0);
  const [stats, setStats] = useState<StatsData>(ZERO_STATS);
  const [tierCounts, setTierCounts] = useState<TierCounts>(emptyTierCounts);
  const [batch, setBatch] = useState<{ done: number; total: number } | null>(null);

  const rafRef = useRef<number>(0);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const ready = ticket.length === PICK;
  const running = batch !== null;

  const toggleNumber = useCallback(
    (n: number) => {
      if (running) return;
      setTicket((prev) => {
        if (prev.includes(n)) return prev.filter((x) => x !== n);
        if (prev.length >= PICK) return prev;
        return [...prev, n].sort((a, b) => a - b);
      });
    },
    [running]
  );

  const handleLuckyDip = useCallback(() => {
    if (running) return;
    setTicket(luckyDip());
  }, [running]);

  const handleClearTicket = useCallback(() => {
    if (running) return;
    setTicket([]);
  }, [running]);

  const play = useCallback(() => {
    if (!ready || running) return;
    const result = singleDraw(ticket);
    setLastDraw(result);
    setDrawKey((k) => k + 1);
    setStats((s) => ({
      draws: s.draws + 1,
      spent: s.spent + TICKET_PRICE,
      won: s.won + result.payout,
      biggestWin: Math.max(s.biggestWin, result.payout),
    }));
    if (result.tier) {
      const tier = result.tier;
      setTierCounts((tc) => ({ ...tc, [tier]: tc[tier] + 1 }));
    }
  }, [ready, running, ticket]);

  const runMany = useCallback(
    (total: number) => {
      if (!ready || running) return;
      setBatch({ done: 0, total });
      let remaining = total;

      const tick = () => {
        const n = Math.min(CHUNK_SIZE, remaining);
        const res = runBatch(ticket, n);
        setStats((s) => ({
          draws: s.draws + res.draws,
          spent: s.spent + res.spent,
          won: s.won + res.won,
          biggestWin: Math.max(s.biggestWin, res.biggestWin),
        }));
        setTierCounts((tc) => mergeTierCounts(tc, res.tierCounts));
        remaining -= n;
        setBatch({ done: total - remaining, total });
        if (remaining > 0) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setBatch(null);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [ready, running, ticket]
  );

  const reset = useCallback(() => {
    if (running) return;
    setStats(ZERO_STATS);
    setTierCounts(emptyTierCounts());
    setLastDraw(null);
  }, [running]);

  const batchPct = batch ? Math.round((batch.done / batch.total) * 100) : 0;

  return (
    <div
      className="h-full overflow-y-auto"
      style={{
        backgroundColor: "#fffef5",
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)
        `,
        backgroundSize: "32px 32px",
      }}
    >
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-8">
          <div className="mb-4 h-1 bg-black" />
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-black/50">
            UK Lotto · {money(TICKET_PRICE)} a ticket
          </p>
          <h1 className="font-roboto-slab text-[clamp(2.5rem,8vw,4.5rem)] font-black leading-none tracking-tight text-black">
            Lottery Simulator
          </h1>
          <p className="mt-3 max-w-lg font-mono text-sm text-black/50">
            Pick 6 from 59. Match the 6 drawn balls to win. Play one ticket or
            burn through a million — and watch the house take its cut.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Ticket picker */}
          <section className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-roboto-slab text-lg font-black">Your ticket</h2>
              <span className="font-mono text-xs text-black/50">
                {ticket.length}/{PICK} picked
              </span>
            </div>

            <div className="mb-4 flex min-h-[44px] flex-wrap items-center gap-2">
              {ticket.length > 0 ? (
                ticket.map((n) => <Ball key={n} value={n} variant="ticket" />)
              ) : (
                <span className="font-mono text-sm text-black/40">
                  Pick 6 numbers, or hit Lucky Dip.
                </span>
              )}
            </div>

            <NumberPicker
              ticket={ticket}
              onToggle={toggleNumber}
              disabled={running}
            />

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleLuckyDip}
                disabled={running}
                className="flex-1 border-2 border-black bg-amber-300 px-3 py-2 font-mono text-sm font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0"
              >
                🎲 Lucky Dip
              </button>
              <button
                type="button"
                onClick={handleClearTicket}
                disabled={running || ticket.length === 0}
                className="border-2 border-black bg-white px-3 py-2 font-mono text-sm font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0"
              >
                Clear
              </button>
            </div>
          </section>

          {/* Draw + controls */}
          <section className="flex flex-col gap-4">
            <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="mb-3 font-roboto-slab text-lg font-black">
                Latest draw
              </h2>
              <DrawDisplay draw={lastDraw} ticket={ticket} drawKey={drawKey} />
            </div>

            <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <button
                type="button"
                onClick={play}
                disabled={!ready || running}
                className="mb-3 w-full border-2 border-black bg-lime-400 px-4 py-3 font-roboto-slab text-lg font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0"
              >
                Play ({money(TICKET_PRICE)})
              </button>

              <div className="flex gap-2">
                {BATCHES.map((b) => (
                  <button
                    key={b.n}
                    type="button"
                    onClick={() => runMany(b.n)}
                    disabled={!ready || running}
                    className="flex-1 border-2 border-black bg-white px-2 py-2 font-mono text-sm font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0"
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              {batch && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between font-mono text-xs text-black/50">
                    <span>Drawing…</span>
                    <span>
                      {count(batch.done)} / {count(batch.total)}
                    </span>
                  </div>
                  <div className="h-3 border-2 border-black bg-white">
                    <div
                      className="h-full bg-lime-400 transition-all"
                      style={{ width: `${batchPct}%` }}
                    />
                  </div>
                </div>
              )}

              {!ready && !running && (
                <p className="mt-3 font-mono text-xs text-red-600">
                  Pick {PICK - ticket.length} more number
                  {PICK - ticket.length === 1 ? "" : "s"} to play.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Stats */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-roboto-slab text-lg font-black">Your run</h2>
            <button
              type="button"
              onClick={reset}
              disabled={running || stats.draws === 0}
              className="border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0"
            >
              Reset
            </button>
          </div>
          <Stats {...stats} />
        </section>

        {/* Odds + breakdown */}
        <section className="mt-6">
          <h2 className="mb-3 font-roboto-slab text-lg font-black">
            Odds &amp; prizes
          </h2>
          <OddsTable tierCounts={tierCounts} />
          <p
            className={twMerge(
              "mt-3 font-mono text-xs text-black/40",
              stats.draws === 0 && "opacity-60"
            )}
          >
            Odds shown as published &quot;x to 1&quot;. Your wins are the real
            results of {count(stats.draws)} simulated draw
            {stats.draws === 1 ? "" : "s"}.
          </p>
        </section>
      </div>
    </div>
  );
}
