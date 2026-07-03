"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Difficulty } from "./game";

export interface Best {
  moves: number;
  time: number;
}

const key = (d: Difficulty) => `recall-best-${d}`;

// Same-tab change notifications: the native `storage` event only fires in
// other tabs, so we keep our own listener set and emit on write.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

// getSnapshot must return a stable reference between renders or React loops,
// so we memoise the parsed value against the raw string per difficulty.
const cache = new Map<Difficulty, { raw: string | null; value: Best | null }>();

function getSnapshot(d: Difficulty): Best | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key(d));
  } catch {
    raw = null;
  }
  const cached = cache.get(d);
  if (!cached || cached.raw !== raw) {
    let value: Best | null = null;
    try {
      value = raw ? (JSON.parse(raw) as Best) : null;
    } catch {
      value = null;
    }
    cache.set(d, { raw, value });
  }
  return cache.get(d)!.value;
}

export function useBestScore(difficulty: Difficulty) {
  const best = useSyncExternalStore(
    subscribe,
    useCallback(() => getSnapshot(difficulty), [difficulty]),
    () => null,
  );

  // Record `score` only if it beats the stored best (fewer moves wins ties
  // broken by time). Returns true when a new record was written.
  const saveIfBest = useCallback(
    (score: Best): boolean => {
      const prev = getSnapshot(difficulty);
      const better =
        !prev ||
        score.moves < prev.moves ||
        (score.moves === prev.moves && score.time < prev.time);
      if (better) {
        try {
          window.localStorage.setItem(key(difficulty), JSON.stringify(score));
        } catch {
          // Storage unavailable (private mode etc.); keep playing regardless.
        }
        listeners.forEach((l) => l());
        return true;
      }
      return false;
    },
    [difficulty],
  );

  return { best, saveIfBest };
}
