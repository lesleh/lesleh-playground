"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHAMPION_WEIGHTS } from "../../_lib/champion";
import { mulberry32 } from "../../_lib/geometry";
import { drawWorld } from "../../_lib/render";
import { display, mono } from "../../_lib/fonts";
import {
  DEFAULT_CONFIG,
  activeCount,
  bestDistanceThisGen,
  createWorld,
  stepWorld,
  type SimConfig,
  type World,
} from "../../_lib/world";
import { Sparkline } from "./Sparkline";

const CANVAS = { width: 900, height: 480 };
const SPEEDS = [0.25, 0.5, 1, 2, 4];
const MAX_BUDGET_MS = 12;
const MAX_STEP_CAP = 4000;
type Speed = number | "max";
const HUD_EVERY = 6;
// World units that read as one metre on the distance markers (see render.ts).

interface Stats {
  generation: number;
  active: number;
  pop: number;
  genDistance: number;
  bestDistance: number;
  history: number[];
}

const EMPTY_STATS: Stats = {
  generation: 1,
  active: 0,
  pop: DEFAULT_CONFIG.populationSize,
  genDistance: 0,
  bestDistance: 0,
  history: [],
};

// Distances come straight from the physics in metres.
function metres(m: number): string {
  return m.toFixed(1);
}

