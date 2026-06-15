"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { display, mono } from "../../_lib/fonts";
import { Ball } from "./Ball";
import { NumberPicker } from "./NumberPicker";
import { DrawDisplay } from "./DrawDisplay";
import { OddsTable } from "./OddsTable";
import { Stats, type StatsData } from "./Stats";

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")";

const STAGE_BG = [
  GRAIN,
  "radial-gradient(115% 75% at 50% -8%, rgba(150,110,55,0.38), rgba(60,30,45,0.14) 38%, rgba(8,6,12,0) 68%)",
  "radial-gradient(80% 50% at 50% 115%, rgba(120,40,55,0.16), rgba(8,6,12,0) 70%)",
].join(", ");

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

  const remaining = PICK - ticket.length;

  return (
    <div
      className={`${display.variable} ${mono.variable} h-full overflow-y-auto text-[#f3e9d2]`}
      style={{ backgroundColor: "#08060d", backgroundImage: STAGE_BG }}
    >
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-14">
        {/* Masthead */}
        <header className="text-center">
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#e9c66a]/50" />
            <span className="font-ticker text-[10px] uppercase tracking-[0.42em] text-[#e9c66a]/65">
              the national draw
            </span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#e9c66a]/50" />
          </div>
          <h1 className="font-marquee text-[clamp(2.1rem,8.5vw,6rem)] font-black italic leading-[0.9]">
            The{" "}
            <span className="gold-foil animate-[foil-shimmer_7s_linear_infinite]">
              Midnight
            </span>{" "}
            Draw
          </h1>
          <p className="mx-auto mt-4 max-w-md font-ticker text-[11px] uppercase tracking-[0.2em] text-[#f3e9d2]/45">
            six numbers · one in 45,057,474 · {money(TICKET_PRICE)} a line
          </p>

          <div className="mt-7 sm:mt-9">
            <div className="font-ticker text-[10px] uppercase tracking-[0.42em] text-[#f3e9d2]/40">
              tonight&rsquo;s top prize
            </div>
            <div className="gold-foil animate-[foil-shimmer_6s_linear_infinite] font-marquee mt-1 text-[clamp(2.4rem,10vw,7rem)] font-black leading-none">
              {money(6_700_000)}
            </div>
          </div>
        </header>

        {/* Draw chamber */}
        <section
          className="relative mt-8 overflow-hidden rounded-2xl border border-[#e9c66a]/25 px-4 py-7 sm:mt-12 sm:px-6 sm:py-9"
          style={{
            backgroundImage:
              "radial-gradient(120% 120% at 50% 0%, rgba(44,30,54,0.6), rgba(10,8,16,0.82))",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 28px 56px rgba(0,0,0,0.5), 0 30px 60px rgba(0,0,0,0.45)",
          }}
        >
          <div className="mb-6 flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 animate-[blink_1.5s_ease-in-out_infinite] rounded-full bg-[#e0556a]" />
            <span className="font-ticker text-[10px] uppercase tracking-[0.38em] text-[#f3e9d2]/45">
              latest draw
            </span>
          </div>
          <DrawDisplay draw={lastDraw} ticket={ticket} drawKey={drawKey} />
        </section>

        {/* Betting floor */}
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {/* Your line */}
          <section className="rounded-xl border border-[#f3e9d2]/12 bg-[#0f0b14]/60 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-marquee text-xl italic">Your line</h2>
              <span className="font-ticker text-[11px] uppercase tracking-[0.2em] text-[#f3e9d2]/40">
                {ticket.length}/{PICK} marked
              </span>
            </div>

            <div className="mb-5 flex min-h-[48px] flex-wrap items-center gap-2.5">
              {ticket.length > 0 ? (
                ticket.map((n) => <Ball key={n} value={n} />)
              ) : (
                <span className="font-ticker text-[11px] uppercase tracking-[0.2em] text-[#f3e9d2]/35">
                  mark six numbers below
                </span>
              )}
            </div>

            <NumberPicker ticket={ticket} onToggle={toggleNumber} disabled={running} />

            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={handleLuckyDip}
                disabled={running}
                className="font-ticker flex-1 rounded-md border border-[#e9c66a]/50 bg-[#e9c66a]/10 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#f6e3a1] transition-colors hover:bg-[#e9c66a]/20 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-[#e9c66a]/10"
              >
                Quick pick
              </button>
              <button
                type="button"
                onClick={handleClearTicket}
                disabled={running || ticket.length === 0}
                className="font-ticker rounded-md border border-[#f3e9d2]/15 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#f3e9d2]/60 transition-colors hover:border-[#f3e9d2]/40 hover:text-[#f3e9d2] disabled:cursor-not-allowed disabled:opacity-30"
              >
                Clear
              </button>
            </div>
          </section>

          {/* Place your bet */}
          <section className="flex flex-col rounded-xl border border-[#f3e9d2]/12 bg-[#0f0b14]/60 p-5 backdrop-blur-sm">
            <h2 className="font-marquee mb-4 text-xl italic">Place your bet</h2>

            <button
              type="button"
              onClick={play}
              disabled={!ready || running}
              className="font-marquee rounded-lg px-6 py-4 text-lg font-black italic text-[#1b1208] transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
              style={{
                backgroundImage:
                  "linear-gradient(100deg,#f7e7ad,#d8b24a 45%,#c69a2f)",
                boxShadow:
                  "0 10px 24px rgba(216,178,74,0.25), inset 0 1px 0 rgba(255,255,255,0.5)",
              }}
            >
              Play this line — {money(TICKET_PRICE)}
            </button>

            <div className="mt-5">
              <div className="mb-2 font-ticker text-[10px] uppercase tracking-[0.3em] text-[#f3e9d2]/40">
                or auto-play
              </div>
              <div className="grid grid-cols-3 gap-2">
                {BATCHES.map((b) => (
                  <button
                    key={b.n}
                    type="button"
                    onClick={() => runMany(b.n)}
                    disabled={!ready || running}
                    className="font-ticker rounded-md border border-[#f3e9d2]/15 px-2 py-2.5 text-sm font-bold tabular-nums text-[#f3e9d2]/70 transition-colors hover:border-[#e9c66a]/50 hover:text-[#f6e3a1] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[#f3e9d2]/15 disabled:hover:text-[#f3e9d2]/70"
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {batch && (
              <div className="mt-5">
                <div className="mb-1.5 flex justify-between font-ticker text-[10px] uppercase tracking-[0.2em] text-[#f3e9d2]/45">
                  <span>drawing…</span>
                  <span className="tabular-nums">
                    {count(batch.done)} / {count(batch.total)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#f3e9d2]/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#d8b24a] to-[#f7e7ad] transition-[width] duration-150"
                    style={{ width: `${batchPct}%` }}
                  />
                </div>
              </div>
            )}

            {!ready && !running && (
              <p className="mt-4 font-ticker text-[11px] uppercase tracking-[0.15em] text-[#e0556a]/80">
                mark {remaining} more number{remaining === 1 ? "" : "s"} to play
              </p>
            )}

            <p className="mt-auto pt-5 font-ticker text-[10px] leading-relaxed text-[#f3e9d2]/30">
              Every line costs {money(TICKET_PRICE)}, win or lose. Watch the
              ledger.
            </p>
          </section>
        </div>

        {/* The ledger */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-end">
            <button
              type="button"
              onClick={reset}
              disabled={running || stats.draws === 0}
              className="font-ticker rounded-md border border-[#f3e9d2]/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f3e9d2]/55 transition-colors hover:border-[#f3e9d2]/40 hover:text-[#f3e9d2] disabled:cursor-not-allowed disabled:opacity-25"
            >
              Reset run
            </button>
          </div>
          <Stats {...stats} />
        </section>

        {/* Prize structure */}
        <section className="mt-6">
          <OddsTable tierCounts={tierCounts} />
        </section>

        <p className="mt-10 text-center font-ticker text-[10px] uppercase tracking-[0.28em] text-[#f3e9d2]/25">
          simulated · no money changes hands · the only winning move is not to play
        </p>
      </div>
    </div>
  );
}
