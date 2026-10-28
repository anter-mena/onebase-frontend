import type { ReactNode } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { cn } from "cn";

import { Line, Pills, RangePills } from "@/components/loading/pageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { OTHER_CHANNEL, SEO_CHANNELS } from "@/lib/seo/channels";

/**
 * SEO Overview's content while it loads, at the real components' own sizes — each
 * read from the component it stands for:
 *
 * <ul>
 *   <li>the map: full width at 820 × 380, with its legend under it (countriesMap.tsx);</li>
 *   <li>Top countries: pinned to the map's height, as the real list is (seoWorkspace.tsx);</li>
 *   <li>the traffic chart: filling its card under a `text-3xl` total (trafficChart.tsx);</li>
 *   <li>the three figures: StatTile — label, `text-2xl` figure, change line;</li>
 *   <li>Traffic by channel: an `h-7` SplitBar and its fixed rows (lib/seo/channels);
 *       Devices: three figures and an `h-2.5` bar.</li>
 * </ul>
 *
 * <p>Then the page goes on (Landing pages, Search engines), below the fold as on
 * the real page. Used twice: by `loading.tsx`, on the way into the page, and by
 * the page itself while a new brand or period loads.
 */
export function SeoSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-4" role="status" aria-label="Loading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* The brand filter: its track, with the chosen brand's pill (logo and name are data). */}
        <div className="inline-flex shrink-0 rounded-lg border border-border/60 bg-muted p-0.5">
          <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 shadow-sm">
            <Skeleton className="size-3 rounded-sm" />
            <Line className="text-[0.7rem]" width="w-16" />
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Line className="text-xs" width="w-36" />
          {/* This month: the page's default period. */}
          <RangePills active="month" />
        </div>
      </div>

      <section className="min-w-0 rounded-xl border bg-muted/40 p-2.5">
        <div className="grid min-w-0 gap-2.5 md:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="flex min-w-0 flex-col rounded-lg border bg-card p-4">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-medium">Visitors by country</h2>
                <Line className="mt-0.5 text-[0.65rem]" width="w-32" />
              </div>
              <p className="shrink-0 text-[0.65rem] whitespace-nowrap text-muted-foreground">Hover a country</p>
            </div>
            <Skeleton className="mt-4 aspect-[820/380] w-full" />
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.6rem] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span>Fewer</span>
                <span className="flex overflow-hidden rounded-[3px]">
                  {[0, 1, 2, 3, 4].map((index) => (
                    <span key={index} className="size-2.5 bg-muted" />
                  ))}
                </span>
                <span className="inline-flex items-center gap-1">
                  More · up to <span className="inline-block h-[0.75em] w-6 animate-pulse rounded-[0.2em] bg-muted" />
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px] bg-muted" />
                <span>No sessions</span>
              </div>
            </div>
          </div>

          {/* Pinned to the map's height from md up, like the real list. */}
          <div className="relative min-w-0">
            <div className="flex min-w-0 flex-col overflow-hidden px-3.5 py-4 md:absolute md:inset-0">
              <h2 className="text-sm font-medium">Top countries</h2>
              <p className="mt-0.5 text-[0.65rem] text-muted-foreground">Every visitor, and how many came from search</p>
              <ul className="mt-4 flex min-h-0 flex-col gap-3 overflow-hidden">
                {Array.from({ length: 10 }, (_, index) => (
                  <li key={index} className="min-w-0 shrink-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <Line className="text-xs" width={index % 2 ? "w-20" : "w-24"} />
                      <Line className="shrink-0 text-xs" width="w-10" />
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 min-w-0 flex-1 rounded-full bg-muted" />
                      <Line className="w-10 shrink-0 text-right text-[0.65rem]" width="w-7" />
                    </div>
                    <Line className="mt-0.5 text-[0.6rem]" width="w-20" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Traffic by channel">
            <div className="flex h-7 w-full gap-1">
              <Skeleton className="h-full flex-[4] rounded-[6px]" />
              <Skeleton className="h-full flex-[2] rounded-[6px]" />
              <Skeleton className="h-full flex-1 rounded-[6px]" />
            </div>
            {/* The fixed rows, by name: they are the same in every period. One grid, like SplitBar's. */}
            <ul className="mt-6 grid grid-cols-[auto_minmax(0,1fr)_minmax(0,max-content)_2.5rem] items-center gap-x-2 gap-y-2.5 text-xs">
              {[...SEO_CHANNELS, OTHER_CHANNEL].map((channel) => (
                <li key={channel} className="col-span-full grid grid-cols-subgrid items-center">
                  <span className="size-2.5 rounded-[3px] bg-muted" />
                  <span className="min-w-0 truncate">{channel}</span>
                  <Line className="text-right text-[0.65rem]" width="w-14" />
                  <Line className="text-right" width="w-7" />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Devices" note="Sessions by what they were read on" className="flex-1">
            <ul className="grid grid-cols-3 gap-3">
              {[
                { label: "Desktop", Icon: Monitor },
                { label: "Phone", Icon: Smartphone },
                { label: "Tablet", Icon: Tablet },
              ].map(({ label, Icon }) => (
                <li key={label} className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
                    <Icon aria-hidden className="size-3 shrink-0" />
                    <span className="truncate">{label}</span>
                  </p>
                  <Line className="mt-1 text-base" width="w-12" />
                  <Line className="text-[0.6rem]" width="w-8" />
                </li>
              ))}
            </ul>
            <div className="mt-3 flex h-2.5 w-full gap-1">
              <Skeleton className="h-full flex-[3] rounded-[4px]" />
              <Skeleton className="h-full flex-[2] rounded-[4px]" />
              <Skeleton className="h-full flex-1 rounded-[4px]" />
            </div>
          </Panel>
        </div>

        <section className="flex min-w-0 flex-col rounded-xl border bg-muted/40 p-2.5">
          <div className="grid min-w-0 flex-1 gap-2.5 md:grid-cols-[minmax(0,1fr)_15rem]">
            <div className="flex min-w-0 flex-col rounded-lg border bg-card p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Line className="text-xs" width="w-32" />
                  <Pills active={0} options={["All", "Organic", "Direct"].map((label) => ({ label, className: "px-2.5" }))} />
                </div>
                <Line className="mt-1 text-3xl" width="w-28" />
                <Line className="mt-1 text-[0.65rem]" width="w-20" />
                <Line className="mt-1.5 text-[0.65rem]" width="w-40" />
              </div>
              {/* Fills the card's spare height, as the real chart does (at least h-44). */}
              <div className="flex min-h-0 min-w-0 flex-1 flex-col pt-4">
                <Skeleton className="min-h-44 w-full flex-1" />
              </div>
            </div>
            <div className="flex min-w-0 flex-col divide-y">
              <Figure title="Engagement rate" label="10s+, two pages, or a key event" />
              <Figure title="Key events" label="What GA4 renamed conversions" />
              <Figure title="Engagement time" label="Average per session" />
            </div>
          </div>
        </section>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel title="Landing pages" note="Where visits started, most first">
          <div className="flex flex-col">
            {Array.from({ length: 5 }, (_, index) => (
              <Line key={index} className="border-b py-2.5 text-xs last:border-b-0" width={index % 2 ? "w-1/2" : "w-2/3"} />
            ))}
          </div>
        </Panel>
        <Panel title="Search engines" note="Organic sessions by source">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Line key={index} className="text-xs" width={index % 2 ? "w-1/2" : "w-3/4"} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/** The dashboard Panel these cards use (panels.tsx): title, note, then the body under `mt-4`. */
function Panel({ title, note, className, children }: { title: string; note?: string; className?: string; children: ReactNode }) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-xl border bg-card p-4", className)}>
      <h2 className="truncate text-sm font-medium">{title}</h2>
      {note ? (
        <p className="mt-0.5 truncate text-[0.65rem] text-muted-foreground">{note}</p>
      ) : (
        <Line className="mt-0.5 text-[0.65rem]" width="w-40" />
      )}
      <div className="mt-4 min-w-0 flex-1">{children}</div>
    </section>
  );
}

/** A Figure (seoWorkspace.tsx) holding a StatTile: real title and label, the figure grey. */
function Figure({ title, label }: { title: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-4">
      <h2 className="text-sm font-medium">{title}</h2>
      <div className="mt-2.5 flex min-w-0 flex-col">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <Line className="mt-1 text-2xl" width="w-24" />
        <Line className="mt-1.5 text-[0.65rem]" width="w-36" />
      </div>
    </div>
  );
}
