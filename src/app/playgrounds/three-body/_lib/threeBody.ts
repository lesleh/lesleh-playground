export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
}

export interface SimParams {
  speed: number;
  trailLength: number;
  zoom: number;
}

// Solar units: AU, M☉, years. Kepler's 3rd law gives G = 4π² for these units.
export const G = 4 * Math.PI * Math.PI;

// Softening length prevents singular forces during close encounters.
// Small enough to not distort orbits at AU scale, large enough to keep integrator stable.
export const SOFTENING = 0.05;
const SOFTENING_SQ = SOFTENING * SOFTENING;

export const BASE_DT = 0.005;
export const SUBSTEPS = 8;

export const DEFAULT_PARAMS: SimParams = {
  speed: 1,
  trailLength: 800,
  zoom: 5,
};

const _ax = new Float64Array(8);
const _ay = new Float64Array(8);
const _axNew = new Float64Array(8);
const _ayNew = new Float64Array(8);

function computeAccel(bodies: Body[], ax: Float64Array, ay: Float64Array): void {
  const n = bodies.length;
  for (let i = 0; i < n; i++) {
    ax[i] = 0;
    ay[i] = 0;
  }
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = bodies[j].x - bodies[i].x;
      const dy = bodies[j].y - bodies[i].y;
      const r2 = dx * dx + dy * dy + SOFTENING_SQ;
      const invR3 = 1 / (r2 * Math.sqrt(r2));
      const fx = G * dx * invR3;
      const fy = G * dy * invR3;
      ax[i] += bodies[j].mass * fx;
      ay[i] += bodies[j].mass * fy;
      ax[j] -= bodies[i].mass * fx;
      ay[j] -= bodies[i].mass * fy;
    }
  }
}

export function step(bodies: Body[], dt: number): void {
  computeAccel(bodies, _ax, _ay);
  for (let i = 0; i < bodies.length; i++) {
    bodies[i].x += bodies[i].vx * dt + 0.5 * _ax[i] * dt * dt;
    bodies[i].y += bodies[i].vy * dt + 0.5 * _ay[i] * dt * dt;
  }
  computeAccel(bodies, _axNew, _ayNew);
  for (let i = 0; i < bodies.length; i++) {
    bodies[i].vx += 0.5 * (_ax[i] + _axNew[i]) * dt;
    bodies[i].vy += 0.5 * (_ay[i] + _ayNew[i]) * dt;
  }
}

export interface EnergyReadout {
  ke: number;
  pe: number;
  total: number;
}

export function totalEnergy(bodies: Body[]): EnergyReadout {
  let ke = 0;
  for (const b of bodies) {
    ke += 0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy);
  }
  let pe = 0;
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const dx = bodies[j].x - bodies[i].x;
      const dy = bodies[j].y - bodies[i].y;
      const r = Math.sqrt(dx * dx + dy * dy + SOFTENING_SQ);
      pe -= (G * bodies[i].mass * bodies[j].mass) / r;
    }
  }
  return { ke, pe, total: ke + pe };
}

export interface MomentumReadout {
  px: number;
  py: number;
  mag: number;
}

export function totalMomentum(bodies: Body[]): MomentumReadout {
  let px = 0;
  let py = 0;
  for (const b of bodies) {
    px += b.mass * b.vx;
    py += b.mass * b.vy;
  }
  return { px, py, mag: Math.sqrt(px * px + py * py) };
}

export function angularMomentum(bodies: Body[]): number {
  let l = 0;
  for (const b of bodies) {
    l += b.mass * (b.x * b.vy - b.y * b.vx);
  }
  return l;
}

export function cloneBodies(bodies: Body[]): Body[] {
  return bodies.map((b) => ({ ...b }));
}
