"use client";

import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { cn } from "cn";

import { BrandGlyph } from "@/components/clients/brandGlyph";
import { CardLink, InfoCard } from "@/components/clients/infoCard";
import { ClientNote } from "@/components/clients/clientNote";
import { PaymentMethodLabel } from "@/components/clients/clientsTable";
import { CurrencyFlag } from "@/components/settings/currencyFlag";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ClientCountry } from "@/lib/clients/country";
import { statusFromBackend, type BackendClientStatus, type ClientDraft } from "@/lib/clients/types";
import {
  type Client,
  type ClientStatus,
  type ClientTransaction,
} from "@/lib/clients/sample";

/**
 * The left column of a client's page: who they are, what they are on, and
 * what the team should know.
 *
 * <p>Three stacked cards rather than one long list of facts, each answering one
 * question. The identity card is the one you glance at; the two below it have
 * a titled header strip, so the column can be scanned by heading the way the
 * Configuration tabs are.
 *
 * <p>⚠️ Rendered by `ClientLedger`, not by the page, because the Plan card is
 * read from the latest payment — and a payment added in the table has to
 * change the current plan in the same render, exactly as it changes the
 * receipt. No server-only APIs here for that reason: no cookies, no clock.
 */

/** The status pill's dots — the same values the Clients table uses. */
const statusDots: Record<ClientStatus, string> = {
  New: "bg-cyan-500",
  Callback: "bg-amber-500",
  Trial: "bg-blue-500",
  Pending: "bg-orange-500",
  Active: "bg-emerald-500",
  Inactive: "bg-muted-foreground/50",
  Drop: "bg-destructive",
};

/** "12 Jan 2026". UTC and a fixed locale, like every date on this page. */
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const formatDate = (iso: string) => dateFormatter.format(new Date(`${iso}T00:00:00Z`));

/**
 * The day a term bought on `iso` runs out — "2026-09-29" plus 12 months.
 *
 * <p>Calendar months in UTC, the same arithmetic that dated the sample
 * history, so a current plan's end lands on the client's end date.
 */
function addMonths(iso: string, months: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

/** One fact in the Plan card's two-column grid. */
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.65rem] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-xs">{children}</dd>
    </div>
  );
}

/** The left card being edited: the draft, and how to change it. */
export type ClientEdit = {
  draft: ClientDraft;
  onChange: (patch: Partial<ClientDraft>) => void;
  disabled: boolean;
};

const STATUS_ORDER: readonly BackendClientStatus[] = ["NEW", "CALLBACK", "TRIAL", "PENDING", "ACTIVE", "INACTIVE", "DROP"];

/**
 * ⚠️ <b>One box for both modes.</b> Every editable line sits in the same box,
 * viewing or editing — only its border shows up. So switching to edit moves
 * nothing: same height, same width, same place. The pills get a ring instead,
 * which draws outside the layout.
 */
const fieldBox = "flex w-full min-w-0 items-center justify-center gap-1.5 rounded-md border px-2 transition-colors";
const viewBox = "border-transparent";
const editBox = "border-input bg-background focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20";
const inputClassName =
  "w-full min-w-0 bg-transparent text-center text-foreground outline-none placeholder:text-muted-foreground/60 disabled:opacity-60";
const pillClassName = "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[0.6rem] font-medium";
const pickerRing = "cursor-pointer ring-1 ring-input transition-colors hover:ring-ring disabled:cursor-default disabled:opacity-60";

