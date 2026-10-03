/**
 * What one line of the Action log looks like on screen.
 *
 * <p>A plain module (no "use client"), so both the server loader and the table
 * can import it.
 */

/**
 * What happened.
 *
 * <p>The order is roughly a record's life — made, changed, switched on, switched
 * off, removed — with the two that are not about a record at all at the end.
 * It is the order the filter draws them in.
 */
export type ActionKind =
  | "Created"
  | "Updated"
  | "Activated"
  | "Deactivated"
  | "Deleted"
  | "Exported"
  | "Signed in"

/** What was acted on. Mirrors the screens the workspace actually has. */
export type TargetKind =
  | "Client"
  | "Brand"
  | "Payment method"
  | "Subscription"
  | "Workspace"
  | "User"

export type LogEntry = {
  id: number
  /** UTC, ISO 8601. Formatted by `utcStamp` so server and browser agree. */
  at: string
  actor: string
  initials: string
  /** The same pill palette the user avatars use. */
  color: string
  action: ActionKind
  targetKind: TargetKind
  targetName: string
  /** One line saying what actually changed. */
  detail: string
  source: "Web" | "Mobile" | "API"
  ip: string
}
