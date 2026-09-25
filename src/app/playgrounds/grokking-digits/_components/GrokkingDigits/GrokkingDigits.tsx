"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DIGITS_FILE_LAYOUT, parseDigits, type Digits } from "../../_lib/data";
import { display, mono } from "../../_lib/fonts";
import type { WorkerRequest, WorkerResponse } from "../../_lib/protocol";
import {
  DEFAULT_RUN,
  MAX_STEPS,
  phaseOf,
  stripIndices,
  type HistoryPoint,
  type Phase,
  type RunConfig,
  type Snapshot,
} from "../../_lib/trainer";
import { DigitBars } from "./DigitBars";
import { DigitStrip } from "./DigitStrip";
import { DrawPad, NetworkView } from "./DrawPad";
import { Legend, LineChart, type Marker, type Series } from "./LineChart";

const ACC_SERIES: Series[] = [
  { key: "trainAcc", colour: "var(--amber)", label: "Train" },
  { key: "testAcc", colour: "var(--mint)", label: "Unseen" },
];
const LOSS_SERIES: Series[] = [
  { key: "trainLoss", colour: "var(--amber)", label: "Train" },
  { key: "testLoss", colour: "var(--mint)", label: "Unseen" },
];
const NORM_SERIES: Series[] = [{ key: "norm", colour: "var(--cyan)", label: "Weight norm" }];

const INIT_SCALES = [1, 4, 8, 16];

const PHASES: Record<Phase, { label: string; colour: string; blurb: string }> = {
  memorising: { label: "Memorising", colour: "var(--amber)", blurb: "Fitting the 1,000 training digits." },
  memorised: {
    label: "Memorised",
    colour: "var(--red)",
    blurb: "Perfect on its training digits, stuck on the rest. Keep watching.",
  },
  grokking: {
    label: "Grokking",
    colour: "var(--cyan)",
    blurb: "Weight decay is squeezing out the lookup table, and unseen digits start to click.",
  },
  generalised: { label: "Generalised", colour: "var(--mint)", blurb: "Reads most digits it has never seen." },
};

// Step axis grows in half-decades so the chart does not rescale every frame.
function axisMax(step: number): number {
  const e = Math.log10(Math.max(step, 1) * 1.15);
  return 10 ** Math.max(3, Math.ceil(e * 2) / 2);
}

function pct(v: number | undefined): string {
  return v === undefined ? "-" : (v * 100).toFixed(1);
}

