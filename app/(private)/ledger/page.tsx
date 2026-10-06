import type { Metadata } from "next";

import { LoadError } from "@/components/errors/loadError";
import { LedgerTable } from "@/components/ledger/ledgerTable";
import { getLedger } from "@/lib/dashboard/dashboard";
import { getPaymentMethods } from "@/lib/paymentMethods/paymentMethods";
import { isSeoRange } from "@/lib/seo/types";

export const metadata: Metadata = {
  title: "Ledger | One Base",
};

/**
 * Every payment received (Admins only). Period and account are in the address
 * bar (?range=…&from=&to=&method=…); the Dashboard's card History opens it on one
 * account.
 */
export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string; method?: string }>;
}) {
  const query = await searchParams;
  const range = isSeoRange(query.range) ? query.range : "month";
  const methodId = query.method && /^\d+$/.test(query.method) ? Number(query.method) : undefined;
  const [ledger, methods] = await Promise.all([getLedger(range, query.from, query.to, methodId), getPaymentMethods()]);

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <p className="text-xs font-medium text-muted-foreground">Workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Ledger</h1>
        <p className="mt-1 text-xs text-muted-foreground">Every payment received: who paid, for what, to which account, and what it left.</p>
      </header>

      <section className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background" aria-label="Ledger content">
        {ledger.ok ? (
          <LedgerTable
            data={ledger.data}
            methods={methods.ok ? methods.data.map(({ id, provider, name, active }) => ({ id, provider, name, active })) : []}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4">
            <LoadError title="The ledger could not be loaded." reason={ledger.error.message} />
          </div>
        )}
      </section>
    </div>
  );
}
