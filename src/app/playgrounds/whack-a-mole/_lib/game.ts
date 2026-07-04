// Core timing for "Whack-a-Mole". Everything here is pure so the difficulty
// ramp can be unit tested without wiring up timers or the DOM.

export const HOLES = 9;
export const GAME_SECONDS = 30;
export const GAME_MS = GAME_SECONDS * 1000;

// The round starts leisurely and winds up to frantic. Spawns come closer
// together and moles duck away sooner as the clock runs down.
export const SPAWN_START_MS = 800;
export const SPAWN_END_MS = 300;
export const LIFETIME_START_MS = 1050;
export const LIFETIME_END_MS = 500;

// Consecutive hits build a multiplier: every COMBO_STEP hits bumps it one
// step, up to MAX_MULTIPLIER. A miss resets the streak to zero.
export const COMBO_STEP = 5;
export const MAX_MULTIPLIER = 5;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// 0 at the first tick of the round, 1 by the final second.
export function progress(elapsedMs: number): number {
  return clamp01(elapsedMs / GAME_MS);
}

// Gap between mole spawns; shrinks over the round so they come thick and fast.
export function spawnInterval(elapsedMs: number): number {
  return Math.round(lerp(SPAWN_START_MS, SPAWN_END_MS, progress(elapsedMs)));
}

// How long a mole lingers before ducking back; shrinks over the round.
export function moleLifetime(elapsedMs: number): number {
  return Math.round(lerp(LIFETIME_START_MS, LIFETIME_END_MS, progress(elapsedMs)));
}

// Points a single hit is worth at the given streak length (the streak counts
// the hit being scored). Ramps one step every COMBO_STEP hits, capped.
export function multiplier(streak: number): number {
  if (streak <= 0) return 1;
  return Math.min(MAX_MULTIPLIER, 1 + Math.floor((streak - 1) / COMBO_STEP));
}

// Pick a random empty hole; returns -1 when every hole is already occupied.
export function pickHole(
  occupied: readonly boolean[],
  rand: () => number = Math.random,
): number {
  const free: number[] = [];
  for (let i = 0; i < occupied.length; i++) {
    if (!occupied[i]) free.push(i);
  }
  if (free.length === 0) return -1;
  return free[Math.floor(rand() * free.length)];
}
