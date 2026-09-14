import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { ConfigurationTabs } from "@/components/settings/configurationTabs";
import { PAYMENT_METHODS_VIEW_COOKIE, parsePaymentMethodsView } from "@/lib/settings/paymentMethodsView";

export const metadata: Metadata = { title: "Configuration | One Base" };

export default async function ConfigurationPage() {
  // Read on the server so the payment methods open in the saved view (cards or table) straight away.
  const paymentMethodsView = parsePaymentMethodsView((await cookies()).get(PAYMENT_METHODS_VIEW_COOKIE)?.value);

  return (
    <Suspense fallback={<div className="h-full rounded-xl border bg-background" />}>
      <ConfigurationTabs paymentMethodsView={paymentMethodsView} />
    </Suspense>
  );
}
