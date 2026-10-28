import type { ComponentType } from "react";
import { Cpu, Gauge, HardDrive, Info, MemoryStick, Server } from "lucide-react";

import { Line, PageHeader, Pills } from "@/components/loading/pageSkeleton";
import { Panel, StatusText } from "@/components/system-status/panel";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * System status while it loads — the Server tab of systemOverview.tsx, built
 * from the real `Panel` (so the header strip, its `?` and the padding are the
 * page's own) and the same layout as serverPanel.tsx: Server and Disk on the
 * left, CPU and RAM side by side and Bandwidth on the right. Only Disk and
 * Bandwidth stretch, as on the page; the others keep their natural height.
 *
 * <p>Labels, icons and scales are the real words; only the readings are grey.
 */

/** A line of the Server panel (serverPanel.tsx `Fact`): icon and label, the value grey. */
function Fact({ icon: Icon, label, width }: { icon: ComponentType<{ className?: string }>; label: string; width: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className="underline decoration-dotted decoration-muted-foreground/50 underline-offset-4">{label}</span>
      </span>
      <Line className="text-xs" width={width} />
    </div>
  );
}

/** CPU / RAM usage (serverPanel.tsx `Usage`): the reading and its detail, then the `h-16` sparkline and its scale. */
function Usage({ title, hint }: { title: string; hint: string }) {
  return (
    <Panel title={title} hint={hint} bodyClassName="gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <Line className="text-2xl" width="w-20" />
        <Line className="text-[0.65rem]" width="w-24" />
      </div>
      <div className="flex flex-1 items-stretch gap-2">
        <Skeleton className="h-16 flex-1" />
        <div className="flex w-8 shrink-0 flex-col justify-between text-[0.6rem] text-muted-foreground tabular-nums">
          <span>100%</span>
          <span>0%</span>
        </div>
      </div>
    </Panel>
  );
}

export default function SystemStatusLoading() {
  return (
    <div className="flex h-full w-full min-h-0 flex-col" role="status" aria-label="Loading">
      <PageHeader
        eyebrow="Administration"
        title="System status"
        description={
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="flex min-w-0 items-center gap-1.5">
              How One Base and the server under it are doing.
              <Info className="size-3.5 text-muted-foreground/70" aria-hidden />
            </p>
            <div aria-hidden>
              <Pills active={0} options={["Server", "Containers", "Backend", "Database"]} />
            </div>
          </div>
        }
      />

      <section className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background" aria-hidden>
        {/* It scrolls, like the real page (systemOverview.tsx): the same container and gutter. */}
        <div className="flex h-full flex-col overflow-y-auto p-4 [scrollbar-gutter:stable]">
          <div className="min-h-0 flex-1">
            <div className="grid gap-4 lg:min-h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <div className="flex flex-col gap-4">
                <Panel
                  title="Server"
                  hint="Fixed specifications, not live readings."
                  action={<StatusText tone="good">Online</StatusText>}
                  bodyClassName="gap-2.5"
                >
                  <Fact icon={Server} label="OS" width="w-28" />
                  <Fact icon={Cpu} label="CPU" width="w-14" />
                  <Fact icon={MemoryStick} label="Memory" width="w-12" />
                  <Fact icon={HardDrive} label="Storage" width="w-14" />
                  <Fact icon={Gauge} label="Load" width="w-24" />
                  <div className="mt-1 flex flex-col gap-1 border-t pt-3 text-[0.7rem] text-muted-foreground">
                    <span className="flex items-center justify-between gap-2">
                      <span className="underline decoration-dotted decoration-muted-foreground/50 underline-offset-4">Host up</span>
                      <Line className="text-[0.7rem]" width="w-12" />
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="underline decoration-dotted decoration-muted-foreground/50 underline-offset-4">Processes</span>
                      <Line className="text-[0.7rem]" width="w-8" />
                    </span>
                  </div>
                </Panel>

                <Panel
                  title="Disk"
                  hint="The whole machine. Docker volumes have no quota, so this is the only real ceiling."
                  className="lg:flex-1"
                  bodyClassName="items-center justify-center gap-3"
                >
                  {/* The ring: 160px, a 14px stroke (usageRing.tsx), with its reading in the middle. */}
                  <div className="flex size-40 flex-col items-center justify-center gap-1.5 rounded-full border-[14px] border-muted">
                    <Line className="text-2xl" width="w-16" />
                    <Line className="text-[0.6rem]" width="w-20" />
                  </div>
                  <Line className="text-center text-[0.65rem]" width="w-20" />
                </Panel>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Usage title="CPU usage" hint="Busy share across all cores." />
                  <Usage title="RAM usage" hint="(Total − Available) ÷ Total. Leaves out the file cache, which Linux counts as used." />
                </div>

                <Panel
                  title="Bandwidth"
                  hint="The machine's real network interfaces, in and out."
                  className="lg:flex-1"
                  bodyClassName="gap-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Download</span>
                    <Line className="text-xs" width="w-16" />
                  </div>
                  <Skeleton className="min-h-14 flex-1" />
                  <div className="flex items-center justify-between border-t pt-2 text-xs">
                    <span className="text-muted-foreground">Upload</span>
                    <Line className="text-xs" width="w-16" />
                  </div>
                  <Skeleton className="min-h-14 flex-1" />
                </Panel>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