export function GrokkingDigits() {
  const workerRef = useRef<Worker | null>(null);
  const historyRef = useRef<HistoryPoint[]>([]);
  const [data, setData] = useState<Digits | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [running, setRunning] = useState(true);
  const [weightDecay, setWeightDecay] = useState(DEFAULT_RUN.weightDecay);
  const [labelSmoothing, setLabelSmoothing] = useState(DEFAULT_RUN.labelSmoothing);
  const [initScale, setInitScale] = useState(DEFAULT_RUN.initScale);
  const [runInitScale, setRunInitScale] = useState(DEFAULT_RUN.initScale);
  const [seed, setSeed] = useState(DEFAULT_RUN.seed);
  // What the probe shows: a drawing, or a strip digit (with its true label).
  const [probe, setProbe] = useState<{ pixels: Float32Array | null; stripIndex: number | null }>({
    pixels: null,
    stripIndex: null,
  });

  const send = (msg: WorkerRequest) => workerRef.current?.postMessage(msg);

  useEffect(() => {
    let cancelled = false;
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
    fetch("/grokking-digits.bin")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buf) => {
        if (cancelled) return;
        const bytes = new Uint8Array(buf);
        setData(parseDigits(bytes));
        worker.postMessage({ type: "init", bytes, cfg: DEFAULT_RUN } satisfies WorkerRequest);
        worker.postMessage({ type: "play" } satisfies WorkerRequest);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
      worker.terminate();
    };
  }, []);

  useEffect(() => {
    send({ type: "probe", pixels: probe.pixels });
  }, [probe.pixels]);

  const restart = useCallback(
    (nextSeed: number) => {
      const cfg: RunConfig = { initScale, weightDecay, labelSmoothing, seed: nextSeed };
      setSeed(nextSeed);
      setRunInitScale(initScale);
      historyRef.current = [];
      setHistory([]);
      send({ type: "reset", cfg });
    },
    [initScale, weightDecay, labelSmoothing],
  );

  const togglePlay = () => {
    send({ type: running ? "pause" : "play" });
    setRunning(!running);
  };

  const changeWeightDecay = (v: number) => {
    setWeightDecay(v);
    send({ type: "setWeightDecay", value: v });
  };
  const changeLabelSmoothing = (v: number) => {
    setLabelSmoothing(v);
    send({ type: "setLabelSmoothing", value: v });
  };

  const { stripPixels, stripLabels } = useMemo(() => {
    if (!data) return { stripPixels: null, stripLabels: null };
    const strip = stripIndices(data);
    return { stripPixels: pickPixels(data, strip), stripLabels: Uint8Array.from(strip, (n) => data.y[n]) };
  }, [data]);
  const pickStrip = (k: number) => {
    if (!stripPixels) return;
    const px = stripPixels.slice(k * DIGITS_FILE_LAYOUT.pixels, (k + 1) * DIGITS_FILE_LAYOUT.pixels);
    setProbe({ pixels: px, stripIndex: k });
  };

  const last = history[history.length - 1];
  const phase = phaseOf(history);
  const memorisedAt = history.find((pt) => pt.trainAcc >= 0.99);
  const generalisedAt = history.find((pt) => pt.testAcc >= 0.9);
  const markers: Marker[] = [];
  if (memorisedAt) {
    markers.push({ step: memorisedAt.step, label: `memorised ${memorisedAt.step}`, colour: "var(--amber)" });
  }
  if (generalisedAt) {
    markers.push({ step: generalisedAt.step, label: `90% ${generalisedAt.step}`, colour: "var(--mint)" });
  }
  const xMax = axisMax(snapshot?.step ?? 1);
  const truth = probe.stripIndex !== null && stripLabels ? stripLabels[probe.stripIndex] : undefined;
  const stripWrong = snapshot && stripLabels ? stripLabels.filter((l, k) => snapshot.stripAnswers[k] !== l).length : 0;

  return (
    <div
      className={`${display.variable} ${mono.variable} neuro-console h-full overflow-y-auto`}
      style={{
        backgroundColor: "var(--ink)",
        color: "var(--text)",
        backgroundImage:
          "linear-gradient(rgba(150,180,205,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(150,180,205,0.045) 1px, transparent 1px), radial-gradient(130% 90% at 50% -10%, rgba(247,201,72,0.06), transparent 55%)",
        backgroundSize: "46px 46px, 46px 46px, 100% 100%",
      }}
    >
      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-3">
          <div>
            <div className="mb-2 flex items-center gap-2 font-readout text-[10px] uppercase tracking-[0.35em] text-[var(--muted)]">
              <LED on={running} />
              Handwritten digits
              <span className="text-[var(--line-2)]">·</span>
              <span>1,000 training images</span>
            </div>
            <h1 className="font-telemetry text-[clamp(2rem,6vw,3.4rem)] font-bold uppercase leading-[0.85] tracking-tight">
              Grokking <span className="text-[var(--amber)]">digits</span>
            </h1>
          </div>
          <div className="flex items-end gap-4">
            <HeaderStat label="Step" value={(snapshot?.step ?? 0).toLocaleString("en-GB")} />
            <div className="w-px self-stretch bg-[var(--line)]" />
            <HeaderStat label="Phase" value={PHASES[phase].label} accent={PHASES[phase].colour} />
          </div>
        </header>

        <p className="mb-5 max-w-3xl font-readout text-[11px] leading-relaxed text-[var(--muted)]">
          A small convolutional network learns to read handwritten digits from just 1,000 examples. It starts with
          deliberately oversized weights, so it memorises its training images within about 2,000 steps while reading
          only about 78% of unseen digits correctly. Then it stalls. Weight decay keeps shrinking the weights until the
          memorised lookup table no longer fits, and the network switches to features that work on digits it has never
          seen.
        </p>

        {loadError && (
          <p className="mb-5 font-readout text-[11px] text-[var(--red)]">Could not load the digits: {loadError}</p>
        )}

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
                <Readout
                  label="Unseen acc"
                  value={pct(last?.testAcc)}
                  unit="%"
                  accent="var(--mint)"
                  live={phase === "grokking"}
                />
                <Readout label="Weight norm" value={last ? last.norm.toFixed(0) : "-"} />
                <Readout label="At memorising" value={memorisedAt ? pct(memorisedAt.testAcc) : "-"} unit="% unseen" />
              </div>
              <div
                className="border-t border-[var(--line)] px-3 py-2.5 font-readout text-[11px] leading-snug"
                style={{ color: PHASES[phase].colour }}
              >
                {PHASES[phase].blurb}
              </div>
            </Panel>

            <Panel index="05" title="Ask the network">
              <div className="mx-auto grid max-w-[340px] grid-cols-[1fr_72px] gap-3">
                <DrawPad
                  shown={probe.stripIndex !== null ? probe.pixels : null}
                  onChange={(pixels) => setProbe({ pixels, stripIndex: null })}
                />
                <div>
                  <div className="mb-1 font-readout text-[9px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    It sees
                  </div>
                  <NetworkView pixels={probe.pixels} />
                  {truth !== undefined && (
                    <div className="mt-3 font-readout text-[9px] uppercase tracking-[0.18em] text-[var(--muted)]">
                      Label
                      <div className="font-telemetry text-2xl font-semibold normal-case text-[var(--text)]">
                        {truth}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <DigitBars probs={probe.pixels ? (snapshot?.probe ?? null) : null} truth={truth} />
              </div>
              <Caption>
                Draw a digit, or click one in the strip below. The bars update live as it trains. It learned from only
                1,000 examples, so unusual styles trip it up: draw 4s open at the top, as most MNIST 4s are.
              </Caption>
            </Panel>
          </div>
        </div>

        <Panel
          index="06"
          title="Unseen digits"
          className="mt-4"
          right={
            <span className="font-readout text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">
              {snapshot ? `${stripWrong} of ${stripLabels?.length ?? 0} wrong` : ""}
            </span>
          }
        >
          {stripPixels && stripLabels ? (
            <DigitStrip
              pixels={stripPixels}
              labels={stripLabels}
              answers={snapshot?.stripAnswers ?? null}
              selected={probe.stripIndex}
              onPick={pickStrip}
            />
          ) : (
            <p className="font-readout text-[11px] text-[var(--muted)]">Loading digits...</p>
          )}
          <Caption>
            Test digits the network never trains on. Red frames are ones it reads wrong. Watch the red thin out after
            the plateau. Click one to see its probabilities.
          </Caption>
        </Panel>

        <Panel index="07" title="Control deck" className="mt-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={running ? "Pause" : "Play"}
              className="flex h-10 w-10 items-center justify-center rounded-sm border border-[var(--amber)] bg-[var(--amber)] text-black transition hover:brightness-110"
            >
              {running ? <PauseIcon /> : <PlayIcon />}
            </button>
            <DeckButton
              onClick={() => send({ type: "step", count: 100 })}
              disabled={running}
              title="Train 100 steps while paused"
            >
              +100 steps
            </DeckButton>
            <Slider
              label="Weight decay"
              min={0}
              max={1}
              step={0.05}
              value={weightDecay}
              onChange={changeWeightDecay}
              format={(v) => v.toFixed(2)}
              title="Applies live. At 0, the network stays on its memorised plateau."
            />
            <Slider
              label="Label smoothing"
              min={0}
              max={0.3}
              step={0.05}
              value={labelSmoothing}
              onChange={changeLabelSmoothing}
              format={(v) => v.toFixed(2)}
              title="Applies live. Trains towards less than 100% confidence, so the bars show doubt."
            />
            <label className="flex items-center gap-2" title="Size of the starting weights. Applies on restart.">
              <span className="font-readout text-[9px] uppercase tracking-[0.22em] text-[var(--muted)]">
                Start weights
              </span>
              <div className="flex overflow-hidden rounded-sm border border-[var(--line-2)]">
                {INIT_SCALES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setInitScale(s)}
                    className={`px-2.5 py-1.5 font-readout text-[11px] tabular-nums transition-colors ${
                      initScale === s
                        ? "bg-[var(--amber)]/20 text-[var(--amber)]"
                        : "text-[var(--muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </label>
            <div className="ml-auto flex gap-2">
              <DeckButton onClick={() => restart(seed)} title="Restart with the same seed and the current settings">
                Restart
              </DeckButton>
              <DeckButton onClick={() => restart(seed + 1)} tone="danger" title="Restart with new random weights">
                New seed
              </DeckButton>
            </div>
          </div>
          <p className="mt-3 font-readout text-[10px] leading-relaxed text-[var(--muted)]">
            {initScale !== runInitScale
              ? `Restart to use ${initScale}x starting weights.`
              : `Mini-batches of 100, AdamW. Training pauses at step ${MAX_STEPS.toLocaleString("en-GB")}. Try 1x starting weights and restart: it learns unseen digits straight away, with no plateau. The oversized start is what makes it memorise first.`}
          </p>
        </Panel>

        <p className="mt-6 font-readout text-[10px] leading-relaxed text-[var(--muted)]">
          Digits from the MNIST database by Yann LeCun, Corinna Cortes and Christopher J.C. Burges, used under{" "}
          <a
            href="https://creativecommons.org/licenses/by-sa/3.0/"
            className="underline hover:text-[var(--text)]"
            target="_blank"
            rel="noreferrer"
          >
            CC BY-SA 3.0
          </a>
          . Shrunk to 14x14 pixels. The oversized starting weights follow Liu and others, &apos;Omnigrok: grokking
          beyond algorithmic data&apos;, 2022.
        </p>
      </div>
    </div>
  );
}

function pickPixels(data: Digits, indices: Int32Array): Float32Array {
  const { pixels } = DIGITS_FILE_LAYOUT;
  const out = new Float32Array(indices.length * pixels);
  indices.forEach((n, k) => out.set(data.x.subarray(n * pixels, (n + 1) * pixels), k * pixels));
  return out;
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
      <div
        className="font-telemetry text-xl font-semibold uppercase leading-tight tabular-nums"
        style={{ color: accent }}
      >
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
