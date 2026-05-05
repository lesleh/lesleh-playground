import { G, type Body } from "./threeBody";

export type PresetId =
  | "figure-eight"
  | "lagrange"
  | "euler"
  | "binary-planet"
  | "random";

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
    id: "random",
    label: "Random",
    description: "Random initial conditions. Almost always chaotic.",
  },
];

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
    case "random":
      return randomChaos();
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

function randomChaos(): Body[] {
  return [0, 1, 2].map(() => ({
    x: (Math.random() - 0.5) * 4,
    y: (Math.random() - 0.5) * 4,
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 0.5) * 4,
    mass: 0.5 + Math.random() * 1.5,
  }));
}
