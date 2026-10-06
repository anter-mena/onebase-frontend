"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, History, TriangleAlert } from "lucide-react";
import { cn } from "cn";

import { PaymentMethodCard } from "@/components/settings/paymentMethodCard";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { exactMoney, money } from "@/lib/format";
import type { DashboardOverview } from "@/lib/dashboard/types";
import { amountFormatter, networkLogos, providerToCard } from "@/lib/paymentMethods/types";

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

const headerLinkClassName =
  "inline-flex shrink-0 items-center gap-1 text-[0.65rem] font-medium text-muted-foreground hover:text-foreground";

const AVATAR_TINTS = [
  "bg-emerald-100 text-emerald-800", "bg-violet-100 text-violet-800", "bg-amber-100 text-amber-800", "bg-sky-100 text-sky-800",
  "bg-rose-100 text-rose-800", "bg-fuchsia-100 text-fuchsia-800", "bg-cyan-100 text-cyan-800", "bg-orange-100 text-orange-800",
  "bg-indigo-100 text-indigo-800", "bg-pink-100 text-pink-800", "bg-lime-100 text-lime-800", "bg-teal-100 text-teal-800",
];

function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter((word) => /\p{L}/u.test(word));
  if (words.length === 0) return name.replace(/\D/g, "").slice(-2) || "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** "in 3 days", "ends today", "ended 5 days ago", "trial over", "waiting". */
function chaseLabel(row: DashboardOverview["chase"][number]) {
  if (row.group === "CALLBACK") return "trial over — call back";
  if (row.group === "PENDING") return "waiting for their payment";
  const days = row.daysLeft ?? 0;
  if (days === 0) return "ends today";
  if (days > 0) return `ends in ${days} ${days === 1 ? "day" : "days"}`;
  return `ended ${-days} ${days === -1 ? "day" : "days"} ago`;
}

/**
 * The most urgent of Renewals: plans ending in 10 days or less, trials to call
 * back, payments we are waiting for, and plans that ended in the last 30 days.
 *
 * <p>⚠️ Ended is marked with an icon and the words, not with red alone — the
 * same rule the status pills follow. Red is the reinforcement.
 */
