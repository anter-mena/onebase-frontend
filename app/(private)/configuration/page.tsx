import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { getConfigurationTab } from "@/components/app-shell/navigation";
import { ConfigurationSkeleton } from "@/components/settings/configurationSkeleton";
import { ConfigurationTabs } from "@/components/settings/configurationTabs";
import { getBrands } from "@/lib/brands/brands";
import { getPlans } from "@/lib/plans/plans";
import { getPaymentMethods } from "@/lib/paymentMethods/paymentMethods";
import { getCredit, getPerks } from "@/lib/expenses/expenses";
import { PAYMENT_METHODS_VIEW_COOKIE, parsePaymentMethodsView, type PaymentMethodsView } from "@/lib/settings/paymentMethodsView";

export const metadata: Metadata = { title: "Configuration | One Base" };

/**
 * ⚠️ The data waits inside a `<Suspense>` keyed by the tab, not directly in the page.
 *
 * <p>The five tabs are one address with a different `?tab=`. Moving between them
 * keeps the same route, and the route's `loading.tsx` boundary is already shown —
 * so Next keeps the old tab on screen until the new one is ready, and that tab's
 * loader never appears. A boundary with a new key is a new boundary, and a new
 * boundary shows its fallback: each tab change, from the tabs, the sidebar or
 * the address bar, now shows the loader of the tab being opened.
 */
export default async function ConfigurationPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [{ tab }, cookieStore] = await Promise.all([searchParams, cookies()]);
  const tabValue = getConfigurationTab(tab ?? null).value;
  // Read on the server so the payment methods open in the saved view (cards or table) straight away.
  const paymentMethodsView = parsePaymentMethodsView(cookieStore.get(PAYMENT_METHODS_VIEW_COOKIE)?.value);

  return (
    <Suspense key={tabValue} fallback={<ConfigurationSkeleton paymentMethodsView={paymentMethodsView} tabValue={tabValue} />}>
      <ConfigurationContent paymentMethodsView={paymentMethodsView} />
    </Suspense>
  );
}

async function ConfigurationContent({ paymentMethodsView }: { paymentMethodsView: PaymentMethodsView }) {
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
