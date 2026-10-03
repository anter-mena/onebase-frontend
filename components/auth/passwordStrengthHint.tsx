"use client";

/*
 * Shared by "Choose a new password" and "Join One Base", so the two password
 * screens stay identical.
 */

import { cn } from "cn";

import { FieldDescription } from "@/components/ui/field";

/**
 * How strong a password looks, from 0 (too short) to 4 (strong).
 *
 * <p>Deliberately simple and only a guide: 8 characters is the one hard rule
 * (the backend refuses less); length past 12, mixed case, a digit and a symbol
 * each add a step. It never blocks the form.
 */
export function passwordStrength(password: string) {
  if (password.length < 8) return { level: 0, label: "Too short" };
  const points =
    (password.length >= 12 ? 1 : 0) +
    (/[a-z]/.test(password) && /[A-Z]/.test(password) ? 1 : 0) +
    (/\d/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
  const level = Math.min(4, points + 1);
  return { level, label: ["Too short", "Weak", "Fair", "Good", "Strong"][level] };
}

/** Red for weak, amber for fair, green for good and strong — always with the word beside it. */
const barColor = ["bg-(--viz-critical)", "bg-(--viz-critical)", "bg-amber-500", "bg-(--viz-good)", "bg-(--viz-good)"];
const wordColor = ["text-(--viz-critical)", "text-(--viz-critical)", "text-amber-600", "text-(--viz-good)", "text-(--viz-good)"];

/**
 * The line under a new-password input: "At least 8 characters." until something
 * is typed, then four bars and a word.
 *
 * <p>⚠️ One fixed height for both states. The forms are centred on the page, so
 * a line that grew when typing starts would move the whole form.
 */
export function PasswordStrengthHint({ password }: { password: string }) {
  const strength = passwordStrength(password);

  return (
    <div className="-mt-1 flex h-4 items-center" aria-live="polite">
      {password ? (
        <div className="flex w-full items-center gap-3">
          <div className="grid flex-1 grid-cols-4 gap-1" aria-hidden>
            {[1, 2, 3, 4].map((bar) => (
              <span
                key={bar}
                className={cn("h-1 rounded-full transition-colors", bar <= Math.max(strength.level, 1) ? barColor[strength.level] : "bg-muted")}
              />
            ))}
          </div>
          <span className={cn("w-14 text-right text-[0.65rem] leading-none font-medium", wordColor[strength.level])}>{strength.label}</span>
        </div>
      ) : (
        <FieldDescription className="text-[0.65rem] leading-none">At least 8 characters.</FieldDescription>
      )}
    </div>
  );
}
