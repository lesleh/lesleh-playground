"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { mulberry32 } from "../../_lib/geometry";
import type { Network } from "../../_lib/nn";
import { clearWorld, loadWorld, saveWorld } from "../../_lib/persistence";
import { LAPS_TO_FINISH, createCar, stepCar, type Car } from "../../_lib/car";
import { buildTrack } from "../../_lib/track";
import { drawWorld } from "../../_lib/render";
import { idealRunTicks } from "../../_lib/optimum";
import { populationFrom } from "../../_lib/genetic";
import { parseBrain, serializeBrain } from "../../_lib/brainIO";
import { display, mono } from "../../_lib/fonts";
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

type Mode = "evolve" | "solo";

interface Stats {
  mode: Mode;
  generation: number;
  active: number;
  pop: number;
  genTicks: number;
  bestTicks: number;
  idealTicks: number;
  runTimes: number[];
  leaderNet: Network | null;
  // Solo-mode fields.
  soloLaps: number;
  soloRunTicks: number;
  soloBestTicks: number;
}

const EMPTY_STATS: Stats = {
  mode: "evolve",
  generation: 1,
  active: 0,
  pop: DEFAULT_CONFIG.populationSize,
  genTicks: 0,
  bestTicks: 0,
  idealTicks: 0,
  runTimes: [],
  leaderNet: null,
  soloLaps: 0,
  soloRunTicks: 0,
  soloBestTicks: 0,
};

