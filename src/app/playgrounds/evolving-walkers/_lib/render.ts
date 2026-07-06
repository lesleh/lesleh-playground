// Canvas rendering for the walker sim. Pure drawing: reads the world and paints,
// holding no state of its own. Bodies are real planck rigid bodies (metres,
// y-up); the camera tracks the frontier walker and converts to screen pixels.
// The leader is drawn as a solid metal robot from its oriented body boxes; the
// pack as dim silhouettes.

import { Vec2 } from "planck";
import { LIMB_HALF_W, TORSO_HALF_W, type Walker } from "./creature";
import { leader, type World } from "./world";

const BG = "#080a0e";
const GRID = "rgba(150, 180, 205, 0.05)";
const FLOOR = "rgba(150, 180, 205, 0.55)";
const FLOOR_FILL = "#0c1016";
const MARKER = "rgba(150, 180, 205, 0.35)";
const MARKER_TEXT = "rgba(226, 234, 240, 0.6)";
const CASING = "#0a0e14";
const STEEL = "#43596c";
const BEVEL = "rgba(184, 216, 236, 0.7)";
const CYAN = "#5ad3e2";
const AMBER = "#f7c948";
const GROUNDED = "#46e0ad";

const PX = 150; // pixels per metre
const MARKER_STEP_M = 1; // a distance marker every metre

interface Camera {
  camX: number;
  floorScreenY: number;
}

function toScreen(wx: number, wy: number, cam: Camera, width: number): [number, number] {
  return [(wx - cam.camX) * PX + width * 0.32, cam.floorScreenY - wy * PX];
}

export function drawWorld(ctx: CanvasRenderingContext2D, world: World, width: number, height: number): void {
  const lead = leader(world);
  const frontier = lead ? lead.maxX : 0;
  const cam: Camera = { camX: frontier, floorScreenY: height * 0.8 };

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);
  drawGrid(ctx, cam, width, height);
  drawFloor(ctx, cam, width, height);
  drawMarkers(ctx, cam, width);

  // Start line at x = 0.
  const [startSx] = toScreen(0, 0, cam, width);
  if (startSx >= -2 && startSx <= width + 2) {
    ctx.strokeStyle = "rgba(70, 224, 173, 0.5)";
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startSx, 0);
    ctx.lineTo(startSx, cam.floorScreenY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  for (const w of world.walkers) {
    if (w !== lead) drawSilhouette(ctx, w, cam, width);
  }
  if (lead) drawRobot(ctx, lead, cam, width);
}

function drawGrid(ctx: CanvasRenderingContext2D, cam: Camera, width: number, height: number): void {
  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const step = 46;
  const shift = ((cam.camX * PX) % step + step) % step;
  for (let x = -shift; x <= width; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y <= height; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
}

function drawFloor(ctx: CanvasRenderingContext2D, cam: Camera, width: number, height: number): void {
  ctx.fillStyle = FLOOR_FILL;
  ctx.fillRect(0, cam.floorScreenY, width, height - cam.floorScreenY);
  ctx.strokeStyle = FLOOR;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, cam.floorScreenY);
  ctx.lineTo(width, cam.floorScreenY);
  ctx.stroke();
}

function drawMarkers(ctx: CanvasRenderingContext2D, cam: Camera, width: number): void {
  const first = Math.ceil(cam.camX / MARKER_STEP_M) * MARKER_STEP_M;
  ctx.font = "10px var(--font-neuro-mono), monospace";
  for (let wx = first; ; wx += MARKER_STEP_M) {
    const [x] = toScreen(wx, 0, cam, width);
    if (x > width) break;
    ctx.strokeStyle = MARKER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, cam.floorScreenY);
    ctx.lineTo(x, cam.floorScreenY + 8);
    ctx.stroke();
    ctx.fillStyle = MARKER_TEXT;
    ctx.fillText(`${wx}m`, x + 3, cam.floorScreenY + 18);
  }
}

