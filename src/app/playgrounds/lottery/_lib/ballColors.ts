// Jewel-toned bands keyed to the number's decile — echoing the real Lotto's
// coloured balls, tuned for luminance against a midnight stage. `from` is the
// bright centre of the sphere, `to` its shaded edge, `glow` the halo it throws.
export interface BallColor {
  from: string;
  to: string;
  glow: string;
}

const BANDS: BallColor[] = [
  { from: "#8df0e4", to: "#1b9486", glow: "#41ddc8" }, // 1–9   aqua
  { from: "#ffc1d0", to: "#cf3f68", glow: "#ff6f9b" }, // 10–19 rose
  { from: "#ffe0a0", to: "#d28f1d", glow: "#ffc24d" }, // 20–29 amber
  { from: "#d3bfff", to: "#6a3bd1", glow: "#a987ff" }, // 30–39 violet
  { from: "#bdf0a6", to: "#3c9b2e", glow: "#7fe35f" }, // 40–49 verdant
  { from: "#ffae8a", to: "#cf3d27", glow: "#ff7d54" }, // 50–59 ember
];

export const INK = "#1b1208";

export function ballColor(n: number): BallColor {
  const band = Math.min(BANDS.length - 1, Math.max(0, Math.floor((n - 1) / 10)));
  return BANDS[band];
}
