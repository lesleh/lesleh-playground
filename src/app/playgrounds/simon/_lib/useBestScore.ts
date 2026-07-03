"use client";

import { useCallback, useSyncExternalStore } from "react";

// Persisted best round for Echo. Same-tab-notify pattern: the native `storage`
// event only fires in *other* tabs, so we keep our own listener set.

const KEY = "simon-best";

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

  // Store `round` only when it beats the record. Returns true on a new best.
  const saveIfBest = useCallback((round: number): boolean => {
    if (round <= getSnapshot()) return false;
    try {
      window.localStorage.setItem(KEY, String(round));
    } catch {
      // Storage unavailable (private mode etc.); keep playing regardless.
    }
    listeners.forEach((l) => l());
    return true;
  }, []);

  return { best, saveIfBest };
}
