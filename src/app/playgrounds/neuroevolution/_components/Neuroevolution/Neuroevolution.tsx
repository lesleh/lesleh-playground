"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { mulberry32 } from "../../_lib/geometry";
import type { Network } from "../../_lib/nn";
import { clearWorld, loadWorld, saveWorld } from "../../_lib/persistence";
import { createCar } from "../../_lib/car";
import { buildTrack } from "../../_lib/track";
import { drawWorld } from "../../_lib/render";
import { LAPS_TO_FINISH } from "../../_lib/car";
import { idealRunTicks } from "../../_lib/optimum";
import {
  DEFAULT_CONFIG,
  activeCount,
  bestFinishTicks,
  createWorld,
  leader,
  stepWorld,
  type SimConfig,
  type World,
} from "../../_lib/world";
import { NetworkView } from "./NetworkView";
import { Sparkline } from "./Sparkline";

const VIEWPORT = { width: 900, height: 600 };
const SPEEDS = [1, 2, 4, 8];
// Flush HUD state ~10x/second rather than every frame.
const HUD_EVERY = 6;
// Nominal ticks per second, for turning finish-tick counts into a time.
const TICKS_PER_SEC = 60;

interface Stats {
  generation: number;
  active: number;
  pop: number;
  genTicks: number;
  bestTicks: number;
  idealTicks: number;
  runTimes: number[];
  leaderNet: Network | null;
}

const EMPTY_STATS: Stats = {
  generation: 1,
  active: 0,
  pop: DEFAULT_CONFIG.populationSize,
  genTicks: 0,
  bestTicks: 0,
  idealTicks: 0,
  runTimes: [],
  leaderNet: null,
};

function formatTime(ticks: number): string {
  if (ticks <= 0) return "—";
  return `${(ticks / TICKS_PER_SEC).toFixed(1)}s`;
}

