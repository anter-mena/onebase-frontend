"use client";

import { useState, type ReactNode } from "react";
import { Tabs } from "@base-ui/react/tabs";
import {
  Database,
  LifeBuoy,
  ShieldCheck,
  SlidersHorizontal,
  SunMoon,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

import {
  DatabaseSettings,
  GeneralSettings,
  SecuritySettings,
  SupportSettings,
} from "@/components/app-shell/settingsSections";
import { ThemeChooser } from "@/components/app-shell/themeChooser";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * The account's own settings, in a window rather than on a page.
 *
 * <p>⚠️ <b>Not the Configuration screen.</b> `/configuration` is the workspace —
 * brands, plans, payment methods — and it is a destination with a URL because
 * it is where work gets done. This is the signed-in person's own preferences,
 * reached from their name in the sidebar, and it deliberately has no URL: it is
 * a detour from whatever you were doing, and closing it should put you back
 * exactly where you were.
 *
 * <p>Two panes, the shape most desktop applications use for the same job:
 * destinations down the left, one panel on the right.
 */

type SectionId = "general" | "theme" | "security" | "db" | "support";

type Section = {
  id: SectionId;
  label: string;
  icon: LucideIcon;
};

/** The ordinary destinations, in the order they are read. */
const sections: readonly Section[] = [
  { id: "general", label: "General", icon: SlidersHorizontal },
  { id: "theme", label: "Theme", icon: SunMoon },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "db", label: "DB", icon: Database },
];

/**
 * Held apart from the list above so it can sit at the foot of the rail.
 *
 * <p>Its own constant rather than a flag on the last item, because "where does
 * this go" is a fact about the rail's layout and not a property of the section.
 * Getting help is the one entry here that is not a setting, and pinning it to
 * the bottom is how most applications say so.
 */
const supportSection: Section = {
  id: "support",
  label: "Contact and Support",
  icon: LifeBuoy,
};

const allSections: readonly Section[] = [...sections, supportSection];

/**
 * What each destination shows.
 *
 * <p>⚠️ A map keyed by the same ids as the rail, rather than a chain of
 * conditionals in the render. The two lists cannot drift: a section added above
 * without a panel here is a type error, not a blank pane somebody finds later.
 */
const panels: Record<SectionId, ReactNode> = {
  general: <GeneralSettings />,
  theme: <ThemeChooser />,
  security: <SecuritySettings />,
  db: <DatabaseSettings />,
  support: <SupportSettings />,
};

export function AccountSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Sized to sit on a laptop with room around it and to shrink on anything
          smaller. p-0 and gap-0 undo the dialog's own padding, so the two panes
          run to the edges and carry their own. */}
      <DialogContent
        showCloseButton={false}
        className="h-[min(40rem,calc(100dvh-3rem))] w-[calc(100vw-1.5rem)] max-w-[47rem] gap-0 overflow-hidden rounded-2xl p-0"
      >
        <SettingsPanes />
      </DialogContent>
    </Dialog>
  );
}

/**
 * The window's contents, and everything it remembers.
 *
 * <p><b>Its own component so that every visit starts at General.</b> Base UI's
 * portal is `keepMounted={false}`, so this unmounts when the window closes and
 * is built again when it opens — which means the open section resets on its
 * own, with no effect watching a prop and no reset written by hand that a later
 * section could forget to include.
 *
 * <p>Resetting from the outside was the other option and it is worse here: the
 * window is opened by the sidebar setting a flag, not through a trigger, so
 * `onOpenChange` never fires on the way in — a reset hung off it would only run
 * on the way out, while the window is still on screen animating away.
 */
function SettingsPanes() {
  const [section, setSection] = useState<SectionId>("general");

  const active =
    allSections.find((entry) => entry.id === section) ?? allSections[0];

  return (
    <>
      {/* The window's accessible name. It carries the open section, so moving
          between them is announced rather than silent. */}
      <DialogTitle className="sr-only">Settings — {active.label}</DialogTitle>
      <DialogDescription className="sr-only">
        Your account settings for One Base.
      </DialogDescription>

      <Tabs.Root
        orientation="vertical"
        value={section}
        onValueChange={(value) => setSection(value as SectionId)}
        className="flex min-h-0 flex-1"
      >
        {/* ── Where you can go ────────────────────────────────────────────── */}
        {/* w-14 on a phone: the rail keeps its icons and drops its labels
            rather than disappearing, the same trade the app sidebar makes when
            it collapses. The labels stay in the accessibility tree through
            sr-only, so every tab is still named. */}
        <div className="flex w-14 shrink-0 flex-col border-r bg-muted/30 sm:w-52">
          {/* pt-3 on both this and the panel header opposite, so the close
              button and the section title still sit on one line while both get
              room above them. */}
          <div className="flex h-14 shrink-0 items-center px-2 pt-3">
            <DialogClose
              render={
                <button
                  type="button"
                  aria-label="Close settings"
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                />
              }
            >
              <X className="size-4" aria-hidden />
            </DialogClose>
          </div>

          {/* flex-col on the list itself, so the support entry below can claim
              the space between it and the rest with mt-auto. */}
          <Tabs.List className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2 pt-0">
            {sections.map((entry) => (
              <RailTab key={entry.id} section={entry} />
            ))}

            {/* Pushed to the foot of the rail, with a rule to say it is not
                one of the settings above, and pb-3 so it is not flush against
                the bottom edge. */}
            <div className="mt-auto flex flex-col gap-0.5 pt-2 pb-3">
              <span className="mx-2 mb-1 h-px bg-border" aria-hidden />
              <RailTab section={supportSection} />
            </div>
          </Tabs.List>
        </div>

        {/* ── What is there ──────────────────────────────────────────────── */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center border-b px-5 pt-3">
            <h2 className="truncate text-sm font-semibold">{active.label}</h2>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-5 [scrollbar-gutter:stable]">
            {allSections.map(({ id }) => (
              <Tabs.Panel key={id} value={id} className="outline-none">
                {panels[id]}
              </Tabs.Panel>
            ))}
          </div>
        </div>
      </Tabs.Root>
    </>
  );
}

function RailTab({ section }: { section: Section }) {
  const Icon = section.icon;

  return (
    <Tabs.Tab
      value={section.id}
      className={cn(
        // flex-none matters: in a column, a default flex-1 would stretch the
        // rows to fill the whole rail.
        "flex h-8 w-full flex-none items-center gap-2 rounded-lg px-2 text-xs font-normal whitespace-nowrap text-muted-foreground transition-colors",
        "justify-center sm:justify-start",
        "hover:bg-muted hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
        "data-[active]:bg-background data-[active]:font-medium data-[active]:text-foreground data-[active]:shadow-sm",
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className="sr-only truncate sm:not-sr-only">{section.label}</span>
    </Tabs.Tab>
  );
}
