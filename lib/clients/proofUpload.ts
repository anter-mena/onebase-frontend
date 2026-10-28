/**
 * The proof of a payment (2026-10-28): what the Add payment window's second step
 * takes. The same list as the backend's ProofRules, which reads each file's type
 * from its bytes and has the last word; this only spares a round trip.
 */

/** Extension → what to call it. Anything that can run in a browser (HTML, SVG) is left out. */
export const PROOF_FORMATS: Record<string, string> = {
  pdf: "PDF",
  jpg: "JPG",
  jpeg: "JPG",
  png: "PNG",
  webp: "WebP",
  heic: "HEIC",
  heif: "HEIC",
  avif: "AVIF",
  gif: "GIF",
  tif: "TIFF",
  tiff: "TIFF",
  bmp: "BMP",
  doc: "Word",
  docx: "Word",
  xls: "Excel",
  xlsx: "Excel",
  odt: "OpenDocument",
  ods: "OpenDocument",
  rtf: "RTF",
  csv: "CSV",
  txt: "TXT",
  xml: "XML",
  eml: "Email",
  msg: "Email",
}

/** For the file picker: by extension, so a phone's HEIC or an Outlook .msg shows too. */
export const PROOF_ACCEPT = Object.keys(PROOF_FORMATS).map((ext) => `.${ext}`).join(",")

export const MAX_PROOF_FILES = 5
/** All files together: the proxy in front of the app buffers 10 MB of a request at most. */
export const MAX_PROOF_BYTES = 10 * 1024 * 1024

export function proofExtension(name: string) {
  const dot = name.lastIndexOf(".")
  return dot < 0 ? "" : name.slice(dot + 1).toLowerCase()
}

/** "PDF", "Word"… or null when the format is not taken. */
export function proofFormat(file: File) {
  return PROOF_FORMATS[proofExtension(file.name)] ?? null
}

/** "240 KB", "3.2 MB". */
export function fileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * The files already chosen plus the new ones: unknown formats, repeats and anything
 * past five or 10 MB left out, each with the reason.
 */
export function addProofFiles(current: File[], incoming: File[]): { files: File[]; refused: string[] } {
  const files = [...current]
  const refused: string[] = []
  let total = files.reduce((sum, file) => sum + file.size, 0)
  for (const file of incoming) {
    if (files.some((kept) => kept.name === file.name && kept.size === file.size && kept.lastModified === file.lastModified)) continue
    if (!proofFormat(file)) {
      refused.push(`"${file.name}" is not an invoice format.`)
    } else if (file.size === 0) {
      refused.push(`"${file.name}" is empty.`)
    } else if (files.length >= MAX_PROOF_FILES) {
      refused.push(`Only ${MAX_PROOF_FILES} files: "${file.name}" was left out.`)
    } else if (total + file.size > MAX_PROOF_BYTES) {
      refused.push(`"${file.name}" would take the files past 10 MB together.`)
    } else {
      files.push(file)
      total += file.size
    }
  }
  return { files, refused }
}
