/**
 * Which columns the Users table shows, and how that survives a reload.
 *
 * <p>⚠️ A plain module, not part of the table component. That file is
 * `"use client"`, and a client module's exports reach a server component as
 * references rather than values — so the page could neither name the cookie nor
 * check an id against this list. Same reason `lib/clients/columns.ts` exists.
 */

/**
 * The columns a reader can turn off.
 *
 * <p>⚠️ Select, User and Actions are not here and cannot be hidden, for the
 * reason the Clients table gives: a row has to stay identifiable and
 * actionable, and a list of roles with no names attached is not a user list.
 *
 * <p>`width` is the column's width in pixels — the same number as the Tailwind
 * class on its header. ⚠️ Change one and change the other: the table's minimum
 * width is summed from these, and if they disagree `table-fixed` squeezes every
 * column below its declared size and the headings overlap.
 */
export type UserColumnId = "role" | "status" | "lastActive" | "added"

export const userColumns: readonly {
  id: UserColumnId
  label: string
  width: number
}[] = [
  { id: "role", label: "Role", width: 112 },
  { id: "status", label: "Status", width: 144 },
  { id: "lastActive", label: "Last active", width: 176 },
  { id: "added", label: "Added", width: 128 },
]

/** Select (w-8) + User (w-56) + Actions (w-20), the three that always show. */
export const USER_FIXED_COLUMNS_WIDTH = 32 + 224 + 80

export const USER_COLUMNS_COOKIE = "users_columns_hidden"

/** Six months. A table layout is a habit, not a session. */
export const USER_COLUMNS_COOKIE_MAX_AGE = 60 * 60 * 24 * 180

/**
 * ⚠️ A full stop, not a comma. Commas are legal in a cookie value by the time
 * it reaches the browser, but they are the separator in several `Set-Cookie`
 * parsers along the way; no column id contains a full stop.
 */
const SEPARATOR = "."

const KNOWN_IDS = new Set<string>(userColumns.map((column) => column.id))

/** Unrecognised ids are dropped — the value is whatever sits in a browser. */
export function parseHiddenColumns(value: string | undefined): UserColumnId[] {
  if (!value) return []

  return value.split(SEPARATOR).filter((id): id is UserColumnId => KNOWN_IDS.has(id))
}

export function serializeHiddenColumns(hidden: Iterable<UserColumnId>): string {
  return [...hidden].join(SEPARATOR)
}
