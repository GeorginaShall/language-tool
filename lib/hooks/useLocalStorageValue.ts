"use client";

import { useCallback, useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/**
 * Reads a localStorage string value reactively via useSyncExternalStore, so
 * updates (including from this same tab) trigger a re-render without ever
 * calling setState inside an effect. SSR always sees `defaultValue`.
 */
export function useLocalStorageValue<T extends string>(key: string, defaultValue: T): [T, (value: T) => void] {
  const getSnapshot = useCallback(() => {
    const stored = window.localStorage.getItem(key);
    return (stored as T) ?? defaultValue;
  }, [key, defaultValue]);

  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: T) => {
      window.localStorage.setItem(key, next);
      window.dispatchEvent(new StorageEvent("storage", { key }));
    },
    [key]
  );

  return [value, setValue];
}
