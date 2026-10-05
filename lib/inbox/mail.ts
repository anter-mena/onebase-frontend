import "server-only"

import { apiFetch } from "@/lib/api"
import {
  FOLDER_IDS,
  type FolderId,
  type Mail,
  type MailAccount,
  type MailBrand,
  type MailDetail,
  type MailFolder,
  type MailQuery,
  type MailSender,
} from "@/lib/inbox/mailTypes"

/**
 * Where the Inbox gets its emails: `GET /api/inbox/*`, which reads the Gmail
 * mailbox live. Filtering and searching happen there (Gmail search), not in the
 * browser — the list only ever receives what it shows.
 */

type Overview = {
  account: { email: string; name: string }
  folders: MailFolder[]
  brands: { name: string; logoUrl: string | null; sender: string | null }[]
  senders: MailSender[]
}

type Summary = {
  id: string
  folder: FolderId
  fromName: string
  fromEmail: string
  toLabel: string
  subject: string
  receivedAt: string | null
  snippet: string
  read: boolean
  starred: boolean
  labels: string[]
  brand: string | null
  attachmentCount: number
}

type Detail = Omit<Summary, "snippet" | "attachmentCount" | "toLabel"> & {
  to: MailDetail["to"]
  cc: MailDetail["cc"]
  replyTo: MailDetail["replyTo"]
  body: string
  attachments: MailDetail["attachments"]
  replyRecipients: string[]
  replyAllCc: string[]
  defaultFrom: string
}

export const PAGE_SIZE = 50

export type InboxData = {
  mails: Mail[]
  selected: MailDetail | null
  accounts: MailAccount[]
  account: MailAccount
  folders: MailFolder[]
  folderId: FolderId
  brands: MailBrand[]
  senders: MailSender[]
  limit: number
}

export async function getInbox(query: MailQuery): Promise<{ ok: true; data: InboxData } | { ok: false; error: string; status: number }> {
  const folderId: FolderId = FOLDER_IDS.includes(query.folder as FolderId) ? (query.folder as FolderId) : "inbox"
  const limit = Math.min(200, Math.max(PAGE_SIZE, Number(query.limit) || PAGE_SIZE))

  const params = new URLSearchParams({ folder: folderId, limit: String(limit) })
  if (query.q?.trim()) params.set("q", query.q.trim())
  if (query.filter === "unread") params.set("unread", "true")
  if (query.brand) params.set("brand", query.brand)

  const [overview, list] = await Promise.all([
    apiFetch<Overview>("/api/inbox/overview", { authenticated: true }),
    apiFetch<Summary[]>(`/api/inbox/messages?${params}`, { authenticated: true }),
  ])
  if (!overview.ok) return { ok: false, error: overview.error.message, status: overview.error.status }
  if (!list.ok) return { ok: false, error: list.error.message, status: list.error.status }

  const mails = list.data.map(toMail)

  // The open email: the one in the address bar (marked read, since somebody opened
  // it), otherwise the newest — shown but left unread, because nobody chose it.
  const chosen = query.mail && query.compose !== "new" ? query.mail : null
  const targetId = chosen ?? (query.compose === "new" ? null : mails[0]?.id ?? null)
  let selected: MailDetail | null = null
  if (targetId) {
    const detail = await apiFetch<Detail>(
      `/api/inbox/messages/${encodeURIComponent(targetId)}?folder=${folderId}&markRead=${chosen ? "true" : "false"}`,
      { authenticated: true }
    )
    if (detail.ok) {
      selected = toDetail(detail.data)
      // The list was read a moment before; show the dot as the open email now is.
      const row = mails.find((mail) => mail.id === selected?.id)
      if (row) row.read = selected.read
    }
  }

  const account: MailAccount = {
    id: "main",
    label: overview.data.account.name,
    email: overview.data.account.email,
    provider: overview.data.account.email.endsWith("@gmail.com") ? "gmail" : "other",
  }

  return {
    ok: true,
    data: {
      mails,
      selected,
      accounts: [account],
      account,
      folders: overview.data.folders,
      folderId,
      brands: overview.data.brands.map((brand) => ({ name: brand.name, logo: brand.logoUrl, sender: brand.sender })),
      senders: overview.data.senders,
      limit,
    },
  }
}

function toMail(summary: Summary): Mail {
  return {
    id: summary.id,
    folder: summary.folder,
    name: summary.fromName || summary.fromEmail,
    email: summary.fromEmail,
    toLabel: summary.toLabel,
    subject: summary.subject || "(no subject)",
    receivedAt: summary.receivedAt ?? new Date(0).toISOString(),
    body: summary.snippet,
    read: summary.read,
    starred: summary.starred,
    labels: summary.labels,
    brand: summary.brand,
    attachmentCount: summary.attachmentCount,
  }
}

function toDetail(detail: Detail): MailDetail {
  return {
    id: detail.id,
    folder: detail.folder,
    name: detail.fromName || detail.fromEmail,
    email: detail.fromEmail,
    toLabel: detail.to.map((address) => address.name || address.email).join(", "),
    subject: detail.subject,
    receivedAt: detail.receivedAt ?? new Date(0).toISOString(),
    body: detail.body,
    read: detail.read,
    starred: detail.starred,
    labels: detail.labels,
    brand: detail.brand,
    attachmentCount: detail.attachments.length,
    to: detail.to,
    cc: detail.cc,
    replyTo: detail.replyTo,
    attachments: detail.attachments,
    replyRecipients: detail.replyRecipients,
    replyAllCc: detail.replyAllCc,
    defaultFrom: detail.defaultFrom,
  }
}
