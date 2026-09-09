"use client";

import { useCallback, useSyncExternalStore } from "react";

const LOCAL_STORAGE_EVENT = "onebase:local-storage-change";
const fallbackValues = new Map<string, boolean>();

type LocalStorageChangeEvent = CustomEvent<{ key: string }>;

export function usePersistedBoolean(key: string, defaultValue: boolean) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const handleStorage = (event: StorageEvent) => {
        if (event.key === key) onStoreChange();
      };
      const handleLocalChange = (event: Event) => {
        if ((event as LocalStorageChangeEvent).detail.key === key) {
          onStoreChange();
        }
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

  const getSnapshot = useCallback(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      return storedValue === null
        ? (fallbackValues.get(key) ?? defaultValue)
        : storedValue === "true";
    } catch {
      return fallbackValues.get(key) ?? defaultValue;
    }
  }, [defaultValue, key]);

  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (nextValue: boolean | ((currentValue: boolean) => boolean)) => {
      const currentValue = getSnapshot();
      const resolvedValue =
        typeof nextValue === "function" ? nextValue(currentValue) : nextValue;

      if (resolvedValue === currentValue) return;

      try {
        window.localStorage.setItem(key, String(resolvedValue));
      } catch {
        fallbackValues.set(key, resolvedValue);
      }

      window.dispatchEvent(
        new CustomEvent(LOCAL_STORAGE_EVENT, { detail: { key } }),
      );
    },
    [getSnapshot, key],
  );

  return [value, setValue] as const;
}
