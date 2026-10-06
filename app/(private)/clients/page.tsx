import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AutoRefresh } from "@/components/app-shell/autoRefresh";
import { ClientsTable } from "@/components/clients/clientsTable";
import { LoadError } from "@/components/errors/loadError";
import { roleFrom } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { getClients } from "@/lib/clients/clients";
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
  const [clients, me] = await Promise.all([getClients(), getCurrentUser()]);
  const canDelete = me.ok && roleFrom(me.data.role) === "ADMIN";

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
        {clients.ok ? (
          <>
            {/* New WhatsApp numbers become clients by themselves: the list keeps up. */}
            <AutoRefresh everyMs={10_000} />
            <ClientsTable clients={clients.data} canDelete={canDelete} defaultHiddenColumns={hiddenColumns} />
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-4">
            <LoadError title="The clients could not be loaded." reason={clients.error.message} />
          </div>
        )}
      </section>
    </div>
  );
}
