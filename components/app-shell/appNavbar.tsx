"use client";

import Link from "next/link";
import { Fragment, Suspense } from "react";
import { BellRing, Inbox, MoonStar, Sun } from "lucide-react";
import { cn } from "cn";
import { usePathname, useSearchParams } from "next/navigation";

import { appNavigation, getConfigurationTab, navbarPages } from "@/components/app-shell/navigation";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "@/hooks/use-theme";

// useSearchParams() lives here, not in AppNavbar: on prerendered pages it makes
// everything up to the nearest Suspense render in the browser only, and the
// whole navbar would be missing from the first HTML.
function BreadcrumbWithTab() {
  return <Breadcrumb tab={useSearchParams().get("tab")} />;
}

// The full path to the current page, for example:
//   /clients                        → Management / Clients
//   /settings?tab=payment-methods   → Administration / Configuration / Payment methods
//   /settings/payment-methods/new   → Administration / Configuration / Payment methods / New
//   /settings/payment-methods/paypal/edit → Administration / Configuration / Payment methods / Edit
function Breadcrumb({ tab }: { tab: string | null }) {
  const pathname = usePathname();
  const currentItem = [...appNavigation, ...navbarPages].find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  const trail: string[] = [currentItem?.section ?? "Workspace", currentItem?.label ?? "Dashboard"];

  if (currentItem && "items" in currentItem) {
    // The sub-page comes from the path (/settings/payment-methods/new) or, on /settings itself, from ?tab=.
    // Without either (while the URL is still unknown), the trail stops at the section.
    const [, , pathSection, ...rest] = pathname.split("/");
    const subItem = pathSection
      ? currentItem.items.find((item) => item.value === pathSection)
      : tab
        ? getConfigurationTab(tab)
        : undefined;
    if (subItem) trail.push(subItem.label);
    if (rest.at(-1) === "new") trail.push("New");
    if (rest.at(-1) === "edit") trail.push("Edit");
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5 text-xs">
      {trail.map((label, index) => {
        const isLast = index === trail.length - 1;
        return (
          <Fragment key={`${index}-${label}`}>
            {/* On phones only the current page shows. */}
            {index > 0 ? <span className="hidden text-muted-foreground sm:inline">/</span> : null}
            <span className={isLast ? "truncate font-medium" : "hidden whitespace-nowrap text-muted-foreground sm:inline"}>
              {label}
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}

export function AppNavbar() {
  // Only the toggle is used here — never `mode`, which would not survive
  // hydration on a server-rendered component. See the button below.
  const { toggleMode } = useTheme();

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger />
        <Suspense fallback={<Breadcrumb tab={null} />}>
          <BreadcrumbWithTab />
        </Suspense>
      </div>

      <div className="flex items-center gap-1.5">
        <Link
          href="/inbox"
          className={cn(
            whiteStyle.button,
            "relative flex size-7 items-center justify-center p-0! text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          )}
          aria-label="Inbox"
          title="Inbox"
        >
          <Inbox className="size-3" aria-hidden />
        </Link>
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
        {/* Light/dark. Choosing a *palette* is not here — that lives in the
            account settings window, under Theme. This only flips the palette
            between its two halves.

            ⚠️ Both icons are rendered and CSS picks one, rather than the
            component choosing from `mode`. This is server-rendered, and a
            person whose cookie says dark would get the light icon in the HTML
            and the dark one on hydration — which React reports as a mismatch.
            `.dark` is already on `<html>` in the first response, so letting the
            stylesheet decide is both correct before any JavaScript runs and
            impossible to get out of step. */}
        <button
          type="button"
          onClick={toggleMode}
          className={cn(
            whiteStyle.button,
            "flex size-7 items-center justify-center p-0! text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          )}
          aria-label="Switch between light and dark"
          title="Light / dark"
        >
          <MoonStar className="size-3 dark:hidden" aria-hidden />
          <Sun className="hidden size-3 dark:block" aria-hidden />
        </button>
      </div>
    </header>
  );
}
