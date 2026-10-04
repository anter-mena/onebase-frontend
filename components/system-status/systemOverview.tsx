"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { cn } from "cn";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LoadError } from "@/components/errors/loadError";
import { BackendPanel } from "@/components/system-status/backendPanel";
import { ContainersPanel } from "@/components/system-status/containersPanel";
import { DatabasePanel } from "@/components/system-status/databasePanel";
import { ServerPanel } from "@/components/system-status/serverPanel";
import { useSystemHealth } from "@/components/system-status/useSystemHealth";
import type { SystemHealth } from "@/lib/system/healthTypes";

/**
 * The System status page — the LMS's System health layout in One Base's theme.
 *
 * <p><b>Four tabs, one per layer.</b> Server, containers, backend and database
 * fail in different ways and are fixed in different ways; one page holding all
 * four is a wall nobody reads. The tab names are how a problem is said out loud
 * — "the database is slow".
 *
 * <p><b>The tabs sit in the header</b>, on the description's line and pushed
 * right — the same place and the same segmented control as Configuration, so
 * the two pages with sections open the same way.
 *
 * <p><b>Live:</b> a new reading every five seconds (`useSystemHealth`). When a
 * reading fails, the last good one stays on screen, marked as not updating — a
 * blank page during a blip is less useful than stale numbers that say so.
 */

const tabs = [
  { id: "server", label: "Server" },
  { id: "containers", label: "Containers" },
  { id: "backend", label: "Backend" },
  { id: "database", label: "Database" },
] as const;

type TabId = (typeof tabs)[number]["id"];

/**
 * How fresh the figures are, behind an info icon at the end of the description
 * — "Live · every 5 seconds". After a failed reading the icon turns red and the
 * tooltip says why, and that the figures on screen are the last good ones.
 */
function Freshness({ error }: { error: string | null }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={error ? "Not updating" : "How fresh these figures are"}
            className={cn(
              "rounded-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              error ? "text-(--viz-critical)" : "text-muted-foreground/70 hover:text-foreground",
            )}
          />
        }
      >
        <Info className="size-3.5" aria-hidden />
      </TooltipTrigger>
      <TooltipContent className="max-w-[16rem] text-left leading-snug">
        {error ? (
          <span className="flex items-start gap-1.5">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-(--viz-critical)" aria-hidden />
            Not updating — {error} Showing the last reading.
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            {/* The pulsing green dot: live. */}
            <span className="relative flex size-1.5 shrink-0" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-(--viz-good) opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-(--viz-good)" />
            </span>
            Live · every 5 seconds
          </span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export function SystemOverview({ initial, initialError }: { initial: SystemHealth | null; initialError: string | null }) {
  const [tab, setTab] = useState<TabId>("server");
  const { current, history, error } = useSystemHealth(initial, initialError);

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <p className="text-xs font-medium text-muted-foreground">Administration</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">System status</h1>

        {/* Description on the left, tabs on the right — Configuration's row. On a phone the tabs drop to their own line. */}
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            How One Base and the server under it are doing.
            <Freshness error={current ? error : null} />
          </p>

          <div role="tablist" aria-label="System status sections" className="inline-flex max-w-full shrink-0 overflow-x-auto rounded-lg border border-border/60 bg-muted p-0.5">
            {tabs.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                id={`status-tab-${entry.id}`}
                aria-selected={tab === entry.id}
                aria-controls="status-panel"
                onClick={() => setTab(entry.id)}
                className={cn(
                  "inline-flex h-6 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-transparent px-2 text-[0.7rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
                  tab === entry.id ? "border-border bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section
        id="status-panel"
        role="tabpanel"
        aria-labelledby={`status-tab-${tab}`}
        className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background"
      >
        <div className="flex h-full flex-col overflow-y-auto p-4 [scrollbar-gutter:stable]">
          <div className="min-h-0 flex-1">
            {!current ? (
              // Nothing to show yet, and the backend said why.
              <LoadError title="The system status could not be loaded." reason={error ?? "Reading the server…"} />
            ) : tab === "server" ? (
              <ServerPanel health={current} history={history} online={!error} />
            ) : tab === "containers" ? (
              <ContainersPanel health={current} history={history} />
            ) : tab === "backend" ? (
              <BackendPanel health={current} history={history} />
            ) : (
              <DatabasePanel health={current} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
