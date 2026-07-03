// Retro pixel-art drawing helpers. Everything is drawn into a low internal
// resolution canvas that GameCanvas upscales with image smoothing OFF, so the
// chunky-pixel look is uniform across the crafted chicken sprite and the
// procedurally drawn bikes.

// --- Scene palette ---------------------------------------------------------

export const COLORS = {
  grass: "#3a7d34",
  grassAlt: "#347030",
  road: "#3a3a44",
  roadAlt: "#33333c",
  laneMark: "#e7d84b",
  goalGlow: "#7bd66b",
  shadow: "rgba(0,0,0,0.28)",
};

// --- Chicken sprite (pixel map) -------------------------------------------

const CHICK = {
  ".": null,
  R: "#e23b3b", // comb
  Y: "#f5a623", // beak / feet
  W: "#fdfdfd", // body
  w: "#d9dde3", // body shade
  K: "#1e1e24", // eye
} as const;

// Front-facing chicken, 11 wide x 12 tall.
const CHICKEN_MAP = [
  "....RRR....",
  "...RRRRR...",
  "....YYY....",
  "...WWWWW...",
  "..WWWWWWW..",
  "..WKWWWKW..",
  "..WWWWWWW..",
  ".WWWWWWWWW.",
  ".WWwwwwwWW.",
  "..WWWWWWW..",
  "...W...W...",
  "..YY...YY..",
];

function drawPixelMap(
  ctx: CanvasRenderingContext2D,
  map: string[],
  palette: Record<string, string | null>,
  cx: number,
  cy: number,
  size: number,
  squashY = 1,
): void {
  const cols = map[0].length;
  const rows = map.length;
  const px = size / Math.max(cols, rows);
  const w = cols * px;
  const h = rows * px * squashY;
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;
  for (let r = 0; r < rows; r++) {
    const line = map[r];
    for (let c = 0; c < cols; c++) {
      const color = palette[line[c]];
      if (!color) continue;
      ctx.fillStyle = color;
      // +1 on size closes hairline seams between pixels after upscaling.
      ctx.fillRect(
        Math.floor(x0 + c * px),
        Math.floor(y0 + r * px * squashY),
        Math.ceil(px) + 1,
        Math.ceil(px * squashY) + 1,
      );
    }
  }
}

// hopProgress: 0 = settled, 1 = just hopped. Drives a brief squash-and-stretch.
export function drawChicken(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cell: number,
  hopProgress = 0,
): void {
  const size = cell * 0.92;
  // Soft ground shadow.
  ctx.fillStyle = COLORS.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.42, size * 0.34, size * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  const squash = 1 + Math.sin(hopProgress * Math.PI) * 0.12;
  drawPixelMap(ctx, CHICKEN_MAP, CHICK, cx, cy - hopProgress * cell * 0.18, size, squash);
}

// --- Bikes (procedural, drawn chunky) --------------------------------------

export interface BikeVariant {
  frame: string;
  rider: string;
  helmet: string;
}

export const BIKE_VARIANTS: BikeVariant[] = [
  { frame: "#ff5964", rider: "#2d2d3a", helmet: "#ffd23f" },
  { frame: "#3fb0ff", rider: "#f4f4f6", helmet: "#ff5964" },
  { frame: "#8b5cf6", rider: "#111318", helmet: "#3fb0ff" },
  { frame: "#22c55e", rider: "#111318", helmet: "#ffffff" },
  { frame: "#f97316", rider: "#f4f4f6", helmet: "#111318" },
];

const TYRE = "#111318";
const SKIN = "#f0c090";
const SPOKE = "#9aa0ac";

function pixelCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

// Draws a cyclist filling roughly `cell` wide, centred at (cx, cy).
// faceRight flips the rider's lean to match travel direction.
export function drawBike(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cell: number,
  variantIndex: number,
  faceRight: boolean,
): void {
  const v = BIKE_VARIANTS[variantIndex % BIKE_VARIANTS.length];
  const s = cell / 16; // sprite unit
  const dir = faceRight ? 1 : -1;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(dir, 1);

  // Ground shadow.
  ctx.fillStyle = COLORS.shadow;
  ctx.beginPath();
  ctx.ellipse(0, 7 * s, 8 * s, 1.8 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  const wheelR = 3.4 * s;
  const backX = -5 * s;
  const frontX = 5 * s;
  const wheelY = 4 * s;

  // Wheels: black tyre, grey hub, dark centre.
  for (const wx of [backX, frontX]) {
    pixelCircle(ctx, wx, wheelY, wheelR, TYRE);
    pixelCircle(ctx, wx, wheelY, wheelR * 0.55, SPOKE);
    pixelCircle(ctx, wx, wheelY, wheelR * 0.22, TYRE);
  }

  // Frame: chunky strokes in the variant colour.
  ctx.strokeStyle = v.frame;
  ctx.lineWidth = 1.8 * s;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(backX, wheelY); // rear hub
  ctx.lineTo(0, wheelY); // bottom bracket
  ctx.lineTo(-0.5 * s, -1 * s); // seat post
  ctx.lineTo(backX, wheelY); // seat stay
  ctx.moveTo(0, wheelY);
  ctx.lineTo(3.5 * s, -1.5 * s); // down/head tube
  ctx.lineTo(frontX, wheelY); // fork
  ctx.moveTo(3.5 * s, -1.5 * s);
  ctx.lineTo(5.5 * s, -2.5 * s); // handlebar
  ctx.stroke();

  // Rider: legs, torso, head.
  ctx.strokeStyle = SKIN;
  ctx.lineWidth = 1.6 * s;
  ctx.beginPath();
  ctx.moveTo(-0.5 * s, -1 * s); // hip
  ctx.lineTo(1 * s, wheelY); // leg to pedal
  ctx.stroke();

  ctx.fillStyle = v.rider;
  ctx.beginPath();
  ctx.moveTo(-1.5 * s, -1 * s);
  ctx.lineTo(1.5 * s, -1 * s);
  ctx.lineTo(4 * s, -6 * s); // lean toward bars
  ctx.lineTo(2 * s, -6.5 * s);
  ctx.closePath();
  ctx.fill();

  // Arm to handlebar.
  ctx.strokeStyle = SKIN;
  ctx.lineWidth = 1.4 * s;
  ctx.beginPath();
  ctx.moveTo(3 * s, -6 * s);
  ctx.lineTo(5.5 * s, -2.5 * s);
  ctx.stroke();

  // Head + helmet.
  pixelCircle(ctx, 3.4 * s, -7.6 * s, 1.8 * s, SKIN);
  ctx.fillStyle = v.helmet;
  ctx.beginPath();
  ctx.arc(3.4 * s, -7.8 * s, 2 * s, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(3.4 * s, -8 * s, 2.4 * s, 1 * s); // visor

  ctx.restore();
}
