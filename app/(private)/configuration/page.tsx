import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { ConfigurationTabs } from "@/components/settings/configurationTabs";
import { getBrands } from "@/lib/brands/brands";
import { getPlans } from "@/lib/plans/plans";
import { getPaymentMethods } from "@/lib/paymentMethods/paymentMethods";
import { getCredit, getPerks } from "@/lib/expenses/expenses";
import { PAYMENT_METHODS_VIEW_COOKIE, parsePaymentMethodsView } from "@/lib/settings/paymentMethodsView";

export const metadata: Metadata = { title: "Configuration | One Base" };

export default async function ConfigurationPage() {
  // Read on the server so the payment methods open in the saved view (cards or table) straight away.
  const paymentMethodsView = parsePaymentMethodsView((await cookies()).get(PAYMENT_METHODS_VIEW_COOKIE)?.value);
  // The real brands, asked fresh on every visit (and every few seconds while the Brands tab is open).
  const [brands, plans, paymentMethods, perks, credit] = await Promise.all([
    getBrands(),
    getPlans(),
    getPaymentMethods(),
    getPerks(),
    getCredit(),
  ]);

  return (
    <Suspense fallback={<div className="h-full rounded-xl border bg-background" />}>
      <ConfigurationTabs
        paymentMethodsView={paymentMethodsView}
        brands={brands.ok ? brands.data : null}
        brandsError={brands.ok ? null : brands.error.message}
        plans={plans.ok ? plans.data : null}
        plansError={plans.ok ? null : plans.error.message}
        paymentMethods={paymentMethods.ok ? paymentMethods.data : null}
        paymentMethodsError={paymentMethods.ok ? null : paymentMethods.error.message}
        perks={perks.ok ? perks.data : null}
        credit={credit.ok ? credit.data : null}
        expensesError={!perks.ok ? perks.error.message : !credit.ok ? credit.error.message : null}
      />
    </Suspense>
  );
}
