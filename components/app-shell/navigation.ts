import { Globe, LayoutDashboard, MessageCircle, RefreshCcw, Settings, Users } from "lucide-react";

export const settingsNavigation = [
  { label: "Brands", value: "brands", href: "/settings?tab=brands", description: "Manage the brands available in your workspace." },
  { label: "Panel", value: "panel", href: "/settings?tab=panel", description: "Manage the panels available in your workspace." },
  { label: "Expenses", value: "expenses", href: "/settings?tab=expenses", description: "What each subscription costs you, and the price of additional perks." },
  { label: "Subscriptions", value: "subscriptions", href: "/settings?tab=subscriptions", description: "Configure your subscription plans." },
  { label: "Payment methods", value: "payment-methods", href: "/settings?tab=payment-methods", description: "Manage the payment methods available to your clients." },
] as const;

export const appNavigation = [
  {
    section: "Workspace",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    available: true,
  },
  {
    section: "Workspace",
    label: "SEO Overview",
    href: "/seo-overview",
    icon: Globe,
    available: true,
  },
  {
    section: "Management",
    label: "Clients",
    href: "/clients",
    icon: Users,
    available: true,
  },
  {
    section: "Management",
    label: "Renewals",
    href: "/renewals",
    icon: RefreshCcw,
    available: true,
    indicator: "Renewals need attention",
  },
  {
    section: "Communication",
    label: "WhatsApp Inbox",
    href: "/whatsapp-inbox",
    icon: MessageCircle,
    available: true,
    // The pulsing red dot in the sidebar; the text is what screen readers announce for it.
    indicator: "New WhatsApp messages",
  },
  {
    section: "Administration",
    label: "Configuration",
    href: "/settings",
    icon: Settings,
    available: true,
    items: settingsNavigation,
  },
] as const;

// Pages opened from the navbar instead of the sidebar, so the breadcrumb still knows them.
export const navbarPages = [
  {
    section: "Communication",
    label: "Inbox",
    href: "/inbox",
  },
] as const;

export const navigationSections = [
  "Workspace",
  "Management",
  "Communication",
  "Administration",
] as const;

export function getConfigurationTab(value: string | null) {
  return settingsNavigation.find((item) => item.value === value) ?? settingsNavigation[0];
}

// Which settings sub-page is open. Pages under a section (/settings/payment-methods/new, …/paypal/edit)
// take it from the path; /settings itself takes it from ?tab=, which defaults to the first tab.
export function getActiveSettingsValue(pathname: string, tab: string | null) {
  const [, , pathSection] = pathname.split("/");
  if (pathSection) return settingsNavigation.find((item) => item.value === pathSection)?.value ?? null;
  return getConfigurationTab(tab).value;
}
