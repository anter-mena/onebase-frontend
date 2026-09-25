import { ClientLedger } from "@/components/clients/clientLedger";
import { transactionsFor, type Client } from "@/lib/clients/sample";
import { countryFromPhone } from "@/lib/clients/country";
import type { TransactionColumnId } from "@/lib/clients/transactionColumns";

/**
 * Everything about one client, in three parts.
 *
 * <p>Who they are, what they have paid, and what that came to — read left to
 * right, each one narrower in scope than the last. The profile is reference,
 * the ledger is the record, and the receipt is the answer.
 *
 * <p>A server component. The profile (`ClientProfile`) is static and stays on
 * the server; the ledger and the receipt are one client component, because a
 * payment added to one has to appear on the other — see `ClientLedger`.
 */

export function ClientDetail({
  client,
  hiddenColumns,
}: {
  client: Client;
  /** The Transactions table’s hidden columns, read from the cookie by the page. */
  hiddenColumns: readonly TransactionColumnId[];
}) {
  const transactions = transactionsFor(client);
  // Worked out here, on the server, so the numbering-plan data stays out of
  // the browser bundle — the ledger below is a client component.
  const country = countryFromPhone(client.phone);

  return (
    // Side by side, the three cards are exactly the height of the page's
    // section — a height, not a floor. `xl:h-full` fixes the grid to it,
    // `grid-rows-[minmax(0,1fr)]` lets the one row shrink to that instead of
    // growing to its tallest card, and `xl:items-stretch` hands it to all
    // three. So the page itself never scrolls: a long history scrolls inside
    // the receipt, and the ledger pages and scrolls inside its own card.
    //
    // ⚠️ `minmax(0,1fr)`, not `1fr`. A plain `1fr` row has a minimum of its
    // content's height, so a twelve-line receipt would still push the row past
    // the section and bring the page scrollbar back.
    //
    // ⚠️ Only at `xl`. Stacked on a narrower screen there is no room to divide,
    // so each card is as tall as its own content and the page scrolls as usual.
    //
    // The two side columns are fixed and the ledger takes what is left, so
    // widening them narrows only the table — which scrolls sideways on its own
    // rather than squeezing its columns.
    <div className="grid min-w-0 items-start gap-4 xl:h-full xl:grid-cols-[20rem_minmax(0,1fr)_23rem] xl:grid-rows-[minmax(0,1fr)] xl:items-stretch">
      {/* All three columns: who they are, what they have paid, and what it
          came to. One client component, because all three read the same
          payments — see ClientLedger. */}
      <ClientLedger
        client={client}
        country={country}
        initialTransactions={transactions}
        defaultHiddenColumns={hiddenColumns}
      />
    </div>
  );
}
