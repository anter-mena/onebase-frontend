import { BookText, Globe, LayoutDashboard, LayoutTemplate, Mail, MessageCircle, RefreshCcw, ScrollText, Server, Settings, Users, UsersRound } from "lucide-react";

export const settingsNavigation = [
  { label: "Panel", value: "panel", href: "/configuration?tab=panel", description: "Manage the panels available in your workspace." },
  { label: "Brands", value: "brands", href: "/configuration?tab=brands", description: "Manage the brands available in your workspace." },
  { label: "Expenses", value: "expenses", href: "/configuration?tab=expenses", description: "What each subscription costs you, and the price of additional perks." },
  { label: "Subscriptions", value: "subscriptions", href: "/configuration?tab=subscriptions", description: "Configure your subscription plans." },
  { label: "Payment methods", value: "payment-methods", href: "/configuration?tab=payment-methods", description: "Manage the payment methods available to your clients." },
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
    indicator: "new clients",
  },
  {
    // In the sidebar again (2026-10-28), under Clients: it was only reachable from the
    // Dashboard's payment card (History). Admins only (lib/access).
    section: "Management",
    label: "Ledger",
    href: "/ledger",
    icon: BookText,
    available: true,
  },
  {
    section: "Management",
    label: "Renewals",
    href: "/renewals",
    icon: RefreshCcw,
    available: true,
    indicator: "renewals to act on",
  },
  {
    section: "Communication",
    label: "Email Inbox",
    href: "/inbox",
    icon: Mail,
    available: true,
    indicator: "new emails",
  },
  {
    section: "Communication",
    label: "WhatsApp Inbox",
    href: "/whatsapp-inbox",
    icon: MessageCircle,
    available: true,
    // The red count in the sidebar, shown only while getSidebarCounts has one;
    // the text is what screen readers announce after the number.
    indicator: "unread WhatsApp messages",
  },
  {
    section: "Administration",
    label: "Users",
    href: "/users",
    icon: UsersRound,
    available: true,
  },
  {
    // Admins only (lib/access): Commercials send templates from the inbox, they don't write them.
    section: "Administration",
    label: "Templates",
    href: "/templates",
    icon: LayoutTemplate,
    available: true,
  },
  {
    section: "Administration",
    label: "Configuration",
    href: "/configuration",
    icon: Settings,
    available: true,
    items: settingsNavigation,
  },
  {
    section: "Administration",
    label: "System status",
    href: "/system-status",
    icon: Server,
    available: true,
  },
  {
    // Last in the sidebar (2026-10-28).
    section: "Administration",
    label: "Action log",
    href: "/action-log",
    icon: ScrollText,
    available: true,
  },
] as const;

// Pages opened from the navbar instead of the sidebar, so the breadcrumb still knows them.
export const navbarPages = [
  {
    section: "Communication",
    label: "Email Inbox",
    href: "/inbox",
  },
] as const;

export const navigationSections = [
  "Workspace",
  "Management",
  "Communication",
  "Administration",
] as const;

/**
 * Where `/configuration` lands when the URL does not say.
 *
 * ⚠️ Named rather than "whichever tab is first". Reordering the list used to
 * move the landing tab with it — putting Panel first would have opened
 * Configuration on a screen that says "coming soon", which is a poor first
 * thing to show and would have happened as a side effect nobody chose.
 * The order of the tabs and the one you arrive at are separate decisions.
 */
const DEFAULT_SETTINGS_TAB = "brands";

export function getConfigurationTab(value: string | null) {
  return (
    settingsNavigation.find((item) => item.value === value) ??
    settingsNavigation.find((item) => item.value === DEFAULT_SETTINGS_TAB) ??
    settingsNavigation[0]
  );
}

// Which settings sub-page is open. Pages under a section (/configuration/payment-methods/new, …/paypal/edit)
// take it from the path; /configuration itself takes it from ?tab=, which defaults to the first tab.
export function getActiveSettingsValue(pathname: string, tab: string | null) {
  const [, , pathSection] = pathname.split("/");
  if (pathSection) return settingsNavigation.find((item) => item.value === pathSection)?.value ?? null;
  return getConfigurationTab(tab).value;
}