export function RenewalsPanel({ rows, className }: { rows: DashboardOverview["chase"]; className?: string }) {
  const ended = rows.filter((row) => row.group === "INACTIVE").length;
  return (
    <Panel
      className={className}
      title="Needs chasing"
      note={rows.length === 0 ? "Nobody right now" : `${rows.length} to follow up${ended ? ` · ${ended} ended` : ""}`}
      action={
        <Link href="/renewals" className={headerLinkClassName}>
          All
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      }
    >
      <ul className="flex flex-col gap-3 pt-2">
        {rows.map((row) => {
          const late = row.group === "INACTIVE";
          return (
            <li key={row.client.id}>
              <Link href={`/clients/${row.client.id}`} className="group flex items-center gap-2.5">
                <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg text-[0.6rem] font-semibold", AVATAR_TINTS[row.client.id % AVATAR_TINTS.length])}>
                  {initialsOf(row.client.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium group-hover:underline">{row.client.name}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-[0.6rem] text-muted-foreground">
                    {late ? <TriangleAlert className="size-2.5 shrink-0" style={{ color: "var(--viz-critical)" }} aria-hidden /> : null}
                    {chaseLabel(row)}
                  </span>
                </span>
                {row.client.revenue > 0 ? (
                  <span className="shrink-0 text-xs font-medium tabular-nums">{money(row.client.revenue)}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

const dayFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/**
 * Where clients pay you: every account switched on, one card at a time
 * (decided 2026-10-06), with the arrows to move between them. Under the card,
 * that account's figures for the period, and History — the Ledger, filtered to
 * it.
 *
 * <p>⚠️ <b>When this panel is told to grow, the panel grows — never the card
 * inside it.</b> The artwork is a fixed piece at a fixed height; the blocks under
 * it share the extra room.
 */
export function PaymentPanel({
  methods,
  periodNote,
  periodQuery,
  className,
}: {
  methods: DashboardOverview["methods"];
  /** "this month" — what "Received" covers. */
  periodNote: string;
  /** The period in the address bar, carried to the Ledger. */
  periodQuery: string;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const count = methods.length;
  const current = count ? methods[Math.min(index, count - 1)] : null;
  const move = (step: number) => setIndex((value) => (value + step + count) % count);

  return (
    <Panel
      className={className}
      title="Payment methods"
      note={count ? `${Math.min(index, count - 1) + 1} of ${count} · where clients pay you` : "Where clients pay you"}
      action={
        <Link href="/configuration?tab=payment-methods" className={headerLinkClassName}>
          Manage
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      }
    >
      {current ? (
        <div className="flex h-full flex-col justify-evenly gap-3">
          <div className="flex items-center gap-2">
            <CarouselButton label="Previous card" disabled={count < 2} onClick={() => move(-1)}>
              <ChevronLeft className="size-3.5" />
            </CarouselButton>
            <div className="flex min-w-0 flex-1" aria-live="polite">
              <PaymentMethodCard
                key={current.id}
                className="max-sm:min-h-[10.5rem]"
                provider={providerToCard[current.provider]}
                active
                methodName={current.name}
                amount={amountFormatter.format(current.balance)}
                currency="USD"
                holder={current.holder}
                networks={networkLogos[current.cardNetwork]}
              />
            </div>
            <CarouselButton label="Next card" disabled={count < 2} onClick={() => move(1)}>
              <ChevronRight className="size-3.5" />
            </CarouselButton>
          </div>

          {count > 1 ? (
            <div className="flex justify-center gap-1.5" role="tablist" aria-label="Cards">
              {methods.map((method, at) => (
                <button
                  key={method.id}
                  type="button"
                  role="tab"
                  aria-selected={method.id === current.id}
                  aria-label={method.name}
                  onClick={() => setIndex(at)}
                  className={cn("h-1.5 rounded-full transition-all", method.id === current.id ? "w-4 bg-foreground" : "w-1.5 bg-foreground/25 hover:bg-foreground/50")}
                />
              ))}
            </div>
          ) : null}

          {/* This card's figures for the period, where the quick actions were. */}
          <dl className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-3 text-center">
            <div className="min-w-0">
              <dt className="truncate text-[0.6rem] text-muted-foreground">Received, {periodNote}</dt>
              <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums">{exactMoney(current.received)}</dd>
            </div>
            <div className="min-w-0">
              <dt className="truncate text-[0.6rem] text-muted-foreground">Payments</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums">{current.payments}</dd>
            </div>
            <div className="min-w-0">
              <dt className="truncate text-[0.6rem] text-muted-foreground">Last payment</dt>
              <dd className="mt-0.5 truncate text-sm font-semibold">{current.lastPaidOn ? dayFormatter.format(new Date(`${current.lastPaidOn}T00:00:00Z`)) : "—"}</dd>
            </div>
          </dl>

          <Link
            href={`/ledger?method=${current.id}${periodQuery ? `&${periodQuery}` : ""}`}
            className={cn(whiteStyle.button, "flex h-8 w-full items-center justify-center gap-1.5 p-0! text-[0.7rem]! font-medium!")}
          >
            <History className="size-3.5" aria-hidden />
            History — every payment to {current.name}
          </Link>
        </div>
      ) : (
        <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          No payment method switched on.
          <Link href="/configuration?tab=payment-methods" className="font-medium text-foreground underline-offset-4 hover:underline">Add one in Configuration</Link>
        </div>
      )}
    </Panel>
  );
}

function CarouselButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(whiteStyle.button, "flex size-7 shrink-0 items-center justify-center p-0! disabled:pointer-events-none disabled:opacity-35")}
    >
      {children}
    </button>
  );
}
