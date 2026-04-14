"use client";

import React, { useState, useCallback, useRef } from "react";
import { Heading } from "../../../../components/Heading";

// =====================================================================
// Types & Constants
// =====================================================================

const MOVES = ["rock", "paper", "scissors"] as const;
type Move = (typeof MOVES)[number];

const EMOJI: Record<Move, string> = {
  rock: "\u{1FAA8}",
  paper: "\u{1F4C4}",
  scissors: "\u2702\uFE0F",
};

const BEATS: Record<Move, Move> = {
  rock: "scissors",
  scissors: "paper",
  paper: "rock",
};

const COUNTER: Record<Move, Move> = {
  scissors: "rock",
  paper: "scissors",
  rock: "paper",
};

type Outcome = "win" | "lose" | "tie";

// =====================================================================
// Strategies -- each predicts what the opponent will play next
// =====================================================================

interface Strategy {
  predict(): Move | null;
  update(opp: Move, ai: Move): void;
}

class FrequencyStrategy implements Strategy {
  private counts: Record<Move, number> = { rock: 0, paper: 0, scissors: 0 };

  update(opp: Move) {
    this.counts[opp]++;
  }

  predict(): Move | null {
    const total = this.counts.rock + this.counts.paper + this.counts.scissors;
    if (total === 0) return null;
    return Object.entries(this.counts).sort(
      (a, b) => (b[1] as number) - (a[1] as number)
    )[0][0] as Move;
  }
}

class RecentBiasStrategy implements Strategy {
  private w: Record<Move, number> = { rock: 0, paper: 0, scissors: 0 };

  constructor(private decay: number) {}

  update(opp: Move) {
    for (const m of MOVES) this.w[m] *= this.decay;
    this.w[opp] += 1;
  }

  predict(): Move | null {
    const total = this.w.rock + this.w.paper + this.w.scissors;
    if (total === 0) return null;
    return Object.entries(this.w).sort(
      (a, b) => (b[1] as number) - (a[1] as number)
    )[0][0] as Move;
  }
}

class NGramStrategy implements Strategy {
  private hist: Move[] = [];
  private trans: Record<string, Record<Move, number>> = {};

  constructor(private n: number) {}

  update(opp: Move) {
    if (this.hist.length >= this.n) {
      const k = this.hist.slice(-this.n).join(",");
      if (!this.trans[k])
        this.trans[k] = { rock: 0, paper: 0, scissors: 0 };
      this.trans[k][opp]++;
    }
    this.hist.push(opp);
  }

  predict(): Move | null {
    if (this.hist.length < this.n) return null;
    const c = this.trans[this.hist.slice(-this.n).join(",")];
    return c
      ? (Object.entries(c).sort(
          (a, b) => (b[1] as number) - (a[1] as number)
        )[0][0] as Move)
      : null;
  }
}

class PairNGramStrategy implements Strategy {
  private hist: [Move, Move][] = [];
  private trans: Record<string, Record<Move, number>> = {};

  constructor(private n: number) {}

  update(opp: Move, ai: Move) {
    if (this.hist.length >= this.n) {
      const k = this.hist
        .slice(-this.n)
        .map((p) => p[0] + p[1])
        .join("|");
      if (!this.trans[k])
        this.trans[k] = { rock: 0, paper: 0, scissors: 0 };
      this.trans[k][opp]++;
    }
    this.hist.push([ai, opp]);
  }

  predict(): Move | null {
    if (this.hist.length < this.n) return null;
    const c =
      this.trans[
        this.hist
          .slice(-this.n)
          .map((p) => p[0] + p[1])
          .join("|")
      ];
    return c
      ? (Object.entries(c).sort(
          (a, b) => (b[1] as number) - (a[1] as number)
        )[0][0] as Move)
      : null;
  }
}

class WinStayLoseShiftStrategy implements Strategy {
  private lastOpp: Move | null = null;
  private lastAI: Move | null = null;
  private lastResult: "win" | "lose" | "tie" | null = null;

