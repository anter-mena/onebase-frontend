"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronsUpDown, Command } from "lucide-react";
import { Collapsible } from "@base-ui/react/collapsible";
import { cn } from "cn";

import {
  appNavigation,
  getActiveSettingsValue,
  navigationSections,
  settingsNavigation,
} from "@/components/app-shell/navigation";
import { SecurityCard } from "@/components/app-shell/securityCard";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { LiquidGlassLayers } from "@/components/ui/liquifyglasse";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

type SettingsItem = (typeof settingsNavigation)[number];

// useSearchParams() lives here, not in AppSidebar: on prerendered pages it makes
// everything up to the nearest Suspense render in the browser only, and the
// whole sidebar would be missing from the first HTML.
function ActiveSettingsLinks({ items, active }: { items: readonly SettingsItem[]; active: boolean }) {
  const activeValue = getActiveSettingsValue(usePathname(), useSearchParams().get("tab"));
  return <SettingsLinks items={items} activeValue={active ? activeValue : null} />;
}

function SettingsLinks({ items, activeValue }: { items: readonly SettingsItem[]; activeValue: string | null }) {
  return (
    <ul className="ml-4 py-1">
      {items.map((sub) => {
        const subActive = activeValue === sub.value;
        return (
          <li key={sub.href} className="relative before:absolute before:top-0 before:left-0 before:h-full before:w-px before:bg-border last:before:h-1/2">
            <Link href={sub.href} aria-current={subActive ? "page" : undefined} className={cn("relative flex items-center rounded-md py-1.5 pr-2 pl-5 text-xs before:absolute before:top-1/2 before:left-0 before:h-px before:w-3 before:bg-border hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring", subActive ? "font-medium text-foreground" : "text-muted-foreground")}>
              {sub.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpen, isMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-12 shrink-0 justify-center border-b px-2 py-1.5">
        <div className="flex h-8 w-full min-w-0 items-center justify-start gap-2 overflow-visible">
          <div
            className={cn(
              blackStyle.button,
              "flex size-8 shrink-0 items-center justify-center p-0!",
            )}
          >
            <Command className="size-4" aria-hidden />
          </div>
          <div className="min-w-0 whitespace-nowrap leading-tight group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-semibold">One Base</p>
            <p className="truncate text-[0.6rem] text-muted-foreground">
              Workspace
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-1">
        {navigationSections.map((section) => (
          <SidebarGroup key={section} className="py-1.5">
            <SidebarGroupLabel className="h-5 px-2 text-[0.55rem] uppercase tracking-wider group-data-[collapsible=icon]:-mt-5">
              {section}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {appNavigation
                  .filter((item) => item.section === section)
                  .map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                    if ("items" in item) {
                      return (
                        <SidebarMenuItem key={item.href}>
                          <Collapsible.Root key={String(active)} defaultOpen={active} onOpenChange={(open) => { if (open && !isMobile) setOpen(true); }}>
                            <Collapsible.Trigger onClick={() => { if (!isMobile) setOpen(true); }} render={<SidebarMenuButton tooltip={item.label} isActive={active} className="group/settings text-xs" />}>
                              <Icon aria-hidden />
                              <span>{item.label}</span>
                              <ChevronDown aria-hidden className="ml-auto size-3.5 transition-transform group-aria-expanded/settings:rotate-180 group-data-[collapsible=icon]:hidden" />
                            </Collapsible.Trigger>
                            <Collapsible.Panel className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 data-[starting-style]:h-0 data-[ending-style]:h-0 motion-reduce:transition-none group-data-[collapsible=icon]:hidden">
                              {/* Only these links read the URL's ?tab=, so only they wait for the browser. */}
                              <Suspense fallback={<SettingsLinks items={item.items} activeValue={null} />}>
                                <ActiveSettingsLinks items={item.items} active={active} />
                              </Suspense>
                            </Collapsible.Panel>
                          </Collapsible.Root>
                        </SidebarMenuItem>
                      );
                    }

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          tooltip={item.label}
                          isActive={active}
                          render={<Link href={item.href} />}
                          className="text-xs"
                        >
                          <Icon aria-hidden />
                          <span>{item.label}</span>
                          {"indicator" in item && item.indicator ? (
                            <span
                              className="relative isolate z-10 ml-auto flex size-1.5 shrink-0 overflow-visible! whitespace-normal! group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:top-0.5 group-data-[collapsible=icon]:right-0.5"
                              aria-label="New WhatsApp messages"
                            >
                              <span className="absolute inset-0 z-0 inline-flex animate-ping rounded-full bg-red-400 opacity-70" />
                              <span className="relative z-10 inline-flex size-full rounded-full bg-red-500 ring-1 ring-background" />
                            </span>
                          ) : null}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-0 border-t p-2">
        <div className="grid grid-rows-[1fr] transition-[grid-template-rows] duration-200 ease-linear group-data-[collapsible=icon]:grid-rows-[0fr]">
          <div className="min-h-0 overflow-hidden">
            <div className="pb-2 opacity-100 transition-opacity delay-200 duration-100 group-data-[collapsible=icon]:invisible group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0">
              <SecurityCard />
            </div>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem className="flex h-12 items-center">
            <SidebarMenuButton
              size="lg"
              tooltip={{
                children: (
                  <span className="flex flex-col">
                    <span className="font-medium">Admin User</span>
                    <span className="opacity-70">admin@onebase.com</span>
                  </span>
                ),
              }}
              className="relative h-auto min-h-12 items-center justify-start gap-2 overflow-visible border-transparent bg-transparent py-2 pr-7 pl-3 text-left shadow-none group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!"
            >
              <span
                aria-hidden
                className={cn(
                  whiteStyle.button,
                  "absolute inset-0 overflow-hidden p-0! opacity-100 transition-[opacity,visibility] delay-200 duration-100 group-data-[collapsible=icon]:invisible group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0",
                )}
              >
                <LiquidGlassLayers />
              </span>
              <span
                className={cn(
                  blackStyle.button,
                  "relative flex size-8 shrink-0 items-center justify-center p-0! text-[0.65rem]! font-semibold!",
                )}
              >
                AU
              </span>
              <span className="relative min-w-0 flex-1 leading-tight opacity-100 transition-[opacity,visibility] delay-200 duration-100 group-data-[collapsible=icon]:invisible group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0">
                <span className="block truncate text-[0.7rem] font-semibold">
                  Admin User
                </span>
                <span className="block truncate text-[0.6rem] text-muted-foreground">
                  admin@onebase.com
                </span>
              </span>
              <ChevronsUpDown
                className="absolute top-1/2 right-2 size-3! shrink-0 -translate-y-1/2 text-muted-foreground opacity-100 transition-[opacity,visibility] delay-200 duration-100 group-data-[collapsible=icon]:invisible group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0"
                aria-hidden
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
