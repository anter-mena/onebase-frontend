"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
  type TransitionStartFunction,
} from "react";
import { createPortal } from "react-dom";
import { LoaderCircle } from "lucide-react";

/**
 * The app holds still while it saves (2026-10-28). A payment, an invitation, a deleted
 * client… used to leave the rest of the app live: you could open another page, close
 * the window or click again while the server was still writing, and lose track of
 * whether it went through.
 *
 * <p>While anything holds the lock: a layer over the whole app (sidebar, header, page
 * and any open window) takes every click, the keyboard does nothing, closing or
 * reloading the tab asks first, and a small pill says what is being saved. It lifts
 * the moment the server has answered, success or error.
 *
 * <p>Outside the app (the sign-in pages) there is no provider, and nothing locks.
 */
type Hold = (label: string) => () => void;

const ActionLockContext = createContext<Hold | null>(null);

let nextId = 0;

export function ActionLockProvider({ children }: { children: ReactNode }) {
  const [holds, setHolds] = useState<{ id: number; label: string }[]>([]);
  const busy = holds.length > 0;

  const hold = useCallback<Hold>((label) => {
    const id = ++nextId;
    setHolds((current) => [...current, { id, label }]);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      setHolds((current) => current.filter((entry) => entry.id !== id));
    };
  }, []);

  useEffect(() => {
    if (!busy) return;
    // Closing or reloading the tab mid-save asks first.
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    // No key does anything meanwhile: no Tab to another link, no Enter, no Escape
    // closing the window that is saving.
    const keys = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("keydown", keys, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("keydown", keys, true);
    };
  }, [busy]);

  return (
    <ActionLockContext.Provider value={hold}>
      {children}
      {busy ? createPortal(<LockLayer label={holds[holds.length - 1].label} />, document.body) : null}
    </ActionLockContext.Provider>
  );
}

/** Above everything, open windows included; its pill in the very centre of the screen, shown only if the save takes a moment. */
function LockLayer({ label }: { label: string }) {
  return (
    <div className="action-lock fixed inset-0 z-[1000] cursor-wait" aria-busy="true">
      <div
        role="status"
        aria-live="polite"
        className="action-lock-pill absolute top-1/2 left-1/2 flex items-center gap-2 rounded-full border bg-popover px-3.5 py-2 text-xs font-medium text-popover-foreground shadow-lg"
      >
        <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
        {label}
      </div>
    </div>
  );
}

/**
 * Locks the app around a piece of work that is not a transition (a direct upload):
 * `const release = hold("Sending the email…")`, then `release()` when it is done.
 */
export function useActionLock(): Hold {
  return useContext(ActionLockContext) ?? noLock;
}

const noLock: Hold = () => () => {};

/**
 * `useTransition` that holds the app still while it runs: from the click until the
 * server has answered and the page has refreshed. Same shape as `useTransition`.
 */
export function useLockedTransition(label: string): [boolean, TransitionStartFunction] {
  const [pending, start] = useTransition();
  const hold = useActionLock();
  const release = useRef<(() => void) | null>(null);

  // Taken at the click itself, not a render later: no second click slips through.
  const startLocked = useCallback<TransitionStartFunction>(
    (work) => {
      release.current?.();
      release.current = hold(label);
      start(work);
    },
    [hold, label, start],
  );

  useEffect(() => {
    if (!pending && release.current) {
      release.current();
      release.current = null;
    }
  }, [pending]);

  // A window that closes mid-save must not leave the app locked.
  useEffect(() => () => release.current?.(), []);

  return [pending, startLocked];
}
