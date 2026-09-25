/**
 * Which columns a client's Transactions table shows, and how that survives a
 * reload — the same arrangement as `columns.ts` for the Clients table.
 *
 * <p>⚠️ A plain module, not part of `transactionsTable`, for the reason that
 * file gives: a `"use client"` module's exports reach a server component as
 * references rather than values, and the page has to read this cookie itself.
 *
 * <p>A cookie rather than localStorage, so the server draws the right columns
 * in the first HTML instead of drawing all of them and dropping some as React
 * hydrates. One preference for every client's page: it is a way of reading
 * the table, not a fact about any one client.
 */

/**
 * The columns a reader can turn off.
 *
 * <p>⚠️ Select, Date and Description are not here and cannot be hidden. A row
 * has to stay identifiable — which payment, when — or the table stops being a
 * ledger and becomes a column of numbers with nothing to hang them on.
 *
 * <p>`width` is the column's width in pixels — the same number as the Tailwind
 * class on its header. ⚠️ Change one and change the other: the table's minimum
 * width is summed from these, and if they disagree the columns are squeezed
 * below their declared size and the headings overlap.
 */
export type TransactionColumnId = "brand" | "kind" | "method" | "amount" | "expense" | "net"

export const transactionColumns: readonly {
  id: TransactionColumnId
  label: string
  width: number
}[] = [
  { id: "brand", label: "Brand", width: 64 },
  { id: "kind", label: "Type", width: 112 },
  { id: "method", label: "Payment", width: 128 },
  { id: "amount", label: "Amount", width: 112 },
  { id: "expense", label: "Expense", width: 96 },
  { id: "net", label: "Net", width: 112 },
]

/** Select (w-8) + Date (w-28) + Description's floor — the three that always show. */
export const TRANSACTION_FIXED_COLUMNS_WIDTH = 32 + 112 + 176

export const TRANSACTION_COLUMNS_COOKIE = "client_transactions_columns_hidden"

/** Six months, like the Clients table's. A table layout is a habit, not a session. */
export const TRANSACTION_COLUMNS_COOKIE_MAX_AGE = 60 * 60 * 24 * 180

/** A full stop, for the reason `columns.ts` gives. */
const SEPARATOR = "."

const KNOWN_IDS = new Set<string>(transactionColumns.map((column) => column.id))

/**
 * The hidden columns a cookie is asking for.
 *
 * <p>⚠️ Every id is checked against the list — the value is whatever is in the
 * reader's browser, stale after a rename or edited by hand.
 */
export function parseHiddenTransactionColumns(value: string | undefined): TransactionColumnId[] {
  if (!value) return []
  return value.split(SEPARATOR).filter((id): id is TransactionColumnId => KNOWN_IDS.has(id))
}

export function serializeHiddenTransactionColumns(hidden: Iterable<TransactionColumnId>): string {
  return [...hidden].join(SEPARATOR)
}
