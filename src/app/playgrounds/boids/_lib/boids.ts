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
  separation: 1.0,
  alignment: 1.5,
  cohesion: 1.0,
  speed: 5.0,
};

export const VISUAL_RANGE = 100;
const SEPARATION_RANGE = 25;
const TOPOLOGICAL_N = 7;

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
  // Global centre of mass — weak pull keeps the flock from fragmenting
  let globalX = 0, globalY = 0;
  for (let i = 0; i < boids.length; i++) {
    globalX += boids[i].x;
    globalY += boids[i].y;
  }
  globalX /= boids.length;
  globalY /= boids.length;

  grid.clear();
  for (let i = 0; i < boids.length; i++) {
    grid.insert(i, boids[i].x, boids[i].y);
  }

  const vr2 = VISUAL_RANGE * VISUAL_RANGE;
  const sr2 = SEPARATION_RANGE * SEPARATION_RANGE;

  for (let i = 0; i < boids.length; i++) {
    const b = boids[i];
    const candidates = grid.query(b.x, b.y);

    // Topological neighbours: respond to the TOPOLOGICAL_N nearest visible boids,
    // not all boids within a fixed radius. This is what real starlings do (Ballerini 2008).
    const visible: Array<{ j: number; distSq: number }> = [];
    for (const j of candidates) {
      if (j === i) continue;
      const n = boids[j];
      const dx = b.x - n.x, dy = b.y - n.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < vr2) visible.push({ j, distSq });
    }
    visible.sort((a, b) => a.distSq - b.distSq);
    const nearest = visible.length > TOPOLOGICAL_N ? visible.slice(0, TOPOLOGICAL_N) : visible;

    let sepX = 0, sepY = 0;
    let avgVx = 0, avgVy = 0;
    let avgX = 0, avgY = 0;

    for (const { j, distSq } of nearest) {
      const n = boids[j];
      const dx = b.x - n.x, dy = b.y - n.y;

      if (distSq < sr2 && distSq > 0) {
        const dist = Math.sqrt(distSq);
        sepX += (dx / dist) * params.separation * 0.15;
        sepY += (dy / dist) * params.separation * 0.15;
      }

      avgVx += n.vx;
      avgVy += n.vy;
      avgX += n.x;
      avgY += n.y;
    }

    const count = nearest.length;
    b.vx += sepX;
    b.vy += sepY;

    if (count > 0) {
      // Strong, fast alignment — direction changes ripple across the flock
      b.vx += (avgVx / count - b.vx) * params.alignment * 0.2;
      b.vy += (avgVy / count - b.vy) * params.alignment * 0.2;

      // Local cohesion toward nearest neighbours' centre
      b.vx += (avgX / count - b.x) * params.cohesion * 0.001;
      b.vy += (avgY / count - b.y) * params.cohesion * 0.001;
    }

    // Weak global pull keeps flock unified
    b.vx += (globalX - b.x) * 0.00008;
    b.vy += (globalY - b.y) * 0.00008;

    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    const maxSpeed = params.speed;
    const minSpeed = maxSpeed * 0.6; // birds maintain speed — don't slow down much

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
