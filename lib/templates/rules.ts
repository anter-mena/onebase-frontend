/**
 * What a template may hold. The same rules as the backend's `TemplateRules`:
 * change both together. The builder checks them as you go, so a button is
 * greyed out with its reason instead of failing on Save; the backend checks
 * every one again, and its sentence is what the screen shows if they differ.
 *
 * <p>A plain module, so the builder, the list and the inbox's picker share it.
 */

import type {
  TemplateBlockType,
  TemplateButtonType,
  TemplateInput,
  TemplateLanguage,
  TemplateMediaType,
} from "@/lib/templates/types"

export const TEMPLATE_LIMITS = {
  name: 80,
  footer: 60,
  blocks: 20,
  /** All the texts of a template together. */
  text: 1024,
  buttons: 2,
  buttonLabel: 20,
  /** A link. */
  buttonValue: 2000,
  /** A phone number, spaces included. */
  phoneValue: 30,
  /** Each file. The upload goes through this app's host (Vercel), which refuses a request over 4.5 MB. */
  fileBytes: 4 * 1024 * 1024,
} as const

export const TEMPLATE_LANGUAGES: readonly { value: TemplateLanguage; label: string }[] = [
  { value: "EN", label: "English" },
  { value: "FR", label: "French" },
  { value: "AR", label: "Arabic" },
]

export function languageLabel(language: TemplateLanguage) {
  return TEMPLATE_LANGUAGES.find((item) => item.value === language)?.label ?? language
}

/** The block names the screens use: "Photo", "PDF"… */
export const BLOCK_LABELS: Record<TemplateBlockType, string> = {
  TEXT: "Text",
  IMAGE: "Photo",
  DOCUMENT: "PDF",
  AUDIO: "Audio",
  BUTTON: "Button",
}

/**
 * One kind of attachment per template: up to 2 photos, or 1 PDF, or 1 audio.
 * The browser's type is only a first check — the backend reads the bytes.
 */
export const MEDIA_RULES: Record<
  TemplateMediaType,
  { max: number; accept: string; types: readonly string[]; extensions: readonly string[]; hint: string }
> = {
  IMAGE: {
    max: 2,
    accept: "image/jpeg,image/png",
    types: ["image/jpeg", "image/png"],
    extensions: ["jpg", "jpeg", "png"],
    hint: "JPG or PNG, 4 MB at most",
  },
  DOCUMENT: {
    max: 1,
    accept: "application/pdf",
    types: ["application/pdf"],
    extensions: ["pdf"],
    hint: "PDF, 4 MB at most",
  },
  AUDIO: {
    max: 1,
    accept: "audio/mpeg,audio/ogg,audio/aac,audio/mp4,audio/x-m4a,audio/amr,.mp3,.ogg,.aac,.m4a,.amr",
    types: ["audio/mpeg", "audio/ogg", "audio/aac", "audio/mp4", "audio/x-m4a", "audio/amr"],
    extensions: ["mp3", "ogg", "aac", "m4a", "amr"],
    hint: "MP3, OGG, AAC, M4A or AMR, 4 MB at most",
  },
}

export const BUTTON_TYPES: readonly {
  value: TemplateButtonType
  label: string
  max: number
  /** What the second field asks for; null when the button has no value. */
  valueLabel: string | null
}[] = [
  { value: "QUICK_REPLY", label: "Quick reply", max: 2, valueLabel: null },
  { value: "URL", label: "Link", max: 2, valueLabel: "Link address" },
  { value: "PHONE", label: "Call", max: 1, valueLabel: "Phone number" },
]

export function buttonTypeLabel(type: TemplateButtonType) {
  return BUTTON_TYPES.find((item) => item.value === type)?.label ?? type
}

const MEDIA_TYPES: readonly TemplateBlockType[] = ["IMAGE", "DOCUMENT", "AUDIO"]

export function isMediaType(type: TemplateBlockType): type is TemplateMediaType {
  return MEDIA_TYPES.includes(type)
}

const URL_VALUE = /^https?:\/\/\S+$/i
const PHONE_VALUE = /^\+[\d ]*\d[\d ]*$/

/** What the add buttons need to know about each block already there. */
type BlockShape = { type: TemplateBlockType; text?: string; buttonType?: TemplateButtonType }

function textLength(blocks: readonly BlockShape[]) {
  return blocks.reduce((total, block) => total + (block.type === "TEXT" ? (block.text ?? "").length : 0), 0)
}

/** The attachment kind already chosen, if any. */
function attachmentKind(blocks: readonly BlockShape[]): TemplateMediaType | null {
  const found = blocks.find((block) => isMediaType(block.type))
  return found && isMediaType(found.type) ? found.type : null
}

/** Why a block of this type can't be added, or null when it can. */
export function addBlockRefusal(blocks: readonly BlockShape[], type: Exclude<TemplateBlockType, "BUTTON">): string | null {
  if (blocks.length >= TEMPLATE_LIMITS.blocks) return `${TEMPLATE_LIMITS.blocks} blocks at most.`
  if (type === "TEXT") {
    return textLength(blocks) < TEMPLATE_LIMITS.text ? null : `The texts already use all ${TEMPLATE_LIMITS.text} characters.`
  }
  const kind = attachmentKind(blocks)
  if (kind && kind !== type) {
    return `This template already has a ${BLOCK_LABELS[kind].toLowerCase()}: one kind of attachment per template.`
  }
  const rules = MEDIA_RULES[type]
  const count = blocks.filter((block) => block.type === type).length
  if (count < rules.max) return null
  return rules.max === 1 ? `One ${BLOCK_LABELS[type]} at most.` : `${rules.max} photos at most.`
}

