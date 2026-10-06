import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { cn } from "cn";

import { ReceiptMark, ReceiptRow } from "@/components/clients/earningsReceipt";
import { PrintReceiptBar } from "@/components/clients/printReceiptBar";
import receipt from "@/components/clients/receipt.module.css";
import { LoadError } from "@/components/errors/loadError";
import { getPaymentReceipt } from "@/lib/clients/clients";
import { providerLabels } from "@/lib/clients/types";
import { exactMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "Receipt | One Base",
};

/** "6 Oct 2026". A calendar date: read in UTC so it never moves. */
const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const formatDate = (iso: string) => dateFormatter.format(new Date(`${iso}T00:00:00Z`));

/**
 * ⚠️ Black on white whatever the theme: a receipt printer prints ink, not a dark
 * mode. The slip is the client page's ticket; these redefine the tokens it is
 * drawn from, for this page only.
 */
const paper = {
  "--card": "#ffffff",
  "--card-foreground": "#000000",
  "--muted-foreground": "#4b4b4b",
  "--border": "#000000",
  "--primary": "#ffffff",
  "--foreground": "#000000",
  printColorAdjust: "exact",
  WebkitPrintColorAdjust: "exact",
} as CSSProperties;

/**
 * One payment's receipt, sized for an 80 mm receipt printer (decided
 * 2026-10-06): the client page's ticket, made for the client — what they bought
 * and paid, never what it cost us. Outside the app shell (the `(print)` group),
 * so only the slip is printed; the proxy still asks for a sign-in.
 */
export default async function PaymentReceiptPage({ params }: { params: Promise<{ id: string; paymentId: string }> }) {
  const { id, paymentId } = await params;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(paymentId)) notFound();
  const result = await getPaymentReceipt(Number(id), Number(paymentId));
  if (!result.ok && result.error.status === 404) notFound();
  if (!result.ok) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <LoadError title="This receipt could not be loaded." reason={result.error.message} />
      </div>
    );
  }

  const { client, payment } = result.data;
  const clientNumber = String(client.id).padStart(4, "0");
  const plan = `${payment.months} ${payment.months === 1 ? "month" : "months"} · ${payment.devices} ${payment.devices === 1 ? "device" : "devices"}`;
  const method = payment.paymentProvider ? providerLabels[payment.paymentProvider] : "—";
  const privatePrice = payment.amount !== payment.planPrice;

  return (
    <main className="flex min-h-svh flex-col items-center gap-5 bg-muted/40 px-4 py-8 print:block print:min-h-0 print:bg-white print:p-0">
      {/* 80 mm wide, as long as the slip; no page margins — the printer's own. */}
      <style>{"@page { size: 80mm auto; margin: 0; } @media print { html, body { background: #fff !important; } }"}</style>
      <PrintReceiptBar />

      <div style={paper} className={cn(receipt.shadow, "w-[80mm] print:filter-none")}>
        <article className={cn(receipt.ticket, "flex flex-col text-[11px]")} aria-label="Receipt">
          <div className="flex h-(--notch-y) shrink-0 flex-col items-center justify-center px-5 text-center">
            <ReceiptMark />
            <h1 className="mt-3 text-sm font-semibold">Payment receipt</h1>
            <p className={cn(receipt.muted, "mt-0.5 text-[10px]")}>
              {client.name} · #{clientNumber}
            </p>
          </div>

          <div className={receipt.rule} />

          <dl className="flex flex-col gap-2 px-5 py-4">
            <ReceiptRow label="Receipt no.">OB-{clientNumber}-{String(payment.id).padStart(5, "0")}</ReceiptRow>
            <ReceiptRow label="Date">{formatDate(payment.paidOn)}</ReceiptRow>
            <ReceiptRow label="Type">{payment.kind === "NEW_PLAN" ? "New plan" : "Renewal"}</ReceiptRow>
            <ReceiptRow label="Brand">{payment.brandName ?? "—"}</ReceiptRow>
            <ReceiptRow label="Paid by">{payment.paymentMethodName ? `${method} · ${payment.paymentMethodName}` : method}</ReceiptRow>
            {client.phone ? (
              <ReceiptRow label="Phone">{parsePhoneNumberFromString(client.phone)?.formatInternational() ?? client.phone}</ReceiptRow>
            ) : null}
          </dl>

          <div className={receipt.rule} />

          <ul className="flex flex-col gap-2.5 px-5 py-4">
            <li className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block font-medium">{plan}</span>
                <span className={cn(receipt.muted, "mt-0.5 block text-[10px] tabular-nums")}>
                  {formatDate(payment.startsOn)} → {formatDate(payment.endsOn)}
                </span>
              </span>
              <span className="shrink-0 font-medium tabular-nums">{exactMoney(payment.planPrice)}</span>
            </li>
            {payment.perks.map((perk) => (
              <li key={perk.perkId} className="flex items-start justify-between gap-3">
                <span className="min-w-0">{perk.name} ×{perk.quantity}</span>
                <span className={cn(receipt.muted, "shrink-0")}>included</span>
              </li>
            ))}
          </ul>

          <div className={receipt.rule} />

          <dl className="flex flex-col gap-2 px-5 pt-4">
            {privatePrice ? <ReceiptRow label="List price">{exactMoney(payment.planPrice)}</ReceiptRow> : null}
            {privatePrice ? (
              <ReceiptRow label={payment.amount < payment.planPrice ? "Discount" : "Adjustment"}>
                {payment.amount < payment.planPrice ? "− " : "+ "}
                {exactMoney(Math.abs(payment.planPrice - payment.amount))}
              </ReceiptRow>
            ) : null}
          </dl>
          <div className="flex items-baseline justify-between gap-3 px-5 pt-3">
            <span className="text-xs font-semibold">Total paid</span>
            <span className="text-lg font-semibold tabular-nums">{exactMoney(payment.amount)}</span>
          </div>
          <p className={cn(receipt.muted, "px-5 pt-3 pb-9 text-center text-[10px] leading-relaxed")}>
            Valid until {formatDate(payment.endsOn)}. Thank you!
          </p>
        </article>
      </div>
    </main>
  );
}
