import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { ConfigurationTabs } from "@/components/settings/configurationTabs";
import { getBrands } from "@/lib/brands/brands";
import { getPlans } from "@/lib/plans/plans";
import { PAYMENT_METHODS_VIEW_COOKIE, parsePaymentMethodsView } from "@/lib/settings/paymentMethodsView";

export const metadata: Metadata = { title: "Configuration | One Base" };

export default async function ConfigurationPage() {
  // Read on the server so the payment methods open in the saved view (cards or table) straight away.
  const paymentMethodsView = parsePaymentMethodsView((await cookies()).get(PAYMENT_METHODS_VIEW_COOKIE)?.value);
  // The real brands, asked fresh on every visit (and every few seconds while the Brands tab is open).
  const [brands, plans] = await Promise.all([getBrands(), getPlans()]);

  return (
    <Suspense fallback={<div className="h-full rounded-xl border bg-background" />}>
      <ConfigurationTabs
        paymentMethodsView={paymentMethodsView}
        brands={brands.ok ? brands.data : null}
        brandsError={brands.ok ? null : brands.error.message}
        plans={plans.ok ? plans.data : null}
        plansError={plans.ok ? null : plans.error.message}
      />
    </Suspense>
  );
}
