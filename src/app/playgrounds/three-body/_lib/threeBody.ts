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

// Softening length prevents singular forces during close encounters. Has to be small
// enough that the published periodic orbits (Šuvakov–Dmitrašinović catalog) match their
// unsoftened shape — at 0.025 the force was still 6% off at typical close-approach
// distances, which knocked Yin-Yang off its orbit. 0.01 is essentially a no-op for orbits
// staying outside ~0.05 AU and still bounds the per-step kick at exact contact.
export const SOFTENING = 0.01;
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

// Yoshida 4th-order symplectic integrator. Error is O(dt⁴) per step (vs O(dt²) for
// Velocity Verlet) at the cost of three force evaluations per step instead of one.
// The step is x→v→x→v→x→v→x with these coefficients chosen so the leading error
// terms cancel. Critical for keeping fragile periodic orbits (Šuvakov-Dmitrašinović
// catalog) closed over many cycles.
const CBRT2 = Math.cbrt(2);
const W1 = 1 / (2 - CBRT2);
const W0 = -CBRT2 * W1;
const C1 = W1 / 2;
const C2 = (W0 + W1) / 2;
const C3 = C2;
const C4 = C1;
const D1 = W1;
const D2 = W0;
const D3 = W1;

export function step(bodies: Body[], dt: number): void {
  const n = bodies.length;
  for (let i = 0; i < n; i++) {
    bodies[i].x += C1 * bodies[i].vx * dt;
    bodies[i].y += C1 * bodies[i].vy * dt;
  }
  computeAccel(bodies, _ax, _ay);
  for (let i = 0; i < n; i++) {
    bodies[i].vx += D1 * _ax[i] * dt;
    bodies[i].vy += D1 * _ay[i] * dt;
    bodies[i].x += C2 * bodies[i].vx * dt;
    bodies[i].y += C2 * bodies[i].vy * dt;
  }
  computeAccel(bodies, _ax, _ay);
  for (let i = 0; i < n; i++) {
    bodies[i].vx += D2 * _ax[i] * dt;
    bodies[i].vy += D2 * _ay[i] * dt;
    bodies[i].x += C3 * bodies[i].vx * dt;
    bodies[i].y += C3 * bodies[i].vy * dt;
  }
  computeAccel(bodies, _ax, _ay);
  for (let i = 0; i < n; i++) {
    bodies[i].vx += D3 * _ax[i] * dt;
    bodies[i].vy += D3 * _ay[i] * dt;
    bodies[i].x += C4 * bodies[i].vx * dt;
    bodies[i].y += C4 * bodies[i].vy * dt;
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
