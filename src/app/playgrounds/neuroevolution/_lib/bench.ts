// Headless A/B benchmark for the genetic algorithm. Runs the real world loop
// (no canvas, no React) for a fixed number of generations across a set of seeds
// and prints a comparison table, so config changes are judged on numbers rather
// than on watching the canvas.
//
//   pnpm bench                 # default matrix, fixed-track mode
//   pnpm bench --vary          # vary-track (generalist) mode
//   pnpm bench --gens 40 --seeds 6
//   pnpm bench --only pop-100  # run a single config (one machine-readable row),
//                              # so the matrix can be fanned across CPU cores as
//                              # separate processes and collated
//
// Deterministic: same seed + same config always yields the same result.

import { mulberry32 } from "./geometry";
import { DEFAULT_CONFIG, createWorld, stepWorld, type SimConfig } from "./world";

const VIEWPORT = { width: 960, height: 600 };

interface BenchResult {
  // Best selection-fitness reached at any point (fixed-track: live race fitness;
  // vary-track: lexicographic score on that generation's eval tracks).
  bestEver: number;
  // 1-based generation the first car finished the target laps, 0 if none did.
  firstFinishGen: number;
  // Fewest finish ticks on the final track (fixed-track specialist speed; always
  // 0 in vary-track mode, where the record resets every generation).
  bestTicks: number;
  // Crowned generalist's held-out battery result (how many of BATTERY_SIZE it
  // finishes, and its mean finish time over those).
  generalFinishes: number;
  generalMeanTicks: number;
}

function runOne(config: SimConfig, seed: number, gens: number): BenchResult {
  const rand = mulberry32(seed);
  const world = createWorld(config, VIEWPORT, rand);
  while (world.generation <= gens) {
    stepWorld(world, config, rand);
  }
  const firstIdx = world.timeHistory.findIndex((t) => t > 0);
  return {
    bestEver: world.bestEver,
    firstFinishGen: firstIdx === -1 ? 0 : firstIdx + 1,
    bestTicks: world.bestTicks,
    generalFinishes: world.generalFinishes,
    generalMeanTicks: world.generalMeanTicks,
  };
}

interface Stat {
  mean: number;
  sd: number;
  n: number;
}

interface Agg {
  label: string;
  bestEver: Stat;
  firstFinishGen: Stat; // over seeds that finished at all
  finishedSeeds: number;
  bestTicks: Stat; // over seeds with a record
  generalFinishes: Stat;
  generalMeanTicks: Stat; // over seeds with >0 finishes
}

