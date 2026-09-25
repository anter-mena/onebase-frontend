"use client";

import { useState, type ReactNode } from "react";
import { Monitor, Smartphone, Tablet, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "cn";

// ⚠️ Borrowed from the dashboard rather than copied. `StatTile`, `SplitBar` and
// `Panel` are not about revenue — they are a figure, a part-to-whole and a
// card. If a third screen needs them they should move to a shared
// `components/figures`; two is not yet enough to justify the churn.
import { SplitBar, StatTile } from "@/components/dashboard/figures";
import { hatch } from "@/components/dashboard/hatch";
import { Panel } from "@/components/dashboard/panels";
import { CountriesMap } from "@/components/seo/countriesMap";
import { TrafficChart } from "@/components/seo/trafficChart";
import { count, percent, signedPercent } from "@/lib/format";
import {
  channelsFor,
  countriesFor,
  devicesFor,
  enginesFor,
  landingPagesFor,
  seoBrands,
  seoRanges,
  totalsFor,
  trafficFor,
  type SeoBrandId,
  type SeoRangeId,
} from "@/lib/seo/sample";

/**
 * "1m 36s" — an average engagement time.
 *
 * <p>⚠️ Deliberately not `duration` from `lib/format`. That one returns the
 * leading unit and nothing else, which is right for an uptime — nobody needs
 * "2 weeks and 4 hours" — and wrong here. 96s and 119s would both read
 * "1 minute", and the seconds are exactly where this figure moves.
 */
function engagementTime(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;

  return minutes === 0 ? `${rest}s` : `${minutes}m ${String(rest).padStart(2, "0")}s`;
}

/**
 * The SEO Overview.
 *
 * <p><b>Everything on this page comes from GA4, and that decides what is on
 * it.</b> GA4 knows what happened after the click — how much organic traffic
 * arrived, where it landed, which engine sent it, what it did next. It does not
 * know queries, impressions, click-through rate or average position; those are
 * Search Console, a separate property and a separate API. So there are no
 * ranking cards here waiting to be filled in. Adding them is a Search Console
 * integration, not a component.
 *
 * <p><b>Two controls, both at the top, scoping everything under them.</b> One
 * property at a time, because GA4 has no cross-property report and a combined
 * figure would be one this screen invented with no way to reconcile it against
 * the GA4 UI.
 *
 * <p>Client-side because both controls are preferences of the moment, and
 * nothing here is fetched yet. Same shape as the dashboard: a thin server page,
 * one client component.
 */
export function SeoWorkspace() {
  const [brand, setBrand] = useState<SeoBrandId>("nike");
  const [range, setRange] = useState<SeoRangeId>("7d");

  const activeBrand = seoBrands.find((entry) => entry.id === brand) ?? seoBrands[0];
  const activeRange = seoRanges.find((entry) => entry.id === range) ?? seoRanges[0];
  const changeNote = `vs previous ${activeRange.label.toLowerCase()}`;

  const points = trafficFor(brand, range);
  const totals = totalsFor(brand, range);
  const channels = channelsFor(brand, range);
  const engines = enginesFor(brand, range);
  const countries = countriesFor(brand, range);
  const devices = devicesFor(brand, range);
  const { rows: landingPages, tailSessions } = landingPagesFor(brand, range);

  const allSessions = channels.reduce((total, row) => total + row.sessions, 0);
  const organicShare = allSessions === 0 ? 0 : (totals.sessions / allSessions) * 100;

  const channelRows = channels.map((row, index) => ({
    label: row.channel,
    value: row.sessions,
    // Fixed slots in the order the mix is declared, so a channel keeps its
    // colour whatever the period does to the ordering. Organic is slot 1 by
    // construction — it is the channel this page is about.
    color: index < 6 ? `var(--viz-ramp-${index + 1})` : "var(--viz-ramp-rest)",
    note: `${count(row.sessions)} sessions`,
  }));

  const engineTotal = engines.reduce((total, row) => total + row.sessions, 0);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* ── The two filters ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BrandFilter value={brand} onChange={setBrand} />

        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted-foreground">
            Organic search, {activeRange.note}.
          </p>
          <RangeFilter value={range} onChange={setRange} />
        </div>
      </div>

      {/* ── Where in the world ────────────────────────────────────────────
          Cards inside a card, the same shape as the overview below: the map
          keeps the only surface of its own, and the ranked list beside it is
          a transparent block letting the parent's tint through.

          The two belong in one frame because they are one answer — the map is
          the shape of it and the list is the figures behind it. A choropleth
          is the best thing on this page for seeing where an audience is and
          the worst for comparing two numbers, so it never has to: the counts
          are all on the right. Framing them separately invited reading the
          shading as the data. */}
      <section
        aria-label="Organic sessions by country"
        className="min-w-0 rounded-xl border bg-muted/40 p-2.5"
      >
        <div className="grid min-w-0 gap-2.5 md:grid-cols-[minmax(0,1fr)_17rem]">
          {/* The heading is the map's, not the card's — the hovered country
              reads out on the same line, opposite the title, and that only
              works if one component owns both. */}
          <div className="flex min-w-0 flex-col rounded-lg border bg-card p-4">
            <CountriesMap
              rows={countries}
              title="Organic sessions by country"
              note={`${activeBrand.label} · ${activeRange.note}`}
            />
          </div>

          {/* 17rem rather than the overview's 15rem — these rows carry a
              label, a count, a bar and a percentage, where that column carries
              a figure and a delta. Same treatment, the width each needs. */}
          <div className="flex min-w-0 flex-col px-3.5 py-4">
            <h2 className="text-sm font-medium">Top countries</h2>
            <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
              Share of organic sessions
            </p>

            <div className="mt-4 min-w-0">
              <ShareList
                rows={countries.map((row) => ({
                  label: row.country,
                  value: row.sessions,
                }))}
                total={totals.sessions}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── The mix, then the plot ───────────────────────────────────────
          Channel split first and narrow, the overview card taking the rest.
          It reads in the order the question does: how much of everything is
          organic, and then what that organic did over the period. It also
          puts the two bar-shaped things side by side at different scales —
          one static split, one series — instead of stacking the split under a
          table it has nothing to do with. */}
      <div className="grid min-w-0 gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
        {/* Two cards down the narrow column, not one tall one.
            The channel split is six rows and a bar; beside a chart card this
            tall it ran out of content less than half way down and the rest was
            empty panel. Devices is the natural second answer to the same
            question — the channel mix says how they arrived, this says what
            they arrived on — and it fills that space with something worth
            reading rather than with padding. */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* ⚠️ The denominator is named in the note. "62% organic" with
              nothing to divide it by is the figure that gets quoted wrong. */}
          <Panel
            title="Traffic by channel"
            note={`${count(allSessions)} sessions from every source`}
          >
            <SplitBar rows={channelRows} total={allSessions} />
          </Panel>

          {/* `flex-1` so this one takes the column's slack and the two end
              level with the chart card beside them. */}
          <Panel
            title="Devices"
            note="Organic sessions by what they were read on"
            className="flex-1"
          >
            <DeviceSplit rows={devices} total={totals.sessions} />
          </Panel>
        </div>

        {/* Cards inside a card, the shape the dashboard's overview uses.
          These four figures were a row of separate panels above the chart,
          which made them look like four unrelated facts that happened to be
          near a plot. They are not: the headline is the chart's columns added
          up, and the other three are what those same sessions did. One outer
          card holds them, the chart keeps the only surface of its own, and the
          three beside it are transparent blocks divided by a rule — a column
          of numbers reading off the plot, not three more framed rectangles. */}
      <section
        aria-label="Organic search overview"
        // ⚠️ `flex flex-col` so the grid inside can be told to fill.
        // The section already stretched to the row — the column beside it is
        // taller — but its contents were sized to themselves, so the extra
        // height pooled as blank tint under the chart. A stretched box whose
        // child does not fill it is the usual reason a card looks short inside
        // a tall one.
        className="flex min-w-0 flex-col rounded-xl border bg-muted/40 p-2.5"
      >
        {/* `flex-1`: the grid takes the section's full height, so both of its
            items stretch — the chart card grows into the space, and the three
            figures beside it each take a third of it with their contents
            centred, which is what `Figure` is built to do. */}
        <div className="grid min-w-0 flex-1 gap-2.5 md:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="flex min-w-0 flex-col rounded-lg border bg-card p-4">
            {/* The one hero figure on the page, and it is the chart's own
                total — not a number standing beside a plot that could
                disagree with it. */}
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                Organic sessions, {activeRange.note}
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">
                {count(totals.sessions)}
              </p>
              {/* Users rides along here rather than taking a fourth slot in
                  the column. It is context for the hero — how many people the
                  sessions came from — not a figure anybody tracks on its own,
                  and three figures beside the plot is the shape that matches
                  the chart's height. */}
              <p className="mt-1 text-[0.65rem] text-muted-foreground">
                {count(totals.users)} users · {percent(organicShare, 1)} of all
                traffic
              </p>
              <Trend change={totals.sessionsChange} note={changeNote} />
            </div>

            {/* Pinned to the bottom, so the x-axis sits on the card's padding
                rather than the plot floating with dead space beneath it. */}
            <div className="mt-auto min-w-0 pt-4">
              <TrafficChart points={points} rangeNote={activeRange.note} />
            </div>
          </div>

          {/* Beside the chart on a wide card, under it on a narrow one. */}
          <div className="flex min-w-0 flex-col divide-y">
            <Figure title="Engagement rate">
              <StatTile
                label="10s+, two pages, or a key event"
                value={percent(totals.engagementRate, 1)}
                change={totals.engagementRateChange}
                changeNote={changeNote}
              />
            </Figure>

            <Figure title="Key events">
              <StatTile
                label="What GA4 renamed conversions"
                value={count(totals.keyEvents)}
                change={totals.keyEventsChange}
                changeNote={changeNote}
              />
            </Figure>

            <Figure title="Engagement time">
              <StatTile
                label="Average per session"
                value={engagementTime(totals.averageEngagementSeconds)}
                change={totals.averageEngagementSecondsChange}
                changeNote={changeNote}
              />
            </Figure>
          </div>
        </div>
        </section>
      </div>

      {/* ── Where it landed, who sent it, and what else brings traffic ───── */}
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel
          title="Landing pages"
          note="Where organic sessions started, most first"
        >
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[30rem] border-collapse text-xs">
              <thead>
                <tr className="border-b text-[0.65rem] text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 text-left font-medium">
                    Page
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Sessions
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Engagement
                  </th>
                  <th scope="col" className="py-2 pl-3 text-right font-medium">
                    Key events
                  </th>
                </tr>
              </thead>
              <tbody>
                {landingPages.map((row) => (
                  <tr key={row.path} className="border-b last:border-b-0">
                    <td className="py-2.5 pr-3">
                      {/* The path in a monospace face: these are read
                          character by character, and a proportional font makes
                          /air-max and /airmax look the same. */}
                      <span className="font-mono text-[0.7rem]">{row.path}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {count(row.sessions)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {percent(row.engagementRate, 1)}
                    </td>
                    <td className="py-2.5 pl-3 text-right tabular-nums">
                      {count(row.keyEvents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ⚠️ The tail, stated rather than dropped. Five rows with nothing
              under them read as the whole site. */}
          <p className="mt-3 text-[0.65rem] text-muted-foreground">
            {count(tailSessions)} more organic sessions landed on pages outside
            the top five.
          </p>
        </Panel>

        <Panel title="Search engines" note="Organic sessions by source">
          <ShareList
            rows={engines.map((row) => ({ label: row.source, value: row.sessions }))}
            total={engineTotal}
          />
        </Panel>
      </div>


      {/* ⚠️ Says plainly what this screen cannot show and why, so nobody spends
          an afternoon looking for the keyword card. */}
      <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
        Every figure here comes from GA4 ({activeBrand.property}). Queries,
        impressions, click-through rate and average position are not in the GA4
        API — they come from Search Console, which is a separate connection.
      </p>
    </div>
  );
}

/** GA4's three `deviceCategory` values, and what each one looks like. */
const deviceLook: Record<string, { icon: typeof Monitor; label: string }> = {
  desktop: { icon: Monitor, label: "Desktop" },
  mobile: { icon: Smartphone, label: "Phone" },
  tablet: { icon: Tablet, label: "Tablet" },
};

/**
 * How the organic sessions split across desktop, phone and tablet.
 *
 * <p>Three counts and a bar, not a pie. The question is "how many on each",
 * which is a number, and the bar underneath is there to show the proportion at
 * a glance rather than to be measured.
 *
 * <p>⚠️ Each device is named as well as iconned. A monitor and a tablet
 * outline at 12px are close enough that nobody should have to tell them apart
 * to read the figure.
 *
 * <p>GA4 calls it `mobile`; this says "Phone", because that is what it is and
 * the column beside it says "Desktop" rather than `desktop`. The API's spelling
 * stays in the sample file where the mapping will be written.
 */
function DeviceSplit({
  rows,
  total,
}: {
  rows: readonly { device: string; sessions: number }[];
  total: number;
}) {
  return (
    // ⚠️ No border and no padding of its own — this sits inside a Panel, which
    // is already the card. A second frame around it would be a card drawn
    // inside a card for no reason other than that the markup allowed it.
    <div className="min-w-0">
      <ul className="grid grid-cols-3 gap-3">
        {rows.map((row) => {
          const look = deviceLook[row.device];
          const Icon = look?.icon ?? Monitor;
          const share = total === 0 ? 0 : (row.sessions / total) * 100;

          return (
            <li key={row.device} className="min-w-0">
              <p className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
                <Icon aria-hidden className="size-3 shrink-0" />
                <span className="truncate">{look?.label ?? row.device}</span>
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums">
                {count(row.sessions)}
              </p>
              <p className="text-[0.6rem] tabular-nums text-muted-foreground">
                {percent(share, 1)}
              </p>
            </li>
          );
        })}
      </ul>

      {/* The same proportion as one bar, so the three figures above can be
          taken in as a shape as well as read.
          ⚠️ Drawn here rather than with `SplitBar`, which brings its own
          legend list — labels, counts and percentages — and that is exactly
          the row already sitting above it. The bar is the only part wanted.
          Fixed slots, so a device keeps its colour when the numbers move. */}
      <div className="mt-3 flex h-2.5 w-full gap-1">
        {rows.map((row, index) => (
          <span
            key={row.device}
            aria-hidden
            className="h-full min-w-1.5 rounded-[4px]"
            style={{
              flex: "1 1 0",
              flexGrow: row.sessions,
              backgroundImage: hatch(`var(--viz-ramp-${index + 1})`),
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * A ranked list of shares, each measured against the full width.
 *
 * <p>⚠️ Not a {@link SplitBar}. These distributions are wildly uneven — Google
 * takes nine tenths of organic, Morocco a third of the countries — and a single
 * bar cut into parts gives the tail four slivers a reader cannot tell apart or
 * compare. One bar per row, all starting from the same left edge, stays
 * readable however lopsided the data is.
 *
 * <p>Shared by the engines and the countries panels, which ask the same
 * question of different dimensions.
 */
function ShareList({
  rows,
  total,
}: {
  rows: readonly { label: string; value: number }[];
  total: number;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => {
        const share = total === 0 ? 0 : (row.value / total) * 100;

        return (
          <li key={row.label} className="min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-xs">{row.label}</span>
              <span className="shrink-0 text-xs font-medium tabular-nums">
                {count(row.value)}
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${share}%`, background: "var(--viz-ramp-2)" }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-[0.65rem] tabular-nums text-muted-foreground">
                {percent(share, 1)}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * One figure in the column beside the chart.
 *
 * <p>No fill and no border — just a rule between each, so the outer card's
 * tint shows through. Three framed rectangles beside a framed rectangle is more
 * weight than a column of numbers deserves.
 *
 * <p>`flex-1` on each, so the three divide the chart's height between them and
 * the rules land at even intervals whatever the figures happen to be.
 */
function Figure({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-4">
      <h2 className="text-sm font-medium">{title}</h2>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

/**
 * Which way the hero figure moved.
 *
 * <p>The same idiom `StatTile` uses, written out here because the hero is not
 * a StatTile — it is larger and carries its own sub-line. ⚠️ Direction is an
 * arrow and a period as well as a colour, so it survives being printed and
 * being read by somebody with a colour vision deficiency.
 *
 * <p>Renders nothing when there is no previous period to divide by, rather
 * than showing a confident 0%.
 */
function Trend({
  change,
  note,
  upIsGood = true,
}: {
  change?: number;
  note: string;
  upIsGood?: boolean;
}) {
  if (change === undefined) return null;

  const rising = change > 0;
  const good = rising === upIsGood;
  const Icon = rising ? TrendingUp : TrendingDown;
  const color = good ? "var(--viz-good)" : "var(--viz-critical)";

  return (
    <p className="mt-1.5 flex items-center gap-1 text-[0.65rem]">
      <Icon aria-hidden className="size-3 shrink-0" style={{ color }} />
      <span className="font-medium" style={{ color }}>
        {signedPercent(change)}
      </span>
      <span className="truncate text-muted-foreground">{note}</span>
    </p>
  );
}

/** The brand whose GA4 property is on screen. */
function BrandFilter({
  value,
  onChange,
}: {
  value: SeoBrandId;
  onChange: (next: SeoBrandId) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Brand"
      className="inline-flex shrink-0 rounded-lg border border-border/60 bg-muted p-0.5"
    >
      {seoBrands.map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => onChange(entry.id)}
          aria-pressed={value === entry.id}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-md border border-transparent px-2.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
            value === entry.id
              ? "border-border bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span
            aria-hidden
            className="block size-3 shrink-0 bg-current"
            style={{
              mask: `url(https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/${entry.logo}.svg) center / contain no-repeat`,
              WebkitMask: `url(https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/${entry.logo}.svg) center / contain no-repeat`,
            }}
          />
          {entry.label}
        </button>
      ))}
    </div>
  );
}

/** How far back. The same control the dashboard uses, for the same reason. */
function RangeFilter({
  value,
  onChange,
}: {
  value: SeoRangeId;
  onChange: (next: SeoRangeId) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Period"
      className="inline-flex shrink-0 rounded-lg border border-border/60 bg-muted p-0.5"
    >
      {seoRanges.map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => onChange(entry.id)}
          aria-pressed={value === entry.id}
          className={cn(
            "inline-flex h-6 items-center rounded-md border border-transparent px-2.5 text-[0.7rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
            value === entry.id
              ? "border-border bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {entry.label}
        </button>
      ))}
    </div>
  );
}
