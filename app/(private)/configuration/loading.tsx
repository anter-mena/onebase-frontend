import { cookies } from "next/headers";

import { ConfigurationSkeleton } from "@/components/settings/configurationSkeleton";
import { PAYMENT_METHODS_VIEW_COOKIE, parsePaymentMethodsView } from "@/lib/settings/paymentMethodsView";

/**
 * Configuration while it loads — each tab with its own layout (configurationSkeleton.tsx).
 *
 * <p>The tab is in the query (`?tab=`), which a server loading screen cannot
 * read, so the browser part picks it. What the server can read is handed over:
 * whether Payment methods was last left as cards or as a table, from the same
 * cookie the page reads.
 */
export default async function ConfigurationLoading() {
  const paymentMethodsView = parsePaymentMethodsView((await cookies()).get(PAYMENT_METHODS_VIEW_COOKIE)?.value);
  return <ConfigurationSkeleton paymentMethodsView={paymentMethodsView} />;
}
