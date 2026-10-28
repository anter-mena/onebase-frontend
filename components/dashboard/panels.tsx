"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowRight, History, TriangleAlert } from "lucide-react";
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
  const at = Math.min(index, count - 1);
  const current = count ? methods[at] : null;
  /**
   * The card being shuffled away, and which way: kept on screen for the length of
   * the shuffle (globals.css `card-shuffle-*`), then dropped when its animation ends.
   */
  const [leaving, setLeaving] = useState<{ method: DashboardOverview["methods"][number]; way: "next" | "prev" } | null>(null);
  const turn = (to: number, way: "next" | "prev") => {
    if (!current || to === at) return;
    setLeaving({ method: current, way });
    setIndex(to);
  };
  const move = (step: number) => turn((at + step + count) % count, step > 0 ? "next" : "prev");
  /** The half being hovered (or focused): its neighbour comes out from behind on that side. */
  const [leaning, setLeaning] = useState<"left" | "right" | null>(null);
  /** A dot: shuffles the shorter way round to it. */
  const go = (to: number) => turn(to, (to - at + count) % count <= count / 2 ? "next" : "prev");
  /** While a shuffle runs, no peek and no lean: the two cards crossing are the whole picture. */
  const peeking = leaving ? null : leaning;
  const neighbours = count > 1 ? { left: methods[(at - 1 + count) % count], right: methods[(at + 1) % count] } : null;

  function card(method: DashboardOverview["methods"][number]) {
    return (
      <PaymentMethodCard
        className="max-sm:min-h-[10.5rem]"
        provider={providerToCard[method.provider]}
        active
        methodName={method.name}
        amount={amountFormatter.format(method.balance)}
        currency="USD"
        holder={method.holder}
        networks={networkLogos[method.cardNetwork]}
      />
    );
  }

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
        // The dots and figures sit at the foot, on the panel's own padding; the card
        // centres in the height above (2026-10-27). `justify-evenly` spread the spare
        // height above, between and below, leaving a gap under the figures.
        <div className="flex h-full flex-col gap-3">
          {/* Each half of the card turns it (decided 2026-10-16). Hovering a half shows
              where it leads (2026-10-27): the card shrinks to 80% and steps 8% away,
              and the next (or previous) one comes out from behind it on the hovered
              side — larger, at 88%, 4% out, so it reads as the one to go to. Those
              numbers centre the pair: about 2% of the width is left free on each side
              (an earlier 86% / 94% put the card against the far edge and the neighbour
              past the near one). A turn shuffles the deck (globals.css `card-shuffle-*`).
              The outer block clips sideways at the panel's border, so the swing of a
              shuffle never runs over the next column. */}
          <div className="-mx-4 flex flex-1 flex-col justify-center overflow-x-clip px-4">
          <div className="relative flex min-w-0" aria-live="polite">
            {neighbours
              ? (["left", "right"] as const).map((side) => {
                  const shown = peeking === side;
                  return (
                    <div
                      key={side}
                      aria-hidden
                      className="pointer-events-none absolute inset-0 flex transition-[transform,opacity] duration-300 ease-out"
                      style={{
                        opacity: shown ? 0.8 : 0,
                        transform: shown ? `translateX(${side === "right" ? 4 : -4}%) scale(0.88)` : "scale(0.8)",
                      }}
                    >
                      {card(neighbours[side])}
                    </div>
                  );
                })
              : null}
            {/* Two layers on purpose: the outer one leans (inline transform), the inner
                ones play the shuffle. An animation overrides an inline transform while it
                runs, so on one element the lean would jump at the end of each shuffle. */}
            <div
              className="relative z-10 flex min-w-0 flex-1 transition-transform duration-300 ease-out"
              style={{ transform: peeking ? `translateX(${peeking === "right" ? -8 : 8}%) scale(0.8)` : undefined }}
            >
              {leaving ? (
                <div
                  key={`leaving-${leaving.method.id}`}
                  aria-hidden
                  className={cn("pointer-events-none absolute inset-0 flex", `card-shuffle-out-${leaving.way}`)}
                  onAnimationEnd={() => setLeaving(null)}
                >
                  {card(leaving.method)}
                </div>
              ) : null}
              <div
                key={current.id}
                className={cn("relative flex min-w-0 flex-1", leaving && `card-shuffle-in-${leaving.way}`)}
              >
                {card(current)}
              </div>
            </div>
            {count > 1 ? (
              <>
                <CarouselHalf side="left" label="Previous card" onLean={setLeaning} onClick={() => move(-1)} />
                <CarouselHalf side="right" label="Next card" onLean={setLeaning} onClick={() => move(1)} />
              </>
            ) : null}
          </div>
          </div>

          {/* The dots and the figures as one block, 12px apart (2026-10-27): spread
              evenly on their own, the dots floated halfway between card and figures. */}
          <div className="flex flex-col gap-3">
          {count > 1 ? (
            <div className="flex justify-center gap-1.5" role="tablist" aria-label="Cards">
              {methods.map((method, at) => (
                <button
                  key={method.id}
                  type="button"
                  role="tab"
                  aria-selected={method.id === current.id}
                  aria-label={method.name}
                  onClick={() => go(at)}
                  className={cn("h-1.5 rounded-full transition-all", method.id === current.id ? "w-4 bg-foreground" : "w-1.5 bg-foreground/25 hover:bg-foreground/50")}
                />
              ))}
            </div>
          ) : null}

          {/* This card's figures for the period, and History — the only way into the Ledger. */}
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
          <dl className="grid min-w-0 flex-1 grid-cols-3 gap-2 text-center">
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
            aria-label={`History — every payment to ${current.name}`}
            title={`History — every payment to ${current.name}`}
            className={cn(whiteStyle.button, "flex size-8 shrink-0 items-center justify-center p-0!")}
          >
            <History className="size-3.5" aria-hidden />
          </Link>
          </div>
          </div>
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

/**
 * Half of the card, as an invisible button. Hovered (or focused), it tells the panel
 * which neighbour to bring out from behind the card; clicked, it turns to it.
 */
function CarouselHalf({
  side,
  label,
  onLean,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  onLean: (side: "left" | "right" | null) => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onMouseEnter={() => onLean(side)}
      onMouseLeave={() => onLean(null)}
      onFocus={() => onLean(side)}
      onBlur={() => onLean(null)}
      className={cn("absolute inset-y-0 z-20 w-1/2 cursor-pointer outline-none", side === "left" ? "left-0" : "right-0")}
    />
  );
}
