// Ties the pieces together: a track, a population of cars, and the generation
// lifecycle. Kept free of React and canvas so the loop can be unit tested.

import {
  BRAIN_SHAPE,
  FINISH_TIME_BUDGET,
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
  // Under vary-track, how many fresh random tracks each brain is scored on per
  // generation (worst-case-ish lexicographic selection). Higher = more general,
  // more compute.
  evalTracks: number;
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
  evalTracks: 4,
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
  // Best generaliser seen, selected on a fixed held-out battery by the
  // lexicographic score (higher = better; worst-case is too flat to rank
  // generalists). Track-independent, so it persists.
  generalScore: number;
  generalNet: Network | null;
  // How many battery tracks the crowned generalist finishes (for display).
  generalFinishes: number;
  // Mean finish time (ticks) of the crowned generalist over the battery tracks
  // it finishes, 0 if none — lets speed be watched after finishes saturate.
  generalMeanTicks: number;
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
    generalFinishes: 0,
    generalMeanTicks: 0,
    stall: 0,
    history: [],
    timeHistory: [],
  };
}

// A fixed, seeded set of held-out tracks the population never trains on — a
// validation set for measuring how well a brain generalises. Kept large enough
// that finish-count doesn't saturate (a 5-track set hits 5/5 early and gives a
// noisy speed signal), so crowning keeps picking the brain that's fastest across
// many tracks, not just the one lucky on a handful.
const BATTERY_SEEDS = [
  9001, 9002, 9003, 9004, 9005, 9006, 9007, 9008, 9009, 9010, 9011, 9012, 9013,
  9014, 9015, 9016, 9017, 9018, 9019, 9020,
];
export const BATTERY_SIZE = BATTERY_SEEDS.length;
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

// Per-finish base, large enough that one more finish always outranks any
// speed/progress gain elsewhere (speed bonus <= FINISH_TIME_BUDGET, progress
// small), so the sum below behaves lexicographically: finish first, then speed.
const FINISH_BASE = 1_000_000;

export interface TrackScore {
  // Lexicographic fitness (higher = better): each finished track is worth a big
  // base plus a speed bonus (faster = higher); each DNF is worth only the
  // distance reached. More finishes always wins; among equal finishes, faster
  // wins; a DNF still climbs by getting further.
  lexi: number;
  // How many of the tracks were finished.
  finishes: number;
  // Mean finish time (ticks) over the finished tracks, 0 if none — the "how
  // fast" half of the objective, for display.
  meanTicks: number;
}

export function scoreTracks(net: Network, tracks: Track[]): TrackScore {
  let lexi = 0;
  let finishes = 0;
  let tickSum = 0;
  for (const track of tracks) {
    const car = createCar(net, track);
    for (let i = 0; i < FINISH_TIME_BUDGET && car.alive && !car.done; i++) {
      stepCar(car, track);
    }
    if (car.done) {
      finishes++;
      tickSum += car.finishTicks;
      lexi += FINISH_BASE + (FINISH_TIME_BUDGET - car.finishTicks);
    } else {
      lexi += car.gatesPassed;
    }
  }
  return { lexi, finishes, meanTicks: finishes ? tickSum / finishes : 0 };
}

// The "never crash, then go fast" objective, as one number, for vary-track
// selection.
export function lexiFitness(net: Network, tracks: Track[]): number {
  return scoreTracks(net, tracks).lexi;
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
  const dims = { width: world.track.width, height: world.track.height };

  // Selection fitness. Under vary-track, score each brain on K fresh random
  // tracks with the lexicographic (finish-then-speed) sum, so the population is
  // bred to finish anything, not just this generation's lucky track. Otherwise
  // use the live-race fitness. (The held-out battery is never used here.)
  let scored: Scored[];
  if (config.varyTrack) {
    const evalTracks = Array.from({ length: config.evalTracks }, () =>
      buildTrack(dims, rand),
    );
    scored = world.cars.map((c) => ({
      net: c.net,
      fitness: lexiFitness(c.net, evalTracks),
    }));
  } else {
    scored = world.cars.map((c) => ({ net: c.net, fitness: c.fitness }));
  }
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

  // Generalist champion (separate from the track record): pick the best of this
  // generation's elites on the held-out battery by the lexicographic score
  // (worst-case is too flat to tell a 4/5 generalist from a 0/5 one), and keep
  // the best ever. Selecting the champion on held-out data doesn't leak into
  // breeding, which uses fresh tracks.
  const battery = validationBattery(dims.width, dims.height);
  let bestIdx = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < config.eliteCount && i < nets.length; i++) {
    const s = scoreTracks(nets[i], battery);
    if (s.lexi > bestScore) {
      bestScore = s.lexi;
      bestIdx = i;
    }
  }
  if (bestIdx >= 0 && (world.generalNet === null || bestScore > world.generalScore)) {
    const s = scoreTracks(nets[bestIdx], battery);
    world.generalScore = s.lexi;
    world.generalFinishes = s.finishes;
    world.generalMeanTicks = s.meanTicks;
    world.generalNet = cloneNetwork(nets[bestIdx]);
  }

  // Domain randomization reshuffles the course each generation; the fastest-run
  // record only means something on a fixed track, so reset it when varying.
  if (config.varyTrack) {
    world.track = buildTrack(dims, rand);
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
