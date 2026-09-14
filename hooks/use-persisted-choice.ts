"use client";

import { useCallback, useSyncExternalStore } from "react";

// Same event as use-persisted-boolean, so every hook reading a key updates when another one writes it.
const LOCAL_STORAGE_EVENT = "onebase:local-storage-change";

type LocalStorageChangeEvent = CustomEvent<{ key: string }>;

/**
 * One of a fixed set of string values, remembered in localStorage (for example a selected currency).
 * Anything missing or not in `choices` reads as `defaultValue`. `choices` should be a stable, module-level array.
 */
export function usePersistedChoice<T extends string>(key: string, choices: readonly T[], defaultValue: T) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const handleStorage = (event: StorageEvent) => {
        if (event.key === key) onStoreChange();
      };
      const handleLocalChange = (event: Event) => {
        if ((event as LocalStorageChangeEvent).detail.key === key) onStoreChange();
      };

      window.addEventListener("storage", handleStorage);
      window.addEventListener(LOCAL_STORAGE_EVENT, handleLocalChange);

      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(LOCAL_STORAGE_EVENT, handleLocalChange);
      };
    },
    [key],
  );

  const getSnapshot = useCallback((): T => {
    try {
      const stored = window.localStorage.getItem(key);
      return choices.find((choice) => choice === stored) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  }, [choices, defaultValue, key]);

  // The server cannot read localStorage, so it renders the default.
  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // Storage can be unavailable (private mode); the choice then only lasts until reload.
      }
      window.dispatchEvent(new CustomEvent(LOCAL_STORAGE_EVENT, { detail: { key } }));
    },
    [key],
  );

  return [value, setValue] as const;
}
