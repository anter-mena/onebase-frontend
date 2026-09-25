import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ClientDetail } from "@/components/clients/clientDetail";
import { findClient } from "@/lib/clients/sample";
import {
  TRANSACTION_COLUMNS_COOKIE,
  parseHiddenTransactionColumns,
} from "@/lib/clients/transactionColumns";

export const metadata: Metadata = {
  title: "Client details | One Base",
};

export default async function ClientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = findClient(id);

  // ⚠️ 404 rather than an empty page. A URL naming a client who is not here is
  // wrong, and a shell with blank fields invites the reader to conclude the
  // record exists and has nothing in it.
  if (!client) notFound();

  // ⚠️ Read here, not in the table — the reason the Clients page gives: a
  // preference resolved after the first paint is one the reader watches being
  // applied, columns drawn and then taken away as React hydrates.
  const cookieStore = await cookies();
  const hiddenColumns = parseHiddenTransactionColumns(cookieStore.get(TRANSACTION_COLUMNS_COOKIE)?.value);

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" aria-hidden />
          Clients
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{client.name}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Their details, what they have paid, and what it came to.
        </p>
      </header>

      <section
        className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background"
        aria-label="Client details content"
      >
        <div className="h-full overflow-y-auto p-4 [scrollbar-gutter:stable]">
          <ClientDetail client={client} hiddenColumns={hiddenColumns} />
        </div>
      </section>
    </div>
  );
}
