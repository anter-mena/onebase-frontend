/**
 * What the Action log shows, invented for the interface phase.
 *
 * <p>⚠️ Made up, but not at random. The people are the same admin and
 * colleagues the rest of the workspace implies, and the things they acted on
 * are the brands, clients and payment methods that actually exist on the other
 * screens — Nike, Adidas, Puma, Adam Mansouri, Main PayPal. A log that
 * references records no other page has ever heard of is the fastest way to
 * make the whole workspace look fabricated.
 *
 * <p>Fixed timestamps rather than anything clock-derived: this renders on the
 * server as well as in the browser, and a time that differs between the two is
 * a hydration mismatch. It also means two screenshots can be compared.
 *
 * <p>Delete this file when the API is real. Nothing in `components/action-log`
 * knows where these come from.
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

export type LogEntry = {
  id: number
  /** UTC, ISO 8601. Formatted by `utcStamp` so server and browser agree. */
  at: string
  actor: string
  initials: string
  /** The same pill palette the client avatars use. */
  color: string
  action: ActionKind
  targetKind: TargetKind
  targetName: string
  /** One line saying what actually changed. */
  detail: string
  source: "Web" | "Mobile" | "API"
  ip: string
}

export const logEntries: LogEntry[] = [
  { id: 24, at: "2026-09-24T09:12:00Z", actor: "Admin User", initials: "AU", color: "bg-emerald-100 text-emerald-800", action: "Updated", targetKind: "Client", targetName: "Adam Mansouri", detail: "Status changed from Pending to Active", source: "Web", ip: "196.64.12.41" },
  { id: 23, at: "2026-09-24T08:47:00Z", actor: "Admin User", initials: "AU", color: "bg-emerald-100 text-emerald-800", action: "Signed in", targetKind: "Workspace", targetName: "One Base", detail: "Signed in from a new device", source: "Web", ip: "196.64.12.41" },
  { id: 22, at: "2026-09-23T17:05:00Z", actor: "Salma Idrissi", initials: "SI", color: "bg-violet-100 text-violet-800", action: "Exported", targetKind: "Client", targetName: "12 clients", detail: "Exported the client list as CSV", source: "Web", ip: "105.158.9.7" },
  { id: 21, at: "2026-09-23T15:31:00Z", actor: "Salma Idrissi", initials: "SI", color: "bg-violet-100 text-violet-800", action: "Deactivated", targetKind: "Payment method", targetName: "Interac", detail: "Stopped accepting new payments on this method", source: "Web", ip: "105.158.9.7" },
  { id: 20, at: "2026-09-23T11:20:00Z", actor: "Admin User", initials: "AU", color: "bg-emerald-100 text-emerald-800", action: "Created", targetKind: "Client", targetName: "Imane Berrada", detail: "Added from the Clients screen", source: "Web", ip: "196.64.12.41" },
  { id: 19, at: "2026-09-22T16:58:00Z", actor: "Younes Alami", initials: "YA", color: "bg-sky-100 text-sky-800", action: "Updated", targetKind: "Subscription", targetName: "Growth — 12 months", detail: "Price changed from $1,150 to $1,200", source: "Web", ip: "41.92.140.28" },
  { id: 18, at: "2026-09-22T14:02:00Z", actor: "Younes Alami", initials: "YA", color: "bg-sky-100 text-sky-800", action: "Activated", targetKind: "Brand", targetName: "Puma", detail: "Brand switched on for the workspace", source: "Web", ip: "41.92.140.28" },
  { id: 17, at: "2026-09-22T09:44:00Z", actor: "Admin User", initials: "AU", color: "bg-emerald-100 text-emerald-800", action: "Signed in", targetKind: "Workspace", targetName: "One Base", detail: "Signed in", source: "Mobile", ip: "196.64.12.41" },
  { id: 16, at: "2026-09-21T18:36:00Z", actor: "Salma Idrissi", initials: "SI", color: "bg-violet-100 text-violet-800", action: "Deleted", targetKind: "Client", targetName: "Test Account", detail: "Removed a duplicate record", source: "Web", ip: "105.158.9.7" },
  { id: 15, at: "2026-09-21T13:12:00Z", actor: "Admin User", initials: "AU", color: "bg-emerald-100 text-emerald-800", action: "Updated", targetKind: "Payment method", targetName: "Main PayPal", detail: "Account holder renamed to Admin User", source: "Web", ip: "196.64.12.41" },
  { id: 14, at: "2026-09-20T10:29:00Z", actor: "Younes Alami", initials: "YA", color: "bg-sky-100 text-sky-800", action: "Created", targetKind: "Payment method", targetName: "Binance", detail: "Added a crypto method in USDT", source: "Web", ip: "41.92.140.28" },
  { id: 13, at: "2026-09-19T15:47:00Z", actor: "Admin User", initials: "AU", color: "bg-emerald-100 text-emerald-800", action: "Updated", targetKind: "Client", targetName: "Nadia Bennani", detail: "Status changed from Inactive to Drop", source: "Web", ip: "196.64.12.41" },
  { id: 12, at: "2026-09-19T09:03:00Z", actor: "Salma Idrissi", initials: "SI", color: "bg-violet-100 text-violet-800", action: "Signed in", targetKind: "Workspace", targetName: "One Base", detail: "Signed in", source: "Web", ip: "105.158.9.7" },
  { id: 11, at: "2026-09-18T17:22:00Z", actor: "Younes Alami", initials: "YA", color: "bg-sky-100 text-sky-800", action: "Deactivated", targetKind: "Brand", targetName: "Puma", detail: "Brand hidden while the site was rebuilt", source: "Web", ip: "41.92.140.28" },
  { id: 10, at: "2026-09-18T11:40:00Z", actor: "Admin User", initials: "AU", color: "bg-emerald-100 text-emerald-800", action: "Created", targetKind: "Subscription", targetName: "Starter — 3 months", detail: "New plan at $320", source: "Web", ip: "196.64.12.41" },
  { id: 9, at: "2026-09-17T16:15:00Z", actor: "Salma Idrissi", initials: "SI", color: "bg-violet-100 text-violet-800", action: "Updated", targetKind: "Client", targetName: "Mehdi Tazi", detail: "Payment method changed to Card", source: "Web", ip: "105.158.9.7" },
  { id: 8, at: "2026-09-17T08:55:00Z", actor: "API token", initials: "AT", color: "bg-amber-100 text-amber-800", action: "Created", targetKind: "Client", targetName: "Ayoub Filali", detail: "Created through the public API", source: "API", ip: "34.107.221.9" },
  { id: 7, at: "2026-09-16T14:31:00Z", actor: "Admin User", initials: "AU", color: "bg-emerald-100 text-emerald-800", action: "Activated", targetKind: "Payment method", targetName: "Main PayPal", detail: "Set as the default method", source: "Web", ip: "196.64.12.41" },
  { id: 6, at: "2026-09-16T10:08:00Z", actor: "Younes Alami", initials: "YA", color: "bg-sky-100 text-sky-800", action: "Exported", targetKind: "Client", targetName: "6 clients", detail: "Exported the Active filter as CSV", source: "Web", ip: "41.92.140.28" },
  { id: 5, at: "2026-09-15T18:49:00Z", actor: "Admin User", initials: "AU", color: "bg-emerald-100 text-emerald-800", action: "Updated", targetKind: "Brand", targetName: "Adidas", detail: "Instagram link added", source: "Web", ip: "196.64.12.41" },
  { id: 4, at: "2026-09-15T12:26:00Z", actor: "Salma Idrissi", initials: "SI", color: "bg-violet-100 text-violet-800", action: "Created", targetKind: "Client", targetName: "Meryem Idrissi", detail: "Added from the Clients screen", source: "Mobile", ip: "105.158.9.7" },
  { id: 3, at: "2026-09-14T17:03:00Z", actor: "Admin User", initials: "AU", color: "bg-emerald-100 text-emerald-800", action: "Deleted", targetKind: "Subscription", targetName: "Legacy — 24 months", detail: "Retired an unused plan", source: "Web", ip: "196.64.12.41" },
  { id: 2, at: "2026-09-14T09:37:00Z", actor: "Younes Alami", initials: "YA", color: "bg-sky-100 text-sky-800", action: "Signed in", targetKind: "Workspace", targetName: "One Base", detail: "Signed in", source: "Web", ip: "41.92.140.28" },
  { id: 1, at: "2026-09-13T15:14:00Z", actor: "Admin User", initials: "AU", color: "bg-emerald-100 text-emerald-800", action: "Created", targetKind: "Brand", targetName: "Nike", detail: "First brand added to the workspace", source: "Web", ip: "196.64.12.41" },
]
