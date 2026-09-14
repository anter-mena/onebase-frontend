import { LayoutDashboard, MessageCircle, Settings, Users } from "lucide-react";

export const settingsNavigation = [
  { label: "Brands", value: "brands", href: "/settings?tab=brands", description: "Manage the brands available in your workspace." },
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
    section: "Management",
    label: "Clients",
    href: "/clients",
    icon: Users,
    available: true,
  },
  {
    section: "Communication",
    label: "WhatsApp Inbox",
    href: "/whatsapp-inbox",
    icon: MessageCircle,
    available: true,
    indicator: true,
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
