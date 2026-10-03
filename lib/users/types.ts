/**
 * The shape of a workspace user, as the Users screen draws one.
 *
 * <p>No people live here any more: the invented list was removed, and the
 * screen shows an empty table until it is connected to the backend's real
 * accounts. The shape stays so the table, the filter and the invite form keep
 * one definition to agree on.
 */

/**
 * What someone is allowed to do (see `lib/access.ts` for the pages each opens).
 *
 * <p>Ordered by reach, and it is the order the filter draws them in. There can
 * be several Admins, but never zero: the last active Admin cannot be switched
 * off or removed, or nobody could manage the workspace any more.
 */
export type UserRole = "Admin" | "Commercial"

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
