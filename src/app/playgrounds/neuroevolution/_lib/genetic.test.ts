import { mulberry32 } from "./geometry";
import { createNetwork, type Network } from "./nn";
import {
  computeStats,
  evolve,
  populationFrom,
  tournament,
  type Scored,
} from "./genetic";

function population(fitnesses: number[]): Scored[] {
  return fitnesses.map((fitness, i) => ({
    net: createNetwork([2, 2], mulberry32(i + 1)),
    fitness,
  }));
}

const config = {
  populationSize: 10,
  eliteCount: 2,
  tournamentSize: 3,
  mutationRate: 0.1,
  mutationStrength: 0.3,
};

describe("evolve", () => {
  it("returns exactly populationSize brains", () => {
    const next = evolve(population([1, 5, 3, 2, 4]), config, mulberry32(99));
    expect(next).toHaveLength(10);
  });

  it("carries the fittest elite through unchanged", () => {
    const pop = population([1, 5, 3, 2, 4]);
    const fittest: Network = pop[1].net; // fitness 5
    const next = evolve(pop, config, mulberry32(1));
    expect(next[0]).toEqual(fittest);
  });

  it("with full elitism and no mutation, clones the whole population", () => {
    const pop = population([3, 1, 2]);
    const cloneAll = {
      ...config,
      populationSize: 3,
      eliteCount: 3,
      mutationRate: 0,
    };
    const next = evolve(pop, cloneAll, mulberry32(1));
    // Sorted by fitness: [3, 2, 1].
    expect(next[0]).toEqual(pop[0].net);
    expect(next[1]).toEqual(pop[2].net);
    expect(next[2]).toEqual(pop[1].net);
  });
});

describe("tournament", () => {
  it("returns the fittest of the sampled individuals", () => {
    const pop = population([1, 2, 3, 4, 5]);
    // rand() sequence maps to indices 0, 4, 2 -> fitnesses 1, 5, 3 -> winner idx 4.
    const seq = [0.0, 0.99, 0.5];
    let i = 0;
    const rand = () => seq[i++];
    expect(tournament(pop, 3, rand)).toBe(pop[4].net);
  });
});

describe("populationFrom", () => {
  it("keeps one exact clone of the seed and fills the rest", () => {
    const seed = createNetwork([2, 2], mulberry32(1));
    const pop = populationFrom(seed, 6, 0.5, 0.3, mulberry32(2));
    expect(pop).toHaveLength(6);
    expect(pop[0]).toEqual(seed); // first is an untouched clone
    expect(pop[0]).not.toBe(seed); // but a copy, not the same reference
    expect(pop[1]).not.toEqual(seed); // the rest are mutated
  });
});

describe("computeStats", () => {
  it("reports best and mean fitness", () => {
    const stats = computeStats(population([2, 4, 6]));
    expect(stats.best).toBe(6);
    expect(stats.mean).toBeCloseTo(4);
  });

  it("handles an empty population", () => {
    expect(computeStats([])).toEqual({ best: -Infinity, mean: 0 });
  });
});
