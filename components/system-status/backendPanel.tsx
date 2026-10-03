import { Panel } from "@/components/system-status/panel";
import { Sparkline } from "@/components/system-status/sparkline";
import { StatRow } from "@/components/system-status/statRow";
import type { Sample } from "@/components/system-status/useSystemHealth";
import { bytes, count, duration, percent } from "@/lib/format";
import type { SystemHealth } from "@/lib/system/healthTypes";

/** The Spring Boot application: memory, speed, traffic and its database connections. */
export function BackendPanel({ health, history }: { health: SystemHealth; history: Sample[] }) {
  const { backend } = health;
  const heapPercent = backend.heapMax > 0 ? (backend.heapUsed / backend.heapMax) * 100 : 0;
  const latest = history.at(-1);
  const poolShare = (n: number) => (backend.pool.max > 0 ? (n / backend.pool.max) * 100 : 0);
  const refusedShare = backend.totalRequests > 0 ? (backend.errors4xx / backend.totalRequests) * 100 : 0;

  return (
    <div className="grid gap-4 lg:min-h-full lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)_auto]">
      <Panel
        title="JVM heap"
        hint="Going up and down as memory is cleaned is healthy. Climbing and never falling back is a leak."
        bodyClassName="gap-3"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{bytes(backend.heapUsed)}</span>
          <span className="text-[0.65rem] text-muted-foreground tabular-nums">
            of {bytes(backend.heapMax)} · {percent(heapPercent)}
          </span>
        </div>
        <Sparkline className="h-16 lg:h-auto lg:min-h-16 lg:flex-1" values={history.map((s) => s.heap)} tone="text-foreground" />
      </Panel>

      <Panel
        title="Response time"
        hint="How long the slowest 5% of requests take (p95). An average would hide the slow ones people notice."
        bodyClassName="gap-3"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{backend.p95Millis.toFixed(0)} ms</span>
          <span className="text-[0.65rem] text-muted-foreground tabular-nums">p99 {backend.p99Millis.toFixed(0)} ms</span>
        </div>
        {/* Scaled to the worst reading: latency has no natural maximum. */}
        <Sparkline
          className="h-16 lg:h-auto lg:min-h-16 lg:flex-1"
          values={history.map((s) => s.latency)}
          max={Math.max(50, ...history.map((s) => s.latency))}
          tone="text-foreground"
        />
      </Panel>

      <Panel title="Traffic and errors" bodyClassName="gap-3">
        <StatRow
          label="Requests per minute"
          hint="How busy it is. Falling to zero matters as much as a spike."
          value={latest ? count(Math.round(latest.requestsPerMinute)) : "—"}
          detail={`${count(backend.totalRequests)} since restart`}
        />
        <StatRow
          label="5xx error rate"
          hint="The backend broke. Unlike 4xx, which is it refusing correctly."
          value={percent(backend.error5xxRate, 2)}
          detail={`${count(backend.errors5xx)} of ${count(backend.totalRequests)}`}
          percent={backend.error5xxRate}
          tone="bg-(--viz-critical)/70"
        />
        <StatRow
          label="4xx refusals"
          hint="Refused on purpose — not signed in, no permission, not found."
          value={count(backend.errors4xx)}
          detail={percent(refusedShare, 1)}
          percent={refusedShare}
          tone="bg-amber-500/70"
        />
        <StatRow label="Uptime" hint="Since the backend last started — usually the last deploy." value={duration(backend.uptimeSeconds)} />
      </Panel>

      <Panel title="Database connections" bodyClassName="gap-3">
        <StatRow
          label="Active connections"
          hint="Running a query now. Stuck at the maximum means requests are waiting."
          value={count(backend.pool.active)}
          detail={`of ${backend.pool.max}`}
          percent={poolShare(backend.pool.active)}
        />
        <StatRow
          label="Idle connections"
          hint="Open and ready. Reusing one is much faster than opening a new one."
          value={count(backend.pool.idle)}
          detail={`of ${backend.pool.max}`}
          percent={poolShare(backend.pool.idle)}
          tone="bg-muted-foreground/40"
        />
        <StatRow label="Threads waiting" hint="Waiting for a free connection. Above zero is a problem." value={count(backend.pool.pending)} />
        <StatRow
          label="Connection wait time"
          hint="Time to get a connection. It rises before anything visibly breaks."
          value={`${backend.pool.waitMillis.toFixed(1)} ms`}
        />
      </Panel>
    </div>
  );
}
