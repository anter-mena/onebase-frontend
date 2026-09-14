import { notFound, redirect } from "next/navigation";
import { settingsNavigation } from "@/components/app-shell/navigation";

export default async function LegacyConfigurationPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const tab = settingsNavigation.find((item) => item.value === section);
  if (!tab) notFound();
  redirect(tab.href);
}
