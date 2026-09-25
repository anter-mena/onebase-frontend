/**
 * The people who can sign in to this workspace, invented for the interface
 * phase.
 *
 * <p>⚠️ The same people the Action log records. "Admin User", "Salma Idrissi"
 * and "Younes Alami" appear on both screens with the same initials and the same
 * avatar colours, because a workspace where the audit trail names people the
 * user list has never heard of reads as two unrelated mock-ups.
 *
 * <p>Fixed values rather than anything clock-derived — this renders on the
 * server as well as the browser, and a figure that differs between the two is a
 * hydration mismatch.
 *
 * <p>Delete this file when the API is real. Nothing in `components/users` knows
 * where these come from.
 */

/**
 * What someone is allowed to do.
 *
 * <p>Ordered by reach, and it is the order the filter draws them in. ⚠️ There
 * is exactly one Owner: the role is the workspace's billing and deletion
 * authority, and a list that lets a second one exist is a list that will
 * eventually be asked which of them is real.
 */
export type UserRole = "Owner" | "Admin" | "Manager"

export type WorkspaceUser = {
  id: number
  name: string
  initials: string
  email: string
  /** The same pill palette the client avatars use. */
  color: string
  role: UserRole
  active: boolean
  /**
   * Invited but never signed in.
   *
   * <p>⚠️ Separate from `active` rather than a third value on it. An invited
   * person is not inactive — nothing has been switched off, they simply have
   * not arrived — and the row shows a pending badge instead of a switch,
   * because there is nothing yet to switch.
   */
  invitePending: boolean
  /** UTC ISO. `null` when they have never signed in. */
  lastActiveAt: string | null
  addedAt: string
}

export const workspaceUsers: WorkspaceUser[] = [
  { id: 1, name: "Admin User", initials: "AU", email: "admin@onebase.app", color: "bg-emerald-100 text-emerald-800", role: "Owner", active: true, invitePending: false, lastActiveAt: "2026-09-24T09:12:00Z", addedAt: "2025-11-04" },
  { id: 2, name: "Salma Idrissi", initials: "SI", email: "salma@onebase.app", color: "bg-violet-100 text-violet-800", role: "Admin", active: true, invitePending: false, lastActiveAt: "2026-09-23T17:05:00Z", addedAt: "2026-01-18" },
  { id: 3, name: "Younes Alami", initials: "YA", email: "younes@onebase.app", color: "bg-sky-100 text-sky-800", role: "Manager", active: true, invitePending: false, lastActiveAt: "2026-09-22T16:58:00Z", addedAt: "2026-02-09" },
  { id: 4, name: "Hafsa Benali", initials: "HB", email: "hafsa@onebase.app", color: "bg-amber-100 text-amber-800", role: "Manager", active: true, invitePending: false, lastActiveAt: "2026-09-19T11:40:00Z", addedAt: "2026-03-22" },
  { id: 5, name: "Karim Ouazzani", initials: "KO", email: "karim@onebase.app", color: "bg-cyan-100 text-cyan-800", role: "Manager", active: true, invitePending: false, lastActiveAt: "2026-09-16T08:27:00Z", addedAt: "2026-04-15" },
  { id: 6, name: "Nour El Amrani", initials: "NE", email: "nour@onebase.app", color: "bg-fuchsia-100 text-fuchsia-800", role: "Manager", active: true, invitePending: true, lastActiveAt: null, addedAt: "2026-09-20" },
  { id: 7, name: "Mehdi Sabri", initials: "MS", email: "mehdi.sabri@onebase.app", color: "bg-indigo-100 text-indigo-800", role: "Manager", active: false, invitePending: false, lastActiveAt: "2026-06-30T14:03:00Z", addedAt: "2026-02-27" },
  { id: 8, name: "Ikram Tazi", initials: "IT", email: "ikram@onebase.app", color: "bg-rose-100 text-rose-800", role: "Manager", active: false, invitePending: false, lastActiveAt: "2026-05-11T09:55:00Z", addedAt: "2026-01-30" },
  { id: 9, name: "Omar Fassi", initials: "OF", email: "omar@onebase.app", color: "bg-teal-100 text-teal-800", role: "Manager", active: true, invitePending: true, lastActiveAt: null, addedAt: "2026-09-22" },
  { id: 10, name: "Leila Chraibi", initials: "LC", email: "leila@onebase.app", color: "bg-lime-100 text-lime-800", role: "Admin", active: true, invitePending: false, lastActiveAt: "2026-09-21T13:12:00Z", addedAt: "2026-05-06" },
]
