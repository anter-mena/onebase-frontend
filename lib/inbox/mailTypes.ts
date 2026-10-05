/**
 * The shape the Inbox draws — what `GET /api/inbox/*` returns.
 *
 * <p>Client-safe on purpose, the same split as `userTypes` and `systemTypes`:
 * the components are shared between the server page and the client pieces, and
 * a file that reads the session cookie cannot be imported from the browser.
 *
 * <p>⚠️ Ids are strings: Gmail's message ids are 64-bit numbers, larger than a
 * JavaScript number can hold exactly.
 */

/** The folders, as the backend names them. */
export type FolderId = "inbox" | "drafts" | "sent" | "archive" | "junk" | "trash"

/**
 * One email in the list.
 *
 * <p>A single message rather than a thread. `body` here is a short preview; the
 * open email ({@link MailDetail}) carries the whole text.
 */
export type Mail = {
  id: string
  folder: FolderId
  /** Who sent it. */
  name: string
  email: string
  /** Who it went to — shown instead of the sender in Sent and Drafts. */
  toLabel: string
  subject: string
  /** ISO timestamp. */
  receivedAt: string
  /** The first words, as plain text. */
  body: string
  read: boolean
  starred: boolean
  /** Gmail labels the account created (EasyIPTV, IPTVNow …). */
  labels: string[]
  /** The label used as the brand, when there is one. */
  brand: string | null
  attachmentCount: number
}

export type MailAddress = { name: string; email: string }

export type MailAttachment = {
  index: number
  name: string
  contentType: string
  size: number
}

/**
 * One email, open.
 *
 * <p>Plain text, never HTML — an HTML-only email is turned into text by the
 * backend, so no stranger's markup ever runs on this page.
 */
export type MailDetail = Mail & {
  to: MailAddress[]
  cc: MailAddress[]
  replyTo: MailAddress[]
  attachments: MailAttachment[]
  /** Who "Reply" answers. */
  replyRecipients: string[]
  /** Who "Reply all" adds in Cc. */
  replyAllCc: string[]
  /** The address an answer goes out from (the brand's support@ when there is one). */
  defaultFrom: string
}

/**
 * What may be done to a message, for the account looking at it.
 *
 * <p>Admins and Commercials may both do everything in the Inbox today; kept as
 * an object so the controls already disable and explain themselves the day it
 * is narrowed.
 */
export type MailAbilities = {
  send: boolean
  delete: boolean
  archive: boolean
  star: boolean
}

/** The mailbox. One today: the Gmail every brand address is routed to. */
export type MailAccount = {
  id: string
  label: string
  email: string
  /** Who hosts the mailbox — "gmail", or anything else for the plain envelope. */
  provider: string
}

/** A brand: a Gmail label, with the brand's logo and support address when it matches Configuration → Brands. */
export type MailBrand = {
  name: string
  logo: string | null
  sender: string | null
}

/** An address answers can go out from. */
export type MailSender = {
  name: string
  email: string
}

/**
 * A folder in the navigation, with what is waiting in it.
 *
 * <p>`unread` drives the mark beside the icon (for Drafts, how many there are).
 * `group`: `working` is mail being dealt with, `aside` mail finished with.
 */
export type MailFolder = {
  id: FolderId
  label: string
  /** Lucide icon name, resolved by the nav so this stays serialisable. */
  icon: string
  unread: number
  group: "working" | "aside"
}

/**
 * What the address bar carries, and the only state the inbox has: an open email
 * can be linked to, Back walks back through what was read, a reload lands where
 * it left off.
 */
export type MailQuery = {
  /** Which message is open. Absent means the newest. */
  mail?: string
  /** "unread" narrows the list; anything else shows everything. */
  filter?: string
  /** Search words (Gmail search). */
  q?: string
  /** Which mailbox is open. One today. */
  account?: string
  /** Narrows the list to one brand (a Gmail label). */
  brand?: string
  /** Which folder is open. Absent means the inbox. */
  folder?: string
  /** How many emails to show; "Load more" raises it. */
  limit?: string
  /** "new" opens an empty email in the reading pane. */
  compose?: string
}

/** Nothing permitted. The safe answer when the set cannot be worked out. */
export const NO_ABILITIES: MailAbilities = {
  send: false,
  delete: false,
  archive: false,
  star: false,
}

export const FOLDER_IDS: FolderId[] = ["inbox", "drafts", "sent", "archive", "junk", "trash"]

/** "12 KB" — sizes as Gmail shows them. */
export function fileSize(bytes: number): string {
  if (!bytes || bytes < 1024) return `${Math.max(bytes, 0)} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
