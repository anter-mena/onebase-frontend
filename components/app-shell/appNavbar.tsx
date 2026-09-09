"use client";

import { BellRing, Inbox, MoonStar } from "lucide-react";
import { cn } from "cn";
import { usePathname } from "next/navigation";

import { appNavigation } from "@/components/app-shell/navigation";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppNavbar() {
  const pathname = usePathname();
  const currentItem = appNavigation.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger />
        <div className="flex min-w-0 items-center gap-1.5 text-xs">
          <span className="hidden text-muted-foreground sm:inline">
            {currentItem?.section ?? "Workspace"}
          </span>
          <span className="hidden text-muted-foreground sm:inline">/</span>
          <span className="truncate font-medium">
            {currentItem?.label ?? "Dashboard"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={cn(
            whiteStyle.button,
            "relative flex size-7 items-center justify-center p-0! text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          )}
          aria-label="Inbox"
          title="Inbox"
        >
          <Inbox className="size-3" aria-hidden />
        </button>
        <button
          type="button"
          className={cn(
            whiteStyle.button,
            "relative flex size-7 items-center justify-center p-0! text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          )}
          aria-label="Notifications, new notifications"
          title="Notifications"
        >
          <BellRing className="size-3" aria-hidden />
          <span
            className="absolute -top-0.5 -right-0.5 flex size-2"
            aria-hidden
          >
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-70" />
            <span className="relative inline-flex size-full rounded-full bg-red-500 ring-1 ring-background" />
          </span>
        </button>
        <button
          type="button"
          className={cn(
            whiteStyle.button,
            "flex size-7 items-center justify-center p-0! text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          )}
          aria-label="Toggle theme"
          title="Theme toggle"
        >
          <MoonStar className="size-3" aria-hidden />
        </button>
      </div>
    </header>
  );
}