// Trace an oriented body box (half-extents hl x hw, in metres) into a path.
function traceBox(ctx: CanvasRenderingContext2D, w: Walker["torso"], hl: number, hw: number, cam: Camera, width: number): void {
  const corners: [number, number][] = [
    [hl, hw],
    [hl, -hw],
    [-hl, -hw],
    [-hl, hw],
  ];
  ctx.beginPath();
  corners.forEach(([lx, ly], i) => {
    const p = w.getWorldPoint(Vec2(lx, ly));
    const [x, y] = toScreen(p.x, p.y, cam, width);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

function fillBox(ctx: CanvasRenderingContext2D, body: Walker["torso"], hl: number, hw: number, cam: Camera, width: number): void {
  traceBox(ctx, body, hl, hw, cam, width);
  ctx.fillStyle = STEEL;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = CASING;
  ctx.stroke();
  // Bevel highlight along the top long edge.
  const a = body.getWorldPoint(Vec2(hl, hw));
  const b = body.getWorldPoint(Vec2(-hl, hw));
  const [ax, ay] = toScreen(a.x, a.y, cam, width);
  const [bx, by] = toScreen(b.x, b.y, cam, width);
  ctx.strokeStyle = BEVEL;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
}

function dot(ctx: CanvasRenderingContext2D, wx: number, wy: number, cam: Camera, width: number, r: number, fill: string, ring?: string): void {
  const [x, y] = toScreen(wx, wy, cam, width);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (ring) {
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = ring;
    ctx.stroke();
  }
}

function drawSilhouette(ctx: CanvasRenderingContext2D, w: Walker, cam: Camera, width: number): void {
  ctx.strokeStyle = "rgba(90, 120, 145, 0.24)";
  ctx.lineCap = "round";
  ctx.lineWidth = 5;
  ctx.beginPath();
  const line = (body: Walker["torso"], hl: number) => {
    const a = body.getWorldPoint(Vec2(hl, 0));
    const b = body.getWorldPoint(Vec2(-hl, 0));
    const [ax, ay] = toScreen(a.x, a.y, cam, width);
    const [bx, by] = toScreen(b.x, b.y, cam, width);
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
  };
  line(w.torso, w.torsoLen / 2);
  for (const limb of w.limbs) {
    line(limb.upper, limb.upperLen / 2);
    line(limb.lower, limb.lowerLen / 2);
  }
  ctx.stroke();
}

function drawRobot(ctx: CanvasRenderingContext2D, w: Walker, cam: Camera, width: number): void {
  ctx.save();
  ctx.shadowBlur = 14;
  ctx.shadowColor = "rgba(90, 211, 226, 0.4)";

  // Limb segments first, so joint caps and the torso sit on top.
  for (const limb of w.limbs) {
    fillBox(ctx, limb.upper, limb.upperLen / 2, LIMB_HALF_W, cam, width);
    fillBox(ctx, limb.lower, limb.lowerLen / 2, LIMB_HALF_W, cam, width);
  }

  // Torso chassis with a glowing core.
  fillBox(ctx, w.torso, w.torsoLen / 2, TORSO_HALF_W, cam, width);
  const core = w.torso.getPosition();
  ctx.save();
  ctx.shadowBlur = 8;
  ctx.shadowColor = AMBER;
  dot(ctx, core.x, core.y, cam, width, 4.5, AMBER);
  ctx.restore();

  ctx.shadowBlur = 0;

  // Feet: a boot pad at each leg's lower end, glowing when planted.
  for (const limb of w.limbs) {
    const f = limb.lower.getWorldPoint(Vec2(limb.footLocalX, 0));
    if (limb.isLeg) {
      const [fx, fy] = toScreen(f.x, f.y, cam, width);
      ctx.fillStyle = STEEL;
      ctx.strokeStyle = CASING;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(fx, fy, 9, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      dot(ctx, f.x, f.y, cam, width, 3, w.grounded[limb.index] ? GROUNDED : "#33465699");
    } else {
      dot(ctx, f.x, f.y, cam, width, 3.5, STEEL, CYAN); // hand
    }
  }

  // Joint servos at hips/shoulders and knees/elbows.
  for (const limb of w.limbs) {
    const hip = limb.hip.getAnchorA();
    const knee = limb.knee.getAnchorA();
    dot(ctx, hip.x, hip.y, cam, width, limb.isLeg ? 6 : 5, CASING, CYAN);
    dot(ctx, knee.x, knee.y, cam, width, limb.isLeg ? 5 : 4, CASING, CYAN);
  }

  drawHead(ctx, w, cam, width);
  ctx.restore();
}

function drawHead(ctx: CanvasRenderingContext2D, w: Walker, cam: Camera, width: number): void {
  const s = w.headSize;
  const centerLocalX = w.torsoLen / 2 + s * 0.5;
  const c = w.torso.getWorldPoint(Vec2(centerLocalX, 0));
  const [cx, cy] = toScreen(c.x, c.y, cam, width);
  const angle = -w.torso.getAngle(); // screen y is flipped
  const px = s * 0.5 * PX;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  roundRect(ctx, -px, -px, px * 2, px * 2, 4);
  ctx.fillStyle = "#1a232e";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#5f7688";
  ctx.stroke();
  // Antenna (points up the spine = local +x, which is +screenX after rotate).
  ctx.strokeStyle = CASING;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px, 0);
  ctx.lineTo(px + 6, 0);
  ctx.stroke();
  dot2(ctx, px + 7, 0, 2, CYAN);
  // Visor.
  ctx.save();
  ctx.shadowBlur = 6;
  ctx.shadowColor = AMBER;
  ctx.fillStyle = AMBER;
  roundRect(ctx, -px * 0.2, -px * 0.7, px * 0.5, px * 1.4, 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

function dot2(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
