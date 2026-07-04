"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "whack-a-mole-high";

// Same-tab change notifications: the native `storage` event only fires in
// other tabs, so we keep our own listener set and emit on write.
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

// getSnapshot must return a stable reference between renders, so we memoise
// the parsed number against the raw string it came from.
let cache: { raw: string | null; value: number } = { raw: null, value: 0 };

function getSnapshot(): number {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (cache.raw !== raw) {
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    cache = { raw, value: Number.isFinite(parsed) ? parsed : 0 };
  }
  return cache.value;
}

export function useHighScore() {
  const high = useSyncExternalStore(subscribe, getSnapshot, () => 0);

  // Record `score` only when it beats the stored best. Returns true when a
  // new record was written.
  const saveIfHigh = useCallback((score: number): boolean => {
    if (score <= getSnapshot()) return false;
    try {
      window.localStorage.setItem(KEY, String(score));
    } catch {
      // Storage unavailable (private mode etc.); keep playing regardless.
    }
    listeners.forEach((l) => l());
    return true;
  }, []);

  return { high, saveIfHigh };
}
