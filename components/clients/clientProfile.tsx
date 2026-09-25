import Link from "next/link";
import { CreditCard, Landmark, Mail, MessageCircle, Phone } from "lucide-react";
import { cn } from "cn";

import { BrandGlyph } from "@/components/clients/brandGlyph";
import { CardLink, InfoCard } from "@/components/clients/infoCard";
import { ClientNote } from "@/components/clients/clientNote";
import { CurrencyFlag } from "@/components/settings/currencyFlag";
import type { ClientCountry } from "@/lib/clients/country";
import {
  type Client,
  type ClientStatus,
  type ClientTransaction,
  type PaymentMethod,
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

const paymentIcons: Partial<Record<PaymentMethod, typeof CreditCard>> = {
  Card: CreditCard,
  "Bank transfer": Landmark,
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

export function ClientProfile({
  client,
  country,
  transactions,
}: {
  client: Client;
  /** From the phone number — `null` when the number does not say. */
  country: ClientCountry | null;
  /** Newest first — the head is the payment that set the current plan. */
  transactions: readonly ClientTransaction[];
}) {
  const clientNumber = String(client.id).padStart(4, "0");

  // ⚠️ The current plan is whatever the latest payment bought — its term, its
  // devices, its brand, its method. Not `client.duration` and friends: those
  // describe the client record, and the moment a payment is added they are
  // out of date while this is not.
  const current = transactions[0];
  const PaymentIcon = current ? paymentIcons[current.method] : undefined;
  const endsAt = current?.months ? addMonths(current.at, current.months) : null;

  return (
    // ⚠️ `xl:overflow-y-auto` is a safety net, not a feature: the three cards
    // fit a laptop screen, but on a short window the column scrolls rather
    // than being cut off at the row's edge.
    <div className="flex min-w-0 flex-col gap-4 xl:min-h-0 xl:overflow-y-auto">
      {/* ── Who they are ─────────────────────────────────────────────── */}
      <section aria-label="Client" className="rounded-xl border bg-card px-5 py-6 text-center">
        <span
          className={cn(
            "mx-auto flex size-16 items-center justify-center rounded-xl text-lg font-semibold",
            client.color,
          )}
        >
          {client.initials}
        </span>
        <h2 className="mt-3 truncate text-base font-semibold">{client.name}</h2>
        {/* The country rides on the id line: it is context for everything
            below — which calling code, which time zone to call in — without
            being worth a line of its own. Absent, not "Unknown", when the
            number does not say. */}
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

        {/* Links, not text: on a phone the number is a tap away from a call,
            and on a desktop the address opens a draft. */}
        <div className="mt-3 flex flex-col items-center gap-1 text-xs text-muted-foreground">
          <a href={`tel:${client.phone.replaceAll(" ", "")}`} className="inline-flex items-center gap-1.5 tabular-nums hover:text-foreground">
            <Phone className="size-3" aria-hidden />
            {client.phone}
          </a>
          {client.email ? (
            <a href={`mailto:${client.email}`} className="inline-flex max-w-full items-center gap-1.5 hover:text-foreground">
              <Mail className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{client.email}</span>
            </a>
          ) : null}
        </div>

        {/* The channel they are reached on, in WhatsApp's own green — the one
            spot of colour on the card, and it means "you can message them". */}
        <Link
          href="/whatsapp-inbox"
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          <MessageCircle className="size-3" aria-hidden />
          WhatsApp conversation
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-[0.6rem] font-medium",
            client.status === "Drop" && "text-destructive",
          )}>
            <span aria-hidden className={cn("size-1.5 rounded-full", statusDots[client.status])} />
            {client.status}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[0.6rem] font-medium">
            <BrandGlyph src={client.brandLogo} className="size-3" />
            {client.brand}
          </span>
        </div>
      </section>

      {/* ── What they are on right now ───────────────────────────────── */}
      <InfoCard title="Current plan" action={<CardLink href="/configuration?tab=subscriptions">Plans</CardLink>}>
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
                {current.method === "Not set" ? (
                  "—"
                ) : (
                  <>
                    {PaymentIcon ? <PaymentIcon className="size-3 shrink-0 text-muted-foreground" aria-hidden /> : null}
                    <span className="truncate">{current.method}</span>
                  </>
                )}
              </Fact>
              <Fact label="Started">{formatDate(current.at)}</Fact>
              {/* The term's own end — the paid date plus what was bought. */}
              <Fact label="Ends">{endsAt ? formatDate(endsAt) : "—"}</Fact>
          </dl>
        ) : (
          <p className="text-xs text-muted-foreground">
            {client.status === "Trial"
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
      <ClientNote initialNote={client.note} className="xl:min-h-40 xl:flex-[1_0_auto]" />
    </div>
  );
}
