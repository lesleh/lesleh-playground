"use client";

import { useCallback, useSyncExternalStore } from "react";

// Persisted high score for Fowl Play. Mirrors the same-tab-notify pattern used
// by the memory playground: the native `storage` event only fires in *other*
// tabs, so we keep our own listener set and emit on write.

const KEY = "fowl-play-best";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot(): number {
  try {
    const raw = window.localStorage.getItem(KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function useBestScore() {
  const best = useSyncExternalStore(subscribe, getSnapshot, () => 0);

  // Store `score` only when it beats the record. Returns true on a new best.
  const saveIfBest = useCallback((score: number): boolean => {
    if (score <= getSnapshot()) return false;
    try {
      window.localStorage.setItem(KEY, String(score));
    } catch {
      // Storage unavailable (private mode etc.); keep playing regardless.
    }
    listeners.forEach((l) => l());
    return true;
  }, []);

  return { best, saveIfBest };
}
