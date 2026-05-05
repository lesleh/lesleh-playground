import { G, type Body } from "./threeBody";

export type PresetId =
  | "figure-eight"
  | "lagrange"
  | "euler"
  | "binary-planet"
  | "trisolaran"
  | "pythagorean"
  | "free-fall"
  | "bound-chaotic";

export interface PresetOption {
  id: PresetId;
  label: string;
  description: string;
}

export const PRESETS: PresetOption[] = [
  {
    id: "figure-eight",
    label: "Figure 8",
    description: "Three equal stars chase each other along a single curve.",
  },
  {
    id: "lagrange",
    label: "Equilateral",
    description: "Lagrange's solution. Three stars rotate as a rigid triangle.",
  },
  {
    id: "euler",
    label: "Collinear",
    description: "Euler's solution. Three stars rotate on a straight line.",
  },
  {
    id: "binary-planet",
    label: "Binary + Planet",
    description: "Tight binary with a distant low-mass companion.",
  },
  {
    id: "trisolaran",
    label: "Trisolaran",
    description: "Three close suns of unequal mass. Bound chaos with stable interludes.",
  },
  {
    id: "pythagorean",
    label: "Pythagorean (Burrau)",
    description: "Masses 3·4·5 at the corners of a 3·4·5 right triangle, at rest.",
  },
  {
    id: "free-fall",
    label: "Free-fall",
    description: "Three equal stars at rest in a perturbed triangle. Fall, scatter, repeat.",
  },
  {
    id: "bound-chaotic",
    label: "Bound chaos",
    description: "Random initial conditions, rejection-sampled to guarantee bound orbits.",
  },
];

export function isPresetId(value: string | undefined): value is PresetId {
  return PRESETS.some((p) => p.id === value);
}

export function buildPreset(id: PresetId): Body[] {
  switch (id) {
    case "figure-eight":
      return figureEight();
    case "lagrange":
      return lagrange();
    case "euler":
      return euler();
    case "binary-planet":
      return binaryPlanet();
    case "trisolaran":
      return trisolaran();
    case "pythagorean":
      return pythagorean();
    case "free-fall":
      return freeFall();
    case "bound-chaotic":
      return boundChaotic();
  }
}

// Chenciner & Montgomery 1993. Originally derived for G=1; with G=4π² here, velocities scale by 2π.
function figureEight(): Body[] {
  const TAU = 2 * Math.PI;
  return [
    {
      x: 0.97000436,
      y: -0.24308753,
      vx: 0.466203685 * TAU,
      vy: 0.43236573 * TAU,
      mass: 1,
    },
    {
      x: -0.97000436,
      y: 0.24308753,
      vx: 0.466203685 * TAU,
      vy: 0.43236573 * TAU,
      mass: 1,
    },
    {
      x: 0,
      y: 0,
      vx: -0.93240737 * TAU,
      vy: -0.86473146 * TAU,
      mass: 1,
    },
  ];
}

function lagrange(): Body[] {
  const L = 2;
  const r = L / Math.sqrt(3);
  const M = 1;
  const omega = Math.sqrt((3 * G * M) / (L * L * L));
  return [0, 1, 2].map((k) => {
    const a = (2 * Math.PI * k) / 3;
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);
    return { x, y, vx: -omega * y, vy: omega * x, mass: M };
  });
}

function euler(): Body[] {
  // Equal masses on a rotating line. With unit spacing 2 AU between adjacent bodies,
  // outer body feels GM/4 + GM/16 = 5GM/16 toward center; centripetal balance gives
  // ω²·2 = 5GM/16, so ω² = 5GM/32.
  const M = 1;
  const omega = Math.sqrt((5 * G * M) / 32);
  return [
    { x: -2, y: 0, vx: 0, vy: -omega * 2, mass: M },
    { x: 0, y: 0, vx: 0, vy: 0, mass: M },
    { x: 2, y: 0, vx: 0, vy: omega * 2, mass: M },
  ];
}

