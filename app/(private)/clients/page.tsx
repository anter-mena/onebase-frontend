import type { Metadata } from "next";

import { ClientsTable } from "@/components/clients/clientsTable";

export const metadata: Metadata = {
  title: "Clients | One Base",
};

export default function ClientsPage() {
  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <p className="text-xs font-medium text-muted-foreground">Management</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Clients</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          View and manage your client relationships.
        </p>
      </header>

      <section
        className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background"
        aria-label="Clients content"
      >
        <ClientsTable />
      </section>
    </div>
  );
}