  update(opp: Move, ai: Move) {
    if (opp === ai) this.lastResult = "tie";
    else if (BEATS[opp] === ai) this.lastResult = "win";
    else this.lastResult = "lose";
    this.lastOpp = opp;
    this.lastAI = ai;
  }

  predict(): Move | null {
    if (!this.lastResult || !this.lastOpp || !this.lastAI) return null;
    return this.lastResult === "win" ? this.lastOpp : COUNTER[this.lastAI];
  }
}

class BeatLastStrategy implements Strategy {
  private lastAI: Move | null = null;
  update(_opp: Move, ai: Move) {
    this.lastAI = ai;
  }
  predict(): Move | null {
    return this.lastAI ? COUNTER[this.lastAI] : null;
  }
}

class RepeatLastStrategy implements Strategy {
  private last: Move | null = null;
  update(opp: Move) {
    this.last = opp;
  }
  predict(): Move | null {
    return this.last;
  }
}

class RotateUpStrategy implements Strategy {
  private last: Move | null = null;
  update(opp: Move) {
    this.last = opp;
  }
  predict(): Move | null {
    return this.last ? COUNTER[this.last] : null;
  }
}

class RotateDownStrategy implements Strategy {
  private last: Move | null = null;
  update(opp: Move) {
    this.last = opp;
  }
  predict(): Move | null {
    return this.last ? BEATS[this.last] : null;
  }
}

class OutcomeStrategy implements Strategy {
  private trans: Record<string, Record<Move, number>> = {
    win: { rock: 0, paper: 0, scissors: 0 },
    lose: { rock: 0, paper: 0, scissors: 0 },
    tie: { rock: 0, paper: 0, scissors: 0 },
  };
  private lastOutcome: string | null = null;

  update(opp: Move, ai: Move) {
    if (this.lastOutcome) this.trans[this.lastOutcome][opp]++;
    if (opp === ai) this.lastOutcome = "tie";
    else if (BEATS[opp] === ai) this.lastOutcome = "win";
    else this.lastOutcome = "lose";
  }

  predict(): Move | null {
    if (!this.lastOutcome) return null;
    const c = this.trans[this.lastOutcome];
    const t = c.rock + c.paper + c.scissors;
    return t >= 2
      ? (Object.entries(c).sort(
          (a, b) => (b[1] as number) - (a[1] as number)
        )[0][0] as Move)
      : null;
  }
}

class MetaStrategy implements Strategy {
  constructor(
    private base: Strategy,
    private isPair: boolean
  ) {}

  update(opp: Move, ai: Move) {
    this.isPair ? this.base.update(opp, ai) : this.base.update(opp, ai);
  }

  predict(): Move | null {
    const p = this.base.predict();
    return p ? COUNTER[COUNTER[p]] : null;
  }
}

// =====================================================================
// AI Engine
// =====================================================================

const PAIR_TYPES = new Set([
  "Pair 1-Gram",
  "Pair 2-Gram",
  "Win-Stay/Lose-Shift",
  "Beat Last",
  "Outcome",
  "Meta Frequency",
  "Meta 2-Gram",
]);

interface StrategyEntry {
  name: string;
  strategy: Strategy;
  score: number;
}

function createStrategies(): StrategyEntry[] {
  return [
    { name: "Frequency", strategy: new FrequencyStrategy(), score: 0 },
    {
      name: "Recent (fast)",
      strategy: new RecentBiasStrategy(0.75),
      score: 0,
    },
    {
      name: "Recent (slow)",
      strategy: new RecentBiasStrategy(0.9),
      score: 0,
    },
    { name: "1-Gram", strategy: new NGramStrategy(1), score: 0 },
    { name: "2-Gram", strategy: new NGramStrategy(2), score: 0 },
    { name: "3-Gram", strategy: new NGramStrategy(3), score: 0 },
    { name: "Pair 1-Gram", strategy: new PairNGramStrategy(1), score: 0 },
    { name: "Pair 2-Gram", strategy: new PairNGramStrategy(2), score: 0 },
    {
      name: "Win-Stay/Lose-Shift",
      strategy: new WinStayLoseShiftStrategy(),
      score: 0,
    },
    { name: "Beat Last", strategy: new BeatLastStrategy(), score: 0 },
    { name: "Repeat Last", strategy: new RepeatLastStrategy(), score: 0 },
    { name: "Rotate Up", strategy: new RotateUpStrategy(), score: 0 },
    { name: "Rotate Down", strategy: new RotateDownStrategy(), score: 0 },
    { name: "Outcome", strategy: new OutcomeStrategy(), score: 0 },
    {
      name: "Meta Frequency",
      strategy: new MetaStrategy(new FrequencyStrategy(), false),
      score: 0,
    },
    {
      name: "Meta 2-Gram",
      strategy: new MetaStrategy(new NGramStrategy(2), false),
      score: 0,
    },
  ];
}

