"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { display, mono } from "../../_lib/fonts";
import {
  DEFAULT_RUN,
  phaseOf,
  type HistoryPoint,
  type Phase,
  type RunConfig,
  type Snapshot,
} from "../../_lib/trainer";
import type { WorkerRequest, WorkerResponse } from "../../_lib/protocol";
import { AnswerGrid, GridLegend } from "./AnswerGrid";
import { AskNetwork } from "./AskNetwork";
import { EmbeddingCircle } from "./EmbeddingCircle";
import { Legend, LineChart, type Marker, type Series } from "./LineChart";
import { Spectrum } from "./Spectrum";

const ACC_SERIES: Series[] = [
  { key: "trainAcc", colour: "var(--amber)", label: "Train" },
  { key: "testAcc", colour: "var(--mint)", label: "Unseen" },
];
const LOSS_SERIES: Series[] = [
  { key: "trainLoss", colour: "var(--amber)", label: "Train" },
  { key: "testLoss", colour: "var(--mint)", label: "Unseen" },
];
const NORM_SERIES: Series[] = [{ key: "norm", colour: "var(--cyan)", label: "Weight norm" }];

const PHASES: Record<Phase, { label: string; colour: string; blurb: string }> = {
  memorising: {
    label: "Memorising",
    colour: "var(--amber)",
    blurb: "Fitting the training pairs.",
  },
  memorised: {
    label: "Memorised",
    colour: "var(--red)",
    blurb: "Perfect on training pairs, guessing on the rest. Keep watching.",
  },
  grokking: {
    label: "Grokking",
    colour: "var(--cyan)",
    blurb: "The general rule is taking over from the lookup table.",
  },
  grokked: {
    label: "Grokked",
    colour: "var(--mint)",
    blurb: "Right on pairs it has never seen. Training pauses once it settles.",
  },
};

// Step axis grows in half-decades so the chart does not rescale every frame.
function axisMax(step: number): number {
  const e = Math.log10(Math.max(step, 1) * 1.15);
  return 10 ** Math.max(3, Math.ceil(e * 2) / 2);
}

function firstStep(history: HistoryPoint[], test: (pt: HistoryPoint) => boolean): number | null {
  const pt = history.find(test);
  return pt ? pt.step : null;
}

function pct(v: number | undefined): string {
  return v === undefined ? "-" : `${(v * 100).toFixed(1)}`;
}

