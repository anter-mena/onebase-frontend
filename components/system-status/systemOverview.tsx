"use client";

import { useState } from "react";
import { cn } from "cn";

import { LoadError } from "@/components/errors/loadError";
import { BackendPanel } from "@/components/system-status/backendPanel";
import { ContainersPanel } from "@/components/system-status/containersPanel";
import { DatabasePanel } from "@/components/system-status/databasePanel";
import { ServerPanel } from "@/components/system-status/serverPanel";
import { useSystemHealth } from "@/components/system-status/useSystemHealth";
import type { SystemHealth } from "@/lib/system/healthTypes";

/**
 * The System status overview — the LMS's System health layout in One Base's
 * theme.
 *
 * <p><b>Four tabs, one per layer.</b> Server, containers, backend and database
 * fail in different ways and are fixed in different ways; one page holding all
 * four is a wall nobody reads. The tab names are how a problem is said out loud
 * — "the database is slow". The tabs are the Dashboard's segmented control, so
 * they read as part of this app.
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

export function SystemOverview({ initial, initialError }: { initial: SystemHealth | null; initialError: string | null }) {
  const [tab, setTab] = useState<TabId>("server");
  const { current, history, error } = useSystemHealth(initial, initialError);

  // Nothing to show yet, and the backend said why.
  if (!current) {
    return <LoadError title="The system status could not be loaded." reason={error ?? "Reading the server…"} />;
  }

  return (
    <div className="flex min-h-full flex-col gap-4 lg:h-full lg:min-h-0">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Layer" className="inline-flex shrink-0 rounded-lg border border-border/60 bg-muted p-0.5">
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
                "inline-flex h-6 items-center rounded-md border border-transparent px-2.5 text-[0.7rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
                tab === entry.id ? "border-border bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>

        {/* How fresh the figures are. On a failed reading: the reason, and that what is shown is older. */}
        {error ? (
          <p role="status" className="flex min-w-0 items-center gap-1.5 text-[0.65rem] text-(--viz-critical)">
            <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
            <span className="truncate">Not updating — {error} Showing the last reading.</span>
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
            <span className="relative flex size-1.5" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-(--viz-good) opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-(--viz-good)" />
            </span>
            Live · every 5 seconds
          </p>
        )}
      </div>

      <div id="status-panel" role="tabpanel" aria-labelledby={`status-tab-${tab}`} className="min-h-0 lg:flex-1 lg:overflow-y-auto">
        {tab === "server" ? <ServerPanel health={current} history={history} online={!error} /> : null}
        {tab === "containers" ? <ContainersPanel health={current} history={history} /> : null}
        {tab === "backend" ? <BackendPanel health={current} history={history} /> : null}
        {tab === "database" ? <DatabasePanel health={current} /> : null}
      </div>
    </div>
  );
}
