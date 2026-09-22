"use client";

import { Tabs } from "@base-ui/react/tabs";
import { useRouter, useSearchParams } from "next/navigation";

import { getConfigurationTab, settingsNavigation } from "@/components/app-shell/navigation";
import { Brands } from "@/components/settings/brands";
import { Expenses } from "@/components/settings/expenses";
import { Panel } from "@/components/settings/panel";
import { PaymentMethods } from "@/components/settings/paymentMethods";
import { Subscriptions } from "@/components/settings/subscriptions";
import type { PaymentMethodsView } from "@/lib/settings/paymentMethodsView";

export function ConfigurationTabs({ paymentMethodsView }: { paymentMethodsView: PaymentMethodsView }) {
  const router = useRouter();
  const activeTab = getConfigurationTab(useSearchParams().get("tab"));

  return (
    <Tabs.Root value={activeTab.value} onValueChange={(value) => {
      const tab = settingsNavigation.find((item) => item.value === value);
      if (tab) router.push(tab.href, { scroll: false });
    }} className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <p className="text-xs font-medium text-muted-foreground">Administration</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Configuration</h1>

        {/* The tabs share the description's line, pushed to the far right. The
            eyebrow and the title are left to read as a plain heading, the same
            two lines every other page opens with, and the row that carries a
            control is the quiet one underneath.

            Wrapping is kept here, unlike the theme panel: four tab labels are
            wide enough that on a phone they genuinely have to drop to a line of
            their own, and `justify-between` leaves them left-aligned there. */}
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="min-w-0 text-xs text-muted-foreground">Manage your brands, subscription plans, and payment methods.</p>

          <Tabs.List aria-label="Configuration sections" className="inline-flex max-w-full shrink-0 overflow-x-auto rounded-lg border border-border/60 bg-muted p-0.5">
            {settingsNavigation.map(({ value, label }) => (
              <Tabs.Tab key={value} value={value} className="inline-flex h-6 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-transparent px-2 text-[0.7rem] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring data-[active]:border-border data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm">
                {label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </div>
      </header>
      {settingsNavigation.map(({ value }) => (
        <Tabs.Panel key={value} value={value} className="mt-4 min-h-0 flex-1 overflow-auto rounded-xl border bg-background p-4">
          {value === "payment-methods" ? (
            <PaymentMethods initialView={paymentMethodsView} />
          ) : value === "subscriptions" ? (
            <Subscriptions />
          ) : value === "expenses" ? (
            <Expenses />
          ) : value === "panel" ? (
            <Panel />
          ) : (
            <Brands />
          )}
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}