/** Why a button of this kind can't be added, or null when it can. */
export function addButtonRefusal(blocks: readonly BlockShape[], buttonType: TemplateButtonType): string | null {
  if (blocks.length >= TEMPLATE_LIMITS.blocks) return `${TEMPLATE_LIMITS.blocks} blocks at most.`
  if (blocks.length === 0) return "Add a text or a file first: a button goes under one."
  const buttons = blocks.filter((block) => block.type === "BUTTON")
  if (buttons.length >= TEMPLATE_LIMITS.buttons) return `${TEMPLATE_LIMITS.buttons} buttons at most.`
  const kind = BUTTON_TYPES.find((item) => item.value === buttonType)
  if (kind && buttons.filter((block) => block.buttonType === buttonType).length >= kind.max) {
    return kind.max === 1 ? `One ${kind.label.toLowerCase()} button at most.` : `${kind.max} ${kind.label.toLowerCase()} buttons at most.`
  }
  return null
}

/** A chosen file that is clearly not accepted here, before uploading it. */
export function fileRefusal(type: TemplateMediaType, file: File): string | null {
  const rules = MEDIA_RULES[type]
  const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
  if (!rules.types.includes(file.type) && !rules.extensions.includes(extension)) return `This file can't be used here: ${rules.hint}.`
  if (file.size > TEMPLATE_LIMITS.fileBytes) return "Files can be 4 MB at most."
  return null
}

/**
 * What still stops the template from being saved, in the builder's order, or
 * null. The same checks, and nearly the same sentences, as the backend.
 */
export function templateProblem(input: TemplateInput): string | null {
  const name = input.name.trim()
  if (!name) return "Give the template a name."
  if (name.length > TEMPLATE_LIMITS.name) return `The name can be ${TEMPLATE_LIMITS.name} characters at most.`
  if (input.footer.length > TEMPLATE_LIMITS.footer) return `The footer can be ${TEMPLATE_LIMITS.footer} characters at most.`

  const blocks = input.blocks
  if (blocks.length === 0) return "The message is empty: add a text or an attachment."
  if (blocks.length > TEMPLATE_LIMITS.blocks) return `A template can have ${TEMPLATE_LIMITS.blocks} blocks at most.`
  if (!blocks.some((block) => block.type === "TEXT" || isMediaType(block.type))) {
    return "Add at least a text or an attachment: buttons can't be sent alone."
  }
  if (blocks[0].type === "BUTTON") return "A button goes under a text or a file: the message can't start with one."

  let text = 0
  let kind: TemplateMediaType | null = null
  const media: Record<TemplateMediaType, number> = { IMAGE: 0, DOCUMENT: 0, AUDIO: 0 }
  const buttons: Record<TemplateButtonType, number> = { QUICK_REPLY: 0, URL: 0, PHONE: 0 }

  for (const block of blocks) {
    if (block.type === "TEXT") {
      const value = block.text ?? ""
      if (!value.trim()) return "A text is empty: write it or remove it."
      text += value.length
    } else if (isMediaType(block.type)) {
      if (block.fileId === undefined) return `Choose the file of the ${BLOCK_LABELS[block.type]} block, or remove it.`
      if (kind && kind !== block.type) return "One kind of attachment per template: photos, a PDF or an audio."
      kind = block.type
      media[block.type] += 1
      if (media[block.type] > MEDIA_RULES[block.type].max) {
        return block.type === "IMAGE" ? "2 photos at most." : `One ${BLOCK_LABELS[block.type]} at most.`
      }
    } else {
      const type = block.buttonType ?? "QUICK_REPLY"
      buttons[type] += 1
      const label = block.label?.trim() ?? ""
      if (!label) return "A button has no text."
      if (label.length > TEMPLATE_LIMITS.buttonLabel) return `A button's text can be ${TEMPLATE_LIMITS.buttonLabel} characters at most.`
      const value = block.value?.trim() ?? ""
      if (type === "URL" && !URL_VALUE.test(value)) return `The link of “${label}” must start with http:// or https://.`
      if (type === "PHONE" && !PHONE_VALUE.test(value)) return `The number of “${label}” must start with + and hold digits only.`
      if (value.length > (type === "PHONE" ? TEMPLATE_LIMITS.phoneValue : TEMPLATE_LIMITS.buttonValue)) return `The value of “${label}” is too long.`
    }
  }

  if (text > TEMPLATE_LIMITS.text) return `The texts can be ${TEMPLATE_LIMITS.text} characters at most, all together.`
  if (buttons.QUICK_REPLY + buttons.URL + buttons.PHONE > TEMPLATE_LIMITS.buttons) return `${TEMPLATE_LIMITS.buttons} buttons at most.`
  if (buttons.PHONE > 1) return "One call button at most."
  return null
}
