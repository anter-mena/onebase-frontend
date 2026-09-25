/**
 * Which columns the Clients table shows, and how that survives a reload.
 *
 * <p>⚠️ <b>A plain module, not part of `clientsTable`.</b> That file is
 * `"use client"`, and every export of a client module reaches a server
 * component as a client <i>reference</i> rather than its value — so the page
 * could not use the cookie name or validate an id against this list. The same
 * reason `lib/sidebar/state.ts` exists.
 *
 * <p>The preference lives in a cookie rather than localStorage so the server
 * renders the right columns in the first HTML. localStorage would draw all
 * eleven and then drop three the moment React hydrated, which is the flash the
 * sidebar just lost.
 */

/**
 * The columns a reader can turn off.
 *
 * <p>⚠️ Select, Client and Actions are not here and cannot be hidden. A row has
 * to stay identifiable and actionable or the table stops being a table: hiding
 * the name leaves twelve anonymous rows of numbers, and hiding the actions
 * leaves no way to do anything with them.
 *
 * <p>`width` is the column's width in pixels — the same number as the Tailwind
 * class on its header. ⚠️ Change one and change the other: the table's minimum
 * width is summed from these, and if they disagree the columns are squeezed
 * below their declared size and the headings overlap.
 */
export type ClientColumnId =
  | "brand"
  | "contact"
  | "subscriptionEnd"
  | "status"
  | "subscription"
  | "orders"
  | "paymentMethod"
  | "revenue"

export const clientColumns: readonly {
  id: ClientColumnId
  label: string
  width: number
}[] = [
  // 64 rather than 48: the cell is a 28px logo, but the heading is "Brand"
  // plus a sort arrow, and a column has to fit the wider of the two.
  { id: "brand", label: "Brand", width: 64 },
  { id: "contact", label: "Contact", width: 272 },
  { id: "subscriptionEnd", label: "End date", width: 112 },
  { id: "status", label: "Status", width: 80 },
  { id: "subscription", label: "Subscription", width: 192 },
  { id: "orders", label: "Orders", width: 112 },
  { id: "paymentMethod", label: "Payment", width: 112 },
  // Same again — "Revenue" and its arrow need more than "+$22,100" does.
  { id: "revenue", label: "Revenue", width: 96 },
]

/** Select (w-8) + Client (w-36) + Actions (w-20), the three that always show. */
export const CLIENT_FIXED_COLUMNS_WIDTH = 32 + 144 + 80

export const CLIENT_COLUMNS_COOKIE = "clients_columns_hidden"

/** Six months. A table layout is a habit, not a session. */
export const CLIENT_COLUMNS_COOKIE_MAX_AGE = 60 * 60 * 24 * 180

/**
 * ⚠️ A full stop, not a comma. Commas are legal in a cookie value by the time
 * it reaches the browser, but they are the separator in several `Set-Cookie`
 * parsers along the way; no column id contains a full stop.
 */
const SEPARATOR = "."

const KNOWN_IDS = new Set<string>(clientColumns.map((column) => column.id))

/**
 * The hidden columns a cookie is asking for.
 *
 * <p>⚠️ Every id is checked against the list. The value is whatever the reader
 * has in their browser — stale after a column is renamed, or edited by hand —
 * and an unrecognised id has to be dropped rather than hiding nothing or, worse,
 * being trusted into a lookup later.
 */
export function parseHiddenColumns(value: string | undefined): ClientColumnId[] {
  if (!value) return []

  return value
    .split(SEPARATOR)
    .filter((id): id is ClientColumnId => KNOWN_IDS.has(id))
}

export function serializeHiddenColumns(hidden: Iterable<ClientColumnId>): string {
  return [...hidden].join(SEPARATOR)
}
