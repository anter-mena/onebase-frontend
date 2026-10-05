"use client"

import { useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Archive,
  ArchiveX,
  ChevronLeft,
  Download,
  File as FileIcon,
  Forward,
  Inbox,
  MoreVertical,
  Reply,
  ReplyAll,
  Trash2,
} from "lucide-react"

import { mailAction, type MailAction } from "@/app/(private)/inbox/actions"
import { Composer, type ComposeMode } from "@/components/inbox/composer"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import blackStyle from "@/components/ui/button-styles/black.module.css"
import whiteStyle from "@/components/ui/button-styles/white.module.css"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { utcStamp } from "@/lib/format"
import { initialsOf } from "@/lib/initials"
import { fileSize, type FolderId, type MailAbilities, type MailDetail, type MailSender } from "@/lib/inbox/mailTypes"
import { cn } from "@/lib/utils"

/**
 * One email, open — and where answers are written.
 *
 * <p>Four bands, in the order the eye needs them: what you can do about it, who
 * sent it, what it says, and how to answer. Archive, Spam and Delete sit at the
 * top, far from Send, so the most common outcome and the most destructive one
 * never share a corner.
 *
 * <p>Every action happens in Gmail itself (see `GmailMailbox` in the backend), so
 * the mailbox looks the same in Gmail and here.
 *
 * <p>A draft opens straight into the composer; "New email" fills the whole pane.
 */

type Props = {
  mail: MailDetail | null
  folderId: FolderId
  can: MailAbilities
  senders: MailSender[]
  /** The selected brand's support address, so a new email starts from it. */
  brandSender: string | null
  /** True when the address bar says `compose=new`. */
  composingNew: boolean
}

function refusal(permission: string): string {
  return `This needs the ${permission} permission, which your account does not have.`
}

function ToolbarButton({
  icon: Icon,
  label,
  allowed,
  permission,
  onClick,
  busy,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  allowed: boolean
  permission?: string
  onClick: () => void
  busy?: boolean
}) {
  const why = !allowed && permission ? refusal(permission) : null
  return (
    <Tooltip>
      {/* The tooltip sits on a wrapper: a disabled button gets pointer-events-none
          and could never open its own tooltip. */}
      <TooltipTrigger render={<span className="inline-flex" />}>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!allowed || busy}
          onClick={onClick}
          aria-label={label}
          className={cn(whiteStyle.button, "p-0!")}
        >
          <Icon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="block max-w-[16rem] text-left leading-snug">
        <p className="font-medium">{label}</p>
        {why && <p className="mt-0.5 text-background/70">{why}</p>}
      </TooltipContent>
    </Tooltip>
  )
}

