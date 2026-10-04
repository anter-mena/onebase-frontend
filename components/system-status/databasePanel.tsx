import { cn } from "cn";

import { UsageRing } from "@/components/system-status/usageRing";
import { Panel } from "@/components/system-status/panel";
import { StatRow } from "@/components/system-status/statRow";
import { bytes, count, duration, percent } from "@/lib/format";
import type { SystemHealth } from "@/lib/system/healthTypes";

/** PostgreSQL: how big it is, how busy it is, and which table weighs what. */
export function DatabasePanel({ health }: { health: SystemHealth }) {
  const { database, server } = health;
  const shareOfDisk = server.diskTotal > 0 ? (database.onDiskBytes / server.diskTotal) * 100 : 0;

  return (
    <div className="grid gap-4 lg:h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="flex flex-col gap-4 lg:min-h-0">
        <Panel title="Storage" bodyClassName="gap-3">
          <StatRow label="Data" hint="What the tables and their indexes take." value={bytes(database.sizeBytes)} />
          <StatRow label="On disk" hint="The whole PostgreSQL folder. This is the number that fills a disk." value={bytes(database.onDiskBytes)} />
          <StatRow label="Write-ahead log" hint="Changes are written here first. Growing without stopping is trouble." value={bytes(database.walBytes)} />
          <StatRow
            label="Share of disk"
            hint="PostgreSQL against the whole machine."
            value={percent(shareOfDisk, 2)}
            detail={`of ${bytes(server.diskTotal)}`}
            percent={shareOfDisk}
          />
        </Panel>

        <Panel
          title="Cache hit ratio"
          hint="Reads answered from memory instead of the disk. Below about 99% slows things down."
          className="lg:flex-1"
          bodyClassName="items-center justify-center gap-3"
        >
          <UsageRing percent={database.cacheHitRatio} sublabel="from memory" />
          <p className="text-center text-[0.65rem] text-muted-foreground">Below 99% is usually a missing index, not too little memory</p>
        </Panel>
      </div>

      <div className="flex flex-col gap-4 lg:min-h-0">
        <Panel title="Activity" bodyClassName="gap-3">
          <StatRow
            label="Open connections"
            hint="Every connection to the database, busy or idle. Reaching the limit causes errors."
            value={count(database.activeConnections)}
            detail={`of ${database.maxConnections}`}
            percent={database.maxConnections > 0 ? (database.activeConnections / database.maxConnections) * 100 : 0}
          />
          <StatRow label="Running queries" hint="Working right now, not waiting." value={count(database.runningQueries)} />
          <StatRow
            label="Slow queries"
            hint="Queries over one second. Needs the pg_stat_statements extension."
            value={database.slowQueriesAvailable ? "0" : "—"}
            detail={database.slowQueriesAvailable ? undefined : "not enabled"}
          />
          <StatRow label="Uptime" hint="Since PostgreSQL started. Longer than the backend's is healthy." value={duration(database.uptimeSeconds)} />
        </Panel>

        <Panel
          title="Tables"
          hint="Rows and total size of each table. Row counts are close estimates, not exact."
          action={<span className="text-[0.65rem] text-muted-foreground tabular-nums">{database.tables.length} tables</span>}
          className="lg:min-h-36 lg:flex-1"
          bodyClassName="p-0"
        >
          {/* Scrolls inside the card on large screens, so a bigger schema does not push the rest off the page. */}
          <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b">
                  <th className="py-2 pl-4 text-left text-[0.6rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Table</th>
                  <th className="px-3 py-2 text-right text-[0.6rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Rows</th>
                  <th className="py-2 pr-4 text-right text-[0.6rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Size</th>
                </tr>
              </thead>
              <tbody>
                {database.tables.map((table) => (
                  <tr key={table.name} className="border-b last:border-b-0">
                    <td className="py-2 pl-4 font-mono text-[0.7rem]">{table.name}</td>
                    <td className={cn("px-3 py-2 text-right tabular-nums", table.rows === 0 ? "text-muted-foreground/50" : "font-medium")}>
                      {count(table.rows)}
                    </td>
                    <td className="py-2 pr-4 text-right text-muted-foreground tabular-nums">{bytes(table.bytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