export function EvolvingWalkers() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const randRef = useRef<() => number>(mulberry32(1));
  const seedRef = useRef(1);
  const configRef = useRef<SimConfig>({ ...DEFAULT_CONFIG });

  const pausedRef = useRef(false);
  const speedRef = useRef<Speed>(0.5);
  // Accumulator for fractional speeds (< 1 tick per frame).
  const tickAccRef = useRef(0);

  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<Speed>(0.5);
  const [mutationRate, setMutationRate] = useState(DEFAULT_CONFIG.mutationRate);

  const flush = useCallback(() => {
    const w = worldRef.current;
    if (!w) return;
    setStats({
      generation: w.generation,
      active: activeCount(w),
      pop: w.walkers.length,
      genDistance: bestDistanceThisGen(w),
      bestDistance: w.bestDistance,
      history: w.history.slice(),
    });
  }, []);

  const startWorld = useCallback(
    (seedWeights?: number[]) => {
      seedRef.current += 1;
      randRef.current = mulberry32(seedRef.current);
      worldRef.current = createWorld(configRef.current, randRef.current, seedWeights);
      flush();
    },
    [flush],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    randRef.current = mulberry32(seedRef.current);
    worldRef.current = createWorld(configRef.current, randRef.current);
    flush();

    let animId = 0;
    let frame = 0;
    const loop = () => {
      const w = worldRef.current;
      if (w) {
        if (!pausedRef.current) {
          const sp = speedRef.current;
          if (sp === "max") {
            const end = performance.now() + MAX_BUDGET_MS;
            for (let s = 0; s < MAX_STEP_CAP; s++) {
              stepWorld(w, configRef.current, randRef.current);
              if (performance.now() >= end) break;
            }
          } else {
            // Accumulate fractional ticks so speeds below 1 step less than once
            // per frame (0.25x steps roughly every fourth frame).
            tickAccRef.current += sp;
            let steps = Math.floor(tickAccRef.current);
            tickAccRef.current -= steps;
            while (steps-- > 0) stepWorld(w, configRef.current, randRef.current);
          }
        }
        drawWorld(ctx, w, CANVAS.width, CANVAS.height);
        if (frame % HUD_EVERY === 0) flush();
      }
      frame++;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [flush]);

  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  };
  const pickSpeed = (s: Speed) => {
    speedRef.current = s;
    setSpeed(s);
  };
  const changeMutation = (v: number) => {
    configRef.current = { ...configRef.current, mutationRate: v };
    setMutationRate(v);
  };

  return (
    <div
      className={`${display.variable} ${mono.variable} neuro-console h-full overflow-y-auto`}
      style={{
        backgroundColor: "var(--ink)",
        color: "var(--text)",
        backgroundImage:
          "linear-gradient(rgba(150,180,205,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(150,180,205,0.045) 1px, transparent 1px), radial-gradient(130% 90% at 50% -10%, rgba(69,200,216,0.07), transparent 55%)",
        backgroundSize: "46px 46px, 46px 46px, 100% 100%",
      }}
    >
      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {/* Header */}
        <header className="relative z-10 mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-3">
          <div>
            <div className="mb-2 flex items-center gap-2 font-readout text-[10px] uppercase tracking-[0.35em] text-[var(--muted)]">
              <LED on={!paused} />
              Evolved locomotion model
              <span className="text-[var(--line-2)]">·</span>
              <span>stride imitation</span>
            </div>
            <h1 className="font-telemetry text-[clamp(2rem,6vw,3.4rem)] font-bold uppercase leading-[0.85] tracking-tight">
              Evolving <span className="text-[var(--cyan)]">walkers</span>
            </h1>
          </div>
          <div className="flex items-end gap-4">
            <HeaderStat label="Gen" value={String(stats.generation)} />
            <div className="w-px self-stretch bg-[var(--line)]" />
            <HeaderStat label="Best" value={`${metres(stats.bestDistance)}m`} accent="var(--cyan)" />
          </div>
        </header>

        <p className="relative z-10 mb-5 max-w-2xl font-readout text-[11px] leading-relaxed text-[var(--muted)]">
          Each robot is a rigid-body frame driven by its own neural network.
          They score by matching a choreographed walking stride while actually
          covering ground, and an evolution strategy breeds the closest matches
          into the next generation. Watch the flailing tighten into a walk —
          the best learn to run.
        </p>

        <div className="relative z-10 grid gap-4 lg:grid-cols-[1.9fr_1fr]">
          {/* Arena */}
          <Panel index="01" title="Arena" right={<Tag on>Live</Tag>} bodyClass="p-0">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={CANVAS.width}
                height={CANVAS.height}
                className="block h-auto w-full"
              />
              <div
                className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
                aria-hidden
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px)",
                }}
              />
            </div>
          </Panel>

          {/* Side stack */}
          <div className="flex flex-col gap-4">
            <Panel index="02" title="Telemetry" bodyClass="p-0">
              <div className="grid grid-cols-2">
                <Readout label="Generation" value={String(stats.generation)} />
                <Readout label="Walking" value={`${stats.active}/${stats.pop}`} />
                <Readout label="This gen" value={`${metres(stats.genDistance)}`} unit="m" />
                <Readout
                  label="Furthest"
                  value={metres(stats.bestDistance)}
                  unit="m"
                  accent="var(--cyan)"
                  live={stats.bestDistance > 0}
                />
              </div>
            </Panel>

            <Panel index="03" title="Best distance / generation">
              <Sparkline data={stats.history} />
            </Panel>
          </div>
        </div>

        {/* Control deck */}
        <Panel index="04" title="Control deck" className="relative z-10 mt-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <button
              type="button"
              onClick={togglePause}
              aria-label={paused ? "Play" : "Pause"}
              className="flex h-10 w-10 items-center justify-center rounded-sm border border-[var(--amber)] bg-[var(--amber)] text-black transition hover:brightness-110"
            >
              {paused ? <PlayIcon /> : <PauseIcon />}
            </button>

            <div className="flex items-center gap-2">
              <FieldLabel>Speed</FieldLabel>
              <div className="flex overflow-hidden rounded-sm border border-[var(--line-2)]">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => pickSpeed(s)}
                    className={`px-2.5 py-1.5 font-readout text-[11px] tabular-nums transition-colors ${
                      speed === s ? "bg-[var(--cyan)]/20 text-[var(--cyan)]" : "text-[var(--muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {s}×
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => pickSpeed("max")}
                  title="Run as fast as this machine allows"
                  className={`px-2.5 py-1.5 font-readout text-[11px] uppercase tracking-[0.15em] transition-colors ${
                    speed === "max" ? "bg-[var(--cyan)]/20 text-[var(--cyan)]" : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  Max
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <FieldLabel>Mutation</FieldLabel>
              <input
                type="range"
                min={0}
                max={0.5}
                step={0.01}
                value={mutationRate}
                onChange={(e) => changeMutation(Number(e.target.value))}
                className="neuro-range w-28"
                style={{ ["--pct" as string]: `${(mutationRate / 0.5) * 100}%` }}
              />
              <span className="w-9 font-readout text-[11px] tabular-nums text-[var(--text)]">
                {mutationRate.toFixed(2)}
              </span>
            </div>

            <div className="ml-auto flex gap-2">
              <DeckButton
                onClick={() => startWorld(CHAMPION_WEIGHTS)}
                title="Seed the population with a pre-trained champion that already runs"
              >
                Load trained brain
              </DeckButton>
              <DeckButton onClick={() => startWorld()} tone="danger" title="New random population from scratch">
                Fresh start
              </DeckButton>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ---------- instrument sub-components ---------- */

function Panel({
  index,
  title,
  right,
  children,
  className = "",
  bodyClass = "p-3",
}: {
  index?: string;
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClass?: string;
}) {
  return (
    <section className={`relative rounded-sm border border-[var(--line)] bg-[var(--panel)] ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-3 py-2">
          <div className="flex items-center gap-2 font-readout text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
            {index && <span className="text-[var(--cyan)]/70">{index}</span>}
            {title}
          </div>
          {right}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

function Readout({
  label,
  value,
  unit,
  accent = "var(--text)",
  live = false,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: string;
  live?: boolean;
}) {
  return (
    <div className="border-b border-r border-[var(--line)] px-3 py-3 [&:nth-child(2n)]:border-r-0 [&:nth-last-child(-n+2)]:border-b-0">
      <div className="mb-1.5 flex items-center gap-1.5 font-readout text-[9px] uppercase tracking-[0.22em] text-[var(--muted)]">
        {live && (
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--cyan)] text-[var(--cyan)]"
            style={{ animation: "neuro-pulse 1.5s ease-in-out infinite" }}
          />
        )}
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-telemetry text-[1.7rem] font-bold leading-none tabular-nums" style={{ color: accent }}>
          {value}
        </span>
        {unit && <span className="font-readout text-[11px] text-[var(--muted)]">{unit}</span>}
      </div>
    </div>
  );
}

function HeaderStat({ label, value, accent = "var(--text)" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="text-right">
      <div className="font-readout text-[9px] uppercase tracking-[0.3em] text-[var(--muted)]">{label}</div>
      <div className="font-telemetry text-xl font-semibold uppercase leading-tight tabular-nums" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}

function LED({ on }: { on: boolean }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{
        background: on ? "var(--mint)" : "var(--muted)",
        color: "var(--mint)",
        animation: on ? "neuro-pulse 1.8s ease-in-out infinite" : "none",
      }}
    />
  );
}

function Tag({ children, on }: { children: React.ReactNode; on?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 font-readout text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
      {on && (
        <span
          className="inline-block h-2 w-2 rounded-full bg-[var(--red)] text-[var(--red)]"
          style={{ animation: "neuro-pulse 1.8s ease-in-out infinite" }}
        />
      )}
      {children}
    </span>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-readout text-[9px] uppercase tracking-[0.22em] text-[var(--muted)]">{children}</span>
  );
}

function DeckButton({
  onClick,
  title,
  children,
  tone = "line",
}: {
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
  tone?: "line" | "danger";
}) {
  const tones: Record<string, string> = {
    line: "border-[var(--line-2)] text-[var(--muted)] hover:border-[var(--cyan)] hover:text-[var(--text)]",
    danger: "border-[var(--red)]/50 text-[var(--red)] hover:bg-[var(--red)] hover:text-black",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded-sm border px-3 py-2 font-readout text-[10px] uppercase tracking-[0.2em] transition-colors ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <path d="M2 1.5v9l8-4.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <rect x="2" y="1.5" width="3" height="9" />
      <rect x="7" y="1.5" width="3" height="9" />
    </svg>
  );
}
