"use client";

import { useState } from "react";
import { Pencil, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "cn";

import { CreditSummary } from "@/components/dashboard/creditSummary";
import { Gauge, Meter, SplitBar, StatTile } from "@/components/dashboard/figures";
import { Panel, PaymentPanel, RenewalsPanel } from "@/components/dashboard/panels";
import { RevenueChart, RevenueLegend } from "@/components/dashboard/revenueChart";
import { compactMoney, money, signedPercent } from "@/lib/format";
import {
  lifetimeRevenue,
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

  // Worked out from the two counts, never stored as a percentage — see the
  // note on `retention`. More people paying is good news here, unambiguously,
  // so there is no `upIsGood` question to answer.
  const activeChange =
    ((retention.active - retention.lastMonthActive) / retention.lastMonthActive) * 100;
  const activeRising = activeChange >= 0;
  const ActiveTrendIcon = activeRising ? TrendingUp : TrendingDown;
  const activeTrendColor = activeRising ? "var(--viz-good)" : "var(--viz-critical)";

  const brandTotal = revenueByBrand.reduce((total, row) => total + row.revenue, 0);
  const clientCount = revenueByBrand.reduce((total, row) => total + row.clients, 0);
  const brandRows = revenueByBrand.map((row, index) => ({
    label: row.brand,
    value: row.revenue,
    // The share ramp, not the three identity slots: this is one quantity cut
    // up, and `--viz-1..3` are hues chosen to sit beside each other in any
    // combination — a cost they should only pay where that is the job.
    //
    // Fixed slots in order, so a brand keeps its colour whatever the sort and
    // however many others there are. Past the sixth the ramp runs out and the
    // rest share the grey; six brands is already more than this bar can say.
    color: index < 6 ? `var(--viz-ramp-${index + 1})` : "var(--viz-ramp-rest)",
    note: row.clients === 0 ? "no clients" : `${row.clients} clients`,
    logo: row.logo,
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

      {/* A fixed 25rem sidebar rather than a third of the width. As a fraction
          it grew with the viewport, and the payment card inside it grew with
          it — on a wide screen the card was half again the size of the same
          card on the Payment methods screen. A sidebar has a right width; it
          does not have a right proportion. The left column takes the rest.
          25rem sits between the ~32rem the fraction was producing and the 22rem
          first tried here, which was tighter than it needed to be. */}
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_25rem]">
        {/* ── Left ──────────────────────────────────────────────────────── */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* Cards inside a card.
              They belong together — both figures are that chart summed up, and
              the hero is the difference between them — so an outer card holds
              them, inset from its edges and separated by the same gap rather
              than merged into panes divided by a rule.
              Only the chart carries a surface of its own. The three figures
              beside it have no fill and no box — just a rule between each — so
              the parent's tint shows through: they are a column of numbers
              reading off the chart, and three more framed rectangles beside a
              framed rectangle was more weight than that deserves. */}
          <section
            aria-label="Revenue overview"
            className="min-w-0 rounded-xl border bg-muted/40 p-2.5"
          >
            <div className="grid min-w-0 gap-2.5 md:grid-cols-[minmax(0,1fr)_15rem]">
            <div className="flex min-w-0 flex-col rounded-lg border bg-card p-4">
              {/* The hero on the left, the key on the right, on one line. The
                  legend used to sit under this block and above the plot, which
                  put a row of small print between the figure and the chart it
                  belongs to. */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {/* The one hero figure on the page. Net rather than revenue,
                      so it does not restate the figure beside it. */}
                  <p className="text-xs text-muted-foreground">Net, {active.note}</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight">{money(totals.net)}</p>
                  <p className="mt-1 text-[0.65rem] text-muted-foreground">
                    {money(totals.revenue)} in, {money(totals.expenses)} out
                  </p>
                </div>

                <RevenueLegend />
              </div>

              {/* Pinned to the bottom of the card.
                  The card does not set its own height — the column of figures
                  beside it does — so the leftover space has to go somewhere.
                  Under the hero it read as the chart floating, with a strip of
                  empty card below the labels; `mt-auto` spends it above the
                  plot instead, so the x-axis sits on the card's bottom padding
                  and the bars have a floor. */}
              <div className="mt-auto min-w-0 pt-4">
                <RevenueChart points={points} rangeNote={active.note} />
              </div>
            </div>

            {/* Beside the chart on a wide card, under it on a narrow one.
                Total, then Revenue, then Expenses — widest scope first, then
                the two figures that make up the period, in the order the chart
                reads them: what came in, then what went out. */}
            <div className="flex min-w-0 flex-col divide-y">
              {/* ⚠️ All time, not this period — and deliberately so. The other
                  two cards and the hero are all the selected range, so a third
                  card showing that range's net would restate the hero in
                  smaller type. This is the figure the Clients table adds up to,
                  which is the one total on the page the range does not move. */}
              <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-4">
                <h2 className="text-sm font-medium">Total</h2>
                <div className="mt-2.5">
                  <StatTile
                    label={`All time, ${clientCount} clients`}
                    value={money(lifetimeRevenue)}
                  />
                </div>
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-4">
                <h2 className="text-sm font-medium">Revenue</h2>
                <div className="mt-2.5">
                  <StatTile
                    label="New and renewing"
                    value={money(totals.revenue)}
                    change={totals.revenueChange}
                    changeNote={changeNote}
                  />
                </div>
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-4">
                <h2 className="text-sm font-medium">Expenses</h2>
                <div className="mt-2.5">
                  <StatTile
                    label="What subscriptions cost you"
                    value={money(totals.expenses)}
                    change={totals.expensesChange}
                    changeNote={changeNote}
                    // Spending more is not an improvement.
                    upIsGood={false}
                  />
                </div>
              </div>
            </div>
            </div>
          </section>

          {/* Two stacked down the left, one tall card beside them.
              The height belongs to the gauge: a ring wants to be round, and at
              half the height it was a thumbnail with a number in it. The meter
              and the brand split both have a natural size and gain nothing
              from more room, so they take a row each and line up down the left
              edge.

              The rows are auto-sized, so the tall card comes out exactly as
              tall as the two beside it plus the gap — nothing is pinned, and
              the bottoms meet on their own. Source order is the placement
              order: the gauge first, spanning both rows so it takes the left
              column outright, then the two that stack down the right. */}
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            {/* ⚠️ Not a conversion rate, and the note must not imply it is.
                A conversion rate is trials that became paid — its denominator
                is the people who started a trial. This divides by everyone on
                the books, whether they ever trialled or not, so it is the
                share of the client list currently paying. Naming the division
                in the note is the whole point: a percentage on a dashboard
                with no stated denominator is the figure that gets quoted
                wrong. A real conversion rate would need trial outcomes, which
                the sample does not carry. */}
            <Panel
              title="Active clients"
              note="Paid plans ÷ all clients on the books"
              className="md:row-span-2"
              // The trend is the second line of the description, so it takes
              // the same 2px the note takes under the title. At the default
              // 16px it read as a separate paragraph that had come loose from
              // the heading.
              contentClassName="mt-0.5"
            >
              <div className="flex h-full flex-col">
                {/* Which way it is moving, before the ring rather than after
                    it. The ring says where the figure stands today; this says
                    whether that is worth being pleased about, and it is the
                    second half of the headline, not a footnote to it.

                    ⚠️ The direction is an arrow and a sentence as well as a
                    colour, the same rule StatTile follows. And it is two
                    counts doing the arithmetic, so it cannot disagree with the
                    figure in the middle of the ring. */}
                <p className="flex flex-wrap items-center gap-x-1.5 text-[0.65rem]">
                  <ActiveTrendIcon
                    aria-hidden
                    className="size-3 shrink-0"
                    style={{ color: activeTrendColor }}
                  />
                  <span className="font-medium" style={{ color: activeTrendColor }}>
                    {signedPercent(activeChange)}
                  </span>
                  <span className="text-muted-foreground">
                    {activeRising ? "more" : "fewer"} on a paid plan than last month
                  </span>
                </p>

                {/* The break now falls here, below the description block,
                    rather than inside it.
                    `min-h-0` so the ring gives way rather than pushing the
                    lines around it out of the card on a short row. */}
                <div className="mt-4 min-h-0 flex-1">
                  <Gauge
                    ratio={retention.active / retention.total}
                    centerLabel="on a paid plan"
                  />
                </div>

                {/* The two counts the ring is made of, at the foot of the
                    card. They moved down here from the note, which now has to
                    explain the division instead — and this is the better place
                    for them anyway: the note says what the figure means, the
                    footing says what it is made of.

                    No rule above it. With one short line left down here the
                    border was drawing more attention than the line it was
                    separating; the space does that job on its own. */}
                <p className="mt-3 text-[0.65rem] leading-relaxed text-muted-foreground">
                  {retention.active} of {retention.total} on the books
                </p>
              </div>
            </Panel>

            <Panel
              title="Monthly target"
              note="September"
              action={
                // Small glyph, ordinary hit target. The icon is 12px to sit
                // level with the note rather than compete with the title, but
                // the button around it is 24px — a 12px target is not one.
                <button
                  type="button"
                  aria-label="Edit target"
                  className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Pencil className="size-3" aria-hidden />
                </button>
              }
            >
              {/* Against the bottom of the card.
                  A meter has a natural height and growing it would only
                  stretch the track, so the slack has to go somewhere. All of
                  it above puts the bar on the card's bottom edge, level with
                  the foot of the cards beside it — which reads as a baseline
                  the row shares rather than three blocks floating at three
                  different heights. */}
              <div className="flex h-full flex-col justify-end">
                <Meter
                  label="Earned so far"
                  valueLabel={money(monthlyTarget.earned)}
                  limitLabel={`${money(monthlyTarget.target - monthlyTarget.earned)} to go · target ${compactMoney(monthlyTarget.target)}`}
                  ratio={monthlyTarget.earned / monthlyTarget.target}
                />
              </div>
            </Panel>

            {/* The brand split shares its cell with the credit card.
                ⚠️ Nested inside this one cell rather than added as a third
                column on the grid above. That grid's left column is the gauge
                spanning both rows, and a third column would have narrowed it
                too — the split was asked for here, between these two, so it
                happens here.

                `sm:` rather than `md:`: this cell is already half the row above
                `md`, so waiting until then would leave the two stacked on every
                laptop and side by side only on a wide desktop. */}
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <Panel title="Revenue by brand" note={`${money(brandTotal)} all time`}>
                <SplitBar rows={brandRows} total={brandTotal} />
              </Panel>

              <CreditSummary />
            </div>
          </div>
        </div>

        {/* ── Right ─────────────────────────────────────────────────────── */}
        {/* ⚠️ "Needs chasing" here, where "Recent activity" was.
            The two were competing for the same slot and only one of them is
            worth a permanent column. Recent activity is a log — it says what
            already happened, which is reading, not work. This says who owes
            money and how much, with a way in to each one. A sidebar that is
            always on screen should hold the thing with something to do in it. */}
        {/* A floor under the payment panel; the list takes what is left.
            The panel's own content comes to about 25.5rem, and 30.5rem is a
            fifth more than that. "Needs chasing" is `flex-1`, so it gives up
            exactly what this one takes and the column still ends level with
            the left side.

            ⚠️ A floor rather than a share. `flex-1` on both was the first
            attempt and moved nothing: with `flex-basis: 0` each panel's share
            is still capped below by its own content, and this one's content
            was already more than half the column — so it sat at its natural
            height and the slack went on landing entirely in the list. A panel
            that has to be bigger than its contents has to be told a number.

            ⚠️ `xl:` only, because that is where this is a sidebar. Below it
            the panels are full width and stack, and a 30.5rem floor there
            would just open a gap under the card.

            ⚠️ What grows is the panel. The credit card inside it keeps its own
            fixed height; see the note on PaymentPanel. */}
        <div className="flex min-w-0 flex-col gap-4">
          <PaymentPanel className="xl:min-h-[30.5rem]" />
          <RenewalsPanel className="flex-1" />
        </div>
      </div>
    </div>
  );
}