// Seconds string for a tick count ("—" when there's nothing yet).
function secs(ticks: number): string {
  return ticks > 0 ? (ticks / TICKS_PER_SEC).toFixed(1) : "—";
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

  // Solo mode: race one champion brain on a loop, no evolution.
  const modeRef = useRef<Mode>("evolve");
  const championRef = useRef<Network | null>(null);
  const soloCarRef = useRef<Car | null>(null);
  const soloBestRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [sensors, setSensors] = useState(true);
  const [mutationRate, setMutationRate] = useState(DEFAULT_CONFIG.mutationRate);
  const [varyTrack, setVaryTrack] = useState(DEFAULT_CONFIG.varyTrack);
  const [mode, setMode] = useState<Mode>("evolve");
  const [ioMsg, setIoMsg] = useState("");

  const flush = useCallback(() => {
    const w = worldRef.current;
    if (!w) return;
    if (modeRef.current === "solo") {
      const car = soloCarRef.current;
      const gateCount = w.track.gates.length;
      setStats((prev) => ({
        ...prev,
        mode: "solo",
        idealTicks: idealRunTicks(w.track),
        leaderNet: championRef.current,
        soloLaps: car ? Math.min(LAPS_TO_FINISH, Math.floor(car.gatesPassed / gateCount)) : 0,
        soloRunTicks: car ? car.ticks : 0,
        soloBestTicks: soloBestRef.current,
      }));
      return;
    }
    const lead = leader(w);
    const genTicks = bestFinishTicks(w);
    const bestTicks =
      genTicks > 0 && (w.bestTicks === 0 || genTicks < w.bestTicks)
        ? genTicks
        : w.bestTicks;
    setStats((prev) => ({
      ...prev,
      mode: "evolve",
      generation: w.generation,
      active: activeCount(w),
      pop: w.cars.length,
      genTicks,
      bestTicks,
      idealTicks: idealRunTicks(w.track),
      runTimes: w.timeHistory.map((t) => t / 60),
      leaderNet: lead ? lead.net : null,
    }));
  }, []);

  // The brain to spotlight/export: the champion being raced in solo, else the
  // record-holder (best finish so far), falling back to the current leader
  // before anyone has finished.
  const spotlightNet = useCallback((): Network | null => {
    if (championRef.current && modeRef.current === "solo") return championRef.current;
    const w = worldRef.current;
    if (!w) return null;
    return w.bestNet ?? leader(w)?.net ?? w.cars[0]?.net ?? null;
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
          bestNet: null,
          history: [],
          timeHistory: [],
        };
      } else {
        world = createWorld(configRef.current, VIEWPORT, randRef.current);
      }
      worldRef.current = world;
      savedGenRef.current = world.generation;
      // A new track invalidates the solo run (times are track-specific).
      soloCarRef.current = null;
      soloBestRef.current = 0;
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
        bestNet: saved.bestNet ?? null,
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
      if (w && modeRef.current === "solo") {
        const brain = championRef.current;
        if (brain) {
          if (!soloCarRef.current) soloCarRef.current = createCar(brain, w.track);
          if (!pausedRef.current) {
            for (let s = 0; s < speedRef.current; s++) {
              const car = soloCarRef.current;
              stepCar(car, w.track);
              if (!car.alive || car.done) {
                if (
                  car.done &&
                  (soloBestRef.current === 0 || car.finishTicks < soloBestRef.current)
                ) {
                  soloBestRef.current = car.finishTicks;
                }
                soloCarRef.current = createCar(brain, w.track); // loop the run
                break;
              }
            }
          }
          const solo = soloCarRef.current;
          drawWorld(ctx, { ...w, cars: solo ? [solo] : [] }, sensorsRef.current);
        }
        if (frame % HUD_EVERY === 0) flush();
      } else if (w) {
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

  const enterSolo = useCallback(
    (net: Network | null) => {
      const brain = net ?? spotlightNet();
      if (!brain) return;
      championRef.current = brain;
      soloCarRef.current = null;
      soloBestRef.current = 0;
      modeRef.current = "solo";
      setMode("solo");
      flush();
    },
    [flush, spotlightNet],
  );

  const toggleSolo = () => {
    if (modeRef.current === "solo") {
      modeRef.current = "evolve";
      setMode("evolve");
      soloCarRef.current = null;
      flush();
    } else {
      enterSolo(null);
    }
  };

  const downloadBrain = () => {
    const net = spotlightNet();
    const w = worldRef.current;
    if (!net) return;
    const runTicks = modeRef.current === "solo" ? soloBestRef.current : w?.bestTicks ?? 0;
    const text = serializeBrain(net, {
      generation: w?.generation,
      runSeconds: runTicks ? runTicks / TICKS_PER_SEC : undefined,
    });
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `neuro-brain-gen${w?.generation ?? 0}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIoMsg("Brain exported");
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-uploading the same file later
    if (!file) return;
    file.text().then((text) => {
      try {
        enterSolo(parseBrain(text));
        setIoMsg("Brain loaded — racing solo");
      } catch (err) {
        setIoMsg(err instanceof Error ? err.message : "Could not load brain");
      }
    });
  };

  const breedFromChampion = () => {
    const w = worldRef.current;
    const net = spotlightNet();
    if (!w || !net) return;
    clearWorld();
    const cfg = configRef.current;
    const cars = populationFrom(
      net,
      cfg.populationSize,
      cfg.mutationRate,
      cfg.mutationStrength,
      randRef.current,
    ).map((n) => createCar(n, w.track));
    const world: World = {
      track: w.track,
      cars,
      generation: 1,
      step: 0,
      bestEver: 0,
      bestTicks: 0,
      bestNet: null,
      history: [],
      timeHistory: [],
    };
    worldRef.current = world;
    savedGenRef.current = 1;
    soloCarRef.current = null;
    modeRef.current = "evolve";
    setMode("evolve");
    saveWorld(world);
    flush();
    setIoMsg("Seeded a fresh population from the champion");
  };

  const solo = mode === "solo";
  const shownBest = solo ? stats.soloBestTicks : stats.bestTicks;
  const deltaS =
    shownBest > 0 && stats.idealTicks > 0
      ? (shownBest - stats.idealTicks) / TICKS_PER_SEC
      : null;

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
        {/* One-time boot scanline sweep */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="h-24 w-full"
            style={{
              background:
                "linear-gradient(to bottom, transparent, rgba(69,200,216,0.10), transparent)",
              animation: "neuro-sweep 1.1s ease-out 0.1s both",
            }}
          />
        </div>

        {/* Header */}
        <header
          className="neuro-boot relative z-10 mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-3"
          style={{ animationDelay: "0ms" }}
        >
          <div>
            <div className="mb-2 flex items-center gap-2 font-readout text-[10px] uppercase tracking-[0.35em] text-[var(--muted)]">
              <LED on={!paused} color="var(--mint)" />
              Genetic drive model
              <span className="text-[var(--line-2)]">·</span>
              <span className="text-[var(--muted)]">no training data</span>
            </div>
            <h1 className="font-telemetry text-[clamp(2rem,6vw,3.4rem)] font-bold uppercase leading-[0.85] tracking-tight">
              Neuro<span className="text-[var(--cyan)]">evolution</span>
            </h1>
          </div>
          <div className="flex items-stretch gap-4">
            <HeaderStat label="Gen" value={solo ? "—" : String(stats.generation)} />
            <div className="w-px bg-[var(--line)]" />
            <HeaderStat
              label="Mode"
              value={solo ? "Solo" : "Evolve"}
              accent={solo ? "var(--amber)" : "var(--cyan)"}
            />
          </div>
        </header>

        <p className="neuro-boot relative z-10 mb-5 max-w-2xl font-readout text-[11px] leading-relaxed text-[var(--muted)]" style={{ animationDelay: "40ms" }}>
          Each car drives with its own neural network, racing to finish{" "}
          {LAPS_TO_FINISH} laps flat out. The fastest breed the next generation,
          with mutations. Nobody teaches them the line — the track does.
        </p>

        <div className="relative z-10 grid gap-4 lg:grid-cols-[1.9fr_1fr]">
          {/* Track viewport */}
          <Panel
            index="01"
            title={solo ? "Solo run" : "Track"}
            right={<Tag on>Live</Tag>}
            bodyClass="p-0"
            className="neuro-boot"
            style={{ animationDelay: "80ms" }}
          >
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={VIEWPORT.width}
                height={VIEWPORT.height}
                className="block h-auto w-full"
              />
              {/* CRT scanlines */}
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
            <Panel
              index="02"
              title="Telemetry"
              className="neuro-boot"
              bodyClass="p-0"
              style={{ animationDelay: "140ms" }}
            >
              <div className="grid grid-cols-2">
                {solo ? (
                  <>
                    <Readout label="Mode" value="Solo" accent="var(--amber)" />
                    <Readout
                      label="Laps"
                      value={`${stats.soloLaps}/${LAPS_TO_FINISH}`}
                    />
                    <Readout
                      label="This run"
                      value={secs(stats.soloRunTicks)}
                      unit={stats.soloRunTicks > 0 ? "s" : ""}
                    />
                    <Readout
                      label="Best run"
                      value={secs(stats.soloBestTicks)}
                      unit={stats.soloBestTicks > 0 ? "s" : ""}
                      accent="var(--amber)"
                      live={stats.soloBestTicks > 0}
                    />
                  </>
                ) : (
                  <>
                    <Readout label="Generation" value={String(stats.generation)} />
                    <Readout label="Driving" value={`${stats.active}/${stats.pop}`} />
                    <Readout
                      label="This gen"
                      value={secs(stats.genTicks)}
                      unit={stats.genTicks > 0 ? "s" : ""}
                    />
                    <Readout
                      label="Fastest"
                      value={secs(stats.bestTicks)}
                      unit={stats.bestTicks > 0 ? "s" : ""}
                      accent="var(--amber)"
                      live={stats.bestTicks > 0}
                    />
                  </>
                )}
              </div>
              {/* Target + delta */}
              <div className="flex items-center justify-between border-t border-[var(--line)] px-3 py-2.5">
                <span className="font-readout text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
                  Track optimum
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="font-telemetry text-lg font-semibold tabular-nums text-[var(--mint)]">
                    ≈ {secs(stats.idealTicks)}
                    <span className="ml-0.5 text-[10px] text-[var(--muted)]">s</span>
                  </span>
                  {deltaS !== null && <DeltaChip delta={deltaS} />}
                </div>
              </div>
            </Panel>

            <Panel
              index="03"
              title="Lap time / generation"
              right={
                <span className="font-readout text-[9px] uppercase tracking-[0.2em] text-[var(--mint)]">
                  — optimum
                </span>
              }
              className="neuro-boot"
              style={{ animationDelay: "200ms" }}
            >
              <Sparkline data={stats.runTimes} optimum={stats.idealTicks / 60} />
            </Panel>

            <Panel
              index="04"
              title="Leader schematic"
              className="neuro-boot"
              style={{ animationDelay: "260ms" }}
            >
              <NetworkView net={stats.leaderNet} />
              <div className="mt-2 flex items-center justify-center gap-4 font-readout text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-3 rounded-[1px] bg-[var(--cyan)]" />
                  excite
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-3 rounded-[1px] bg-[var(--red)]" />
                  inhibit
                </span>
              </div>
            </Panel>
          </div>
        </div>

        {/* Control deck */}
        <Panel
          index="05"
          title="Control deck"
          className="neuro-boot relative z-10 mt-4"
          style={{ animationDelay: "320ms" }}
        >
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {/* Transport */}
            <button
              type="button"
              onClick={togglePause}
              aria-label={paused ? "Play" : "Pause"}
              className="flex h-10 w-10 items-center justify-center rounded-sm border border-[var(--amber)] bg-[var(--amber)] text-black transition hover:brightness-110"
            >
              {paused ? <PlayIcon /> : <PauseIcon />}
            </button>

            {/* Speed */}
            <div className="flex items-center gap-2">
              <FieldLabel>Speed</FieldLabel>
              <div className="flex overflow-hidden rounded-sm border border-[var(--line-2)]">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => pickSpeed(s)}
                    className={`px-2.5 py-1.5 font-readout text-[11px] tabular-nums transition-colors ${
                      speed === s
                        ? "bg-[var(--cyan)]/20 text-[var(--cyan)]"
                        : "text-[var(--muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>

            {/* Mutation */}
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

            <Switch on={sensors} onClick={toggleSensors} label="Sensors" />
            <Switch
              on={varyTrack}
              onClick={toggleVary}
              label="Vary track"
              title="Fresh track every generation, so cars learn to drive in general instead of memorising one track"
            />

            <div className="ml-auto flex gap-2">
              <DeckButton
                onClick={() => startWorld(true)}
                title="Keep the current brains, drop them on a brand-new track"
              >
                New track
              </DeckButton>
              <DeckButton
                onClick={() => startWorld(false)}
                title="New track and a fresh population of random brains"
                tone="danger"
              >
                Fresh start
              </DeckButton>
            </div>
          </div>

          <p className="mt-3 border-t border-[var(--line)] pt-2.5 font-readout text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
            auto-saves · refresh resumes · new track keeps the brains · fresh start wipes them
            {varyTrack ? " · varying track each generation" : ""}
          </p>
        </Panel>

        {/* Garage / champion */}
        <Panel
          index="06"
          title="Garage · champion"
          right={
            ioMsg ? (
              <span className="font-readout text-[9px] uppercase tracking-[0.2em] text-[var(--mint)]">
                {ioMsg}
              </span>
            ) : undefined
          }
          className="neuro-boot relative z-10 mt-4"
          style={{ animationDelay: "380ms" }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <DeckButton
              onClick={toggleSolo}
              tone={solo ? "amber" : "line"}
              title="Race just the best brain, on its own, looping"
            >
              {solo ? "Back to evolving" : "Race solo"}
            </DeckButton>
            <div className="mx-1 h-5 w-px bg-[var(--line)]" />
            <DeckButton onClick={downloadBrain} title="Save the best brain to a file">
              ↓ Export
            </DeckButton>
            <DeckButton
              onClick={() => fileInputRef.current?.click()}
              title="Load a brain from a file and race it solo"
            >
              ↑ Import
            </DeckButton>
            <DeckButton
              onClick={breedFromChampion}
              title="Start a fresh population evolved from this brain"
            >
              ⤳ Breed from it
            </DeckButton>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={onFile}
              className="hidden"
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ---------- instrument sub-components ---------- */

function Corners() {
  const base = "pointer-events-none absolute h-1.5 w-1.5 border-[var(--line-2)]";
  return (
    <>
      <span className={`${base} left-0 top-0 border-l border-t`} />
      <span className={`${base} right-0 top-0 border-r border-t`} />
      <span className={`${base} bottom-0 left-0 border-b border-l`} />
      <span className={`${base} bottom-0 right-0 border-b border-r`} />
    </>
  );
}

function Panel({
  index,
  title,
  right,
  children,
  className = "",
  bodyClass = "p-3",
  style,
}: {
  index?: string;
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClass?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section
      className={`relative rounded-sm border border-[var(--line)] bg-[var(--panel)] ${className}`}
      style={style}
    >
      <Corners />
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
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--red)] text-[var(--red)]"
            style={{ animation: "neuro-pulse 1.5s ease-in-out infinite" }}
          />
        )}
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className="font-telemetry text-[1.7rem] font-bold leading-none tabular-nums"
          style={{ color: accent }}
        >
          {value}
        </span>
        {unit && (
          <span className="font-readout text-[11px] text-[var(--muted)]">{unit}</span>
        )}
      </div>
    </div>
  );
}

function DeltaChip({ delta }: { delta: number }) {
  const tone =
    delta <= 0.5 ? "var(--mint)" : delta <= 1.5 ? "var(--amber)" : "var(--muted)";
  const sign = delta >= 0 ? "+" : "−";
  return (
    <span
      className="rounded-sm border px-1.5 py-0.5 font-readout text-[10px] tabular-nums"
      style={{ borderColor: tone, color: tone }}
    >
      Δ {sign}
      {Math.abs(delta).toFixed(1)}s
    </span>
  );
}

function HeaderStat({
  label,
  value,
  accent = "var(--text)",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="text-right">
      <div className="font-readout text-[9px] uppercase tracking-[0.3em] text-[var(--muted)]">
        {label}
      </div>
      <div
        className="font-telemetry text-xl font-semibold uppercase leading-tight tabular-nums"
        style={{ color: accent }}
      >
        {value}
      </div>
    </div>
  );
}

function LED({ on, color = "var(--mint)" }: { on: boolean; color?: string }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{
        background: on ? color : "var(--muted)",
        color,
        animation: on ? "neuro-pulse 1.8s ease-in-out infinite" : "none",
      }}
    />
  );
}

