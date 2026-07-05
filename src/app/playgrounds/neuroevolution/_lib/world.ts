// Ties the pieces together: a track, a population of cars, and the generation
// lifecycle. Kept free of React and canvas so the loop can be unit tested.

import {
  BRAIN_SHAPE,
  FINISH_TIME_BUDGET,
  createCar,
  stepCar,
  type Car,
} from "./car";
import {
  computeStats,
  evolve,
  type EvolveConfig,
  type Scored,
} from "./genetic";
import { createNetwork } from "./nn";
import { buildTrack, type Track } from "./track";

export interface SimConfig extends EvolveConfig {
  // Hard cap on ticks per generation, so a car that laps forever still hands
  // over to the next generation.
  maxSteps: number;
  // Domain randomization: when true, a fresh track is generated every
  // generation, so the population is selected for driving in general rather
  // than for one specific layout.
  varyTrack: boolean;
}

export const DEFAULT_CONFIG: SimConfig = {
  populationSize: 50,
  eliteCount: 4,
  tournamentSize: 5,
  mutationRate: 0.12,
  mutationStrength: 0.4,
  maxSteps: FINISH_TIME_BUDGET,
  varyTrack: false,
};

export interface Viewport {
  width: number;
  height: number;
}

export interface World {
  track: Track;
  cars: Car[];
  generation: number;
  step: number;
  bestEver: number;
  // Fewest ticks any car has ever taken to finish (0 = nobody has yet).
  bestTicks: number;
  // Best fitness of each completed generation.
  history: number[];
  // Best finish time (ticks) of each generation, 0 if none finished. Drives the
  // history chart, since it's the metric that keeps meaningfully improving.
  timeHistory: number[];
}

export function createWorld(
  config: SimConfig,
  viewport: Viewport,
  rand: () => number,
): World {
  const track = buildTrack(viewport, rand);
  const cars: Car[] = [];
  for (let i = 0; i < config.populationSize; i++) {
    cars.push(createCar(createNetwork(BRAIN_SHAPE, rand), track));
  }
  return {
    track,
    cars,
    generation: 1,
    step: 0,
    bestEver: 0,
    bestTicks: 0,
    history: [],
    timeHistory: [],
  };
}

// A car still driving: alive and not yet finished.
function isActive(c: Car): boolean {
  return c.alive && !c.done;
}

// The car worth highlighting: one still driving with the highest fitness, or
// the best finisher/wreck if the field is spent.
export function leader(world: World): Car | null {
  let best: Car | null = null;
  for (const c of world.cars) {
    if (!best) {
      best = c;
      continue;
    }
    const better =
      (isActive(c) && !isActive(best)) ||
      (isActive(c) === isActive(best) && c.fitness > best.fitness);
    if (better) best = c;
  }
  return best;
}

export function activeCount(world: World): number {
  let n = 0;
  for (const c of world.cars) if (isActive(c)) n++;
  return n;
}

// Fewest finish ticks among cars that finished this generation (0 if none).
export function bestFinishTicks(world: World): number {
  let best = 0;
  for (const c of world.cars) {
    if (c.done && (best === 0 || c.finishTicks < best)) best = c.finishTicks;
  }
  return best;
}

// Advance one tick. When no car is still driving (all finished or crashed), or
// the safety cap is hit, breed the next generation in place.
export function stepWorld(
  world: World,
  config: SimConfig,
  rand: () => number,
): void {
  let anyActive = false;
  for (const car of world.cars) {
    stepCar(car, world.track);
    if (isActive(car)) anyActive = true;
  }
  world.step += 1;

  if (!anyActive || world.step >= config.maxSteps) {
    endGeneration(world, config, rand);
  }
}

function endGeneration(
  world: World,
  config: SimConfig,
  rand: () => number,
): void {
  const scored: Scored[] = world.cars.map((c) => ({
    net: c.net,
    fitness: c.fitness,
  }));
  const stats = computeStats(scored);
  world.history.push(stats.best);
  if (stats.best > world.bestEver) world.bestEver = stats.best;

  const genTicks = bestFinishTicks(world);
  world.timeHistory.push(genTicks);
  if (genTicks > 0 && (world.bestTicks === 0 || genTicks < world.bestTicks)) {
    world.bestTicks = genTicks;
  }

  const nets = evolve(scored, config, rand);
  // Domain randomization reshuffles the course each generation; the fastest-run
  // record only means something on a fixed track, so reset it when varying.
  if (config.varyTrack) {
    world.track = buildTrack(
      { width: world.track.width, height: world.track.height },
      rand,
    );
    world.bestTicks = 0;
  }
  world.cars = nets.map((net) => createCar(net, world.track));
  world.generation += 1;
  world.step = 0;
}
