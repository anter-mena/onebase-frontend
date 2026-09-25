import { Command } from "lucide-react";
import { cn } from "cn";

import receipt from "@/components/clients/receipt.module.css";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import { exactMoney } from "@/lib/format";
import type { Client, ClientTransaction } from "@/lib/clients/sample";

/**
 * What a client's payments came to, as a ticket.
 *
 * <p>⚠️ Every line comes from `transactions`, and every total is their sum —
 * not `client.revenue` quoted again. It is handed the same array the table
 * beside it renders, so a payment added there is on this slip the same render.
 * A receipt added up independently of the ledger beside it is a receipt that
 * will eventually disagree with it.
 */

/** "12 Jan 2026". UTC and a fixed locale, so server and browser agree. */
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const formatDate = (iso: string) => dateFormatter.format(new Date(`${iso}T00:00:00Z`));

/** One line of the receipt's details: label on the left, value on the right. */
function ReceiptRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={receipt.muted}>{label}</dt>
      <dd className="truncate text-right tabular-nums">{children}</dd>
    </div>
  );
}

export function EarningsReceipt({
  client,
  transactions,
}: {
  client: Client;
  /** Newest first — the head of the list is the latest payment. */
  transactions: readonly ClientTransaction[];
}) {
  const paid = transactions.reduce((total, entry) => total + entry.amount, 0);
  const spent = transactions.reduce((total, entry) => total + (entry.expense ?? 0), 0);
  const uncosted = transactions.filter((entry) => entry.expense === null).length;
  const clientNumber = String(client.id).padStart(4, "0");
  const latest = transactions[0];
  // ⚠️ Interface phase: composed from the client and how many payments there
  // are, so it is stable and moves on when a payment is added. The API will
  // issue the real one; nothing reads this back.
  const reference = `OB-${clientNumber}-${String(transactions.length).padStart(3, "0")}`;

  return (
    // A flex column so the ticket inside can take the row's height — this
    // section is the grid item, and without it only the wrapper would grow
    // while the ticket stayed short inside it.
    //
    // ⚠️ `min-h-0` at every level down to the list. A flex item will not shrink
    // below its content by default, so a single missing one lets twelve lines
    // push the ticket taller than the row, and the list never gets a height
    // small enough to scroll.
    <section aria-label="Receipt" className="flex min-h-0 min-w-0 flex-col">
      <div className={cn(receipt.shadow, "flex min-h-0 flex-1 flex-col")}>
        <div className={cn(receipt.ticket, "flex min-h-0 flex-1 flex-col")}>
          {/* Exactly `--notch-y` tall, so the tear line under it lands on the
              notches whatever the header says. */}
          <div className="flex h-(--notch-y) shrink-0 flex-col items-center justify-center px-6 text-center">
            {/* The workspace's mark, drawn exactly as the sidebar and the login
                page draw it — the black skin with the Command glyph — so the
                slip reads as issued by One Base. */}
            <span
              aria-label="One Base"
              role="img"
              className={cn(blackStyle.button, "flex size-11 items-center justify-center p-0!")}
            >
              <Command className="size-5" aria-hidden />
            </span>
            <h2 className="mt-3 text-sm font-medium">
              {transactions.length ? "Earnings receipt" : "No payments yet"}
            </h2>
            <p className={cn(receipt.muted, "mt-0.5 text-[0.6rem]")}>
              {client.name} · #{clientNumber}
            </p>
          </div>

          <div className={receipt.rule} />

          <dl className="flex shrink-0 flex-col gap-3 px-6 py-5 text-[0.7rem]">
            <ReceiptRow label="Reference number">{transactions.length ? reference : "—"}</ReceiptRow>
            <ReceiptRow label="Latest payment">{latest ? formatDate(latest.at) : "—"}</ReceiptRow>
            {/* The latest payment's method, not the client's default: once a
                payment can be added by hand, the two need not match. */}
            <ReceiptRow label="Payment method">
              {!latest || latest.method === "Not set" ? "—" : latest.method}
            </ReceiptRow>
          </dl>

          <div className={receipt.rule} />

          {transactions.length === 0 ? (
            <p className={cn(receipt.muted, "px-6 py-5 text-center text-[0.7rem]")}>
              Nothing earned from this client yet.
            </p>
          ) : (
            // Each payment answers one question — what did it leave? — so the
            // net is the figure on the right, and the sum that produced it sits
            // underneath in the muted ink, where it can be checked without
            // competing with the answer.
            //
            // The only part of the slip that scrolls. The header above and the
            // totals below stay put, so however long the history, the answer
            // is always on screen — you scroll the lines, not the total.
            <ul className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto overscroll-contain px-6 py-5 [scrollbar-gutter:stable]">
              {transactions.map((entry) => (
                <li key={entry.id} className="flex items-start justify-between gap-3 text-[0.7rem]">
                  <span className="min-w-0">
                    <span className="block truncate">{entry.description}</span>
                    {/* The type rides on the date line: the description is now
                        only the plan, and "New plan" or "Renewal" is what tells
                        two identical plans apart on a slip. */}
                    <span className={cn(receipt.muted, "mt-0.5 block text-[0.6rem] tabular-nums")}>
                      {formatDate(entry.at)} · {entry.kind}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-medium tabular-nums">
                      {exactMoney(entry.amount - (entry.expense ?? 0))}
                    </span>
                    <span className={cn(receipt.muted, "mt-0.5 block text-[0.6rem] tabular-nums")}>
                      {exactMoney(entry.amount)}
                      {entry.expense === null ? " · cost not on file" : ` − ${exactMoney(entry.expense)}`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* `mt-auto`: when the column is stretched, the totals drop to the
              foot of the slip, where totals belong, and the spare height opens
              above them rather than under the scallops. `pb-9` keeps the
              footnote clear of the scalloped edge. */}
          <div className="mt-auto shrink-0">
            <div className={receipt.rule} />
            <dl className="flex flex-col gap-2 px-6 pt-5 text-[0.7rem]">
              <ReceiptRow label="Earned">{exactMoney(paid)}</ReceiptRow>
              <ReceiptRow label="Expenses">{spent ? `− ${exactMoney(spent)}` : exactMoney(0)}</ReceiptRow>
            </dl>
            <div className="flex items-baseline justify-between gap-3 px-6 pt-4">
              <span className="text-xs font-medium">Net earnings</span>
              <span className="text-lg font-semibold tabular-nums">{exactMoney(paid - spent)}</span>
            </div>
            <p className={cn(receipt.muted, "px-6 pt-3 pb-9 text-center text-[0.6rem] leading-relaxed")}>
              All time, after plan and perk costs. Before panel credit.
              {/* ⚠️ Said out loud rather than left in the arithmetic. A cost
                  that is not on file is counted as nothing, and a net figure
                  that silently includes that is higher than the truth. */}
              {uncosted > 0
                ? ` ${uncosted} ${uncosted === 1 ? "payment has" : "payments have"} no plan cost on file and ${uncosted === 1 ? "is" : "are"} counted in full.`
                : null}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
