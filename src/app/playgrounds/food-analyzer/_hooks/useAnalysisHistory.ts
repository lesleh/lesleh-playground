"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { FoodAnalysis } from "../types";

const STORAGE_KEY = "food-analyzer-history";
const MAX_HISTORY = 10;

export interface HistoryItem {
  id: string;
  timestamp: number;
  input: string;
  analysis: FoodAnalysis;
}

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

function emit() {
  listeners.forEach((l) => l());
}

// getSnapshot must return a stable reference between renders or React loops,
// so we memoise the parsed value against the raw string.
let cache: { raw: string | null; value: HistoryItem[] } = {
  raw: null,
  value: [],
};

// Stable empty reference for the server (and storage-unavailable) snapshot.
const EMPTY: HistoryItem[] = [];

function getSnapshot(): HistoryItem[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (cache.raw !== raw) {
    let value: HistoryItem[] = [];
    try {
      value = raw ? (JSON.parse(raw) as HistoryItem[]) : [];
    } catch {
      value = [];
    }
    cache = { raw, value };
  }
  return cache.value;
}

function write(items: HistoryItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save history:", error);
  }
  emit();
}

export function useAnalysisHistory() {
  const history = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  const addToHistory = useCallback((input: string, analysis: FoodAnalysis) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      input: input.substring(0, 100), // Truncate long inputs
      analysis,
    };
    write([newItem, ...getSnapshot()].slice(0, MAX_HISTORY));
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    write(getSnapshot().filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
    emit();
  }, []);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
