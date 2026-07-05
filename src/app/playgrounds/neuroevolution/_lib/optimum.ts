// Estimate the fastest lap the car physics allow on a given track, using a
// quasi-steady-state speed profile along the centre line:
//   1. Each point has a corner-speed cap (turn radius grows with speed, so a
//      tight corner caps speed at TURN_RATE x radius), widened by half the road
//      since a real line uses the track's width to open corners up.
//   2. Forward/backward passes then limit how fast the car can accelerate out
//      of and brake into each corner.
// It's an estimate: cars can shave a touch more by cutting the line tighter.

import { ACCEL, BRAKE, LAPS_TO_FINISH, MAX_SPEED, TURN_RATE } from "./car";
import type { Track } from "./track";
import type { Vec } from "./geometry";

// Radius of the circle through three points; Infinity if near-collinear.
function radius(a: Vec, b: Vec, c: Vec): number {
  const ab = Math.hypot(b.x - a.x, b.y - a.y);
  const bc = Math.hypot(c.x - b.x, c.y - b.y);
  const ca = Math.hypot(a.x - c.x, a.y - c.y);
  const area = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) / 2;
  if (area < 1e-6) return Infinity;
  return (ab * bc * ca) / (4 * area);
}

export function idealLapTicks(track: Track): number {
  const pts = track.centerline;
  const n = pts.length;
  if (n < 3) return 0;

  const ds = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    ds[i] = Math.hypot(pts[j].x - pts[i].x, pts[j].y - pts[i].y);
  }

  // Corners open up by the full road width on an ideal line (enter wide, apex,
  // exit wide), so the estimate stays an optimistic bound the cars approach.
  const widen = track.trackWidth;
  const v = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const r = radius(pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n]) + widen;
    v[i] = Math.min(MAX_SPEED, TURN_RATE * r);
  }

  // Relax accel (forward) and brake (backward) limits; a few wraps converge on
  // a closed loop. v_next^2 = v^2 + 2*a*ds is the constant-accel kinematic step.
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const reach = Math.sqrt(v[i] * v[i] + 2 * ACCEL * ds[i]);
      if (v[j] > reach) v[j] = reach;
    }
    for (let i = n - 1; i >= 0; i--) {
      const j = (i + 1) % n;
      const reach = Math.sqrt(v[j] * v[j] + 2 * BRAKE * ds[i]);
      if (v[i] > reach) v[i] = reach;
    }
  }

  let ticks = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const vAvg = (v[i] + v[j]) / 2;
    if (vAvg > 0.01) ticks += ds[i] / vAvg;
  }
  return ticks;
}

// Ideal time (ticks) for a full finishing run of LAPS_TO_FINISH laps.
export function idealRunTicks(track: Track): number {
  return idealLapTicks(track) * LAPS_TO_FINISH;
}
