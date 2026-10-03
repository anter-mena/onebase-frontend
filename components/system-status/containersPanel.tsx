import { Boxes } from "lucide-react";

import { Panel, StatusText } from "@/components/system-status/panel";
import { Sparkline } from "@/components/system-status/sparkline";
import { StatRow } from "@/components/system-status/statRow";
import type { Sample } from "@/components/system-status/useSystemHealth";
import { bytes, count, duration, percent } from "@/lib/format";
import type { SystemHealth } from "@/lib/system/healthTypes";

/**
 * One card per container (today: the backend and the database), with what it
 * costs the machine.
 *
 * <p>The two figures worth watching are not the graphs. <b>Restarts</b> climbing
 * means something is crashing and Docker is quietly putting it back.
 * <b>Health</b> is the container's own check, which knows things uptime does not
 * — Postgres can be up and refusing connections.
 */

type Container = SystemHealth["containers"]["items"][number];

/** Health outranks state: an `unhealthy` container is still `running`, and must not look green. */
function statusTone(state: string, health: string) {
  if (health === "unhealthy") return "critical" as const;
  if (health === "starting" || state === "restarting") return "warning" as const;
  if (state === "running") return "good" as const;
  return "muted" as const;
}

function ContainerCard({ container, history, hostMemory }: { container: Container; history: Sample[]; hostMemory: number }) {
  const running = container.state === "running";
  // No limit is set, so Docker reports the machine's total as the ceiling.
  const unlimited = hostMemory > 0 && Math.abs(container.memoryLimit - hostMemory) < hostMemory * 0.02;
  const memoryPercent = container.memoryLimit > 0 ? (container.memoryUsed / container.memoryLimit) * 100 : 0;
  const series = history.map((s) => s.containerCpu[container.name] ?? 0);

  return (
    <Panel
      title={container.name}
      action={<StatusText tone={statusTone(container.state, container.health)}>{container.health || container.state}</StatusText>}
      bodyClassName="gap-3"
    >
      <p className="truncate font-mono text-[0.65rem] text-muted-foreground">{container.image}</p>

      {/* A stopped container uses nothing: Docker's own sentence says more than a 0% graph. */}
      {!running ? <p className="text-xs text-muted-foreground">{container.status}</p> : null}

      {running ? (
        <>
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs text-muted-foreground">CPU</span>
              <span className="text-sm font-semibold tabular-nums">{percent(container.cpuPercent)}</span>
            </div>
            {/* Scaled to its own peak: 2% of a four-core machine is real work, and its shape is the point. */}
            <Sparkline className="h-12 sm:h-14" values={series} max={Math.max(5, ...series)} tone="text-foreground" />
          </div>
          <StatRow
            compact
            label="Memory"
            hint={unlimited ? "No cap is set, so the ceiling is the machine's RAM." : "Against the cap set on this container."}
            value={bytes(container.memoryUsed)}
            detail={`of ${bytes(container.memoryLimit)}${unlimited ? " · no cap" : ""}`}
            percent={memoryPercent}
          />
        </>
      ) : null}

      <div className="mt-auto flex flex-col gap-1.5 border-t pt-2.5">
        <StatRow compact label="Restarts" hint="Times Docker has restarted it. Climbing on its own means crashing." value={count(container.restarts)} />
        <StatRow compact label="Uptime" hint="Since this container last started; a restart resets it." value={duration(container.uptimeSeconds)} />
        <StatRow
          compact
          label="Network"
          hint="Total in and out since it started — a running total, not a rate."
          value={`${bytes(container.networkIn)} in`}
          detail={`${bytes(container.networkOut)} out`}
        />
      </div>
    </Panel>
  );
}

export function ContainersPanel({ health, history }: { health: SystemHealth; history: Sample[] }) {
  const { containers } = health;

  if (!containers.available) {
    return (
      <Panel
        title="Containers"
        action={
          <span className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
            <Boxes className="size-3.5" aria-hidden />
            not connected
          </span>
        }
        bodyClassName="items-center justify-center gap-2 p-8 text-center"
      >
        <p className="text-sm font-medium">No Docker endpoint is answering</p>
        <p className="max-w-md text-xs text-muted-foreground">{containers.detail}</p>
      </Panel>
    );
  }

  const shown = containers.items.filter((c) => ["running", "restarting", "paused", "dead"].includes(c.state));
  const stopped = containers.items.length - shown.length;

  return (
    <div className="flex flex-col gap-3 lg:min-h-full">
      {/* The count on the page: a missing card must still show as a number. */}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Boxes className="size-3.5" aria-hidden />
        <span className="tabular-nums">
          {count(shown.length)} running
          {stopped > 0 ? ` · ${count(stopped)} stopped` : ""}
        </span>
      </p>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(20rem,100%),1fr))]">
        {shown.map((container) => (
          <ContainerCard key={container.id} container={container} history={history} hostMemory={health.server.memoryTotal} />
        ))}
      </div>
    </div>
  );
}
