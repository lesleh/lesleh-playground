// Canvas rendering for the simulation. Pure drawing: it reads the world and
// paints, holding no state of its own. Tuned to sit inside the telemetry
// console: dark asphalt, beveled kerbs, a blueprint infield, and a glowing
// additive swarm of cars trailing light.

import { SENSOR_ANGLES } from "./car";
import type { Car } from "./car";
import { leader, type World } from "./world";

const BG = "#080a0e";
const GRID = "rgba(150, 180, 205, 0.05)";
const ROAD = "#151b26";
const KERB_DARK = "#05070a";
const KERB_EDGE = "rgba(150, 180, 205, 0.5)";
const START = "#35d6a0";
const PACK = "rgba(69, 200, 216, 0.5)";
const LEADER = "#f7c948";
const DONE = "#35d6a0";
const SENSOR = "rgba(247, 201, 72, 0.22)";

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  world: World,
  showSensors: boolean,
): void {
  const { track } = world;
  const w = track.width;
  const h = track.height;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  // Road surface: outer loop with the inner loop punched out (even-odd).
  ctx.beginPath();
  traceLoop(ctx, track.outer);
  traceLoop(ctx, track.inner);
  ctx.fillStyle = ROAD;
  ctx.fill("evenodd");

  // Kerbs: a dark casing with a crisp light edge on top, for a beveled rim.
  ctx.lineJoin = "round";
  for (const loop of [track.outer, track.inner]) {
    ctx.beginPath();
    traceLoop(ctx, loop);
    ctx.lineWidth = 5;
    ctx.strokeStyle = KERB_DARK;
    ctx.stroke();
    ctx.lineWidth = 1.75;
    ctx.strokeStyle = KERB_EDGE;
    ctx.stroke();
  }

  drawStart(ctx, track.gates[0]);

  const lead = leader(world);

  // Finished cars, parked where they crossed the line.
  ctx.globalCompositeOperation = "lighter";
  for (const c of world.cars) {
    if (c.done) {
      drawTrail(ctx, c, DONE);
      fillCar(ctx, c, DONE, 8, 5, 4);
    }
  }

  // The pack still driving, blended additively so density reads as brightness.
  for (const c of world.cars) {
    if (c.alive && !c.done && c !== lead) {
      drawTrail(ctx, c, "rgba(69, 200, 216, 0.5)");
      fillCar(ctx, c, PACK, 6, 4, 3);
    }
  }
  ctx.globalCompositeOperation = "source-over";

  // Leader on top, with sensors and a warm glow.
  if (lead && lead.alive && !lead.done) {
    if (showSensors) drawSensors(ctx, lead);
    ctx.globalCompositeOperation = "lighter";
    drawTrail(ctx, lead, "rgba(247, 201, 72, 0.55)");
    ctx.globalCompositeOperation = "source-over";
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = LEADER;
    fillCar(ctx, lead, LEADER, 10, 6, 4.5);
    ctx.restore();
  }

  // Soft vignette for depth.
  const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.75);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= w; x += 45) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = 0; y <= h; y += 45) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
}

function traceLoop(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) {
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}

// Start/finish: a bright dashed gate with a small direction chevron.
function drawStart(
  ctx: CanvasRenderingContext2D,
  gate: { ax: number; ay: number; bx: number; by: number },
) {
  ctx.save();
  ctx.strokeStyle = START;
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(gate.ax, gate.ay);
  ctx.lineTo(gate.bx, gate.by);
  ctx.stroke();
  ctx.restore();
}

function fillCar(
  ctx: CanvasRenderingContext2D,
  car: Car,
  color: string,
  front: number,
  back: number,
  halfBase: number,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  traceCar(ctx, car, front, back, halfBase);
  ctx.fill();
}

function traceCar(
  ctx: CanvasRenderingContext2D,
  car: Car,
  front: number,
  back: number,
  halfBase: number,
) {
  const fx = Math.cos(car.angle);
  const fy = Math.sin(car.angle);
  const px = -fy;
  const py = fx;
  ctx.moveTo(car.x + fx * front, car.y + fy * front);
  ctx.lineTo(car.x - fx * back + px * halfBase, car.y - fy * back + py * halfBase);
  ctx.lineTo(car.x - fx * back - px * halfBase, car.y - fy * back - py * halfBase);
  ctx.closePath();
}

// A short comet tail behind the car, fading out, length scaled by speed.
function drawTrail(ctx: CanvasRenderingContext2D, car: Car, color: string) {
  const len = Math.min(car.speed * 5, 42);
  if (len < 3) return;
  const bx = car.x - Math.cos(car.angle) * len;
  const by = car.y - Math.sin(car.angle) * len;
  const grad = ctx.createLinearGradient(car.x, car.y, bx, by);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "transparent");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(car.x, car.y);
  ctx.lineTo(bx, by);
  ctx.stroke();
}

function drawSensors(ctx: CanvasRenderingContext2D, car: Car) {
  ctx.strokeStyle = SENSOR;
  ctx.fillStyle = SENSOR;
  ctx.lineWidth = 1;
  for (let s = 0; s < SENSOR_ANGLES.length; s++) {
    const a = car.angle + SENSOR_ANGLES[s];
    const d = car.sensors[s];
    const ex = car.x + Math.cos(a) * d;
    const ey = car.y + Math.sin(a) * d;
    ctx.beginPath();
    ctx.moveTo(car.x, car.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ex, ey, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
