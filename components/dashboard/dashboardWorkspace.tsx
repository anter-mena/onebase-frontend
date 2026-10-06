"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pencil, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "cn";

import { setMonthlyTarget } from "@/app/(private)/dashboard/actions";
import { RangeFilter } from "@/components/app-shell/rangeFilter";
import { CreditSummary } from "@/components/dashboard/creditSummary";
import { Gauge, Meter, SplitBar, StatTile } from "@/components/dashboard/figures";
import { Panel, PaymentPanel, RenewalsPanel } from "@/components/dashboard/panels";
import { RevenueChart, RevenueLegend } from "@/components/dashboard/revenueChart";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { compactMoney, money, signedPercent } from "@/lib/format";
import { changeFrom, type DashboardOverview, type RevenuePoint } from "@/lib/dashboard/types";
import { pointLabels, rangeNote } from "@/lib/seo/types";

/**
 * The dashboard, on the real payments (built 2026-10-06).
 *
 * <p><b>One period, at the top, scoping everything under it</b> — the SEO page's
 * filter, kept in the address bar so the server fetches that period. "Total" and
 * the client counts are all time; the monthly target is always this month.
 */
export function DashboardWorkspace({ data }: { data: DashboardOverview }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function choose(range: string, dates?: { from: string; to: string }) {
    const next = new URLSearchParams(params.toString());
    next.set("range", range);
    next.delete("from");
    next.delete("to");
    if (dates) {
      next.set("from", dates.from);
      next.set("to", dates.to);
    }
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const note = rangeNote(data);
  const changeNote = "vs the period before";
  const fewDays = data.points.length <= 7;
  const points: RevenuePoint[] = data.points.map((point) => ({
    ...pointLabels(data.step, point.start, fewDays),
    newRevenue: point.newRevenue,
    renewals: point.renewals,
    expenses: point.expenses,
  }));
  const totals = data.totals;
  const revenueChange = changeFrom(totals.revenue, totals.previousRevenue);
  const expensesChange = changeFrom(totals.expenses, totals.previousExpenses);

  const { active, total, activeMonthAgo } = data.active;
  const activeChange = activeMonthAgo === 0 ? null : ((active - activeMonthAgo) / activeMonthAgo) * 100;
  const activeRising = (activeChange ?? 0) >= 0;
  const ActiveTrendIcon = activeRising ? TrendingUp : TrendingDown;
  const activeTrendColor = activeRising ? "var(--viz-good)" : "var(--viz-critical)";

  const brandTotal = data.brands.reduce((sum, row) => sum + row.revenue, 0);
  const brandRows = data.brands.map((row, index) => ({
    label: row.name,
    value: row.revenue,
    // Fixed slots in order, so a brand keeps its colour; past the sixth they share the grey.
    color: index < 6 ? `var(--viz-ramp-${index + 1})` : "var(--viz-ramp-rest)",
    note: row.clients === 0 ? "no clients" : `${row.clients} ${row.clients === 1 ? "client" : "clients"}`,
    logo: row.logoUrl ?? undefined,
  }));

  const monthName = new Date(`${data.target.month}T00:00:00Z`).toLocaleString("en-GB", { month: "long", timeZone: "UTC" });
  const periodQuery = new URLSearchParams(
    Object.fromEntries([["range", data.range], ...(data.range === "custom" ? [["from", data.start], ["to", data.end]] : [])]),
  ).toString();

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* ── The one filter ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Everything below covers {note}
          {totals.uncosted > 0 ? ` · ${totals.uncosted} payment${totals.uncosted === 1 ? " has" : "s have"} no plan cost on file` : ""}.
        </p>
        <RangeFilter
          value={data.range}
          start={data.start}
          end={data.end}
          onChange={(id) => choose(id)}
          onCustom={(from, to) => choose("custom", { from, to })}
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_25rem]">
        {/* ── Left ──────────────────────────────────────────────────────── */}
        <div className="flex min-w-0 flex-col gap-4">
          <section aria-label="Revenue overview" className="min-w-0 rounded-xl border bg-muted/40 p-2.5">
            <div className="grid min-w-0 gap-2.5 md:grid-cols-[minmax(0,1fr)_15rem]">
              <div className="flex min-w-0 flex-col rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Net, {note}</p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight">{money(totals.net)}</p>
                    <p className="mt-1 text-[0.65rem] text-muted-foreground">
                      {money(totals.revenue)} in, {money(totals.expenses)} out · {totals.payments} {totals.payments === 1 ? "payment" : "payments"}
                    </p>
                  </div>
                  <RevenueLegend />
                </div>
                <div className="mt-auto min-w-0 pt-4">
                  <RevenueChart points={points} rangeNote={note} />
                </div>
              </div>

              <div className="flex min-w-0 flex-col divide-y">
                {/* All time, not this period — the one total on the page the range does not move. */}
                <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-4">
                  <h2 className="text-sm font-medium">Total</h2>
                  <div className="mt-2.5">
                    <StatTile label={`All time, ${data.clientCount} clients`} value={money(data.lifetimeRevenue)} />
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-4">
                  <h2 className="text-sm font-medium">Revenue</h2>
                  <div className="mt-2.5">
                    <StatTile
                      label="New and renewing"
                      value={money(totals.revenue)}
                      change={revenueChange ?? undefined}
                      changeNote={changeNote}
                    />
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-4">
                  <h2 className="text-sm font-medium">Expenses</h2>
                  <div className="mt-2.5">
                    <StatTile
                      label="Plan costs and perks"
                      value={money(totals.expenses)}
                      change={expensesChange ?? undefined}
                      changeNote={changeNote}
                      upIsGood={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            {/* ⚠️ Not a conversion rate: Active ÷ everyone on the books, said in the note. */}
            <Panel title="Active clients" note="On a paid plan ÷ all clients on the books" className="md:row-span-2" contentClassName="mt-0.5">
              <div className="flex h-full flex-col">
                {activeChange !== null ? (
                  <p className="flex flex-wrap items-center gap-x-1.5 text-[0.65rem]">
                    <ActiveTrendIcon aria-hidden className="size-3 shrink-0" style={{ color: activeTrendColor }} />
                    <span className="font-medium" style={{ color: activeTrendColor }}>{signedPercent(activeChange)}</span>
                    <span className="text-muted-foreground">{activeRising ? "more" : "fewer"} on a paid plan than 30 days ago</span>
                  </p>
                ) : (
                  <p className="text-[0.65rem] text-muted-foreground">Nobody was on a paid plan 30 days ago.</p>
                )}
                <div className="mt-4 min-h-0 flex-1">
                  <Gauge ratio={total === 0 ? 0 : active / total} centerLabel="on a paid plan" />
                </div>
                <p className="mt-3 text-[0.65rem] leading-relaxed text-muted-foreground">
                  {active} of {total} on the books
                </p>
              </div>
            </Panel>

            <Panel title="Monthly target" note={monthName} action={<TargetEditor current={data.target.target} />}>
              <div className="flex h-full flex-col justify-end">
                {data.target.target ? (
                  <Meter
                    label="Earned so far"
                    valueLabel={money(data.target.earned)}
                    limitLabel={
                      data.target.earned >= data.target.target
                        ? `target ${compactMoney(data.target.target)} reached`
                        : `${money(data.target.target - data.target.earned)} to go · target ${compactMoney(data.target.target)}`
                    }
                    ratio={Math.min(1, data.target.earned / data.target.target)}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {money(data.target.earned)} earned this month. Set a target with the pencil to see how far along it is.
                  </p>
                )}
              </div>
            </Panel>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <Panel title="Revenue by brand" note={`${money(brandTotal)}, ${note}`}>
                <SplitBar rows={brandRows} total={brandTotal} />
              </Panel>
              <CreditSummary credit={data.credit} />
            </div>
          </div>
        </div>

        {/* ── Right ─────────────────────────────────────────────────────── */}
        <div className="flex min-w-0 flex-col gap-4">
          <PaymentPanel className="xl:min-h-[30.5rem]" methods={data.methods} periodNote={note} periodQuery={periodQuery} />
          <RenewalsPanel className="flex-1" rows={data.chase} />
        </div>
      </div>
    </div>
  );
}

/** The pencil: this month's target, saved on the server. */
function TargetEditor({ current }: { current: number | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(current ? String(current) : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const valid = /^\d+(\.\d{1,2})?$/.test(value.trim()) && Number(value) > 0;

  function save() {
    if (!valid || saving) return;
    setError(null);
    startSaving(async () => {
      const result = await setMonthlyTarget(Number(value));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (next) { setValue(current ? String(current) : ""); setError(null); } }}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Edit target"
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        }
      >
        <Pencil className="size-3" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <label htmlFor="monthly-target" className="text-xs font-medium">This month&apos;s target (USD)</label>
          <Input
            id="monthly-target"
            inputMode="decimal"
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="20000"
            aria-invalid={value !== "" && !valid}
            className="h-8 text-right text-xs tabular-nums"
          />
          {error ? <p role="alert" className="text-[0.65rem] text-destructive">{error}</p> : null}
          <Button type="submit" size="sm" disabled={!valid || saving} className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}>
            {saving ? "Saving…" : "Save target"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
