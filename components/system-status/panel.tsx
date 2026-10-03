import type { ReactNode } from "react";
import { cn } from "cn";

import { Hint } from "@/components/system-status/hint";

/**
 * The card every block on the System status page sits in.
 *
 * <p>The LMS layout, in One Base's own card: the same shape as `InfoCard` on the
 * client profile — white card, grey title strip, small caps with wide tracking —
 * so this page reads as part of the app, not one dropped into it.
 *
 * <p>`min-h-0` so a card told to fill can also be told to shrink, and the body
 * clips, so anything inside that scrolls (the tables list) scrolls within it.
 */
export function Panel({
  title,
  hint,
  action,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  /** What this card measures and how — a "?" beside the title. */
  hint?: ReactNode;
  /** At the right of the title strip: a status, a count. */
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className={cn("flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-card", className)}>
      <header className="flex h-9 shrink-0 items-center justify-between gap-2 border-b bg-muted/50 px-4">
        <h3 className="flex min-w-0 items-center gap-1.5 text-[0.6rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          <span className="truncate">{title}</span>
          {hint ? <Hint>{hint}</Hint> : null}
        </h3>
        {action}
      </header>
      <div className={cn("flex min-h-0 flex-1 flex-col p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/** "● Online", "● healthy" — the dot and the word, never the colour alone. */
export function StatusText({ tone, children }: { tone: "good" | "warning" | "critical" | "muted"; children: ReactNode }) {
  const color = {
    good: "text-(--viz-good)",
    warning: "text-amber-600 dark:text-amber-400",
    critical: "text-(--viz-critical)",
    muted: "text-muted-foreground",
  }[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[0.65rem] font-medium", color)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}
