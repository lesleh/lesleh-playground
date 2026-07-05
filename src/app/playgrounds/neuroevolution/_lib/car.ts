// A car: kinematic body, wall-distance sensors, and an NN brain. One step
// reads the sensors, asks the brain for steering + throttle, moves, then checks
// for a crash or a gate crossing.

import { rayHit, segmentsIntersect } from "./geometry";
import { forward, type Network } from "./nn";
import type { Track } from "./track";

// Sensor whiskers, relative to the car's heading: wide side coverage plus fine
// forward resolution so the car can read a corner before it arrives.
const DEG = Math.PI / 180;
export const SENSOR_ANGLES = [
  -90 * DEG,
  -45 * DEG,
  -20 * DEG,
  0,
  20 * DEG,
  45 * DEG,
  90 * DEG,
];
// Longer range gives genuine look-ahead: the forward whiskers spot walls sooner,
// so a brain can learn to brake early for a corner it can't yet be next to.
export const SENSOR_RANGE = 260;

// Network shape: one input per sensor plus current speed, two hidden layers,
// then steering + throttle.
export const BRAIN_SHAPE = [SENSOR_ANGLES.length + 1, 12, 8, 2];

// The car is deliberately overpowered for the track: top speed is high and
// grip (turn rate) is modest, so the full-speed turn radius R* = MAX_SPEED /
// TURN_RATE is far larger than the track's corners. Mastering when to brace and
// how much to brake is a deep skill that takes many generations to refine.
export const MAX_SPEED = 5.8;
export const ACCEL = 0.22;
// Braking bites harder than the throttle, like a real car, so the winning line
// is "flat out, brake hard, apex, accelerate out" rather than crawling.
export const BRAKE = 0.45;
const FRICTION = 0.02;
// Angular velocity per tick at full steer. Constant (not speed-scaled), so the
// turn radius widens with speed: fast corners can only be taken by slowing down.
export const TURN_RATE = 0.06;
// Below this speed the car can't steer, so a parked car can't spin in place.
const MIN_TURN_SPEED = 0.3;
// Ticks a car may go without reaching a new gate before it's culled as stalled.
// Generous, since a good line may crawl through a hairpin.
const STALE_STEPS = 120;

// The goal is a clean run of this many laps, as fast as possible.
export const LAPS_TO_FINISH = 3;
// Reference tick budget for scoring finish speed (a faster finish scores
// higher). Doubles as the generation's hard safety cap.
export const FINISH_TIME_BUDGET = 3000;

export interface Car {
  x: number;
  y: number;
  angle: number;
  speed: number;
  alive: boolean;
  // Set once the car has completed the target laps; it then stops simulating.
  done: boolean;
  net: Network;
  nextGate: number;
  gatesPassed: number;
  fitness: number;
  stale: number;
  // Ticks this car has been simulated; the tick it finished on (0 if unfinished).
  ticks: number;
  finishTicks: number;
  // Last sensor distances (clamped to SENSOR_RANGE), kept for rendering.
  sensors: number[];
}

export function createCar(net: Network, track: Track): Car {
  return {
    x: track.start.x,
    y: track.start.y,
    angle: track.start.angle,
    speed: 0,
    alive: true,
    done: false,
    net,
    nextGate: 1 % track.gates.length,
    gatesPassed: 0,
    fitness: 0,
    stale: 0,
    ticks: 0,
    finishTicks: 0,
    sensors: SENSOR_ANGLES.map(() => SENSOR_RANGE),
  };
}

// Cast every whisker and return the nearest wall distance for each.
function readSensors(car: Car, track: Track): number[] {
  const out = new Array(SENSOR_ANGLES.length);
  for (let s = 0; s < SENSOR_ANGLES.length; s++) {
    const a = car.angle + SENSOR_ANGLES[s];
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let nearest = SENSOR_RANGE;
    for (const w of track.walls) {
      const t = rayHit(car.x, car.y, dx, dy, w.ax, w.ay, w.bx, w.by);
      if (t < nearest) nearest = t;
    }
    out[s] = nearest;
  }
  return out;
}

// Advance one car by a single tick. No-op once it has crashed.
export function stepCar(car: Car, track: Track): void {
  if (!car.alive || car.done) return;
  car.ticks += 1;

  const sensors = readSensors(car, track);
  car.sensors = sensors;

  const inputs = new Array(SENSOR_ANGLES.length + 1);
  for (let i = 0; i < sensors.length; i++) inputs[i] = sensors[i] / SENSOR_RANGE;
  inputs[sensors.length] = car.speed / MAX_SPEED;

  // Throttle is bipolar: positive accelerates, negative brakes (harder).
  const [steer, throttle] = forward(car.net, inputs);

  car.speed += throttle * (throttle < 0 ? BRAKE : ACCEL);
  car.speed *= 1 - FRICTION;
  if (car.speed > MAX_SPEED) car.speed = MAX_SPEED;
  if (car.speed < 0) car.speed = 0;
  // Constant angular velocity means the turn radius grows with speed, so a tight
  // corner demands braking. That speed/steer tradeoff is the skill that keeps
  // cars improving long after they can merely stay on the road.
  if (car.speed > MIN_TURN_SPEED) car.angle += steer * TURN_RATE;

  const px = car.x;
  const py = car.y;
  const nx = px + Math.cos(car.angle) * car.speed;
  const ny = py + Math.sin(car.angle) * car.speed;

  for (const w of track.walls) {
    if (segmentsIntersect(px, py, nx, ny, w.ax, w.ay, w.bx, w.by)) {
      car.alive = false;
      return;
    }
  }

  car.x = nx;
  car.y = ny;

  const gate = track.gates[car.nextGate];
  if (segmentsIntersect(px, py, nx, ny, gate.ax, gate.ay, gate.bx, gate.by)) {
    car.gatesPassed += 1;
    car.nextGate = (car.nextGate + 1) % track.gates.length;
    car.stale = 0;
  } else {
    car.stale += 1;
    if (car.stale > STALE_STEPS) {
      car.alive = false;
    }
  }

  const target = LAPS_TO_FINISH * track.gates.length;
  if (car.gatesPassed >= target) {
    car.done = true;
    car.finishTicks = car.ticks;
  }

  car.fitness = fitness(car, track, target);
}

// A finished car scores above any unfinished one, ranked by how fast it went.
// An unfinished car scores by distance covered, with a smooth fraction toward
// the next gate so even early, gate-less cars get a usable gradient.
function fitness(car: Car, track: Track, target: number): number {
  if (car.done) {
    return target + Math.max(0, FINISH_TIME_BUDGET - car.finishTicks);
  }
  const gate = track.gates[car.nextGate];
  const midX = (gate.ax + gate.bx) / 2;
  const midY = (gate.ay + gate.by) / 2;
  const d = Math.hypot(midX - car.x, midY - car.y);
  const shaping = Math.max(0, Math.min(0.95, 1 - d / track.gateSpacing));
  return car.gatesPassed + shaping;
}
