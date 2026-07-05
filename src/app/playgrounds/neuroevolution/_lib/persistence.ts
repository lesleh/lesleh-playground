// Persist the running simulation to localStorage so a refresh resumes the same
// evolved population on the same track instead of starting from scratch.

import type { Network } from "./nn";
import type { Track } from "./track";
import type { World } from "./world";

const KEY = "neuroevolution-world";
// Bump when the saved shape (track/network layout/scoring/physics) changes, to
// drop stale saves.
const VERSION = 6;

interface Saved {
  version: number;
  track: Track;
  nets: Network[];
  generation: number;
  bestEver: number;
  bestTicks: number;
  // Champions; optional so pre-existing saves still load.
  bestNet?: Network | null;
  generalScore?: number;
  generalNet?: Network | null;
  history: number[];
  timeHistory: number[];
}

export function saveWorld(world: World): void {
  try {
    const payload: Saved = {
      version: VERSION,
      track: world.track,
      nets: world.cars.map((c) => c.net),
      generation: world.generation,
      bestEver: world.bestEver,
      bestTicks: world.bestTicks,
      bestNet: world.bestNet,
      generalScore: world.generalScore,
      generalNet: world.generalNet,
      history: world.history,
      timeHistory: world.timeHistory,
    };
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // Storage full or unavailable (private mode): keep running unsaved.
  }
}

// Returns the saved state, or null if there is none / it's from an old version.
export function loadWorld(): Saved | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Saved;
    if (
      parsed.version !== VERSION ||
      !parsed.track ||
      !Array.isArray(parsed.nets) ||
      parsed.nets.length === 0
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearWorld(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
