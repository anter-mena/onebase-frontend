import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfigurationTabs } from "@/components/settings/configurationTabs";

export const metadata: Metadata = { title: "Configuration | One Base" };

export default function ConfigurationPage() {
  return (
    <Suspense fallback={<div className="h-full rounded-xl border bg-background" />}>
      <ConfigurationTabs />
    </Suspense>
  );
}
