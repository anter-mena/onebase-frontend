"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CirclePlus,
  History,
  RefreshCcw,
  RotateCcw,
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
import { recentActivity, recentClients, renewalsDue } from "@/lib/dashboard/sample";

/** The card every panel on this page sits in. */
export function Panel({
  title,
  note,
  action,
  children,
  className,
}: {
  title: string;
  note?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
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
      <div className="mt-4 min-w-0 flex-1">{children}</div>
    </section>
  );
}

/**
 * The renewals that are already late.
 *
 * <p>⚠️ Overdue is marked with an icon and the word, not with red alone — the
 * same rule the status pills follow. Red is the reinforcement.
 */
export function RenewalsPanel() {
  const overdue = renewalsDue.filter((row) => row.overdue);
  const owed = overdue.reduce((total, row) => total + row.amount, 0);

  return (
    <Panel
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
      <ul className="flex flex-col gap-3">
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

const activityLook = {
  payment: { icon: BadgeCheck, label: "Paid", tone: "var(--viz-good)" },
  renewal: { icon: RefreshCcw, label: "Renewed", tone: "var(--viz-1)" },
  signup: { icon: UserPlus, label: "New", tone: "var(--viz-1)" },
  refund: { icon: RotateCcw, label: "Refunded", tone: "var(--viz-2)" },
  failed: { icon: TriangleAlert, label: "Failed", tone: "var(--viz-critical)" },
} as const;

/**
 * What happened lately.
 *
 * <p>Each row carries its outcome as an icon and a word as well as a colour, so
 * "Failed" is never a red thing somebody has to know the code for.
 */
export function ActivityPanel() {
  return (
    <Panel title="Recent activity" note="Newest first" className="min-h-0">
      <ul className="flex flex-col divide-y divide-border/80">
        {recentActivity.map((row) => {
          const look = activityLook[row.kind];
          const Icon = look.icon;

          return (
            <li key={row.id} className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0">
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `color-mix(in oklch, ${look.tone} 14%, transparent)` }}
              >
                <Icon className="size-3.5" style={{ color: look.tone }} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">{row.client}</span>
                <span className="mt-0.5 block truncate text-[0.6rem] text-muted-foreground">{row.detail}</span>
              </span>

              <span className="shrink-0 text-right">
                <span className="block text-xs font-medium tabular-nums">
                  {row.amount < 0 ? `-${money(Math.abs(row.amount))}` : money(row.amount)}
                </span>
                <span className="mt-0.5 block text-[0.6rem] text-muted-foreground">{look.label}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

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
 */
export function PaymentPanel() {
  const method = paymentMethods[0];

  return (
    <Panel
      title="Payment methods"
      note="Where clients pay you"
      action={
        <Link
          href="/settings?tab=payment-methods"
          className="inline-flex shrink-0 items-center gap-1 text-[0.65rem] font-medium text-muted-foreground hover:text-foreground"
        >
          Manage
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      }
    >
      <div className="flex">
        <PaymentMethodCard
          provider={method.id}
          active={method.active}
          methodName={method.name}
          amount={method.amount}
          currency={method.currency}
          holder={method.holder}
          networks={method.networks}
        />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {quickActions.map(({ label, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center gap-1.5 text-[0.6rem] text-muted-foreground hover:text-foreground"
          >
            <span className={cn(whiteStyle.button, "flex size-9 items-center justify-center p-0!")}>
              <Icon className="size-3.5" aria-hidden />
            </span>
            {label}
          </Link>
        ))}
      </div>

      <div className="mt-5">
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

        <ul className="mt-2.5 flex items-center">
          {recentClients.map((client, index) => (
            <li key={client.name} className={index > 0 ? "-ml-2" : undefined}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Link
                      href="/clients"
                      aria-label={client.name}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full text-[0.6rem] font-semibold ring-2 ring-card transition-transform hover:-translate-y-0.5",
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
              className="flex size-8 items-center justify-center rounded-full border border-dashed bg-card text-muted-foreground ring-2 ring-card hover:text-foreground"
            >
              <CirclePlus className="size-3.5" aria-hidden />
            </Link>
          </li>
        </ul>
      </div>
    </Panel>
  );
}
