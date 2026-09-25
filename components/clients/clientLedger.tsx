"use client";

import { useState } from "react";

import { ClientProfile } from "@/components/clients/clientProfile";
import { EarningsReceipt } from "@/components/clients/earningsReceipt";
import { TransactionsTable } from "@/components/clients/transactionsTable";
import type { ClientCountry } from "@/lib/clients/country";
import type { Client, ClientTransaction } from "@/lib/clients/sample";
import type { TransactionColumnId } from "@/lib/clients/transactionColumns";

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
 * <p>Interface phase: an added payment lives in this state until the page is
 * reloaded, the same as a deleted client on the Clients table. The API call
 * goes in `addPayments` and nothing else changes.
 */
export function ClientLedger({
  client,
  country,
  initialTransactions,
  defaultHiddenColumns,
}: {
  client: Client;
  /** From the phone number, detected on the server by the page. */
  country: ClientCountry | null;
  initialTransactions: readonly ClientTransaction[];
  /** Read from the cookie by the page, so the first HTML is already correct. */
  defaultHiddenColumns: readonly TransactionColumnId[];
}) {
  const [transactions, setTransactions] = useState(initialTransactions);

  function addPayments(payments: readonly ClientTransaction[]) {
    // Kept newest first: the receipt reads its "latest payment" and the plan
    // card its current plan from the head of the list. The sort is stable on
    // equal dates, so today’s payment goes on top.
    setTransactions((current) => [...payments, ...current].toSorted((a, b) => b.at.localeCompare(a.at)));
  }

  return (
    <>
      <ClientProfile client={client} country={country} transactions={transactions} />
      <TransactionsTable
        client={client}
        transactions={transactions}
        onAddPayments={addPayments}
        defaultHiddenColumns={defaultHiddenColumns}
      />
      <EarningsReceipt client={client} transactions={transactions} />
    </>
  );
}
