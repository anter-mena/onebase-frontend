import { LayoutDashboard, MessageCircle, Users } from "lucide-react";

export const appNavigation = [
  { section: "Workspace", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, available: true },
  {
    section: "Management",
    label: "Clients",
    href: "/clients",
    icon: Users,
    available: false,
    items: [
      { label: "All clients", href: "/clients" },
      { label: "Add client", href: "/clients/new" },
    ],
  },
  {
    section: "Communication",
    label: "WhatsApp Inbox",
    href: "/inbox",
    icon: MessageCircle,
    available: false,
    items: [
      { label: "Conversations", href: "/inbox" },
      { label: "Message templates", href: "/inbox/templates" },
    ],
  },
] as const;

export const navigationSections = ["Workspace", "Management", "Communication"] as const;
