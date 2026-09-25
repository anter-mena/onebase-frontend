import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PaymentMethodForm } from "@/components/settings/paymentMethodForm";

export const metadata: Metadata = { title: "New payment method | One Base" };

export default function NewPaymentMethodPage() {
  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <Link
          href="/configuration?tab=payment-methods"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" aria-hidden />
          Payment methods
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">New payment method</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Add another way for your clients to pay you.
        </p>
      </header>

      <section
        // flex flex-col: lets the form area fill the box's full height, so both halves can center vertically.
        className="mt-4 flex min-h-0 flex-1 flex-col overflow-auto rounded-xl border bg-background p-4 md:p-6"
        aria-label="New payment method form"
      >
        <PaymentMethodForm mode="create" />
      </section>
    </div>
  );
}
