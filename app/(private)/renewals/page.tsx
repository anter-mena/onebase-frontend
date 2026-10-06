import type { Metadata } from "next";

import { AutoRefresh } from "@/components/app-shell/autoRefresh";
import { LoadError } from "@/components/errors/loadError";
import { RenewalsTable } from "@/components/renewals/renewalsTable";
import { getRenewals } from "@/lib/clients/clients";

export const metadata: Metadata = {
  title: "Renewals | One Base",
};

/**
 * Who to follow up: ending in 10 days or less, trials over (Callback), Pending,
 * and Inactive. The groups come from the backend; a payment takes a client off
 * the list by itself.
 */
export default async function RenewalsPage() {
  const renewals = await getRenewals();

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <p className="text-xs font-medium text-muted-foreground">Management</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Renewals</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Plans ending soon, trials to call back, payments we are waiting for, and plans that ended.
        </p>
      </header>

      <section
        className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background"
        aria-label="Renewals content"
      >
        {renewals.ok ? (
          <>
            {/* Trials turn into Callbacks by themselves: the list keeps up. */}
            <AutoRefresh everyMs={30_000} />
            <RenewalsTable rows={renewals.data} />
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-4">
            <LoadError title="Renewals could not be loaded." reason={renewals.error.message} />
          </div>
        )}
      </section>
    </div>
  );
}
