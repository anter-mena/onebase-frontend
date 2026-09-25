/**
 * Which columns the Action log shows, and how that survives a reload.
 *
 * <p>⚠️ A plain module, not part of the table component. That file is
 * `"use client"`, and every export of a client module reaches a server
 * component as a client <i>reference</i> rather than its value — so the page
 * could neither name the cookie nor validate an id against this list. The same
 * reason `lib/clients/columns.ts` and `lib/sidebar/state.ts` exist.
 */

/**
 * The columns a reader can turn off.
 *
 * <p>⚠️ "When" and "Who" are not here and cannot be hidden. They are what an
 * audit log is: a time and a person. A row without either is a claim that
 * something happened, which is not a record of anything.
 *
 * <p>`width` is the column's width in pixels — the same number as the Tailwind
 * class on its header. ⚠️ Change one and change the other: the table's minimum
 * width is summed from these, and if they disagree the columns are squeezed
 * below their declared size and the headings overlap.
 */
export type ActionLogColumnId = "action" | "target" | "detail" | "source" | "ip"

export const actionLogColumns: readonly {
  id: ActionLogColumnId
  label: string
  width: number
}[] = [
  { id: "action", label: "Action", width: 128 },
  { id: "target", label: "Target", width: 224 },
  { id: "detail", label: "Details", width: 320 },
  { id: "source", label: "Source", width: 96 },
  { id: "ip", label: "IP address", width: 128 },
]

/** When (w-40) + Who (w-44), the two that always show. */
export const ACTION_LOG_FIXED_COLUMNS_WIDTH = 160 + 176

export const ACTION_LOG_COLUMNS_COOKIE = "action_log_columns_hidden"

/** Six months. A table layout is a habit, not a session. */
export const ACTION_LOG_COLUMNS_COOKIE_MAX_AGE = 60 * 60 * 24 * 180

/**
 * ⚠️ A full stop, not a comma. Commas are legal in a cookie value by the time
 * it reaches the browser, but they are the separator in several `Set-Cookie`
 * parsers along the way; no column id contains a full stop.
 */
const SEPARATOR = "."

const KNOWN_IDS = new Set<string>(actionLogColumns.map((column) => column.id))

/**
 * The hidden columns a cookie is asking for.
 *
 * <p>⚠️ Every id is checked against the list. The value is whatever the reader
 * has in their browser — stale after a column is renamed, or edited by hand —
 * so an unrecognised id is dropped rather than trusted.
 */
export function parseHiddenColumns(value: string | undefined): ActionLogColumnId[] {
  if (!value) return []

  return value
    .split(SEPARATOR)
    .filter((id): id is ActionLogColumnId => KNOWN_IDS.has(id))
}

export function serializeHiddenColumns(hidden: Iterable<ActionLogColumnId>): string {
  return [...hidden].join(SEPARATOR)
}
