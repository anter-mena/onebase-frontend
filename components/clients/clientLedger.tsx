"use client";

import { ClientProfile, type ClientEdit } from "@/components/clients/clientProfile";
import { EarningsReceipt } from "@/components/clients/earningsReceipt";
import { TransactionsTable } from "@/components/clients/transactionsTable";
import type { ClientCountry } from "@/lib/clients/country";
import type { Client, ClientTransaction } from "@/lib/clients/sample";
import type { TransactionColumnId } from "@/lib/clients/transactionColumns";
import type { PaymentOptions } from "@/lib/clients/types";

/**
 * The three columns of a client's page, holding one list of payments between
 * them.
 *
 * <p>⚠️ <b>Why all three live here rather than each owning what it shows.</b>
 * Three things are read from the payments: the table lists them, the receipt
 * adds them up, and the Current plan card is whichever came last. A payment
 * added in the table has to reach all three in the same render — rows kept
 * inside the table would leave the receipt adding up, and the plan card
 * describing, the list the page started with. One array, handed to all three,
 * makes that disagreement impossible.
 *
 * <p>Returns three grid items, not a wrapper, so they take the page grid's
 * three columns exactly as they did as separate cards.
 *
 * <p>The list is the server's: a payment added in the window is saved, and the
 * page refreshes, so all three read the new list in the same render.
 */
export function ClientLedger({
  client,
  country,
  transactions,
  defaultHiddenColumns,
  paymentOptions,
  canDeletePayments,
  edit = null,
}: {
  /** Admins: the Delete payment button. */
  canDeletePayments: boolean;
  /** Configuration's plans, perks and brands, for Add payment. */
  paymentOptions: PaymentOptions;
  client: Client;
  /** The left card being edited (Save is in the page header). */
  edit?: ClientEdit | null;
  /** From the phone number, detected on the server by the page. */
  country: ClientCountry | null;
  /** Newest first. */
  transactions: readonly ClientTransaction[];
  /** Read from the cookie by the page, so the first HTML is already correct. */
  defaultHiddenColumns: readonly TransactionColumnId[];
}) {
  return (
    <>
      <ClientProfile client={client} country={country} transactions={transactions} edit={edit} />
      <TransactionsTable
        client={client}
        transactions={transactions}
        defaultHiddenColumns={defaultHiddenColumns}
        paymentOptions={paymentOptions}
        canDelete={canDeletePayments}
      />
      <EarningsReceipt client={client} transactions={transactions} />
    </>
  );
}
