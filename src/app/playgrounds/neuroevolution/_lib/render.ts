// Canvas rendering for the simulation. Pure drawing: it reads the world and
// paints, holding no state of its own.

import { SENSOR_ANGLES } from "./car";
import type { Car } from "./car";
import { leader, type World } from "./world";

const BG = "#0d0d0d";
const ROAD = "#191920";
const WALL = "#4b5563";
const START = "#34d399";
const PACK = "rgba(56, 189, 248, 0.55)";
const LEADER = "#f7c948";
const SENSOR = "rgba(247, 201, 72, 0.28)";

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  world: World,
  showSensors: boolean,
): void {
  const { track } = world;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, track.width, track.height);

  // Road surface: outer loop with the inner loop punched out (even-odd).
  ctx.beginPath();
  traceLoop(ctx, track.outer);
  traceLoop(ctx, track.inner);
  ctx.fillStyle = ROAD;
  ctx.fill("evenodd");

  // Walls.
  ctx.lineWidth = 2;
  ctx.strokeStyle = WALL;
  ctx.beginPath();
  traceLoop(ctx, track.outer);
  ctx.stroke();
  ctx.beginPath();
  traceLoop(ctx, track.inner);
  ctx.stroke();

  // Start / finish gate.
  const g = track.gates[0];
  ctx.strokeStyle = START;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.ax, g.ay);
  ctx.lineTo(g.bx, g.by);
  ctx.stroke();

  const lead = leader(world);

  // Finished cars, parked where they crossed the line.
  ctx.fillStyle = START;
  ctx.beginPath();
  for (const c of world.cars) {
    if (c.done) traceCar(ctx, c, 8, 5, 4);
  }
  ctx.fill();

  // Pack of cars still driving, in one batched path.
  ctx.fillStyle = PACK;
  ctx.beginPath();
  for (const c of world.cars) {
    if (c.alive && !c.done && c !== lead) traceCar(ctx, c, 6, 4, 3);
  }
  ctx.fill();

  if (lead && lead.alive && !lead.done) {
    if (showSensors) drawSensors(ctx, lead);
    ctx.fillStyle = LEADER;
    ctx.beginPath();
    traceCar(ctx, lead, 9, 5, 4);
    ctx.fill();
  }
}

function traceLoop(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) {
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
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
