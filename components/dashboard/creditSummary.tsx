"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { hatch } from "@/components/dashboard/hatch";
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
    <section aria-label="Panel credit" className="flex min-w-0 flex-col rounded-lg border bg-card p-4">
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

      <div className="mt-auto pt-4">
        <p className={remaining < 0 ? "text-3xl font-semibold tracking-tight tabular-nums text-destructive" : "text-3xl font-semibold tracking-tight tabular-nums"}>
          {count(remaining)}
        </p>
        <p className="mt-1 text-[0.65rem] text-muted-foreground">
          {remaining < 0 ? "credits below zero — top up" : "credits left"}
        </p>

        {/* Hatched for what is there, flat grey for what has gone. */}
        <div className="mt-3 flex h-7 w-full gap-1">
          {remaining > 0 ? (
            <span
              className="h-full min-w-1.5 rounded-[6px]"
              style={{ flex: "1 1 0", flexGrow: remaining, backgroundImage: hatch("var(--viz-ramp-2)", { line: 2.5, pitch: 9 }) }}
            />
          ) : null}
          {used > 0 || remaining <= 0 ? (
            <span className="h-full min-w-1.5 rounded-[6px]" style={{ flex: "1 1 0", flexGrow: Math.max(used, 1), background: "var(--viz-ramp-rest)" }} />
          ) : null}
        </div>

        <p className="mt-2 text-[0.6rem] text-muted-foreground">
          {count(used)} of {count(credit.totalCredits)} spent
          {credit.lastTopup ? ` · last top-up ${dayFormatter.format(new Date(credit.lastTopup.at))}` : ""}
        </p>
      </div>
    </section>
  );
}
