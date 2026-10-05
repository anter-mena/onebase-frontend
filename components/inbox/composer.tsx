"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { File as FileIcon, Paperclip, SendHorizontal, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import blackStyle from "@/components/ui/button-styles/black.module.css"
import whiteStyle from "@/components/ui/button-styles/white.module.css"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { fileSize, type MailDetail, type MailSender } from "@/lib/inbox/mailTypes"
import { cn } from "@/lib/utils"

/**
 * Writing an email: new, reply, reply all, forward, or a saved draft.
 *
 * <p>Plain text. A reply's quote and a forward's original are added by the
 * backend under what is written here, so this box only holds the new words.
 * Sent mail lands in Gmail's Sent by itself; a saved draft lands in Gmail's
 * Drafts, and sending it removes it.
 *
 * <p>From is a list, never free text: only the mailbox and the brands' support@
 * addresses (Gmail "Send mail as") can be used.
 */

export type ComposeMode =
  | { kind: "new" }
  | { kind: "reply" | "replyAll" | "forward"; source: MailDetail }
  | { kind: "draft"; draft: MailDetail }

/** Gmail refuses emails over 25 MB once encoded; the backend allows 18 MB of files. */
const MAX_FILES_BYTES = 18 * 1024 * 1024

const splitAddresses = (value: string) =>
  value
    .split(/[\s,;]+/)
    .map((part) => part.trim())
    .filter(Boolean)

function prefill(mode: ComposeMode, senders: MailSender[], brandSender: string | null) {
  const fallbackFrom = brandSender ?? senders[0]?.email ?? ""
  switch (mode.kind) {
    case "new":
      return { from: fallbackFrom, to: "", cc: "", subject: "", body: "", keep: [] as number[] }
    case "reply":
    case "replyAll": {
      const subject = /^re:/i.test(mode.source.subject) ? mode.source.subject : `Re: ${mode.source.subject}`
      return {
        from: mode.source.defaultFrom,
        to: mode.source.replyRecipients.join(", "),
        cc: mode.kind === "replyAll" ? mode.source.replyAllCc.join(", ") : "",
        subject,
        body: "",
        keep: [] as number[],
      }
    }
    case "forward": {
      const subject = /^(fwd?|fw):/i.test(mode.source.subject) ? mode.source.subject : `Fwd: ${mode.source.subject}`
      return {
        from: mode.source.defaultFrom,
        to: "",
        cc: "",
        subject,
        body: "",
        keep: mode.source.attachments.map((file) => file.index),
      }
    }
    case "draft": {
      const ownFrom = senders.find((sender) => sender.email === mode.draft.email)?.email
      return {
        from: ownFrom ?? fallbackFrom,
        to: mode.draft.to.map((address) => address.email).join(", "),
        cc: mode.draft.cc.map((address) => address.email).join(", "),
        subject: mode.draft.subject,
        body: mode.draft.body,
        keep: mode.draft.attachments.map((file) => file.index),
      }
    }
  }
}

