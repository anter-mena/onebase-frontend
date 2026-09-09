"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, Command } from "lucide-react";
import { cn } from "cn";

import {
  appNavigation,
  navigationSections,
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
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const pathname = usePathname();

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

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          tooltip={item.label}
                          isActive={pathname === item.href}
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
