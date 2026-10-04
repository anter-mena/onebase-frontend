import type { ComponentType, ReactNode } from "react";
import { Cpu, Gauge, HardDrive, MemoryStick, Server } from "lucide-react";

import { HintedLabel } from "@/components/system-status/hint";
import { Panel, StatusText } from "@/components/system-status/panel";
import { Sparkline } from "@/components/system-status/sparkline";
import { UsageRing } from "@/components/system-status/usageRing";
import type { Sample } from "@/components/system-status/useSystemHealth";
import { bitsPerSecond, bytes, duration, percent } from "@/lib/format";
import type { SystemHealth } from "@/lib/system/healthTypes";

/**
 * The machine: what it is on the left (fixed specifications, how full the disk
 * is), what it is doing on the right (CPU, memory, bandwidth over the last five
 * minutes).
 */

/** One labelled fact in the Server card. */
function Fact({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <HintedLabel label={label}>{hint}</HintedLabel>
      </span>
      <span className="truncate font-medium tabular-nums">{value}</span>
    </div>
  );
}

/**
 * A graph with its current reading and the two ends of its scale — without
 * them, a flat line at 5% and one at 95% look the same.
 */
function Usage({
  title,
  hint,
  series,
  current,
  detail,
  floor,
  ceiling,
}: {
  title: string;
  hint: ReactNode;
  series: number[];
  current: string;
  detail?: string;
  floor: string;
  ceiling: string;
}) {
  return (
    <Panel title={title} hint={hint} bodyClassName="gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{current}</span>
        {detail ? <span className="text-[0.65rem] text-muted-foreground tabular-nums">{detail}</span> : null}
      </div>
      <div className="flex flex-1 items-stretch gap-2">
        <Sparkline className="h-16 flex-1" values={series} tone="text-(--viz-1)" />
        <div className="flex w-8 shrink-0 flex-col justify-between text-[0.6rem] text-muted-foreground tabular-nums">
          <span>{ceiling}</span>
          <span>{floor}</span>
        </div>
      </div>
    </Panel>
  );
}

export function ServerPanel({ health, history, online }: { health: SystemHealth; history: Sample[]; online: boolean }) {
  const { server } = health;

  const memoryUsed = server.memoryTotal - server.memoryAvailable;
  const memoryPercent = server.memoryTotal > 0 ? (memoryUsed / server.memoryTotal) * 100 : 0;
  const diskUsed = server.diskTotal - server.diskFree;
  const diskPercent = server.diskTotal > 0 ? (diskUsed / server.diskTotal) * 100 : 0;
  const latest = history.at(-1);

  return (
    <div className="grid gap-4 lg:min-h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="flex flex-col gap-4">
        <Panel
          title="Server"
          hint="Fixed specifications, not live readings."
          action={online ? <StatusText tone="good">Online</StatusText> : <StatusText tone="critical">Not answering</StatusText>}
          bodyClassName="gap-2.5"
        >
          <Fact icon={Server} label="OS" value={server.os} hint="The system on the machine, not inside the containers." />
          <Fact icon={Cpu} label="CPU" value={`${server.cores} cores`} hint="Cores available. A load above this number means work is queueing." />
          <Fact icon={MemoryStick} label="Memory" value={bytes(server.memoryTotal)} hint="Total RAM, shared by the system and both containers." />
          <Fact icon={HardDrive} label="Storage" value={bytes(server.diskTotal)} hint="The whole disk. Docker volumes have no quota of their own." />
          <Fact
            icon={Gauge}
            label="Load"
            value={`${server.load1.toFixed(2)} · ${server.load5.toFixed(2)} · ${server.load15.toFixed(2)}`}
            hint="Tasks waiting for a core over 1, 5 and 15 minutes. Above the core count means queueing."
          />

          <div className="mt-1 flex flex-col gap-1 border-t pt-3 text-[0.7rem] text-muted-foreground">
            <span className="flex items-center justify-between gap-2">
              <HintedLabel label="Host up">Since the machine last booted.</HintedLabel>
              <span className="font-medium text-foreground">{duration(server.uptimeSeconds)}</span>
            </span>
            <span className="flex items-center justify-between gap-2">
              <HintedLabel label="Processes">Everything running on the machine, not just One Base.</HintedLabel>
              <span className="font-medium text-foreground tabular-nums">{server.processes}</span>
            </span>
          </div>
        </Panel>

        <Panel
          title="Disk"
          hint="The whole machine. Docker volumes have no quota, so this is the only real ceiling."
          className="lg:flex-1"
          bodyClassName="items-center justify-center gap-3"
        >
          <UsageRing percent={diskPercent} sublabel={`${bytes(diskUsed)} / ${bytes(server.diskTotal)}`} />
          <p className="text-center text-[0.65rem] text-muted-foreground">{bytes(server.diskFree)} free</p>
        </Panel>
      </div>

      <div className="flex flex-col gap-4">
        {/* Side by side: CPU and memory are read together — one high while the other is not is the diagnosis. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Usage
            title="CPU usage"
            hint="Busy share across all cores."
            series={history.map((s) => s.cpu)}
            current={percent(server.cpuPercent)}
            detail={`load ${server.load1.toFixed(2)} / ${server.cores} cores`}
            floor="0%"
            ceiling="100%"
          />
          <Usage
            title="RAM usage"
            hint="(Total − Available) ÷ Total. Leaves out the file cache, which Linux counts as used."
            series={history.map((s) => s.memory)}
            current={percent(memoryPercent)}
            detail={`${bytes(memoryUsed)} / ${bytes(server.memoryTotal)}`}
            floor="0%"
            ceiling="100%"
          />
        </div>

        <Panel
          title="Bandwidth"
          hint={
            server.networkIsHost
              ? "The machine's real network interfaces, in and out. Docker's own virtual ones are left out, or traffic would count three times."
              : "⚠️ Only the backend's own traffic, not the whole machine's — the host's counters are not mounted here."
          }
          className="lg:flex-1"
          bodyClassName="gap-2"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Download</span>
            <span className="font-medium tabular-nums">{latest ? bitsPerSecond(latest.networkIn) : "—"}</span>
          </div>
          {/* Scaled to the window's own peak: network has no natural ceiling. */}
          <Sparkline
            className="min-h-14 flex-1"
            values={history.map((s) => s.networkIn)}
            max={Math.max(1, ...history.map((s) => s.networkIn))}
            tone="text-(--viz-1)"
          />
          <div className="flex items-center justify-between border-t pt-2 text-xs">
            <span className="text-muted-foreground">Upload</span>
            <span className="font-medium tabular-nums">{latest ? bitsPerSecond(latest.networkOut) : "—"}</span>
          </div>
          {/* Mirrored, so the two read apart without a legend. */}
          <Sparkline
            className="min-h-14 flex-1 scale-y-[-1]"
            values={history.map((s) => s.networkOut)}
            max={Math.max(1, ...history.map((s) => s.networkOut))}
            tone="text-(--viz-2)"
          />
        </Panel>
      </div>
    </div>
  );
}
