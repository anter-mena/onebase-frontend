import type { Metadata } from "next";
import { cookies } from "next/headers";

import { ClientsTable } from "@/components/clients/clientsTable";
import { CLIENT_COLUMNS_COOKIE, parseHiddenColumns } from "@/lib/clients/columns";

export const metadata: Metadata = {
  title: "Clients | One Base",
};

export default async function ClientsPage() {
  /**
   * ⚠️ Read here, not in the table.
   *
   * <p>The hidden columns are a stored preference, and a preference resolved
   * after the first paint is a preference the reader watches being applied —
   * eleven columns drawn and three taken away as React hydrates. The cookie
   * name and the parser come from `lib/clients/columns`, a plain module,
   * because a `"use client"` file's exports reach a server component as
   * references rather than values.
   */
  const cookieStore = await cookies();
  const hiddenColumns = parseHiddenColumns(cookieStore.get(CLIENT_COLUMNS_COOKIE)?.value);

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
        <ClientsTable defaultHiddenColumns={hiddenColumns} />
      </section>
    </div>
  );
}
