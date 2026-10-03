"use client";

/*
 * The Caps Lock warning, shared by every password field: sign in, choose a new
 * password, join (and the change-password form when it is built).
 */

import { useState, type KeyboardEvent } from "react";
import { cn } from "cn";

/**
 * Whether Caps Lock is on, read from the keys typed in a field.
 *
 * <p>Browsers only reveal Caps Lock on a key event, so the warning appears as
 * soon as someone types — not the moment the field is focused. Leaving the
 * field hides it again.
 */
export function useCapsLock() {
  const [on, setOn] = useState(false);
  const read = (event: KeyboardEvent<HTMLInputElement>) => setOn(event.getModifierState("CapsLock"));
  return { on, fieldProps: { onKeyDown: read, onKeyUp: read, onBlur: () => setOn(false) } };
}

/**
 * The badge inside the field, on the right. Inside rather than under it, so it
 * never pushes the form down while someone is typing. `withToggle` leaves room
 * for the show/hide eye button.
 */
export function CapsLockBadge({ on, withToggle = false }: { on: boolean; withToggle?: boolean }) {
  if (!on) return null;
  return (
    <span
      role="status"
      className={cn(
        "pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-sm bg-amber-500/15 px-1.5 py-0.5 text-[0.6rem] font-medium text-amber-700 dark:text-amber-400",
        withToggle ? "right-9" : "right-2",
      )}
    >
      Caps Lock
    </span>
  );
}