function Tag({ children, on }: { children: React.ReactNode; on?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 font-readout text-[9px] uppercase tracking-[0.25em] text-[var(--muted)]">
      {on && <LED on color="var(--red)" />}
      {children}
    </span>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-readout text-[9px] uppercase tracking-[0.22em] text-[var(--muted)]">
      {children}
    </span>
  );
}

function Switch({
  on,
  onClick,
  label,
  title,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      title={title}
      className="flex items-center gap-2 font-readout text-[10px] uppercase tracking-[0.2em]"
    >
      <span
        className={`relative h-4 w-7 rounded-sm border transition-colors ${
          on ? "border-[var(--cyan)] bg-[var(--cyan)]/20" : "border-[var(--line-2)]"
        }`}
      >
        <span
          className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-[1px] transition-all ${
            on
              ? "left-[calc(100%-0.8rem)] bg-[var(--cyan)]"
              : "left-0.5 bg-[var(--muted)]"
          }`}
        />
      </span>
      <span className={on ? "text-[var(--text)]" : "text-[var(--muted)]"}>{label}</span>
    </button>
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
  tone?: "line" | "danger" | "amber";
}) {
  const tones: Record<string, string> = {
    line: "border-[var(--line-2)] text-[var(--muted)] hover:border-[var(--cyan)] hover:text-[var(--text)]",
    danger: "border-[var(--red)]/50 text-[var(--red)] hover:bg-[var(--red)] hover:text-black",
    amber: "border-[var(--amber)] bg-[var(--amber)] text-black hover:brightness-110",
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