function binaryPlanet(): Body[] {
  // Tight binary at 1 AU separation; period 1 year. Distant 0.001 M☉ companion at 4 AU.
  const m = 0.5;
  const omegaBinary = Math.sqrt(G / 1);
  const v = omegaBinary * 0.5;
  const vp = Math.sqrt(G / 4);
  return [
    { x: -0.5, y: 0, vx: 0, vy: -v, mass: m },
    { x: 0.5, y: 0, vx: 0, vy: v, mass: m },
    { x: 4, y: 0, vx: 0, vy: vp, mass: 0.001 },
  ];
}

function trisolaran(): Body[] {
  // Three heavy suns near a Lagrange equilateral configuration but with sub-circular,
  // randomly-perturbed velocities. The deep gravitational well plus latent rotation
  // produce long-lived bounded chaos: individual KE stays small relative to binding
  // energy, so a slingshot ejection requires a deep close encounter. It always
  // eventually happens in 3-body systems, but it takes many orbital periods.
  const L = 1.6;
  const M = 1.5;
  const r = L / Math.sqrt(3);
  const omegaCircular = Math.sqrt((3 * G * M) / (L * L * L));
  const bodies: Body[] = [0, 1, 2].map((k) => {
    const a = (2 * Math.PI * k) / 3;
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);
    const omega = omegaCircular * 0.7 * (0.8 + Math.random() * 0.4);
    return { x, y, vx: -omega * y, vy: omega * x, mass: M };
  });
  zeroCOM(bodies);
  return bodies;
}

function pythagorean(): Body[] {
  // Burrau 1913. Masses 3, 4, 5 placed at the vertices of a 3-4-5 right triangle
  // such that each is opposite the corresponding edge. All starting at rest.
  return [
    { x: 1, y: 3, vx: 0, vy: 0, mass: 3 },
    { x: -2, y: -1, vx: 0, vy: 0, mass: 4 },
    { x: 1, y: -1, vx: 0, vy: 0, mass: 5 },
  ];
}

function freeFall(): Body[] {
  // Equal masses at rest in an equilateral triangle. Perfect symmetry collapses to
  // a 1D bounce, so a tiny jitter breaks symmetry and produces chaotic scattering.
  const r = 1.5;
  const jitter = 0.04;
  return [0, 1, 2].map((k) => {
    const a = (2 * Math.PI * k) / 3 + Math.PI / 2;
    return {
      x: r * Math.cos(a) + (Math.random() - 0.5) * jitter,
      y: r * Math.sin(a) + (Math.random() - 0.5) * jitter,
      vx: 0,
      vy: 0,
      mass: 1,
    };
  });
}

function boundChaotic(): Body[] {
  // Reject samples until the total energy is comfortably negative and COM momentum
  // is zeroed. Negative energy guarantees the system is bound; COM=0 keeps it on screen.
  for (let attempt = 0; attempt < 200; attempt++) {
    const bodies: Body[] = [0, 1, 2].map(() => ({
      x: (Math.random() - 0.5) * 2.4,
      y: (Math.random() - 0.5) * 2.4,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      mass: 0.6 + Math.random() * 1.6,
    }));
    zeroCOM(bodies);
    if (energy(bodies) < -10) return bodies;
  }
  // Fallback that's always bound.
  return trisolaran();
}

function zeroCOM(bodies: Body[]): void {
  let totalMass = 0;
  let px = 0;
  let py = 0;
  for (const b of bodies) {
    totalMass += b.mass;
    px += b.mass * b.vx;
    py += b.mass * b.vy;
  }
  const vcx = px / totalMass;
  const vcy = py / totalMass;
  for (const b of bodies) {
    b.vx -= vcx;
    b.vy -= vcy;
  }
}

function energy(bodies: Body[]): number {
  let ke = 0;
  for (const b of bodies) {
    ke += 0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy);
  }
  let pe = 0;
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const dx = bodies[j].x - bodies[i].x;
      const dy = bodies[j].y - bodies[i].y;
      const r = Math.sqrt(dx * dx + dy * dy + 0.05 * 0.05);
      pe -= (G * bodies[i].mass * bodies[j].mass) / r;
    }
  }
  return ke + pe;
}
