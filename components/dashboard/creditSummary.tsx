"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { hatch } from "@/components/dashboard/hatch";
import { count } from "@/lib/format";
import { creditBalance, creditsPerLine } from "@/lib/settings/credit";

/**
 * What is left of the panel credit, on the dashboard.
 *
 * <p>It belongs beside the revenue chart because it is the other half of the
 * same sentence: the chart is what came in, and this is what there is left to
 * sell. Running out of credit stops new lines whatever the revenue says.
 *
 * <p>⚠️ Reads `lib/settings/credit`, the same module the Configuration screen
 * does. Two screens quoting a balance from two places is how a dashboard ends
 * up disagreeing with the page somebody goes to act on it.
 *
 * <p>⚠️ No 3D coin here, deliberately. The one on Expenses costs ~150KB of
 * WebGL runtime plus the mesh; that is a fair price on a page someone opens to
 * look at credit, and a poor one on the dashboard, which should be the fastest
 * screen in the app. The figures are the point — the ornament is not.
 */

const monthlyRate = creditsPerLine[1];
const used = creditBalance.total - creditBalance.remaining;
const linesLeft = Math.floor(creditBalance.remaining / monthlyRate);

export function CreditSummary() {
  return (
    <section
      aria-label="Panel credit"
      className="flex min-w-0 flex-col rounded-lg border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">Panel credit</h2>
          <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
            What new lines are made from
          </p>
        </div>

        {/* Straight to the screen that can do something about it. */}
        <Link
          href="/configuration?tab=expenses"
          className="inline-flex shrink-0 items-center gap-1 text-[0.65rem] font-medium text-muted-foreground hover:text-foreground"
        >
          Top up
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      </div>

      <div className="mt-auto pt-4">
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {count(creditBalance.remaining)}
        </p>
        <p className="mt-1 text-[0.65rem] text-muted-foreground">
          credits left · about {linesLeft} one-month lines
        </p>

        {/* The same bar the monthly target and the expenses panel use: hatched
            for what is there, flat grey for what has gone. */}
        <div className="mt-3 flex h-7 w-full gap-1">
          <span
            className="h-full min-w-1.5 rounded-[6px]"
            style={{
              flex: "1 1 0",
              flexGrow: creditBalance.remaining,
              backgroundImage: hatch("var(--viz-ramp-2)", { line: 2.5, pitch: 9 }),
            }}
          />
          {used > 0 ? (
            <span
              className="h-full min-w-1.5 rounded-[6px]"
              style={{ flex: "1 1 0", flexGrow: used, background: "var(--viz-ramp-rest)" }}
            />
          ) : null}
        </div>

        <p className="mt-2 text-[0.6rem] text-muted-foreground">
          {count(used)} of {count(creditBalance.total)} spent since {creditBalance.at}
        </p>
      </div>
    </section>
  );
}