export function Grokking() {
  const workerRef = useRef<Worker | null>(null);
  const historyRef = useRef<HistoryPoint[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [running, setRunning] = useState(true);
  const [weightDecay, setWeightDecay] = useState(DEFAULT_RUN.weightDecay);
  const [trainFraction, setTrainFraction] = useState(DEFAULT_RUN.trainFraction);
  const [seed, setSeed] = useState(DEFAULT_RUN.seed);
  // The settings the current run started with, for the "restart to apply" hint.
  const [runFraction, setRunFraction] = useState(DEFAULT_RUN.trainFraction);
  // Unseen in the default run, and wraps past 59.
  const [query, setQuery] = useState({ a: 30, b: 43 });

  const send = (msg: WorkerRequest) => workerRef.current?.postMessage(msg);

  useEffect(() => {
    const worker = new Worker(new URL("../../_lib/trainer.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { snapshot: snap, running: workerRunning } = e.data;
      setRunning(workerRunning);
      if (snap.step === 0) historyRef.current = [];
      historyRef.current = historyRef.current.concat(snap.history);
      setHistory(historyRef.current);
      setSnapshot(snap);
    };
    worker.postMessage({ type: "reset", cfg: DEFAULT_RUN } satisfies WorkerRequest);
    worker.postMessage({ type: "play" } satisfies WorkerRequest);
    return () => worker.terminate();
  }, []);

  const restart = useCallback(
    (nextSeed: number) => {
      const cfg: RunConfig = { p: DEFAULT_RUN.p, trainFraction, weightDecay, seed: nextSeed };
      setSeed(nextSeed);
      setRunFraction(trainFraction);
      historyRef.current = [];
      setHistory([]);
      send({ type: "reset", cfg });
    },
    [trainFraction, weightDecay],
  );

  const togglePlay = () => {
    send({ type: running ? "pause" : "play" });
    setRunning(!running);
  };

  const changeWeightDecay = (v: number) => {
    setWeightDecay(v);
    send({ type: "setWeightDecay", value: v });
  };

  const p = DEFAULT_RUN.p;
  const last = history[history.length - 1];
  const phase = phaseOf(last);
  const memorisedAt = firstStep(history, (pt) => pt.trainAcc >= 0.99);
  const grokkedAt = firstStep(history, (pt) => pt.testAcc >= 0.95);
  const markers: Marker[] = [];
  if (memorisedAt) markers.push({ step: memorisedAt, label: `memorised ${memorisedAt}`, colour: "var(--amber)" });
  if (grokkedAt) markers.push({ step: grokkedAt, label: `grokked ${grokkedAt}`, colour: "var(--mint)" });
  const xMax = axisMax(snapshot?.step ?? 1);
  const fourier = snapshot?.fourier;
  const nTrain = Math.round(p * p * runFraction);

  return (
    <div
      className={`${display.variable} ${mono.variable} neuro-console h-full overflow-y-auto`}
      style={{
        backgroundColor: "var(--ink)",
        color: "var(--text)",
        backgroundImage:
          "linear-gradient(rgba(150,180,205,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(150,180,205,0.045) 1px, transparent 1px), radial-gradient(130% 90% at 50% -10%, rgba(70,224,173,0.07), transparent 55%)",
        backgroundSize: "46px 46px, 46px 46px, 100% 100%",
      }}
    >
      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-3">
          <div>
            <div className="mb-2 flex items-center gap-2 font-readout text-[10px] uppercase tracking-[0.35em] text-[var(--muted)]">
              <LED on={running} />
              Modular arithmetic
              <span className="text-[var(--line-2)]">·</span>
              <span>(a + b) mod {p}</span>
            </div>
            <h1 className="font-telemetry text-[clamp(2rem,6vw,3.4rem)] font-bold uppercase leading-[0.85] tracking-tight">
              Grok<span className="text-[var(--mint)]">king</span>
            </h1>
          </div>
          <div className="flex items-end gap-4">
            <HeaderStat label="Step" value={(snapshot?.step ?? 0).toLocaleString("en-GB")} />
            <div className="w-px self-stretch bg-[var(--line)]" />
            <HeaderStat label="Phase" value={PHASES[phase].label} accent={PHASES[phase].colour} />
          </div>
        </header>

        <p className="mb-5 max-w-3xl font-readout text-[11px] leading-relaxed text-[var(--muted)]">
          A small neural network learns to add numbers on a clock with {p} hours. It trains on{" "}
          {Math.round(runFraction * 100)}% of the {p * p} possible sums and never sees the rest. It memorises
          its training sums within a few hundred steps, but stays at chance on the unseen ones. Thousands of
          steps later, it suddenly gets them right. That delayed jump is grokking.
        </p>

        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="flex flex-col gap-4">
            <Panel index="01" title="Accuracy" right={<Legend series={ACC_SERIES} />}>
              <LineChart
                history={history}
                series={ACC_SERIES}
                yScale="unit"
                markers={markers}
                xMax={xMax}
                ariaLabel="Train and unseen accuracy against training step, log scale"
              />
            </Panel>
            <div className="grid gap-4 sm:grid-cols-2">
              <Panel index="02" title="Loss" right={<Legend series={LOSS_SERIES} />}>
                <LineChart
                  history={history}
                  series={LOSS_SERIES}
                  yScale="log"
                  xMax={xMax}
                  width={320}
                  height={190}
                  ariaLabel="Train and unseen loss, log scale"
                />
              </Panel>
              <Panel index="03" title="Weight norm">
                <LineChart
                  history={history}
                  series={NORM_SERIES}
                  yScale="fit"
                  xMax={xMax}
                  width={320}
                  height={190}
                  ariaLabel="Total weight norm against step"
                />
              </Panel>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Panel index="04" title="Telemetry" bodyClass="p-0">
              <div className="grid grid-cols-2">
                <Readout label="Train acc" value={pct(last?.trainAcc)} unit="%" accent="var(--amber)" />
                <Readout label="Unseen acc" value={pct(last?.testAcc)} unit="%" accent="var(--mint)" live={phase === "grokking"} />
                <Readout label="Weight norm" value={last ? last.norm.toFixed(1) : "-"} />
                <Readout label="Top 5 freqs" value={fourier ? pct(fourier.top5Share) : "-"} unit="%" />
              </div>
              <div className="border-t border-[var(--line)] px-3 py-2.5 font-readout text-[11px] leading-snug" style={{ color: PHASES[phase].colour }}>
                {PHASES[phase].blurb}
              </div>
            </Panel>
            <Panel index="05" title="Every sum: row a, column b">
              {snapshot && (
                <AnswerGrid
                  p={p}
                  answer={snapshot.predictions.answer}
                  isTrain={snapshot.isTrain}
                  selected={query}
                  onPick={(a, b) => setQuery({ a, b })}
                />
              )}
              <div className="mt-3">
                <GridLegend />
              </div>
            </Panel>
            <Panel index="06" title="Ask the network">
              <AskNetwork
                p={p}
                a={query.a}
                b={query.b}
                onChange={(a, b) => setQuery({ a, b })}
                predictions={snapshot?.predictions}
                isTrain={snapshot?.isTrain}
              />
              <Caption>Pick two numbers, or click a cell in the grid. Try an unseen sum before and after grokking.</Caption>
            </Panel>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Panel index="07" title="Fourier spectrum of the number embeddings">
            {fourier && <Spectrum spectrum={fourier.spectrum} />}
            <Caption>
              The network gives each number a vector. Early on, those vectors mix every frequency. After grokking,
              a few frequencies (bright bars) carry most of the energy: the network has learned to represent each
              number as waves.
            </Caption>
          </Panel>
          <Panel index="08" title={fourier ? `Embeddings on frequency ${fourier.topFreq}` : "Embeddings"}>
            <div className="mx-auto max-w-[320px]">{fourier && <EmbeddingCircle p={p} circle={fourier.circle} />}</div>
            <Caption>
              Each number, projected onto the strongest frequency. Once grokked they form a circle, like a clock
              face. Adding b becomes a rotation by b steps, which works for every pair, seen or not.
            </Caption>
          </Panel>
        </div>

        <Panel index="09" title="Control deck" className="mt-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={running ? "Pause" : "Play"}
              className="flex h-10 w-10 items-center justify-center rounded-sm border border-[var(--amber)] bg-[var(--amber)] text-black transition hover:brightness-110"
            >
              {running ? <PauseIcon /> : <PlayIcon />}
            </button>
            <DeckButton onClick={() => send({ type: "step", count: 100 })} disabled={running} title="Train 100 steps while paused">
              +100 steps
            </DeckButton>

            <Slider
              label="Weight decay"
              min={0}
              max={2}
              step={0.1}
              value={weightDecay}
              onChange={changeWeightDecay}
              format={(v) => v.toFixed(1)}
              title="Applies live. At 0, the network memorises and never generalises."
            />
            <Slider
              label="Training data"
              min={0.2}
              max={0.8}
              step={0.05}
              value={trainFraction}
              onChange={setTrainFraction}
              format={(v) => `${Math.round(v * 100)}%`}
              title="Share of all sums the network trains on. Applies on restart."
            />

            <div className="ml-auto flex gap-2">
              <DeckButton onClick={() => restart(seed)} title="Restart with the same seed and the current settings">
                Restart
              </DeckButton>
              <DeckButton onClick={() => restart(seed + 1)} tone="danger" title="Restart with a new random split and weights">
                New seed
              </DeckButton>
            </div>
          </div>
          <p className="mt-3 font-readout text-[10px] leading-relaxed text-[var(--muted)]">
            {trainFraction !== runFraction
              ? `Restart to train on ${Math.round(trainFraction * 100)}% of the sums.`
              : `Training on ${nTrain.toLocaleString("en-GB")} of ${(p * p).toLocaleString("en-GB")} sums, full batch, AdamW. Try weight decay 0, then restart: it memorises and stays there. Weight decay keeps squeezing the weights, and the general rule needs far less weight than a lookup table.`}
          </p>
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-3 py-2">
          <div className="flex items-center gap-2 font-readout text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
            {index && <span className="text-[var(--mint)]/70">{index}</span>}
            {title}
          </div>
          {right}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 font-readout text-[10px] leading-relaxed text-[var(--muted)]">{children}</p>;
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

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  format,
  title,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  title?: string;
}) {
  return (
    <label className="flex items-center gap-2" title={title}>
      <span className="font-readout text-[9px] uppercase tracking-[0.22em] text-[var(--muted)]">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="neuro-range w-28"
        style={{ ["--pct" as string]: `${((value - min) / (max - min)) * 100}%` }}
      />
      <span className="w-9 font-readout text-[11px] tabular-nums text-[var(--text)]">{format(value)}</span>
    </label>
  );
}

function DeckButton({
  onClick,
  title,
  children,
  tone = "line",
  disabled = false,
}: {
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
  tone?: "line" | "danger";
  disabled?: boolean;
}) {
  const tones: Record<string, string> = {
    line: "border-[var(--line-2)] text-[var(--muted)] hover:border-[var(--mint)] hover:text-[var(--text)]",
    danger: "border-[var(--red)]/50 text-[var(--red)] hover:bg-[var(--red)] hover:text-black",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`rounded-sm border px-3 py-2 font-readout text-[10px] uppercase tracking-[0.2em] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
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