function stat(values: number[]): Stat {
  const n = values.length;
  if (n === 0) return { mean: 0, sd: 0, n: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  return { mean, sd: Math.sqrt(variance), n };
}

function aggregate(label: string, results: BenchResult[]): Agg {
  const finished = results.filter((r) => r.firstFinishGen > 0);
  const withRecord = results.filter((r) => r.bestTicks > 0);
  const withGeneral = results.filter((r) => r.generalMeanTicks > 0);
  return {
    label,
    bestEver: stat(results.map((r) => r.bestEver)),
    firstFinishGen: stat(finished.map((r) => r.firstFinishGen)),
    finishedSeeds: finished.length,
    bestTicks: stat(withRecord.map((r) => r.bestTicks)),
    generalFinishes: stat(results.map((r) => r.generalFinishes)),
    generalMeanTicks: stat(withGeneral.map((r) => r.generalMeanTicks)),
  };
}

function fmt(s: Stat): string {
  if (s.n === 0) return "     —    ";
  const mean = s.mean.toFixed(s.mean >= 100 ? 0 : 2);
  const sd = s.sd.toFixed(s.sd >= 100 ? 0 : 1);
  return `${mean}±${sd}`;
}

function printTable(aggs: Agg[], seeds: number, gens: number, vary: boolean): void {
  const mode = vary ? "vary-track (generalist)" : "fixed-track (specialist)";
  console.log(`\n${mode}  |  ${seeds} seeds x ${gens} gens\n`);
  const cols = vary
    ? ["config", "genFinishes", "genMeanTicks", "firstFin(gen)", "finished"]
    : ["config", "bestEver", "firstFin(gen)", "finished", "bestTicks"];
  console.log(cols.map((c, i) => (i === 0 ? c.padEnd(16) : c.padStart(15))).join(""));
  for (const a of aggs) {
    const cells = vary
      ? [fmt(a.generalFinishes), fmt(a.generalMeanTicks), fmt(a.firstFinishGen), `${a.finishedSeeds}`]
      : [fmt(a.bestEver), fmt(a.firstFinishGen), `${a.finishedSeeds}`, fmt(a.bestTicks)];
    console.log(a.label.padEnd(16) + cells.map((c) => c.padStart(15)).join(""));
  }
  console.log("");
}

// The matrix under test. Each entry is a delta over DEFAULT_CONFIG so the
// baseline row is exactly the shipped behaviour, and each row isolates one
// existing tunable.
function matrix(): { label: string; config: SimConfig }[] {
  const base = DEFAULT_CONFIG;
  return [
    { label: "baseline", config: { ...base } },
    { label: "pop-100", config: { ...base, populationSize: 100 } },
    { label: "mut-str-0.25", config: { ...base, mutationStrength: 0.25 } },
    { label: "mut-str-0.6", config: { ...base, mutationStrength: 0.6 } },
    { label: "mut-rate-0.2", config: { ...base, mutationRate: 0.2 } },
    { label: "elite-8", config: { ...base, eliteCount: 8 } },
    { label: "tourn-8", config: { ...base, tournamentSize: 8 } },
  ];
}

const USAGE = `pnpm bench [options]

Headless A/B benchmark for the neuroevolution genetic algorithm. Runs the real
world loop across N seeds x N generations and prints a comparison table.

Options:
  --vary           vary-track (generalist) mode; default is fixed-track
  --gens <n>       generations per run (default 50)
  --seeds <n>      number of seeds (default 6)
  --only <label>   run one config, printing a single machine-readable row, so
                   the matrix can be fanned across CPU cores as processes
  -h, --help       show this help

Configs: ${matrix().map((m) => m.label).join(", ")}`;

function parseArgs(argv: string[]): {
  gens: number;
  seeds: number;
  vary: boolean;
  only: string | null;
  help: boolean;
} {
  let gens = 50;
  let seeds = 6;
  let vary = false;
  let only: string | null = null;
  let help = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--vary") vary = true;
    else if (argv[i] === "--gens") gens = Number(argv[++i]);
    else if (argv[i] === "--seeds") seeds = Number(argv[++i]);
    else if (argv[i] === "--only") only = argv[++i];
    else if (argv[i] === "--help" || argv[i] === "-h") help = true;
  }
  return { gens, seeds, vary, only, help };
}

function main(): void {
  const { gens, seeds, vary, only, help } = parseArgs(process.argv.slice(2));
  if (help) {
    console.log(USAGE);
    return;
  }
  const seedList = Array.from({ length: seeds }, (_, i) => 1000 + i * 7);
  // --only runs a single config and prints one machine-readable row, so the
  // matrix can be fanned across CPU cores as separate processes and collated.
  const entries = only ? matrix().filter((m) => m.label === only) : matrix();
  const aggs: Agg[] = [];
  for (const { label, config } of entries) {
    const cfg: SimConfig = { ...config, varyTrack: vary };
    const results = seedList.map((s) => runOne(cfg, s, gens));
    const agg = aggregate(label, results);
    aggs.push(agg);
    if (only) console.log(`ROW ${JSON.stringify(agg)}`);
    else console.log(`  ran ${label}`);
  }
  if (!only) printTable(aggs, seeds, gens, vary);
}

main();