export function ClientProfile({
  client,
  country,
  transactions,
  edit = null,
}: {
  client: Client;
  /** From the phone number — `null` when the number does not say. */
  country: ClientCountry | null;
  /** Newest first — the head is the payment that set the current plan. */
  transactions: readonly ClientTransaction[];
  /** Set while the card is being edited (the header has Save). */
  edit?: ClientEdit | null;
}) {
  const clientNumber = String(client.id).padStart(4, "0");
  const box = cn(fieldBox, edit ? editBox : viewBox);

  // ⚠️ The current plan is whatever the latest payment bought — its term, its
  // devices, its brand, its method. Not `client.duration` and friends: those
  // describe the client record, and the moment a payment is added they are
  // out of date while this is not.
  const current = transactions[0];
  // The term's own dates when the backend sent them (a renewal starts where the
  // running term ended); else the paid date plus the term.
  const startsAt = current?.startsOn ?? current?.at;
  const endsAt = current?.endsOn ?? (current?.months ? addMonths(current.at, current.months) : null);

  // What the pill shows: the draft while editing, the saved client otherwise.
  const statusLabel = edit ? statusFromBackend[edit.draft.status] : client.status;

  return (
    // ⚠️ `xl:overflow-y-auto` is a safety net, not a feature: the three cards
    // fit a laptop screen, but on a short window the column scrolls rather
    // than being cut off at the row's edge.
    <div className="flex min-w-0 flex-col gap-4 xl:min-h-0 xl:overflow-y-auto">
      {/* ── Who they are ─────────────────────────────────────────────── */}
      <section aria-label="Client" className="relative rounded-xl border bg-card px-5 py-6 text-center">
        {/* The status in the corner: the first thing to read, and out of the
            way of the name and contact lines below it. */}
        <div className="absolute top-3 right-3">
          {edit ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={edit.disabled}
                aria-label={`Status: ${statusLabel}. Change it`}
                className={cn(pillClassName, "bg-muted", pickerRing, statusLabel === "Drop" && "text-destructive")}
              >
                <span aria-hidden className={cn("size-1.5 rounded-full", statusDots[statusLabel])} />
                {statusLabel}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="min-w-36">
                <DropdownMenuRadioGroup
                  value={edit.draft.status}
                  onValueChange={(value) => edit.onChange({ status: value as BackendClientStatus })}
                >
                  {STATUS_ORDER.map((status) => (
                    <DropdownMenuRadioItem key={status} value={status} closeOnClick className="text-xs">
                      <span aria-hidden className={cn("size-1.5 rounded-full", statusDots[statusFromBackend[status]])} />
                      {statusFromBackend[status]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className={cn(pillClassName, "bg-muted", client.status === "Drop" && "text-destructive")}>
              <span aria-hidden className={cn("size-1.5 rounded-full", statusDots[client.status])} />
              {client.status}
            </span>
          )}
        </div>
        <span
          className={cn(
            "mx-auto flex size-16 items-center justify-center rounded-xl text-lg font-semibold",
            client.color,
          )}
        >
          {client.initials}
        </span>
        <div className={cn(box, "mt-2 h-8")}>
          {edit ? (
            <input
              aria-label="Full name"
              value={edit.draft.fullName}
              onChange={(event) => edit.onChange({ fullName: event.target.value })}
              placeholder={client.username ?? "Full name"}
              maxLength={120}
              disabled={edit.disabled}
              autoFocus
              className={cn(inputClassName, "text-base font-semibold")}
            />
          ) : (
            <h2 className="truncate text-base font-semibold">{client.name}</h2>
          )}
        </div>
        {/* The country rides on the id line: it is context for everything
            below — which calling code, which time zone to call in — without
            being worth a line of its own. Absent, not "Unknown", when the
            number does not say. It is read from the saved number, so it
            changes on Save, not while typing. */}
        <p className="mt-0.5 inline-flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
          #{clientNumber}
          {country ? (
            <>
              <span aria-hidden>·</span>
              <CurrencyFlag flag={country.code} />
              {country.name}
            </>
          ) : null}
        </p>
        {/* The WhatsApp name, once the team has typed a real one — so the chat
            can still be matched to the person. From the saved client, so the
            line never appears or goes while typing. */}
        {client.username && client.fullName ? (
          <p className="mt-0.5 truncate text-[0.65rem] text-muted-foreground">@{client.username}</p>
        ) : null}

        {/* Links, not text: on a phone the number is a tap away from a call,
            and on a desktop the address opens a draft. */}
        {/* One line, phone | email, like the Clients table. Fixed tracks — the
            phone's is just what a grouped number needs — so editing changes no
            width; a long email is cut with "…". */}
        <div className="mt-3 grid grid-cols-[9.5rem_1px_minmax(0,1fr)] items-center gap-1 text-xs text-muted-foreground">
          <div className={cn(box, "h-7 px-1.5")}>
            <Phone className="size-3 shrink-0" aria-hidden />
            {edit ? (
              <input
                type="tel"
                inputMode="tel"
                aria-label="Phone, with the country code"
                value={edit.draft.phone}
                onChange={(event) => edit.onChange({ phone: event.target.value })}
                placeholder="+212 6 12 34 56 78"
                maxLength={30}
                disabled={edit.disabled}
                className={cn(inputClassName, "text-xs tabular-nums")}
              />
            ) : client.phone ? (
              <a href={`tel:${client.phoneE164 ?? client.phone.replaceAll(" ", "")}`} className="truncate tabular-nums hover:text-foreground">
                {client.phone}
              </a>
            ) : (
              <span>No phone</span>
            )}
          </div>
          <span className="h-4 w-px bg-border" aria-hidden />
          <div className={cn(box, "h-7 px-1.5")}>
            <Mail className="size-3 shrink-0" aria-hidden />
            {edit ? (
              <input
                type="email"
                aria-label="Email"
                value={edit.draft.email}
                onChange={(event) => edit.onChange({ email: event.target.value })}
                placeholder="name@example.com"
                maxLength={255}
                disabled={edit.disabled}
                className={cn(inputClassName, "text-xs")}
              />
            ) : client.email ? (
              <a href={`mailto:${client.email}`} className="truncate hover:text-foreground">
                {client.email}
              </a>
            ) : (
              <span className="truncate">No email</span>
            )}
          </div>
        </div>

        {/* The channel they are reached on, in WhatsApp's own green — the one
            spot of colour on the card, and it means "you can message them". */}
        {client.conversationId ? (
          <Link
            href={`/whatsapp-inbox?c=${client.conversationId}`}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            <MessageCircle className="size-3" aria-hidden />
            WhatsApp conversation
          </Link>
        ) : (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageCircle className="size-3" aria-hidden />
            No WhatsApp conversation yet
          </p>
        )}

      </section>

      {/* ── What they are on right now ───────────────────────────────── */}
      <InfoCard title="Current plan" className="shrink-0" action={<CardLink href="/configuration?tab=subscriptions">Plans</CardLink>}>
        {current ? (
          // Just the facts, two by two. The term leads because it is what the
          // plan is — how long they bought — and everything else qualifies it.
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Fact label="Term">
              {current.months ? `${current.months} ${current.months === 1 ? "month" : "months"}` : "Not on file"}
            </Fact>
            <Fact label="Devices">
              {current.devices} {current.devices === 1 ? "device" : "devices"}
            </Fact>
              <Fact label="Brand">
                <BrandGlyph src={current.brandLogo} className="size-3" />
                <span className="truncate">{current.brand}</span>
              </Fact>
              <Fact label="Pays by">
                {current.method === "Not set" ? "—" : <PaymentMethodLabel method={current.method} account={current.account} />}
              </Fact>
              <Fact label="Started">{formatDate(startsAt ?? current.at)}</Fact>
              {/* The term's own end — the paid date plus what was bought. */}
              <Fact label="Ends">{endsAt ? formatDate(endsAt) : "—"}</Fact>
          </dl>
        ) : (
          <p className="text-xs text-muted-foreground">
            {client.status === "Trial" && /^\d+ days?$/.test(client.duration)
              ? `On a ${client.duration.replace(/^(\d+) days?$/, "$1-day")} trial. `
              : null}
            No plan yet — it starts with their first payment.
          </p>
        )}
      </InfoCard>

      {/* ── What the team should know ────────────────────────────────── */}
      {/* Last, and growing: it takes whatever height the column has left, so
          the column ends level with the table and the receipt, and a long note
          has the most room to be written in.

          ⚠️ `flex-[1_0_auto]`, not `flex-1`. `flex-1` is a zero basis that may
          shrink, and because the card clips (`overflow-hidden`) its minimum
          height is 0 — so on a short screen it shrank below its own content
          and cut off Save and Cancel while editing. An `auto` basis with no
          shrink means it is never smaller than what is in it; when that is
          more than the column has, the column scrolls instead. */}
      <ClientNote clientId={client.id} initialNote={client.note} className="xl:min-h-40 xl:flex-[1_0_auto]" />
    </div>
  );
}