function MailDisplay({ mail, folderId, can, senders, brandSender, composingNew }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [answer, setAnswer] = useState<ComposeMode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pending, startTransition] = useTransition()

  /** Drops keys from the address bar: closing the email, or the new-email pane. */
  function navigateWithout(...keys: string[]) {
    const next = new URLSearchParams(params.toString())
    for (const key of keys) next.delete(key)
    const search = next.toString()
    router.push(search ? `${pathname}?${search}` : pathname, { scroll: false })
  }

  function run(action: MailAction, leaves: boolean) {
    if (!mail) return
    setError(null)
    startTransition(async () => {
      const result = await mailAction(mail.folder, mail.id, action)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setAnswer(null)
      // Archived, deleted or moved: it is not in this folder any more, so the next one opens.
      if (leaves) navigateWithout("mail")
      else router.refresh()
    })
  }

  // ── A new email fills the pane ──────────────────────────────────────────
  if (composingNew) {
    return (
      <div className="flex h-full min-h-0 flex-col p-4">
        <Composer
          key="new"
          mode={{ kind: "new" }}
          senders={senders}
          brandSender={brandSender}
          onClose={() => navigateWithout("compose")}
          className="h-full"
        />
      </div>
    )
  }

  if (!mail) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1">
        <p className="text-sm font-medium">No message selected</p>
        <p className="text-sm text-muted-foreground">Choose one from the list to read it.</p>
      </div>
    )
  }

  // ── A draft opens in the composer ─────────────────────────────────────────
  if (folderId === "drafts") {
    return (
      <div className="flex h-full min-h-0 flex-col p-4">
        <div className="mb-2 flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => navigateWithout("mail")} aria-label="Back to messages" className="-ml-1 @min-[1070px]/inbox:hidden">
            <ChevronLeft className="size-4" />
          </Button>
          <ToolbarButton icon={Trash2} label="Delete draft" allowed={can.delete} permission="INBOX:DELETE" onClick={() => setConfirmDelete(true)} busy={pending} />
          {error && <p className="ml-2 text-xs text-destructive">{error}</p>}
        </div>
        <Composer
          key={mail.id}
          mode={{ kind: "draft", draft: mail }}
          senders={senders}
          onClose={() => navigateWithout("mail")}
          className="h-full"
        />
        <DeleteForever open={confirmDelete} onOpenChange={setConfirmDelete} draft onConfirm={() => run("trash", true)} />
      </div>
    )
  }

  const inTrash = folderId === "trash"
  const canArchive = folderId === "inbox"
  const canJunk = folderId !== "junk" && folderId !== "trash" && folderId !== "sent"
  const canBackToInbox = folderId === "archive" || folderId === "junk" || folderId === "trash"

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* ── What you can do about it ──────────────────────────────────────── */}
      <div className="flex h-14 shrink-0 items-center gap-1 border-b px-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigateWithout("mail")} aria-label="Back to messages" className="-ml-1 @min-[1070px]/inbox:hidden">
          <ChevronLeft className="size-4" />
        </Button>

        {canArchive && (
          <ToolbarButton icon={Archive} label="Archive" allowed={can.archive} permission="INBOX:ARCHIVE" onClick={() => run("archive", true)} busy={pending} />
        )}
        {canBackToInbox && (
          <ToolbarButton
            icon={Inbox}
            label={folderId === "junk" ? "Not spam" : "Move to Inbox"}
            allowed={can.archive}
            permission="INBOX:ARCHIVE"
            onClick={() => run("inbox", true)}
            busy={pending}
          />
        )}
        {canJunk && (
          <ToolbarButton icon={ArchiveX} label="Move to spam" allowed={can.archive} permission="INBOX:ARCHIVE" onClick={() => run("junk", true)} busy={pending} />
        )}
        <ToolbarButton
          icon={Trash2}
          label={inTrash ? "Delete forever" : "Delete"}
          allowed={can.delete}
          permission="INBOX:DELETE"
          onClick={() => (inTrash ? setConfirmDelete(true) : run("trash", true))}
          busy={pending}
        />

        <div className="ml-auto flex items-center gap-1">
          <ToolbarButton icon={Reply} label="Reply" allowed={can.send} permission="INBOX:SEND" onClick={() => setAnswer({ kind: "reply", source: mail })} />
          <ToolbarButton icon={ReplyAll} label="Reply all" allowed={can.send} permission="INBOX:SEND" onClick={() => setAnswer({ kind: "replyAll", source: mail })} />
          <ToolbarButton icon={Forward} label="Forward" allowed={can.send} permission="INBOX:SEND" onClick={() => setAnswer({ kind: "forward", source: mail })} />

          <Separator orientation="vertical" className="mx-1.5 data-vertical:h-5 data-vertical:self-center" />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label="More" className={cn(whiteStyle.button, "p-0! text-muted-foreground")} />}
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem onClick={() => run("unread", true)}>Mark as unread</DropdownMenuItem>
              <DropdownMenuItem disabled={!can.star} onClick={() => run(mail.starred ? "unstar" : "star", false)}>
                {mail.starred ? "Remove star" : "Star"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {error && (
        <p role="alert" className="border-b bg-destructive/5 px-4 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {/* ── Who sent it ───────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-start gap-4 border-b p-4">
        <span aria-hidden className={cn(blackStyle.button, "relative flex size-10 shrink-0 items-center justify-center p-0! text-xs! font-semibold!")}>
          {initialsOf(...splitName(mail.name))}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-sm font-semibold">
            {mail.name}
            {mail.name !== mail.email && <span className="ml-1.5 text-xs font-normal text-muted-foreground">&lt;{mail.email}&gt;</span>}
          </p>
          <p className="truncate text-xs font-medium">{mail.subject}</p>
          <p className="truncate text-xs text-muted-foreground">
            <span className="font-medium text-foreground">To:</span> {addresses(mail.to)}
            {mail.cc.length > 0 && (
              <>
                {" · "}
                <span className="font-medium text-foreground">Cc:</span> {addresses(mail.cc)}
              </>
            )}
          </p>
          {mail.replyTo.length > 0 && (
            <p className="truncate text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Reply-To:</span> {addresses(mail.replyTo)}
            </p>
          )}
        </div>

        <p className="shrink-0 font-mono text-xs whitespace-nowrap text-muted-foreground">{utcStamp(mail.receivedAt)} UTC</p>
      </div>

      {/* ── What it says ──────────────────────────────────────────────────── */}
      {/* Plain text from the backend; its blank lines are the author's paragraphs. */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="text-sm break-words whitespace-pre-wrap">{mail.body || "(This email has no text.)"}</p>

        {mail.attachments.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Attached files">
            {mail.attachments.map((file) => (
              <li key={file.index}>
                <a
                  href={`/inbox/attachment?folder=${mail.folder}&id=${mail.id}&index=${file.index}`}
                  download
                  className="flex max-w-xs items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
                >
                  <FileIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate font-medium">{file.name}</span>
                  <span className="shrink-0 text-muted-foreground">{fileSize(file.size)}</span>
                  <Download className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── How to answer ─────────────────────────────────────────────────── */}
      <Separator className="shrink-0" />
      <div className="max-h-[65%] shrink-0 overflow-y-auto p-4">
        {answer ? (
          <Composer key={`${answer.kind}-${mail.id}`} mode={answer} senders={senders} onClose={() => setAnswer(null)} />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              disabled={!can.send}
              onClick={() => setAnswer({ kind: "reply", source: mail })}
              className={cn(blackStyle.button, "gap-1.5 px-3! py-0! text-xs! font-medium!")}
            >
              <Reply className="size-3.5" />
              Reply
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!can.send}
              onClick={() => setAnswer({ kind: "forward", source: mail })}
              className={cn(whiteStyle.button, "gap-1.5 px-3! py-0! text-xs! font-medium!")}
            >
              <Forward className="size-3.5" />
              Forward
            </Button>
          </div>
        )}
      </div>

      <DeleteForever open={confirmDelete} onOpenChange={setConfirmDelete} onConfirm={() => run("trash", true)} />
    </div>
  )
}

/** Deleting from Trash, or throwing away a draft, cannot be undone — so it asks. */
function DeleteForever({
  open,
  onOpenChange,
  onConfirm,
  draft = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  draft?: boolean
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{draft ? "Delete this draft?" : "Delete this email forever?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {draft ? "The draft is removed from Gmail too." : "It is removed from Gmail too and cannot be brought back."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onOpenChange(false)
              onConfirm()
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function addresses(list: { name: string; email: string }[]): string {
  if (list.length === 0) return "—"
  return list.map((address) => address.name || address.email).join(", ")
}

/** "William Smith" → ["William", "Smith"]; everything after the first word is the surname. */
function splitName(name: string): [string, string] {
  const [first = "", ...rest] = name.trim().split(/\s+/)
  return [first, rest.join(" ")]
}

export { MailDisplay }
