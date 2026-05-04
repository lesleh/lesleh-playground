import { createBoids, updateBoids, type Boid, type BoidParams } from "./boids";
import { SpatialGrid } from "./spatialGrid";

describe("createBoids", () => {
  it("creates the requested number of boids", () => {
    const boids = createBoids(700, 800, 600);
    expect(boids).toHaveLength(700);
  });

  it("places boids within canvas bounds", () => {
    const boids = createBoids(100, 800, 600);
    for (const b of boids) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x).toBeLessThan(800);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeLessThan(600);
    }
  });
});

describe("updateBoids — toroidal wrapping", () => {
  const noForce: BoidParams = { separation: 0, alignment: 0, cohesion: 0, speed: 5, noise: 0 };

  it("clamps a boid at the right edge", () => {
    const boid: Boid = { x: 798, y: 300, vx: 5, vy: 0 };
    const grid = new SpatialGrid(800, 600, 75);
    updateBoids([boid], grid, noForce, 800, 600);
    expect(boid.x).toBeLessThanOrEqual(799);
    expect(boid.x).toBeGreaterThanOrEqual(0);
  });

  it("clamps a boid at the left edge", () => {
    const boid: Boid = { x: 2, y: 300, vx: -5, vy: 0 };
    const grid = new SpatialGrid(800, 600, 75);
    updateBoids([boid], grid, noForce, 800, 600);
    expect(boid.x).toBeGreaterThanOrEqual(0);
    expect(boid.x).toBeLessThanOrEqual(799);
  });

  it("clamps a boid at the bottom edge", () => {
    const boid: Boid = { x: 300, y: 598, vx: 0, vy: 5 };
    const grid = new SpatialGrid(800, 600, 75);
    updateBoids([boid], grid, noForce, 800, 600);
    expect(boid.y).toBeLessThanOrEqual(599);
    expect(boid.y).toBeGreaterThanOrEqual(0);
  });
});
