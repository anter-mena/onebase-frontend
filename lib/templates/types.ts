/**
 * What `GET /api/templates` (and `GET /api/whatsapp/templates`) returns. A plain
 * module (no "use client" or "server-only"), so the loaders, the actions, the
 * builder and the inbox's picker share it.
 *
 * <p>A template is a saved message, not one approved by Meta: it is sent as
 * ordinary WhatsApp messages (texts, files, buttons), so only inside the
 * 24-hour window.
 */

export type TemplateLanguage = "EN" | "FR" | "AR"

export type TemplateMediaType = "IMAGE" | "DOCUMENT" | "AUDIO"

export type TemplateBlockType = "TEXT" | TemplateMediaType | "BUTTON"

export type TemplateButtonType = "QUICK_REPLY" | "URL" | "PHONE"

/** A file stored with the templates (in the database, like brand logos). */
export type TemplateFile = {
  id: number
  name: string
  mime: string
  /** Bytes. */
  size: number
}

/**
 * One piece of the message, in the order the client receives them. The backend
 * sends every key on every block ({type, text, file, buttonType, label, value}),
 * null where it does not apply; only the ones each type uses are read here.
 */
export type TemplateBlock =
  | { type: "TEXT"; text: string }
  | { type: TemplateMediaType; file: TemplateFile }
  /** Shown under the block before it. `value` is the link or the number; null for a quick reply. */
  | { type: "BUTTON"; buttonType: TemplateButtonType; label: string; value: string | null }

export type MessageTemplate = {
  id: number
  name: string
  language: TemplateLanguage
  /** Never deleted: switched off instead, and then it can't be sent. */
  active: boolean
  footer: string
  blocks: TemplateBlock[]
  /** "1 text · 1 photo · 1 button", written by the backend. */
  summary: string
  createdAt: string
  /** Content changes only, not the on/off switch. */
  updatedAt: string
  updatedByName: string | null
}

/** What POST / PUT `/api/templates` take. */
export type TemplateBlockInput = {
  type: TemplateBlockType
  text?: string
  fileId?: number
  buttonType?: TemplateButtonType
  label?: string
  value?: string | null
}

export type TemplateInput = {
  name: string
  language: TemplateLanguage
  active: boolean
  footer: string
  blocks: TemplateBlockInput[]
}
