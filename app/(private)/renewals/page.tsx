import type { Metadata } from "next";

import { RenewalsTable } from "@/components/renewals/renewalsTable";

export const metadata: Metadata = {
  title: "Renewals | One Base",
};

// Started as a duplicate of the Clients page: same header layout, and its own table (a copy of the clients table)
// without the Orders, Payment method and Revenue columns.
export default function RenewalsPage() {
  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <p className="text-xs font-medium text-muted-foreground">Management</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Renewals</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Follow up on client subscriptions that are ending soon.
        </p>
      </header>

      <section
        className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background"
        aria-label="Renewals content"
      >
        <RenewalsTable />
      </section>
    </div>
  );
}
