// Turns a scored population into the next generation: keep a few elites intact,
// then breed the rest by tournament selection, uniform crossover and mutation.

import { cloneNetwork, crossover, mutate, type Network } from "./nn";

export interface Scored {
  net: Network;
  fitness: number;
}

export interface EvolveConfig {
  populationSize: number;
  eliteCount: number;
  tournamentSize: number;
  mutationRate: number;
  mutationStrength: number;
}

export interface GenerationStats {
  best: number;
  mean: number;
}

// Sample `k` individuals and return the fittest one's brain.
export function tournament(
  sorted: Scored[],
  k: number,
  rand: () => number,
): Network {
  let best = sorted[Math.floor(rand() * sorted.length)];
  for (let i = 1; i < k; i++) {
    const c = sorted[Math.floor(rand() * sorted.length)];
    if (c.fitness > best.fitness) best = c;
  }
  return best.net;
}

export function evolve(
  scored: Scored[],
  config: EvolveConfig,
  rand: () => number,
): Network[] {
  const sorted = [...scored].sort((a, b) => b.fitness - a.fitness);
  const next: Network[] = [];

  const elites = Math.min(config.eliteCount, sorted.length);
  for (let i = 0; i < elites; i++) next.push(cloneNetwork(sorted[i].net));

  while (next.length < config.populationSize) {
    const a = tournament(sorted, config.tournamentSize, rand);
    const b = tournament(sorted, config.tournamentSize, rand);
    const child = crossover(a, b, rand);
    next.push(mutate(child, config.mutationRate, config.mutationStrength, rand));
  }

  return next;
}

export function computeStats(scored: Scored[]): GenerationStats {
  let best = -Infinity;
  let sum = 0;
  for (const s of scored) {
    if (s.fitness > best) best = s.fitness;
    sum += s.fitness;
  }
  return { best, mean: scored.length ? sum / scored.length : 0 };
}
