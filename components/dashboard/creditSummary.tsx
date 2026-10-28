"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "cn";

import { hatch } from "@/components/dashboard/hatch";
import { CARD_FIGURE } from "@/lib/dashboard/figureStyle";
import { count } from "@/lib/format";
import type { DashboardOverview } from "@/lib/dashboard/types";

const dayFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * What is left of the panel credit, on the dashboard: the same figures as
 * Configuration → Expenses (`GET /api/credit`), so the two never disagree.
 *
 * <p>It belongs beside the revenue chart because it is the other half of the
 * same sentence: the chart is what came in, and this is what there is left to
 * sell. Running out of credit stops new lines whatever the revenue says.
 */
export function CreditSummary({ credit }: { credit: DashboardOverview["credit"] }) {
  const remaining = credit.remainingCredits;
  const used = credit.usedCredits;
  return (
    <section aria-label="Panel credit" className="flex min-w-0 flex-col rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-medium">Panel credit</h2>
        {/* Straight to the screen that can do something about it. */}
        <Link
          href="/configuration?tab=expenses"
          className="inline-flex shrink-0 items-center gap-1 text-[0.65rem] font-medium text-muted-foreground hover:text-foreground"
        >
          Top up
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      </div>
      {/* Its own line, the card's full width (decided 2026-10-06): beside the
          Top up link it was cut short. */}
      <p className="mt-0.5 text-[0.65rem] text-muted-foreground">What new lines are made from</p>

      {/* Compact since it moved to the right column, under Payment methods
          (2026-10-27): the count and what has been spent on one line, a slim bar,
          then the last top-up. It used to stack a text-3xl figure over a 28px bar. */}
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <p className="flex min-w-0 items-baseline gap-1.5">
          <span className={cn("text-2xl", CARD_FIGURE, remaining < 0 && "text-destructive")}>
            {count(remaining)}
          </span>
          <span className="truncate text-[0.65rem] text-muted-foreground">
            {remaining < 0 ? "credits below zero — top up" : "credits left"}
          </span>
        </p>
        <p className="shrink-0 text-[0.6rem] text-muted-foreground tabular-nums">
          {count(used)} of {count(credit.totalCredits)} spent
        </p>
      </div>

      {/* Hatched for what is there, flat grey for what has gone. */}
      <div className="mt-2 flex h-2.5 w-full gap-1">
        {remaining > 0 ? (
          <span
            className="h-full min-w-1.5 rounded-[4px]"
            style={{ flex: "1 1 0", flexGrow: remaining, backgroundImage: hatch("var(--viz-ramp-2)") }}
          />
        ) : null}
        {used > 0 || remaining <= 0 ? (
          <span className="h-full min-w-1.5 rounded-[4px]" style={{ flex: "1 1 0", flexGrow: Math.max(used, 1), background: "var(--viz-ramp-rest)" }} />
        ) : null}
      </div>

      {credit.lastTopup ? (
        <p className="mt-2 text-[0.6rem] text-muted-foreground">
          Last top-up {dayFormatter.format(new Date(credit.lastTopup.at))}
        </p>
      ) : null}
    </section>
  );
}
