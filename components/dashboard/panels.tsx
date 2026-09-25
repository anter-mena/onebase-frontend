"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CirclePlus,
  History,
  RefreshCcw,
  Send,
  TriangleAlert,
  UserPlus,
} from "lucide-react";
import { cn } from "cn";

import { PaymentMethodCard } from "@/components/settings/paymentMethodCard";
import { paymentMethods } from "@/components/settings/paymentMethodsSample";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { money } from "@/lib/format";
import { recentClients, renewalsDue } from "@/lib/dashboard/sample";

/** The card every panel on this page sits in. */
export function Panel({
  title,
  note,
  action,
  children,
  className,
  contentClassName,
}: {
  title: string;
  note?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /**
   * Overrides the gap between the header and the content.
   *
   * <p>`mt-4` is right when the content is a chart or a list — a clear break
   * below the heading. It is wrong when the first thing in the content is
   * another line of description, which wants to sit with the note above it and
   * read as one block rather than as a paragraph that has drifted.
   */
  contentClassName?: string;
}) {
  return (
    <section
      aria-label={title}
      className={cn("flex min-w-0 flex-col rounded-xl border bg-card p-4", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium">{title}</h2>
          {note ? <p className="mt-0.5 truncate text-[0.65rem] text-muted-foreground">{note}</p> : null}
        </div>
        {action}
      </div>
      <div className={cn("mt-4 min-w-0 flex-1", contentClassName)}>{children}</div>
    </section>
  );
}

/**
 * The renewals that are already late.
 *
 * <p>⚠️ Overdue is marked with an icon and the word, not with red alone — the
 * same rule the status pills follow. Red is the reinforcement.
 */
export function RenewalsPanel({ className }: { className?: string }) {
  const overdue = renewalsDue.filter((row) => row.overdue);
  const owed = overdue.reduce((total, row) => total + row.amount, 0);

  return (
    <Panel
      className={className}
      title="Needs chasing"
      note={`${overdue.length} overdue · ${money(owed)} at risk`}
      action={
        <Link
          href="/renewals"
          className="inline-flex shrink-0 items-center gap-1 text-[0.65rem] font-medium text-muted-foreground hover:text-foreground"
        >
          All
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      }
    >
      {/* `pt-2` on top of the Panel's own 16px, so the first name is clearly
          below the header rather than reading as the next line of it. The rows
          carry avatars and two lines of text each — at 16px the block started
          before the header had finished. */}
      <ul className="flex flex-col gap-3 pt-2">
        {renewalsDue.map((row) => (
          <li key={row.name} className="flex items-center gap-2.5">
            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg text-[0.6rem] font-semibold", row.color)}>
              {row.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium">{row.name}</span>
              <span className="mt-0.5 flex items-center gap-1 text-[0.6rem] text-muted-foreground">
                {row.overdue ? (
                  <TriangleAlert className="size-2.5 shrink-0" style={{ color: "var(--viz-critical)" }} aria-hidden />
                ) : null}
                {row.endsIn}
              </span>
            </span>
            {row.amount > 0 ? (
              <span className="shrink-0 text-xs font-medium tabular-nums">{money(row.amount)}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/*
 * ⚠️ `ActivityPanel` used to live here — "Recent activity", a log of the last
 * few payments and refunds. It shared the sidebar with the payment card and was
 * replaced by `RenewalsPanel`, which earns the slot: a log says what already
 * happened, and the sidebar is the one part of the page that is always on
 * screen. `recentActivity` is still in the sample data if it is wanted again.
 */

const quickActions = [
  { label: "New client", icon: UserPlus, href: "/clients" },
  { label: "Renewals", icon: RefreshCcw, href: "/renewals" },
  { label: "Send", icon: Send, href: "/inbox" },
  { label: "History", icon: History, href: "/clients" },
] as const;

/**
 * The account's own money, and the things done with it most often.
 *
 * <p>The card is the component the Payment methods screen already uses, not a
 * second drawing of one — so a change to the artwork shows up in both places,
 * and it keeps the default look here for the same reason it does there.
 *
 * <p>⚠️ <b>When this panel is told to grow, the panel grows — never the card
 * inside it.</b> The artwork is a fixed piece at a fixed height; stretching it
 * is what a bank card looks like when it is wrong. The three blocks share the
 * extra room instead, with the contacts row pinned to the bottom edge.
 */
export function PaymentPanel({ className }: { className?: string }) {
  const method = paymentMethods[0];

  return (
    <Panel
      className={className}
      title="Payment methods"
      note="Where clients pay you"
      action={
        <Link
          href="/configuration?tab=payment-methods"
          className="inline-flex shrink-0 items-center gap-1 text-[0.65rem] font-medium text-muted-foreground hover:text-foreground"
        >
          Manage
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      }
    >
      {/* The three blocks spread down the panel, with the slack shared four
          ways rather than two.
          `justify-between` put every spare pixel into the two gaps around the
          quick actions and none above the card or below the contacts, which
          left the actions marooned in the middle of the panel. `evenly` adds
          the ends to the count: the same total is divided into space above the
          card, either side of the actions and under the contacts, so each gap
          is half what it was and the blocks sit in the panel rather than being
          pushed to its corners.

          `gap-3` is the floor for when there is no slack at all — below `xl`
          this panel is not stretched, and `evenly` has nothing to hand out. */}
      <div className="flex h-full flex-col justify-evenly gap-3">
      {/* Full width of the panel, at its own 12rem height.
          The card is not what gets resized here — the column is. Three earlier
          attempts fought the card itself: a 20rem cap left a strip of empty
          panel beside it, a bank card ratio filled the strip but grew it to
          ~19rem, and a shorter card fixed a height nobody had complained
          about. Narrowing the column instead makes the card smaller and leaves
          no gap, because the card simply fills it. */}
      <div className="flex">
        <PaymentMethodCard
          // Shorter on a phone, and only on a phone. `min-h-48` (12rem) is the
          // height the Payment methods grid uses, where the card is roughly as
          // wide as a card should be; on a narrow column that same height stops
          // looking like a card and starts looking like a block.
          //
          // 10.5rem is the midpoint: 12rem read as too tall here and 9rem as
          // too short, so this splits them rather than stepping to the next
          // scale value and landing near one end again.
          //
          // ⚠️ The artwork's height is fixed and stays that way. When this
          // panel has to be taller the panel grows — see the wrapper below.
          //
          // `max-sm:` rather than a new base plus an `sm:` override, so the
          // shared height stays the one thing stated — this only subtracts from
          // it below 640px.
          className="max-sm:min-h-[10.5rem]"
          provider={method.id}
          active={method.active}
          methodName={method.name}
          amount={method.amount}
          currency={method.currency}
          holder={method.holder}
          networks={method.networks}
        />
      </div>

      {/* No margins on the blocks any more — the column above spaces them. A
          `mt-*` here would be added on top of the distributed gap and pull the
          middle block off centre. */}
      <div className="grid grid-cols-4 gap-2">
        {quickActions.map(({ label, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center gap-1 text-[0.6rem] text-muted-foreground hover:text-foreground"
          >
            <span className={cn(whiteStyle.button, "flex size-8 items-center justify-center p-0!")}>
              <Icon className="size-3.5" aria-hidden />
            </span>
            {label}
          </Link>
        ))}
      </div>

      {/* No `pb` of its own — the column's `evenly` now leaves a gap under
          this block, and a padding on top of that would double it. */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">In touch recently</p>
          <Link
            href="/clients"
            aria-label="All clients"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        <ul className="mt-2 flex items-center">
          {recentClients.map((client, index) => (
            <li key={client.name} className={index > 0 ? "-ml-2" : undefined}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Link
                      href="/clients"
                      aria-label={client.name}
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full text-[0.6rem] font-semibold ring-2 ring-card transition-transform hover:-translate-y-0.5",
                        client.color,
                      )}
                    />
                  }
                >
                  {client.initials}
                </TooltipTrigger>
                <TooltipContent>{client.name}</TooltipContent>
              </Tooltip>
            </li>
          ))}
          <li className="-ml-2">
            <Link
              href="/clients"
              aria-label="Add a client"
              className="flex size-7 items-center justify-center rounded-full border border-dashed bg-card text-muted-foreground ring-2 ring-card hover:text-foreground"
            >
              <CirclePlus className="size-3.5" aria-hidden />
            </Link>
          </li>
        </ul>
      </div>
      </div>
    </Panel>
  );
}
