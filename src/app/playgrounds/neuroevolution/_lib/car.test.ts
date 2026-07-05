import { mulberry32 } from "./geometry";
import type { Network } from "./nn";
import { buildTrack } from "./track";
import { SENSOR_ANGLES, SENSOR_RANGE, createCar, stepCar } from "./car";

const track = buildTrack({ width: 800, height: 600, points: 48 }, mulberry32(1));
const INPUTS = SENSOR_ANGLES.length + 1;

// A hand-built single-hidden-layer brain whose output depends only on the two
// output biases, so a test can force "drive straight" or "sit still" regardless
// of inputs. Independent of BRAIN_SHAPE: stepCar only reads outputs 0 and 1.
function fixedBrain(steerBias: number, throttleBias: number): Network {
  return {
    layers: [
      { inSize: INPUTS, outSize: 4, w: new Array(INPUTS * 4).fill(0), b: new Array(4).fill(0) },
      { inSize: 4, outSize: 2, w: new Array(4 * 2).fill(0), b: [steerBias, throttleBias] },
    ],
  };
}

describe("createCar", () => {
  it("starts alive at the track start pose", () => {
    const car = createCar(fixedBrain(0, 0), track);
    expect(car.alive).toBe(true);
    expect(car.gatesPassed).toBe(0);
    expect(car.x).toBeCloseTo(track.start.x);
    expect(car.y).toBeCloseTo(track.start.y);
  });
});

describe("stepCar", () => {
  it("populates sensor readings within range", () => {
    const car = createCar(fixedBrain(0, 5), track);
    stepCar(car, track);
    expect(car.sensors).toHaveLength(SENSOR_ANGLES.length);
    for (const d of car.sensors) {
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(SENSOR_RANGE);
    }
  });

  it("earns fitness as it moves toward the next gate", () => {
    const car = createCar(fixedBrain(0, 5), track); // full throttle, straight
    for (let i = 0; i < 20 && car.alive; i++) stepCar(car, track);
    expect(car.fitness).toBeGreaterThan(0);
  });

  it("culls a car that just sits there (stalled)", () => {
    const car = createCar(fixedBrain(0, -5), track); // brakes, never moves
    // Run well past the stale cull window regardless of its exact value.
    for (let i = 0; i < 400; i++) stepCar(car, track);
    expect(car.alive).toBe(false);
    expect(car.gatesPassed).toBe(0);
  });

  it("eventually crashes a car driving blindly straight", () => {
    const car = createCar(fixedBrain(0, 5), track);
    for (let i = 0; i < 800 && car.alive; i++) stepCar(car, track);
    expect(car.alive).toBe(false);
  });

  it("does nothing once dead", () => {
    const car = createCar(fixedBrain(0, 5), track);
    car.alive = false;
    const snapshot = { ...car };
    stepCar(car, track);
    expect(car.x).toBe(snapshot.x);
    expect(car.y).toBe(snapshot.y);
  });
});
