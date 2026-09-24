"use client";

import { label } from "../../_lib/dataset";
import type { Predictions } from "../../_lib/model";

// Pick a and b and see what the network answers right now, how sure it is,
// and whether it ever trained on that sum.
export function AskNetwork({
  p,
  a,
  b,
  onChange,
  predictions,
  isTrain,
}: {
  p: number;
  a: number;
  b: number;
  onChange: (a: number, b: number) => void;
  predictions: Predictions | undefined;
  isTrain: Uint8Array | undefined;
}) {
  const pair = a * p + b;
  const truth = label(pair, p);
  const answer = predictions?.answer[pair];
  const confidence = predictions?.confidence[pair];
  const right = answer === truth;
  const seen = isTrain?.[pair] === 1;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 font-telemetry text-2xl font-semibold tabular-nums">
        <NumberBox value={a} max={p - 1} label="a" onChange={(v) => onChange(v, b)} />
        <span className="text-[var(--muted)]">+</span>
        <NumberBox value={b} max={p - 1} label="b" onChange={(v) => onChange(a, v)} />
        <span className="font-readout text-sm text-[var(--muted)]">mod {p} =</span>
        <span style={{ color: answer === undefined ? "var(--muted)" : right ? "var(--mint)" : "var(--red)" }}>
          {answer ?? "?"}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 font-readout text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
        <div>
          <dt>Confidence</dt>
          <dd className="mt-1 text-sm normal-case tracking-normal text-[var(--text)] tabular-nums">
            {confidence === undefined ? "-" : `${(confidence * 100).toFixed(1)}%`}
          </dd>
        </div>
        <div>
          <dt>Right answer</dt>
          <dd
            className="mt-1 text-sm normal-case tracking-normal tabular-nums"
            style={{ color: right ? "var(--mint)" : "var(--red)" }}
          >
            {truth} {right ? "✓" : "✗"}
          </dd>
        </div>
        <div>
          <dt>Trained on it</dt>
          <dd
            className="mt-1 text-sm normal-case tracking-normal"
            style={{ color: seen ? "var(--amber)" : "var(--mint)" }}
          >
            {seen ? "Yes" : "Never seen"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function NumberBox({
  value,
  max,
  label: name,
  onChange,
}: {
  value: number;
  max: number;
  label: string;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      max={max}
      value={value}
      aria-label={name}
      onChange={(e) => {
        const v = Math.round(Number(e.target.value));
        if (Number.isFinite(v)) onChange(Math.min(max, Math.max(0, v)));
      }}
      className="w-16 rounded-sm border border-[var(--line-2)] bg-transparent px-2 py-1 text-center text-[var(--text)] focus:border-[var(--mint)] focus:outline-none"
    />
  );
}
