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

  it("crowns a generalist from the held-out battery each generation", () => {
    const w = createWorld(config, viewport, mulberry32(30));
    expect(w.generalNet).toBeNull();
    w.cars.forEach((c) => (c.alive = false)); // end the generation this step
    stepWorld(w, config, mulberry32(31));
    expect(w.generalNet).not.toBeNull();
    expect(w.generalScore).toBeGreaterThan(0);
  });

  describe("immigrant diversity rescue", () => {
    // A world with a record in place and everyone else crashed, so each step
    // ends the generation with no new record (progress is stalled).
    const stalledWorld = (seed: number) => {
      const w = createWorld(
        { ...config, stallRounds: 3, immigrants: 4 },
        viewport,
        mulberry32(seed),
      );
      w.bestTicks = 500; // pretend a record already exists to beat
      w.cars.forEach((c) => (c.alive = false));
      return w;
    };
    const stalledConfig = { ...config, stallRounds: 3, immigrants: 4 };

    it("counts stalled generations while nothing beats the record", () => {
      const w = stalledWorld(20);
      stepWorld(w, stalledConfig, mulberry32(21));
      expect(w.stall).toBe(1);
    });

    it("injects immigrants and resets the counter once stalled long enough", () => {
      const w = stalledWorld(22);
      w.stall = stalledConfig.stallRounds - 1; // one step from the threshold
      stepWorld(w, stalledConfig, mulberry32(23));
      // Reset to 0 here only happens when the immigrant burst fires (no record
      // was set), so this confirms the injection triggered.
      expect(w.stall).toBe(0);
    });
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
