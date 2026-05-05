export interface StarColor {
  core: string;
  bright: string;
  mid: string;
  rim: string;
  trail: string;
  trailSolid: string;
  label: string;
}

export const STAR_COLORS: StarColor[] = [
  {
    core: "#ffffff",
    bright: "#cad7ff",
    mid: "rgba(106, 130, 212, 0.6)",
    rim: "rgba(26, 42, 85, 0)",
    trail: "rgba(202, 215, 255, 0.85)",
    trailSolid: "#cad7ff",
    label: "#cad7ff",
  },
  {
    core: "#ffffff",
    bright: "#ffe9a8",
    mid: "rgba(216, 176, 69, 0.6)",
    rim: "rgba(74, 56, 21, 0)",
    trail: "rgba(255, 233, 168, 0.85)",
    trailSolid: "#ffe9a8",
    label: "#ffe9a8",
  },
  {
    core: "#ffffff",
    bright: "#ffb37a",
    mid: "rgba(194, 94, 37, 0.6)",
    rim: "rgba(74, 26, 8, 0)",
    trail: "rgba(255, 179, 122, 0.85)",
    trailSolid: "#ffb37a",
    label: "#ffb37a",
  },
];
