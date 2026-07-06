// Ties it together: a population of robots and the learning loop. The optimiser
// is a CSA evolution strategy (the step-size-adapting core of CMA-ES): it keeps
// a mean controller and a step size, samples a generation of candidates around
// the mean, and moves toward the ones that walked furthest. Far better than a
// plain GA at coordinating continuous controller weights, so the gait actually
// sharpens into a walk/run instead of a lurch. Kept free of React/canvas so it
// runs headless and is unit tested.

import {
  CTRL_SHAPE,
  cloneGenome,
  createWalker,
  genomeFromWeights,
  randomGenome,
  stepWalker,
  type Genome,
  type Walker,
} from "./creature";
import { gaussian } from "./geometry";
import { flattenWeights, weightCount } from "./nn";

export interface SimConfig {
  // Candidates evaluated per generation (the ES population size).
  populationSize: number;
  // Hard tick cap per generation.
  maxTicks: number;
  // Exploration: sets a floor under the ES step size, so the crowd keeps trying
  // varied gaits instead of collapsing onto one. Driven by the UI slider.
  mutationRate: number;
}

export const DEFAULT_CONFIG: SimConfig = {
  populationSize: 60,
  maxTicks: 600,
  mutationRate: 0.1,
};

export const FLOOR_Y = 0;
export const SPAWN_X = 0;

const DIM = weightCount(CTRL_SHAPE);

export interface World {
  walkers: Walker[];
  // The perturbation that produced each walker (mean + sigma*z), for the update.
  zs: number[][];
  mean: number[]; // current mean controller weights
  sigma: number; // step size
  path: number[]; // CSA evolution path
  generation: number;
  tick: number;
  bestDistance: number;
  bestGenome: Genome | null;
  history: number[];
}

function gaussianVec(rand: () => number): number[] {
  const v = new Array(DIM);
  for (let i = 0; i < DIM; i++) v[i] = gaussian(rand);
  return v;
}

export function createWorld(config: SimConfig, rand: () => number): World {
  // Seed the mean from a small random controller.
  const seed = flattenWeights(randomGenome(rand).net).map((w) => w * 0.5);
  const world: World = {
    walkers: [],
    zs: [],
    mean: seed,
    sigma: 0.5,
    path: new Array(DIM).fill(0),
    generation: 1,
    tick: 0,
    bestDistance: 0,
    bestGenome: null,
    history: [],
  };
  sample(world, config, rand);
  return world;
}

// Sample a generation around the mean using the given rng.
function sample(world: World, config: SimConfig, rand: () => number): void {
  const walkers: Walker[] = [];
  const zs: number[][] = [];
  for (let i = 0; i < config.populationSize; i++) {
    const z = gaussianVec(rand);
    const w = new Array(DIM);
    for (let j = 0; j < DIM; j++) w[j] = world.mean[j] + world.sigma * z[j];
    zs.push(z);
    walkers.push(createWalker(genomeFromWeights(w), SPAWN_X));
  }
  world.walkers = walkers;
  world.zs = zs;
}

export function activeCount(world: World): number {
  let n = 0;
  for (const w of world.walkers) if (w.alive) n++;
  return n;
}

export function leader(world: World): Walker | null {
  let best: Walker | null = null;
  for (const w of world.walkers) if (!best || w.maxX > best.maxX) best = w;
  return best;
}

export function bestDistanceThisGen(world: World): number {
  let best = 0;
  for (const w of world.walkers) if (w.fitness > best) best = w.fitness;
  return best;
}

export function stepWorld(world: World, config: SimConfig, rand: () => number): void {
  let anyActive = false;
  for (const w of world.walkers) {
    stepWalker(w);
    if (w.alive) anyActive = true;
  }
  world.tick += 1;
  if (!anyActive || world.tick >= config.maxTicks) endGeneration(world, config, rand);
}

function endGeneration(world: World, config: SimConfig, rand: () => number): void {
  const n = world.walkers.length;
  const order = Array.from({ length: n }, (_, i) => i).sort(
    (a, b) => world.walkers[b].fitness - world.walkers[a].fitness,
  );

  world.history.push(world.walkers[order[0]].fitness);
  const champ = world.walkers[order[0]];
  if (champ.fitness > world.bestDistance) {
    world.bestDistance = champ.fitness;
    world.bestGenome = cloneGenome(champ.genome);
  }

  // Rank-based recombination weights over the top half.
  const mu = Math.max(1, Math.floor(n / 2));
  const raw = new Array(mu);
  let sum = 0;
  for (let j = 0; j < mu; j++) {
    raw[j] = Math.log(mu + 0.5) - Math.log(j + 1);
    sum += raw[j];
  }
  const w = raw.map((r) => r / sum);
  let muEff = 0;
  for (const wi of w) muEff += wi * wi;
  muEff = 1 / muEff;

  // Weighted mean of the elite perturbations, and the mean update.
  const step = new Array(DIM).fill(0);
  for (let j = 0; j < mu; j++) {
    const z = world.zs[order[j]];
    for (let d = 0; d < DIM; d++) step[d] += w[j] * z[d];
  }
  for (let d = 0; d < DIM; d++) world.mean[d] += world.sigma * step[d];

  // Cumulative step-size adaptation (CSA).
  const cs = (muEff + 2) / (DIM + muEff + 5);
  const ds = 1 + 2 * Math.max(0, Math.sqrt((muEff - 1) / (DIM + 1)) - 1) + cs;
  const csFac = Math.sqrt(cs * (2 - cs) * muEff);
  let pathNorm = 0;
  for (let d = 0; d < DIM; d++) {
    world.path[d] = (1 - cs) * world.path[d] + csFac * step[d];
    pathNorm += world.path[d] * world.path[d];
  }
  pathNorm = Math.sqrt(pathNorm);
  const chiN = Math.sqrt(DIM) * (1 - 1 / (4 * DIM) + 1 / (21 * DIM * DIM));
  world.sigma *= Math.exp((cs / ds) * (pathNorm / chiN - 1));
  const floor = 0.03 + config.mutationRate * 0.4;
  world.sigma = Math.min(3, Math.max(floor, world.sigma));

  world.generation += 1;
  world.tick = 0;
  sample(world, config, rand);
}