export function Composer({
  mode,
  senders,
  brandSender,
  onClose,
  className,
}: {
  mode: ComposeMode
  senders: MailSender[]
  /** For a new email: the brand selected in the list, so it starts from that brand's address. */
  brandSender?: string | null
  onClose: () => void
  className?: string
}) {
  const router = useRouter()
  const initial = useMemo(() => prefill(mode, senders, brandSender ?? null), [mode, senders, brandSender])

  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [cc, setCc] = useState(initial.cc)
  const [showCc, setShowCc] = useState(initial.cc.length > 0)
  const [subject, setSubject] = useState(initial.subject)
  const [body, setBody] = useState(initial.body)
  /** Files already in Gmail (the forwarded email, or the draft): number, name, size. */
  const [kept, setKept] = useState(() => {
    const origin = mode.kind === "forward" ? mode.source : mode.kind === "draft" ? mode.draft : null
    return (origin?.attachments ?? []).map((file) => ({ index: file.index, name: file.name, size: file.size }))
  })
  const [files, setFiles] = useState<File[]>([])
  const [draftId, setDraftId] = useState<string | null>(mode.kind === "draft" ? mode.draft.id : null)
  const [busy, setBusy] = useState<"send" | "draft" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const source = mode.kind === "reply" || mode.kind === "replyAll" || mode.kind === "forward" ? mode.source : null

  const dirty =
    to !== initial.to ||
    cc !== initial.cc ||
    subject !== initial.subject ||
    body !== initial.body ||
    files.length > 0 ||
    kept.length !== initial.keep.length

  // Closing the tab with unsent words asks first.
  useEffect(() => {
    if (!dirty || busy === "send") return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty, busy])

  const filesBytes = files.reduce((total, file) => total + file.size, 0)

  function addFiles(list: FileList | null) {
    if (!list) return
    setError(null)
    setFiles((current) => [...current, ...Array.from(list)])
    if (fileInput.current) fileInput.current.value = ""
  }

  async function submit(kind: "send" | "draft") {
    setError(null)
    setNotice(null)
    if (kind === "send" && splitAddresses(to).length === 0) {
      setError("Add at least one recipient.")
      return
    }
    if (filesBytes > MAX_FILES_BYTES) {
      setError("The files are too big together (18 MB at most).")
      return
    }

    const message = {
      from,
      to: splitAddresses(to),
      cc: showCc ? splitAddresses(cc) : [],
      subject,
      body,
      replyToId: source && mode.kind !== "forward" ? source.id : null,
      replyToFolder: source && mode.kind !== "forward" ? source.folder : null,
      forwardId: mode.kind === "forward" ? mode.source.id : null,
      forwardFolder: mode.kind === "forward" ? mode.source.folder : null,
      draftId,
      keepAttachments: kept.map((file) => file.index),
    }
    const form = new FormData()
    form.append("message", new Blob([JSON.stringify(message)], { type: "application/json" }))
    for (const file of files) form.append("files", file, file.name)

    setBusy(kind)
    try {
      const response = await fetch(`/inbox/compose?kind=${kind}`, { method: "POST", body: form })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        setError(result?.fieldErrors ? String(Object.values(result.fieldErrors)[0]) : result?.message ?? "Something went wrong. Please try again.")
        return
      }
      if (kind === "draft") {
        // The draft now lives in Gmail with every file: kept ones first, then the new
        // ones, in that order — so from now on they are numbered from the draft.
        const savedId: string | undefined = result?.id
        if (savedId) {
          setDraftId(savedId)
          setKept([...kept, ...files].map((file, index) => ({ index, name: file.name, size: file.size })))
          setFiles([])
        }
        setNotice("Draft saved.")
        router.refresh()
        return
      }
      onClose()
      router.refresh()
    } catch {
      setError("Could not reach the server. Please try again.")
    } finally {
      setBusy(null)
    }
  }

  const title =
    mode.kind === "new"
      ? "New email"
      : mode.kind === "draft"
        ? "Draft"
        : mode.kind === "forward"
          ? "Forward"
          : mode.kind === "replyAll"
            ? "Reply all"
            : "Reply"

  return (
    <form
      className={cn("flex min-h-0 flex-col gap-2", className)}
      onSubmit={(event) => {
        event.preventDefault()
        void submit("send")
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold">{title}</p>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close without sending">
          <X className="size-4" />
        </Button>
      </div>

      <Field label="From">
        <Select value={from} onValueChange={(value) => value && setFrom(value as string)}>
          <SelectTrigger className="h-8 w-full text-xs" aria-label="From">
            <SelectValue>
              {(value: string | null) => {
                const sender = senders.find((entry) => entry.email === value)
                return sender ? `${sender.name} <${sender.email}>` : value
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {senders.map((sender) => (
              <SelectItem key={sender.email} value={sender.email} className="text-xs">
                {sender.name} &lt;{sender.email}&gt;
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="To">
        <div className="flex items-center gap-2">
          <Input
            value={to}
            onChange={(event) => setTo(event.target.value)}
            placeholder="client@example.com"
            aria-label="To"
            className="h-8 text-xs"
            autoFocus={mode.kind === "new" || mode.kind === "forward"}
          />
          {!showCc && (
            <button type="button" onClick={() => setShowCc(true)} className="shrink-0 text-xs text-muted-foreground hover:text-foreground">
              Cc
            </button>
          )}
        </div>
      </Field>

      {showCc && (
        <Field label="Cc">
          <Input value={cc} onChange={(event) => setCc(event.target.value)} aria-label="Cc" className="h-8 text-xs" />
        </Field>
      )}

      <Field label="Subject">
        <Input value={subject} onChange={(event) => setSubject(event.target.value)} aria-label="Subject" className="h-8 text-xs" />
      </Field>

      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={source && mode.kind !== "forward" ? `Reply to ${source.name}…` : "Write your message…"}
        aria-label="Message"
        className="min-h-28 flex-1 resize-none p-3 text-sm"
        autoFocus={mode.kind === "reply" || mode.kind === "replyAll"}
      />
      {source && mode.kind !== "forward" && (
        <p className="text-[0.65rem] text-muted-foreground">The original email is quoted below your words when it is sent.</p>
      )}
      {mode.kind === "forward" && (
        <p className="text-[0.65rem] text-muted-foreground">The original email is added below your words.</p>
      )}

      {(kept.length > 0 || files.length > 0) && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Attached files">
          {kept.map((file) => (
            <FileChip key={`k${file.index}`} name={file.name} size={file.size} onRemove={() => setKept((list) => list.filter((entry) => entry.index !== file.index))} />
          ))}
          {files.map((file, position) => (
            <FileChip
              key={`f${position}-${file.name}`}
              name={file.name}
              size={file.size}
              onRemove={() => setFiles((list) => list.filter((_, index) => index !== position))}
            />
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {notice && !error && (
        <p role="status" className="text-xs text-muted-foreground">
          {notice}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileInput} type="file" multiple hidden onChange={(event) => addFiles(event.target.files)} />
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          onClick={() => fileInput.current?.click()}
          aria-label="Attach files"
          title="Attach files"
          className={cn(whiteStyle.button, "p-0!")}
        >
          <Paperclip className="size-3.5" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy !== null}
          onClick={() => void submit("draft")}
          className={cn(whiteStyle.button, "ml-auto px-3! py-0! text-xs! font-medium!")}
        >
          {busy === "draft" ? "Saving…" : "Save draft"}
        </Button>

        <Button
          type="submit"
          size="sm"
          disabled={busy !== null}
          aria-label="Send"
          className={cn(blackStyle.button, "gap-1.5 px-3! py-0! text-xs! font-medium!")}
        >
          <SendHorizontal className="size-3.5" />
          {busy === "send" ? "Sending…" : "Send"}
        </Button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[3.5rem_1fr] items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function FileChip({ name, size, onRemove }: { name: string; size: number; onRemove: () => void }) {
  return (
    <li className="flex max-w-full items-center gap-1.5 rounded-md border bg-muted/40 py-1 pr-1 pl-2 text-xs">
      <FileIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="truncate">{name}</span>
      <span className="shrink-0 text-muted-foreground">{fileSize(size)}</span>
      <button type="button" onClick={onRemove} aria-label={`Remove ${name}`} className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground">
        <X className="size-3" />
      </button>
    </li>
  )
}
