// Ties the pieces together: a track, a population of cars, and the generation
// lifecycle. Kept free of React and canvas so the loop can be unit tested.

import {
  BRAIN_SHAPE,
  FINISH_TIME_BUDGET,
  LAPS_TO_FINISH,
  createCar,
  stepCar,
  type Car,
} from "./car";
import { mulberry32 } from "./geometry";
import {
  computeStats,
  evolve,
  type EvolveConfig,
  type Scored,
} from "./genetic";
import { cloneNetwork, createNetwork, type Network } from "./nn";
import { buildTrack, type Track } from "./track";

export interface SimConfig extends EvolveConfig {
  // Hard cap on ticks per generation, so a car that laps forever still hands
  // over to the next generation.
  maxSteps: number;
  // Domain randomization: when true, a fresh track is generated every
  // generation, so the population is selected for driving in general rather
  // than for one specific layout.
  varyTrack: boolean;
  // Diversity rescue: after this many generations with no new record, replace
  // the weakest `immigrants` bred slots with fresh random brains to re-open
  // exploration (0 rounds disables it).
  stallRounds: number;
  immigrants: number;
}

export const DEFAULT_CONFIG: SimConfig = {
  populationSize: 50,
  eliteCount: 4,
  tournamentSize: 5,
  mutationRate: 0.12,
  mutationStrength: 0.4,
  maxSteps: FINISH_TIME_BUDGET,
  varyTrack: false,
  stallRounds: 12,
  immigrants: 6,
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
  // --- Track champion: fastest on THIS track (a specialist) ---
  // Fewest ticks any car has taken to finish the current track (0 = none yet).
  bestTicks: number;
  // The brain that set bestTicks — the track record-holder.
  bestNet: Network | null;
  // --- Generalist champion: best across ALL tracks (a robust all-rounder) ---
  // Worst-case cost over a fixed held-out battery for the best generaliser seen
  // (0 = none yet; lower is better). Track-independent, so it persists.
  generalScore: number;
  generalNet: Network | null;
  // Generations since the last record, for the immigrant diversity rescue.
  stall: number;
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
    bestNet: null,
    generalScore: 0,
    generalNet: null,
    stall: 0,
    history: [],
    timeHistory: [],
  };
}

// A fixed, seeded set of held-out tracks the population never trains on — a
// validation set for measuring how well a brain generalises.
const BATTERY_SEEDS = [9001, 9002, 9003, 9004, 9005];
let batteryCache: { key: string; tracks: Track[] } | null = null;

function validationBattery(width: number, height: number): Track[] {
  const key = `${width}x${height}`;
  if (!batteryCache || batteryCache.key !== key) {
    batteryCache = {
      key,
      tracks: BATTERY_SEEDS.map((s) => buildTrack({ width, height }, mulberry32(s))),
    };
  }
  return batteryCache.tracks;
}

// Worst-case cost of a brain over the battery (lower = more general): its
// slowest finish, or a heavy penalty plus distance shortfall for any track it
// fails to finish. Worst-case selection favours "never crashes on the unknown".
export function evaluateGenerality(net: Network, battery: Track[]): number {
  let worst = 0;
  for (const track of battery) {
    const car = createCar(net, track);
    for (let i = 0; i < FINISH_TIME_BUDGET && car.alive && !car.done; i++) {
      stepCar(car, track);
    }
    const target = LAPS_TO_FINISH * track.gates.length;
    const cost = car.done
      ? car.finishTicks
      : FINISH_TIME_BUDGET + (target - car.gatesPassed);
    if (cost > worst) worst = cost;
  }
  return worst;
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

  // Fastest finisher this generation; keep its brain if it's an all-time record
  // so solo/export always race the actual record-holder.
  let recordCar: Car | null = null;
  for (const c of world.cars) {
    if (c.done && (!recordCar || c.finishTicks < recordCar.finishTicks)) {
      recordCar = c;
    }
  }
  const genTicks = recordCar ? recordCar.finishTicks : 0;
  world.timeHistory.push(genTicks);
  let improved = false;
  if (recordCar && (world.bestTicks === 0 || genTicks < world.bestTicks)) {
    world.bestTicks = genTicks;
    world.bestNet = cloneNetwork(recordCar.net);
    improved = true;
  }

  // Track how long lap-time progress has stalled, once there's a record to beat.
  if (world.bestTicks > 0) world.stall = improved ? 0 : world.stall + 1;

  const nets = evolve(scored, config, rand);

  // Generalist champion (separate from the track record): score this
  // generation's best on the held-out battery and keep whichever brain
  // generalises best. Track-independent, so it survives track changes.
  const score = evaluateGenerality(
    nets[0],
    validationBattery(world.track.width, world.track.height),
  );
  if (world.generalScore === 0 || score < world.generalScore) {
    world.generalScore = score;
    world.generalNet = cloneNetwork(nets[0]);
  }

  // Domain randomization reshuffles the course each generation; the fastest-run
  // record only means something on a fixed track, so reset it when varying.
  if (config.varyTrack) {
    world.track = buildTrack(
      { width: world.track.width, height: world.track.height },
      rand,
    );
    world.bestTicks = 0;
    world.bestNet = null;
    world.stall = 0;
  }

  // Diversity rescue: after a long stall, replace the weakest bred slots (never
  // the elites) with fresh random brains, then reset so bursts stay spaced out.
  if (config.immigrants > 0 && world.stall >= config.stallRounds) {
    const start = Math.max(config.eliteCount, nets.length - config.immigrants);
    for (let i = start; i < nets.length; i++) {
      nets[i] = createNetwork(BRAIN_SHAPE, rand);
    }
    world.stall = 0;
  }

  world.cars = nets.map((net) => createCar(net, world.track));
  world.generation += 1;
  world.step = 0;
}
