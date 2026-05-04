import { SpatialGrid } from "./spatialGrid";

export interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface BoidParams {
  separation: number;
  alignment: number;
  cohesion: number;
  speed: number;
}

export const DEFAULT_PARAMS: BoidParams = {
  separation: 1.5,
  alignment: 1.0,
  cohesion: 1.0,
  speed: 2.0,
};

export const VISUAL_RANGE = 75;
const SEPARATION_RANGE = 25;

export function createBoids(count: number, width: number, height: number): Boid[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
  }));
}

export function updateBoids(
  boids: Boid[],
  grid: SpatialGrid,
  params: BoidParams,
  width: number,
  height: number
): void {
  grid.clear();
  for (let i = 0; i < boids.length; i++) {
    grid.insert(i, boids[i].x, boids[i].y);
  }

  for (let i = 0; i < boids.length; i++) {
    const b = boids[i];
    const neighbors = grid.query(b.x, b.y);

    let sepX = 0, sepY = 0;
    let avgVx = 0, avgVy = 0, alignCount = 0;
    let avgX = 0, avgY = 0, cohCount = 0;

    for (const j of neighbors) {
      if (j === i) continue;
      const n = boids[j];
      const dx = b.x - n.x;
      const dy = b.y - n.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < SEPARATION_RANGE * SEPARATION_RANGE && distSq > 0) {
        const dist = Math.sqrt(distSq);
        sepX += (dx / dist) * params.separation * 0.3;
        sepY += (dy / dist) * params.separation * 0.3;
      }

      if (distSq < VISUAL_RANGE * VISUAL_RANGE) {
        avgVx += n.vx;
        avgVy += n.vy;
        alignCount++;
        avgX += n.x;
        avgY += n.y;
        cohCount++;
      }
    }

    b.vx += sepX;
    b.vy += sepY;

    if (alignCount > 0) {
      b.vx += (avgVx / alignCount - b.vx) * params.alignment * 0.05;
      b.vy += (avgVy / alignCount - b.vy) * params.alignment * 0.05;
    }

    if (cohCount > 0) {
      b.vx += (avgX / cohCount - b.x) * params.cohesion * 0.0008;
      b.vy += (avgY / cohCount - b.y) * params.cohesion * 0.0008;
    }

    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    const maxSpeed = params.speed;
    const minSpeed = maxSpeed * 0.3;

    if (speed > maxSpeed) {
      b.vx = (b.vx / speed) * maxSpeed;
      b.vy = (b.vy / speed) * maxSpeed;
    } else if (speed > 0 && speed < minSpeed) {
      b.vx = (b.vx / speed) * minSpeed;
      b.vy = (b.vy / speed) * minSpeed;
    }

    b.x = (b.x + b.vx + width) % width;
    b.y = (b.y + b.vy + height) % height;
  }
}