const DECAY = 0.9;
const TEMPERATURE = 3.0;

function getAIMove(
  strategies: StrategyEntry[],
  roundCount: number
): { move: Move; pending: Map<string, Move> } {
  const pending = new Map<string, Move>();
  for (const entry of strategies) {
    const p = entry.strategy.predict();
    if (p) pending.set(entry.name, p);
  }

  if (pending.size === 0 || roundCount < 2) {
    return {
      move: MOVES[Math.floor(Math.random() * 3)],
      pending,
    };
  }

  const vals = [...pending.keys()].map(
    (n) => strategies.find((s) => s.name === n)!.score
  );
  const maxS = Math.max(...vals);
  const moveW: Record<Move, number> = { rock: 0, paper: 0, scissors: 0 };

  for (const [name, pred] of pending) {
    const score = strategies.find((s) => s.name === name)!.score;
    const w = Math.exp((score - maxS) * TEMPERATURE);
    moveW[COUNTER[pred]] += w;
  }

  const move = (
    Object.entries(moveW).sort(
      (a, b) => (b[1] as number) - (a[1] as number)
    ) as [Move, number][]
  )[0][0];

  return { move, pending };
}

function updateStrategies(
  strategies: StrategyEntry[],
  pending: Map<string, Move>,
  opp: Move,
  ai: Move
) {
  for (const entry of strategies) {
    entry.score *= DECAY;
  }

  for (const [name, pred] of pending) {
    const entry = strategies.find((s) => s.name === name)!;
    entry.score += pred === opp ? 1.0 : -0.3;
  }

  for (const entry of strategies) {
    if (PAIR_TYPES.has(entry.name)) {
      entry.strategy.update(opp, ai);
    } else {
      entry.strategy.update(opp, ai);
    }
  }
}

// =====================================================================
// React Component
// =====================================================================

const BUTTON_STYLES: Record<Move, string> = {
  rock: "border-rose-500/50 text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20",
  paper:
    "border-blue-500/50 text-blue-400 hover:bg-blue-500/10 active:bg-blue-500/20",
  scissors:
    "border-green-500/50 text-green-400 hover:bg-green-500/10 active:bg-green-500/20",
};

const OUTCOME_STYLES: Record<Outcome, string> = {
  win: "text-green-400",
  lose: "text-rose-400",
  tie: "text-yellow-400",
};

const OUTCOME_TEXT: Record<Outcome, string> = {
  win: "You win!",
  lose: "AI wins!",
  tie: "It's a tie!",
};

const DOT_STYLES: Record<Outcome, string> = {
  win: "bg-green-400",
  lose: "bg-rose-400",
  tie: "bg-yellow-400",
};

