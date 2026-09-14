"use client";

import { Tabs } from "@base-ui/react/tabs";
import { useRouter, useSearchParams } from "next/navigation";

import { getConfigurationTab, settingsNavigation } from "@/components/app-shell/navigation";
import { PaymentMethods } from "@/components/settings/paymentMethods";

export function ConfigurationTabs() {
  const router = useRouter();
  const activeTab = getConfigurationTab(useSearchParams().get("tab"));

  return (
    <Tabs.Root value={activeTab.value} onValueChange={(value) => {
      const tab = settingsNavigation.find((item) => item.value === value);
      if (tab) router.push(tab.href, { scroll: false });
    }} className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <p className="text-xs font-medium text-muted-foreground">Administration</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Configuration</h1>
          <Tabs.List aria-label="Configuration sections" className="inline-flex max-w-full shrink-0 overflow-x-auto rounded-lg border border-border/60 bg-muted p-0.5">
        {settingsNavigation.map(({ value, label }) => (
            <Tabs.Tab key={value} value={value} className="inline-flex h-6 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-transparent px-2 text-[0.7rem] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring data-[active]:border-border data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm">
              {label}
            </Tabs.Tab>
        ))}
          </Tabs.List>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Manage your brands, subscription plans, and payment methods.</p>
      </header>
      {settingsNavigation.map(({ value, label, description }) => (
        <Tabs.Panel key={value} value={value} className="mt-4 min-h-0 flex-1 overflow-auto rounded-xl border bg-background p-4">
          {value === "payment-methods" ? <PaymentMethods /> : <>
          <h2 className="text-sm font-medium">{label}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          <div className="mt-4 flex min-h-60 items-center justify-center rounded-lg border border-dashed p-6 text-center">
            <p className="text-xs text-muted-foreground">{label} configuration tools are coming soon.</p>
          </div>
          </>}
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}
