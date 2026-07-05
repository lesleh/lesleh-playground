import { mulberry32 } from "./geometry";
import {
  DEFAULT_CONFIG,
  activeCount,
  createWorld,
  leader,
  stepWorld,
} from "./world";

const viewport = { width: 800, height: 600 };
const config = { ...DEFAULT_CONFIG, populationSize: 12, maxSteps: 50 };

describe("createWorld", () => {
  it("builds a full population on a track at generation 1", () => {
    const w = createWorld(config, viewport, mulberry32(1));
    expect(w.cars).toHaveLength(12);
    expect(w.generation).toBe(1);
    expect(w.step).toBe(0);
    expect(w.track.gates.length).toBeGreaterThan(0);
    expect(activeCount(w)).toBe(12);
  });
});

describe("stepWorld", () => {
  it("advances the step counter while cars survive", () => {
    const w = createWorld(config, viewport, mulberry32(2));
    stepWorld(w, config, mulberry32(3));
    expect(w.step).toBe(1);
  });

  it("rolls to the next generation and resets with a fresh population", () => {
    const w = createWorld(config, viewport, mulberry32(4));
    const rand = mulberry32(5);
    // A generation ends when no car is still driving or at the step cap,
    // whichever comes first; step until it turns over.
    let guard = 0;
    while (w.generation === 1 && guard < 5000) {
      stepWorld(w, config, rand);
      guard++;
    }
    expect(w.generation).toBe(2);
    expect(w.step).toBe(0);
    expect(w.history).toHaveLength(1);
    expect(w.cars).toHaveLength(12);
    expect(activeCount(w)).toBe(12); // fresh population
  });

  it("keeps the record-holder's brain when a new best time is set", () => {
    const w = createWorld(config, viewport, mulberry32(11));
    // One finisher, everyone else out, so the generation ends this step.
    w.cars.forEach((c) => (c.alive = false));
    w.cars[0].done = true;
    w.cars[0].finishTicks = 500;
    const recordNet = w.cars[0].net;
    stepWorld(w, config, mulberry32(12));
    expect(w.bestTicks).toBe(500);
    expect(w.bestNet).toEqual(recordNet); // captured...
    expect(w.bestNet).not.toBe(recordNet); // ...as a clone
  });

  it("ends the generation early once every car has crashed", () => {
    const w = createWorld(config, viewport, mulberry32(6));
    const rand = mulberry32(7);
    // Kill everyone manually, then a single step should trigger evolution.
    w.cars.forEach((c) => (c.alive = false));
    stepWorld(w, config, rand);
    expect(w.generation).toBe(2);
    expect(w.history).toHaveLength(1);
  });
});

describe("leader", () => {
  it("prefers a living car over a fitter dead one", () => {
    const w = createWorld(config, viewport, mulberry32(8));
    w.cars[0].alive = false;
    w.cars[0].fitness = 100;
    w.cars[1].alive = true;
    w.cars[1].fitness = 1;
    expect(leader(w)).toBe(w.cars[1]);
  });
});