export function RockPaperScissors() {
  const strategiesRef = useRef(createStrategies());
  const roundCountRef = useRef(0);

  const [scores, setScores] = useState({ user: 0, ai: 0, ties: 0 });
  const [lastRound, setLastRound] = useState<{
    userMove: Move;
    aiMove: Move;
    outcome: Outcome;
  } | null>(null);
  const [history, setHistory] = useState<Outcome[]>([]);
  const [strategyScores, setStrategyScores] = useState<
    { name: string; score: number }[]
  >([]);

  const playRound = useCallback((userMove: Move) => {
    const strats = strategiesRef.current;
    const { move: aiMove, pending } = getAIMove(
      strats,
      roundCountRef.current
    );

    updateStrategies(strats, pending, userMove, aiMove);
    roundCountRef.current++;

    let outcome: Outcome;
    if (userMove === aiMove) outcome = "tie";
    else if (BEATS[userMove] === aiMove) outcome = "win";
    else outcome = "lose";

    setScores((prev) => ({
      user: prev.user + (outcome === "win" ? 1 : 0),
      ai: prev.ai + (outcome === "lose" ? 1 : 0),
      ties: prev.ties + (outcome === "tie" ? 1 : 0),
    }));
    setLastRound({ userMove, aiMove, outcome });
    setHistory((prev) => [...prev, outcome]);
    setStrategyScores(
      strats
        .map((s) => ({ name: s.name, score: s.score }))
        .sort((a, b) => b.score - a.score)
    );
  }, []);

  const total = scores.user + scores.ai + scores.ties;
  const aiWinRate = total > 0 ? Math.round((scores.ai / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-6 py-6 px-4 max-w-lg mx-auto bg-slate-900 text-slate-200 min-h-full">
      <Heading level={1} className="text-white text-center my-0">
        Rock Paper Scissors
      </Heading>
      <p className="text-slate-400 text-sm text-center -mt-4">
        Adaptive AI that learns your patterns in real-time
      </p>

      {/* Scoreboard */}
      <div className="flex gap-4 text-sm">
        <span className="px-3 py-1.5 rounded-lg bg-white/5 border-l-2 border-green-400">
          You: <strong>{scores.user}</strong>
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-white/5 border-l-2 border-rose-400">
          AI: <strong>{scores.ai}</strong>
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-white/5 border-l-2 border-yellow-400">
          Ties: <strong>{scores.ties}</strong>
        </span>
      </div>

      {/* Arena */}
      {lastRound && (
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              You
            </div>
            <div className="text-6xl">{EMOJI[lastRound.userMove]}</div>
          </div>
          <div className="text-slate-500 font-bold">VS</div>
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              AI
            </div>
            <div className="text-6xl">{EMOJI[lastRound.aiMove]}</div>
          </div>
        </div>
      )}

      {/* Result */}
      {lastRound && (
        <div
          className={`text-xl font-bold ${OUTCOME_STYLES[lastRound.outcome]}`}
        >
          {OUTCOME_TEXT[lastRound.outcome]}
        </div>
      )}

      {!lastRound && (
        <div className="text-slate-500 text-lg">Make your move!</div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        {MOVES.map((move) => (
          <button
            key={move}
            type="button"
            className={`flex flex-col items-center gap-1 px-5 py-3 rounded-xl border-2 cursor-pointer transition-all ${BUTTON_STYLES[move]}`}
            onClick={() => playRound(move)}
          >
            <span className="text-3xl">{EMOJI[move]}</span>
            <span className="text-sm capitalize">{move}</span>
          </button>
        ))}
      </div>

      {/* Strategy Performance */}
      {strategyScores.length > 0 && (
        <div className="w-full rounded-xl bg-white/5 p-4">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">
            Strategy Performance
          </h3>
          <div className="flex flex-col gap-1">
            {strategyScores.map((s) => {
              const maxAbs = Math.max(
                ...strategyScores.map((x) => Math.abs(x.score)),
                0.1
              );
              const pct = Math.max((s.score / maxAbs) * 100, 0);
              const isHot = s.score > maxAbs * 0.6;
              return (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span
                    className={`w-32 truncate ${isHot ? "text-rose-400 font-bold" : "text-slate-500"}`}
                  >
                    {s.name}
                  </span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${isHot ? "bg-green-400" : "bg-rose-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right tabular-nums text-slate-500">
                    {s.score.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Round History */}
      {history.length > 0 && (
        <div className="w-full rounded-xl bg-white/5 p-4">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">
            Round History
          </h3>
          <div className="flex flex-wrap gap-1">
            {history.map((outcome, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${DOT_STYLES[outcome]}`}
              />
            ))}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            AI win rate: {aiWinRate}% over {total} rounds
          </div>
          <div className="flex gap-3 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
              You win
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
              AI wins
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
              Tie
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
