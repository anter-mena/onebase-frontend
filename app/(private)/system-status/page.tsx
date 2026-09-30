import type { Metadata } from "next";
import { cn } from "cn";

import { InfoCard } from "@/components/clients/infoCard";
import { RefreshButton } from "@/components/system-status/refreshButton";
import { getBackendStatus } from "@/lib/system/status";

export const metadata: Metadata = {
  title: "System status | One Base",
};

/**
 * Is the backend up?
 *
 * <p>Rendered on the server on every visit: `apiFetch` never caches, so the
 * answer is always this moment's, and the browser only ever receives the
 * verdict — never the backend's address.
 */
export default async function SystemStatusPage() {
  const status = await getBackendStatus();
  const checkedAt = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(status.checkedAt));

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Administration</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">System status</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Whether One Base&apos;s backend is answering, checked each time this page opens.
          </p>
        </div>
        <RefreshButton />
      </header>

      <section
        className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background"
        aria-label="System status content"
      >
        <div className="h-full overflow-y-auto p-4 [scrollbar-gutter:stable]">
          <InfoCard title="Backend" action={<StatusPill online={status.online} />} className="max-w-xl">
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-xs">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">{status.online ? "Running" : "Not reachable"}</dd>

              <dt className="text-muted-foreground">Answer</dt>
              <dd className="min-w-0 truncate font-mono text-[0.7rem]">{status.detail}</dd>

              <dt className="text-muted-foreground">Response time</dt>
              <dd className="tabular-nums">{status.latencyMs} ms</dd>

              <dt className="text-muted-foreground">Connected to</dt>
              <dd>{status.target}</dd>

              <dt className="text-muted-foreground">Checked</dt>
              <dd className="tabular-nums">{checkedAt} UTC</dd>
            </dl>
          </InfoCard>
        </div>
      </section>
    </div>
  );
}

/**
 * Online / Offline, in the house pill shape.
 *
 * <p>Colour from the `--viz-good` / `--viz-critical` tokens rather than a fixed
 * shade, so it holds in every palette and in dark mode — and the word is always
 * there, so red and green are never the only signal.
 */
function StatusPill({ online }: { online: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[0.6rem] font-medium",
        online ? "bg-(--viz-good)/10 text-(--viz-good)" : "bg-(--viz-critical)/10 text-(--viz-critical)"
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {online ? "Online" : "Offline"}
    </span>
  );
}
