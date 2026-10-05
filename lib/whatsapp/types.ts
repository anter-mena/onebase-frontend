/**
 * What `GET /api/whatsapp/*` returns. Client-safe: the page fetches on the server
 * and hands this to the client workspace as props.
 */

export type WaConversation = {
  id: number
  /** The number in digits, as WhatsApp sends it. */
  waId: string
  /** "+212…" */
  phone: string
  /** The WhatsApp profile name, or the number. */
  name: string
  unread: number
  lastMessageAt: string | null
  preview: string | null
  /** Free text and files are allowed until 24h after the client's last message. */
  windowOpen: boolean
  windowEndsAt: string | null
}

export type WaMessage = {
  id: number
  direction: "IN" | "OUT"
  type: "TEXT" | "IMAGE" | "DOCUMENT" | "AUDIO" | "VIDEO" | "STICKER" | "TEMPLATE" | "OTHER"
  body: string | null
  hasMedia: boolean
  mediaMime: string | null
  mediaFilename: string | null
  /** RECEIVED for theirs; SENDING, SENT, DELIVERED, READ or FAILED for ours. */
  status: "RECEIVED" | "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED"
  error: string | null
  createdAt: string
}

export type WaStatus = { connected: boolean; unread: number }