export function Neuroevolution() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const randRef = useRef<() => number>(mulberry32(1));
  const seedRef = useRef(1);
  const configRef = useRef<SimConfig>({ ...DEFAULT_CONFIG });

  const pausedRef = useRef(false);
  const speedRef = useRef(2);
  const sensorsRef = useRef(true);
  const savedGenRef = useRef(0);

  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [sensors, setSensors] = useState(true);
  const [mutationRate, setMutationRate] = useState(DEFAULT_CONFIG.mutationRate);
  const [varyTrack, setVaryTrack] = useState(DEFAULT_CONFIG.varyTrack);

  const flush = useCallback(() => {
    const w = worldRef.current;
    if (!w) return;
    const lead = leader(w);
    const genTicks = bestFinishTicks(w);
    const bestTicks =
      genTicks > 0 && (w.bestTicks === 0 || genTicks < w.bestTicks)
        ? genTicks
        : w.bestTicks;
    setStats({
      generation: w.generation,
      active: activeCount(w),
      pop: w.cars.length,
      genTicks,
      bestTicks,
      idealTicks: idealRunTicks(w.track),
      runTimes: w.timeHistory.map((t) => t / 60),
      leaderNet: lead ? lead.net : null,
    });
  }, []);

  // Start a new track. keepBrains carries the current population over (watch
  // them handle, then re-adapt to, a fresh course); otherwise a random one.
  const startWorld = useCallback(
    (keepBrains: boolean) => {
      clearWorld();
      seedRef.current += 1;
      randRef.current = mulberry32(seedRef.current);
      const prev = worldRef.current;
      let world: World;
      if (keepBrains && prev) {
        const track = buildTrack(VIEWPORT, randRef.current);
        world = {
          track,
          cars: prev.cars.map((c) => createCar(c.net, track)),
          generation: prev.generation,
          step: 0,
          bestEver: 0,
          bestTicks: 0,
          history: [],
          timeHistory: [],
        };
      } else {
        world = createWorld(configRef.current, VIEWPORT, randRef.current);
      }
      worldRef.current = world;
      savedGenRef.current = world.generation;
      saveWorld(world);
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

    // Resume a saved run if there is one, else start fresh.
    const saved = loadWorld();
    if (saved) {
      worldRef.current = {
        track: saved.track,
        cars: saved.nets.map((net) => createCar(net, saved.track)),
        generation: saved.generation,
        step: 0,
        bestEver: saved.bestEver,
        bestTicks: saved.bestTicks,
        history: saved.history,
        timeHistory: saved.timeHistory ?? [],
      };
    } else {
      worldRef.current = createWorld(configRef.current, VIEWPORT, randRef.current);
    }
    savedGenRef.current = worldRef.current.generation;
    flush();

    let animId = 0;
    let frame = 0;

    const loop = () => {
      const w = worldRef.current;
      if (w) {
        if (!pausedRef.current) {
          for (let s = 0; s < speedRef.current; s++) {
            stepWorld(w, configRef.current, randRef.current);
          }
        }
        drawWorld(ctx, w, sensorsRef.current);
        // Persist once per generation so a refresh resumes where it left off.
        if (w.generation !== savedGenRef.current) {
          savedGenRef.current = w.generation;
          saveWorld(w);
        }
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
  const pickSpeed = (s: number) => {
    speedRef.current = s;
    setSpeed(s);
  };
  const toggleSensors = () => {
    sensorsRef.current = !sensorsRef.current;
    setSensors(sensorsRef.current);
  };
  const changeMutation = (v: number) => {
    configRef.current = { ...configRef.current, mutationRate: v };
    setMutationRate(v);
  };
  const toggleVary = () => {
    const next = !varyTrack;
    configRef.current = { ...configRef.current, varyTrack: next };
    setVaryTrack(next);
  };

  return (
    <div className="min-h-full bg-[#0d0d0d] text-[#fffef5]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        {/* Header */}
        <header className="mb-6">
          <div className="mb-4 h-1 bg-[#f7c948]" />
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
            genetic algorithm · no training data
          </p>
          <h1 className="font-roboto-slab text-[clamp(2.5rem,8vw,4.5rem)] font-black leading-[0.85] tracking-tight">
            Neuroevolution
          </h1>
          <p className="mt-3 max-w-2xl font-mono text-sm leading-relaxed text-white/50">
            Every car is steered by its own little neural network, racing to
            finish {LAPS_TO_FINISH} laps as fast as it can. The quickest breed
            the next generation, with mutations. Nobody tells them how to drive;
            the track does. Watch the lap times keep dropping.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1.9fr_1fr]">
          {/* Canvas */}
          <div className="overflow-hidden rounded-lg border-[3px] border-white/15">
            <canvas
              ref={canvasRef}
              width={VIEWPORT.width}
              height={VIEWPORT.height}
              className="block h-auto w-full"
            />
          </div>

          {/* Side panel */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/15 bg-white/15">
              <Stat label="Generation" value={String(stats.generation)} />
              <Stat label="Driving" value={`${stats.active} / ${stats.pop}`} />
              <Stat label="This gen" value={formatTime(stats.genTicks)} />
              <Stat
                label="Fastest run"
                value={formatTime(stats.bestTicks)}
                sub={`${LAPS_TO_FINISH} laps`}
              />
            </div>

            {/* Physics-limit target for this exact track. */}
            <div className="flex items-center justify-between rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                Track optimum
              </span>
              <span
                className="font-roboto-slab text-lg font-black tabular-nums text-[#34d399]"
                title="Estimated fastest possible run at the car's physical limits on this track"
              >
                ≈ {formatTime(stats.idealTicks)}
              </span>
            </div>

            <Panel title="Best run time / generation (green = optimum)">
              <Sparkline data={stats.runTimes} optimum={stats.idealTicks / 60} />
            </Panel>

            <Panel title="Leader's brain">
              <NetworkView net={stats.leaderNet} />
              <div className="mt-2 flex items-center justify-center gap-4 font-mono text-[9px] uppercase tracking-widest text-white/40">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-3" style={{ background: "#38bdf8" }} />
                  excite
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-3" style={{ background: "#ef3d2f" }} />
                  inhibit
                </span>
              </div>
            </Panel>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-white/15 bg-white/[0.03] p-3">
          <button
            type="button"
            onClick={togglePause}
            className="rounded-md border-[3px] border-[#f7c948] bg-[#f7c948] px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-black transition-transform hover:-translate-y-0.5"
          >
            {paused ? "Play" : "Pause"}
          </button>

          <div className="flex overflow-hidden rounded-md border border-white/20">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => pickSpeed(s)}
                className={`px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
                  speed === s ? "bg-white/90 text-black" : "text-white/70 hover:bg-white/10"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/60">
            Mutation
            <input
              type="range"
              min={0}
              max={0.5}
              step={0.01}
              value={mutationRate}
              onChange={(e) => changeMutation(Number(e.target.value))}
              className="w-28 accent-[#f7c948]"
            />
            <span className="w-8 tabular-nums text-white/80">
              {mutationRate.toFixed(2)}
            </span>
          </label>

          <button
            type="button"
            onClick={toggleSensors}
            aria-pressed={sensors}
            className={`rounded-md border px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
              sensors
                ? "border-white/40 bg-white/10 text-white"
                : "border-white/20 text-white/50 hover:bg-white/5"
            }`}
          >
            Sensors
          </button>

          <button
            type="button"
            onClick={toggleVary}
            aria-pressed={varyTrack}
            title="Generate a fresh track every generation, so cars learn to drive in general instead of memorising one track"
            className={`rounded-md border px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
              varyTrack
                ? "border-white/40 bg-white/10 text-white"
                : "border-white/20 text-white/50 hover:bg-white/5"
            }`}
          >
            Vary track
          </button>

          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => startWorld(true)}
              title="Keep the current brains, drop them on a brand-new track"
              className="rounded-md border border-white/20 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white/70 transition-colors hover:bg-white hover:text-black"
            >
              New track
            </button>
            <button
              type="button"
              onClick={() => startWorld(false)}
              title="New track and a fresh population of random brains"
              className="rounded-md border border-[#ef3d2f]/60 px-4 py-2 font-mono text-xs uppercase tracking-widest text-[#ef3d2f] transition-colors hover:bg-[#ef3d2f] hover:text-black"
            >
              Fresh start
            </button>
          </div>
        </div>

        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-white/30">
          auto-saves · refresh resumes · new track keeps the brains · fresh start wipes them
          {varyTrack ? " · varying track each generation" : ""}
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-[#0d0d0d] px-3 py-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
        {label}
      </div>
      <div className="font-roboto-slab text-2xl font-black leading-tight tabular-nums">
        {value}
      </div>
      {sub && (
        <div className="font-mono text-[10px] uppercase tracking-widest text-[#f7c948]/80">
          {sub}
        </div>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/[0.03] p-3">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
        {title}
      </div>
      {children}
    </div>
  );
}
