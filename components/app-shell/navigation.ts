import { LayoutDashboard, MessageCircle, Users } from "lucide-react";

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
    available: false,
    items: [
      { label: "All clients", href: "/clients", available: false },
      { label: "Add client", href: "/clients/new", available: false },
    ],
  },
  {
    section: "Communication",
    label: "WhatsApp Inbox",
    href: "/inbox",
    icon: MessageCircle,
    available: true,
    indicator: true,
  },
] as const;

export const navigationSections = [
  "Workspace",
  "Management",
  "Communication",
] as const;
