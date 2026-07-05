// A procedural closed race track. A wavy ellipse forms the centreline; we
// offset it by half the track width to get the inner and outer walls, and drop
// ordered gates across the track for measuring progress.

import { segmentsIntersect, type Vec } from "./geometry";

interface Harmonic {
  f: number;
  a: number;
  p: number;
}

export interface Wall {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

export interface Gate extends Wall {
  index: number;
}

export interface Track {
  width: number;
  height: number;
  trackWidth: number;
  // Average spacing between gates; used to shape the fitness gradient.
  gateSpacing: number;
  centerline: Vec[];
  inner: Vec[];
  outer: Vec[];
  walls: Wall[];
  gates: Gate[];
  start: { x: number; y: number; angle: number };
}

export interface TrackConfig {
  width: number;
  height: number;
  points?: number;
}

const TAU = Math.PI * 2;

export function buildTrack(config: TrackConfig, rand: () => number): Track {
  const { width, height } = config;
  const n = config.points ?? 72;
  const cx = width / 2;
  const cy = height / 2;
  const rx = width * 0.33;
  const ry = height * 0.32;
  // A narrow road: precision matters and corners can be tighter before the
  // offset walls would fold.
  const trackWidth = Math.min(width, height) * 0.068;
  const half = trackWidth / 2;

  // Three seeded harmonics stacked on a radial function give real corners and
  // chicanes rather than a lazy oval, while a radial shape stays simple (never
  // self-intersecting). More lobes plus a narrow road make a technical circuit
  // that takes real skill (and many generations) to drive quickly.
  const base = 3 + Math.floor(rand() * 2); // 3 or 4
  const harmonics: Harmonic[] = [
    { f: base, a: 0.15 + rand() * 0.07, p: rand() * TAU },
    { f: base + 2 + Math.floor(rand() * 2), a: 0.1 + rand() * 0.06, p: rand() * TAU },
    { f: base + 4 + Math.floor(rand() * 3), a: 0.05 + rand() * 0.04, p: rand() * TAU },
  ];

  // Sharp corners can fold the offset walls over themselves. Soften the wobble
  // and rebuild until both walls are clean, so no seed yields a broken track.
  let geo = geometry(cx, cy, rx, ry, half, n, harmonics, 1);
  for (let tries = 0; tries < 8 && wallsPinch(geo.inner, geo.outer); tries++) {
    geo = geometry(cx, cy, rx, ry, half, n, harmonics, 0.8 ** (tries + 1));
  }
  const { centerline, inner, outer } = geo;

  const walls: Wall[] = [];
  const gates: Gate[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    walls.push({ ax: inner[i].x, ay: inner[i].y, bx: inner[j].x, by: inner[j].y });
    walls.push({ ax: outer[i].x, ay: outer[i].y, bx: outer[j].x, by: outer[j].y });
    gates.push({
      ax: inner[i].x,
      ay: inner[i].y,
      bx: outer[i].x,
      by: outer[i].y,
      index: i,
    });
  }

  // Start on the first gate, facing the next one.
  const startDir = Math.atan2(
    centerline[1].y - centerline[0].y,
    centerline[1].x - centerline[0].x,
  );

  let perimeter = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    perimeter += Math.hypot(
      centerline[j].x - centerline[i].x,
      centerline[j].y - centerline[i].y,
    );
  }

  return {
    width,
    height,
    trackWidth,
    gateSpacing: perimeter / n,
    centerline,
    inner,
    outer,
    walls,
    gates,
    start: { x: centerline[0].x, y: centerline[0].y, angle: startDir },
  };
}

// Centreline + offset walls at a given wobble scale (1 = full strength).
function geometry(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  half: number,
  n: number,
  harmonics: Harmonic[],
  scale: number,
): { centerline: Vec[]; inner: Vec[]; outer: Vec[] } {
  const centerline: Vec[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    let rmul = 1;
    for (const h of harmonics) rmul += h.a * scale * Math.sin(h.f * a + h.p);
    centerline.push({
      x: cx + Math.cos(a) * rx * rmul,
      y: cy + Math.sin(a) * ry * rmul,
    });
  }

  const inner: Vec[] = [];
  const outer: Vec[] = [];
  for (let i = 0; i < n; i++) {
    const prev = centerline[(i - 1 + n) % n];
    const next = centerline[(i + 1) % n];
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const tl = Math.hypot(tx, ty) || 1;
    // Normal to the tangent, flipped so it always points away from centre.
    let nx = -ty / tl;
    let ny = tx / tl;
    const rcx = centerline[i].x - cx;
    const rcy = centerline[i].y - cy;
    if (nx * rcx + ny * rcy < 0) {
      nx = -nx;
      ny = -ny;
    }
    outer.push({ x: centerline[i].x + nx * half, y: centerline[i].y + ny * half });
    inner.push({ x: centerline[i].x - nx * half, y: centerline[i].y - ny * half });
  }

  return { centerline, inner, outer };
}

// True if either wall loop crosses itself (a folded, impassable corner).
function wallsPinch(inner: Vec[], outer: Vec[]): boolean {
  return loopSelfIntersects(inner) || loopSelfIntersects(outer);
}

function loopSelfIntersects(loop: Vec[]): boolean {
  const n = loop.length;
  for (let i = 0; i < n; i++) {
    const a1 = loop[i];
    const a2 = loop[(i + 1) % n];
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // adjacent across the wrap
      const b1 = loop[j];
      const b2 = loop[(j + 1) % n];
      if (segmentsIntersect(a1.x, a1.y, a2.x, a2.y, b1.x, b1.y, b2.x, b2.y)) {
        return true;
      }
    }
  }
  return false;
}
