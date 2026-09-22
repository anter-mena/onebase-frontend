"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "cn";

import { Gauge, Meter, SplitBar, StatTile } from "@/components/dashboard/figures";
import { ActivityPanel, Panel, PaymentPanel, RenewalsPanel } from "@/components/dashboard/panels";
import { RevenueChart } from "@/components/dashboard/revenueChart";
import { compactMoney, money } from "@/lib/format";
import {
  monthlyTarget,
  ranges,
  retention,
  revenueByBrand,
  seriesFor,
  totalsFor,
  type RangeId,
} from "@/lib/dashboard/sample";

/**
 * The dashboard.
 *
 * <p><b>One range control, at the top, scoping everything under it.</b> The
 * design this follows puts a separate period picker on each card — a 7d here, a
 * 30d there, a month name on a third — which reads as convenient and is not:
 * three cards silently showing three different periods is how a dashboard gets
 * quoted wrong in a meeting. One control, one period, every figure agreeing.
 *
 * <p>Client-side because the range is a preference of the moment rather than a
 * destination — it is not worth a URL, and nothing here is fetched. The same
 * shape as the WhatsApp workspace: a thin server page, one client component.
 */
export function DashboardWorkspace() {
  const [range, setRange] = useState<RangeId>("7d");

  const points = seriesFor(range);
  const totals = totalsFor(range);
  const active = ranges.find((entry) => entry.id === range) ?? ranges[0];
  const changeNote = `vs previous ${active.label.toLowerCase()}`;

  const brandTotal = revenueByBrand.reduce((total, row) => total + row.revenue, 0);
  const brandRows = revenueByBrand.map((row, index) => ({
    label: row.brand,
    value: row.revenue,
    // Fixed slots in order — a brand keeps its colour whatever the sort.
    color: `var(--viz-${index + 1})`,
    note: row.clients === 0 ? "no clients" : `${row.clients} clients`,
  }));

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* ── The one filter ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Everything below covers the {active.note}.
        </p>

        <div role="group" aria-label="Period" className="inline-flex shrink-0 rounded-lg border border-border/60 bg-muted p-0.5">
          {ranges.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setRange(entry.id)}
              aria-pressed={range === entry.id}
              className={cn(
                "inline-flex h-6 items-center rounded-md border border-transparent px-2.5 text-[0.7rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
                range === entry.id
                  ? "border-border bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* ── Left ──────────────────────────────────────────────────────── */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <section aria-label="Revenue" className="flex min-w-0 flex-col rounded-xl border bg-card p-4">
              {/* The one hero figure on the page. Net rather than revenue, so it
                  does not restate the tile beside it. */}
              <p className="text-xs text-muted-foreground">Net, {active.note}</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight">{money(totals.net)}</p>
              <p className="mt-1 text-[0.65rem] text-muted-foreground">
                {money(totals.revenue)} in, {money(totals.expenses)} out
              </p>

              <div className="mt-5 min-w-0">
                <RevenueChart points={points} rangeNote={active.note} />
              </div>
            </section>

            <div className="flex min-w-0 flex-col gap-4">
              <Panel title="Revenue" className="flex-1">
                <StatTile
                  label="From new and renewing clients"
                  value={money(totals.revenue)}
                  change={totals.revenueChange}
                  changeNote={changeNote}
                />
              </Panel>
              <Panel title="Expenses" className="flex-1">
                <StatTile
                  label="What the subscriptions cost you"
                  value={money(totals.expenses)}
                  change={totals.expensesChange}
                  changeNote={changeNote}
                  // Spending more is not an improvement.
                  upIsGood={false}
                />
              </Panel>
            </div>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <Panel title="Monthly target" note="September">
              <Meter
                label="Earned so far"
                valueLabel={money(monthlyTarget.earned)}
                limitLabel={`${money(monthlyTarget.target - monthlyTarget.earned)} to go · target ${compactMoney(monthlyTarget.target)}`}
                ratio={monthlyTarget.earned / monthlyTarget.target}
              />
            </Panel>

            <section aria-label="Suggestion" className="flex min-w-0 flex-col justify-between rounded-xl border bg-card p-4">
              <div className="flex items-start gap-2.5">
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "color-mix(in oklch, var(--viz-1) 14%, transparent)" }}
                >
                  <Sparkles className="size-3.5" style={{ color: "var(--viz-1)" }} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-medium">Three renewals are overdue</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Chasing them would add {money(47600)} — more than three days of
                    revenue at this week&apos;s rate.
                  </p>
                </div>
              </div>

              <Link
                href="/renewals"
                className="mt-4 inline-flex w-fit items-center gap-1.5 text-xs font-medium text-foreground underline-offset-4 hover:underline"
              >
                Open renewals
                <ArrowRight className="size-3" aria-hidden />
              </Link>
            </section>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-3">
            <Panel title="Revenue by brand" note={`${money(brandTotal)} all time`}>
              <SplitBar rows={brandRows} total={brandTotal} />
            </Panel>

            <Panel title="Active clients" note="Of everyone on the books">
              <Gauge
                ratio={retention.active / retention.total}
                caption={`${retention.active} of ${retention.total} clients are on a paid plan right now.`}
              />
            </Panel>

            <RenewalsPanel />
          </div>
        </div>

        {/* ── Right ─────────────────────────────────────────────────────── */}
        <div className="flex min-w-0 flex-col gap-4">
          <PaymentPanel />
          <ActivityPanel />
        </div>
      </div>
    </div>
  );
}
