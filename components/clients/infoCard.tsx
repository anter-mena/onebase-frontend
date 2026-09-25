import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "cn";

/**
 * A card with a titled header strip — the "Rendez-vous" and "Voyage choisi"
 * cards in the reference the client profile follows.
 *
 * <p>The strip is `bg-muted`, not a colour, so it follows every palette and
 * both modes. Small caps with wide tracking, because it labels a card rather
 * than competing with what is in it.
 *
 * <p>Its own file, with no `"use client"`, because the Plan card renders on the
 * server and the Note card in the browser, and both have to look like one set.
 */
export function InfoCard({
  title,
  action,
  children,
  className,
  contentClassName,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section aria-label={title} className={cn("flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card", className)}>
      <header className="flex h-9 shrink-0 items-center justify-between gap-2 border-b bg-muted/50 px-4">
        <h3 className="text-[0.6rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{title}</h3>
        {action}
      </header>
      <div className={cn("p-4", contentClassName)}>{children}</div>
    </section>
  );
}

/** The quiet action a header strip carries — styled like the dashboard panels' links. */
export const cardActionClassName =
  "inline-flex shrink-0 items-center gap-1 text-[0.65rem] font-medium text-muted-foreground hover:text-foreground";

/** A header-strip action that goes somewhere else. */
export function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={cardActionClassName}>
      {children}
      <ArrowUpRight className="size-3" aria-hidden />
    </Link>
  );
}
