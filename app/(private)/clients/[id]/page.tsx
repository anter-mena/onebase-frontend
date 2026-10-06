import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { ClientWorkspace } from "@/components/clients/clientWorkspace";
import { LoadError } from "@/components/errors/loadError";
import { getBrands } from "@/lib/brands/brands";
import { roleFrom } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { getClient, getPayments } from "@/lib/clients/clients";
import { countryFromCode } from "@/lib/clients/country";
import type { PaymentOptions } from "@/lib/clients/types";
import { getPerks } from "@/lib/expenses/expenses";
import { getPaymentMethods } from "@/lib/paymentMethods/paymentMethods";
import { getPlans } from "@/lib/plans/plans";
import {
  TRANSACTION_COLUMNS_COOKIE,
  parseHiddenTransactionColumns,
} from "@/lib/clients/transactionColumns";

export const metadata: Metadata = {
  title: "Client details | One Base",
};

/** One client. `?edit=1` (the table's "Edit client") opens the left card in edit mode. */
export default async function ClientDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);

  // ⚠️ 404 rather than an empty page. A URL naming a client who is not here is
  // wrong, and a shell with blank fields invites the reader to conclude the
  // record exists and has nothing in it.
  if (!/^\d+$/.test(id)) notFound();
  const [client, payments, plans, perks, brands, methods, me] = await Promise.all([
    getClient(Number(id)),
    getPayments(Number(id)),
    getPlans(),
    getPerks(),
    getBrands(),
    getPaymentMethods(),
    getCurrentUser(),
  ]);
  if (!client.ok && client.error.status === 404) notFound();

  if (!client.ok) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <LoadError title="This client could not be loaded." reason={client.error.message} />
      </div>
    );
  }

  // ⚠️ Read here, not in the table — a preference resolved after the first paint
  // is one the reader watches being applied, columns drawn and then taken away
  // as React hydrates.
  // What Add payment prices from. Only what can be chosen: perks, brands and
  // payment methods that are switched on.
  const paymentOptions: PaymentOptions = {
    plans: plans.ok ? plans.data.map(({ devices, months, price, cost, credits }) => ({ devices, months, price, cost, credits })) : [],
    perks: perks.ok ? perks.data.filter((perk) => perk.active).map(({ id, name, cost }) => ({ id, name, cost })) : [],
    brands: brands.ok ? brands.data.filter((brand) => brand.active).map(({ id, name, logoUrl }) => ({ id, name, logoUrl })) : [],
    methods: methods.ok ? methods.data.filter((method) => method.active).map(({ id, provider, name }) => ({ id, provider, name })) : [],
  };

  const cookieStore = await cookies();
  const hiddenColumns = parseHiddenTransactionColumns(cookieStore.get(TRANSACTION_COLUMNS_COOKIE)?.value);

  return (
    <ClientWorkspace
      client={client.data}
      country={countryFromCode(client.data.countryCode)}
      paymentOptions={paymentOptions}
      transactions={payments.ok ? payments.data : []}
      canDeletePayments={me.ok && roleFrom(me.data.role) === "ADMIN"}
      startEditing={query.edit === "1"}
      hiddenColumns={hiddenColumns}
    />
  );
}
