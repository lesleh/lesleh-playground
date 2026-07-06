import { mulberry32 } from "./geometry";
import {
  DEFAULT_CONFIG,
  activeCount,
  bestDistanceThisGen,
  createWorld,
  leader,
  stepWorld,
  type SimConfig,
} from "./world";

const config: SimConfig = { populationSize: 16, maxTicks: 120, mutationRate: 0.1 };

describe("createWorld", () => {
  it("spawns a generation of candidates with an ES state", () => {
    const world = createWorld(config, mulberry32(1));
    expect(world.walkers).toHaveLength(16);
    expect(world.zs).toHaveLength(16);
    expect(world.mean.length).toBeGreaterThan(0);
    expect(world.sigma).toBeGreaterThan(0);
    expect(world.generation).toBe(1);
    expect(activeCount(world)).toBe(16);
    for (const w of world.walkers) expect(w.limbs).toHaveLength(4);
  });
});

describe("stepWorld", () => {
  it("ends a generation and keeps the population size", () => {
    const rand = mulberry32(1);
    const world = createWorld(config, rand);
    let steps = 0;
    while (world.generation === 1 && steps <= config.maxTicks) {
      stepWorld(world, config, rand);
      steps++;
    }
    expect(world.generation).toBe(2);
    expect(world.tick).toBe(0);
    expect(world.walkers).toHaveLength(16);
    expect(world.history).toHaveLength(1);
  });

  it("always terminates a generation within the tick cap", () => {
    const rand = mulberry32(5);
    const world = createWorld(config, rand);
    for (let g = 0; g < 4; g++) {
      const startGen = world.generation;
      let steps = 0;
      while (world.generation === startGen && steps <= config.maxTicks) {
        stepWorld(world, config, rand);
        steps++;
      }
      expect(world.generation).toBe(startGen + 1);
      expect(steps).toBeLessThanOrEqual(config.maxTicks);
    }
  });

  it("leader is the furthest-travelled walker", () => {
    const rand = mulberry32(2);
    const world = createWorld(config, rand);
    for (let i = 0; i < 60; i++) stepWorld(world, config, rand);
    const lead = leader(world);
    expect(lead).not.toBeNull();
    expect(lead!.maxX).toBe(Math.max(...world.walkers.map((w) => w.maxX)));
  });
});

describe("evolution (CSA-ES)", () => {
  it("improves distance over generations and records the champion", () => {
    const cfg: SimConfig = { populationSize: 24, maxTicks: 400, mutationRate: 0.1 };
    const rand = mulberry32(1);
    const world = createWorld(cfg, rand);
    while (world.generation <= 20) stepWorld(world, cfg, rand);
    expect(world.bestGenome).not.toBeNull();
    const firstGen = world.history[0];
    const laterBest = Math.max(...world.history.slice(-3));
    expect(laterBest).toBeGreaterThanOrEqual(firstGen);
    expect(world.bestDistance).toBeGreaterThan(0.5); // travelled forward (metres)
  }, 60000);

  it("bestDistanceThisGen reflects the current field", () => {
    const rand = mulberry32(9);
    const world = createWorld(config, rand);
    for (let i = 0; i < 30; i++) stepWorld(world, config, rand);
    expect(bestDistanceThisGen(world)).toBeGreaterThanOrEqual(0);
  });
});
