"use client"

import { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Archive,
  ArchiveX,
  ChevronLeft,
  Clock,
  Forward,
  MoreVertical,
  Reply,
  ReplyAll,
  SendHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react"

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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { utcStamp } from "@/lib/format"
import { initialsOf } from "@/lib/initials"
import type { Mail, MailAbilities } from "@/lib/inbox/mailTypes"
import { cn } from "@/lib/utils"

/**
 * One message, open.
 *
 * <p>Four bands, and the order is the order the eye needs them: what you can do
 * about it, who sent it, what it says, and how to answer. The toolbar is at the
 * top rather than beside the reply box because archiving and deleting are the
 * two things done to a message you have decided not to answer — putting them
 * next to Send would mean the most common outcome and the most destructive one
 * share a corner.
 *
 * <p><b>Every control is gated on a permission</b>, and the gate is a real one:
 * `INBOX:SEND`, `DELETE`, `ARCHIVE` and `STAR` each exist in the database and
 * each is grantable to a member individually. An administrator holds all four
 * because the migration grants ADMIN everything, not because of a check for the
 * role here.
 *
 * <p><b>Disabled, not hidden</b> — the opposite of the sidebar's admin-only
 * sections. Hiding is right for a whole area nobody outside it should know
 * about; this is a screen the person is allowed to be on, where one action is
 * not theirs. A button that is missing reads as a feature that does not exist,
 * which sends them to ask the wrong question. A button that is there and says
 * why sends them to ask for the permission.
 *
 * <p>⚠️ <b>Nothing here does anything yet.</b> Every control is drawn and none
 * is wired, because there is no mailbox behind this and no endpoint to call. The
 * permission checks are already correct so that wiring them later is connecting
 * a button rather than remembering a rule.
 */

/**
 * Why a control is unavailable, in the words an administrator would tick.
 *
 * <p>Naming the permission rather than saying "not allowed", for the same reason
 * `PermissionRefused` does: "I cannot archive mail" starts a much longer
 * conversation than "I need INBOX:ARCHIVE".
 */
function refusal(permission: string): string {
  return `This needs the ${permission} permission, which your account does not have.`
}

function ToolbarButton({
  icon: Icon,
  label,
  allowed,
  permission,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  allowed: boolean
  /**
   * The permission this control needs, when it needs one.
   *
   * <p>Left off for actions that are nobody's to grant — snooze is not one of
   * the five `INBOX:*` permissions, it is simply unwritten. Omitting it is what
   * makes the tooltip say so instead of naming a permission that does not exist.
   */
  permission?: string
}) {
  // Only when there is something to say. A tooltip that reports the state of
  // the build talks about the project rather than to the person using it —
  // "not built yet" is true of most of this screen and useful to nobody
  // reading it. A missing permission is different: it is about them, and it
  // tells them what to go and ask for.
  const why = !allowed && permission ? refusal(permission) : null

  return (
    <Tooltip>
      {/* ⚠️ The tooltip sits on a wrapper, not on the button. None of these
          actions is wired yet, so the button is truly `disabled` — and a
          disabled Button gets `pointer-events-none`, which would stop its own
          tooltip from ever opening. The pointer falls through to this span
          instead, so the name still shows on hover. */}
      <TooltipTrigger render={<span className="inline-flex" />}>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled
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

function MailDisplay({
  mail,
  can,
}: {
  /** The open message, or null when nothing is selected. */
  mail: Mail | null
  can: MailAbilities
}) {
  /**
   * The mute switch actually moves.
   *
   * <p>It was `disabled`, which made it the one control on the screen that gave
   * no feedback at all — a switch that does not move when clicked reads as
   * broken, not as unbuilt. Nothing is stored: it forgets on navigation, which
   * is honest, because there is nothing behind it to remember.
   *
   * <p>Not gated on a permission either. Muting a thread is not one of the five
   * `INBOX:*` permissions — it changes nothing anybody else can see.
   */
  const [muted, setMuted] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  /**
   * Back to the list, on narrow screens where only one pane shows at a time.
   *
   * <p>Dropping `mail` from the address bar is what closes the message, so the
   * browser's own Back button does the same thing.
   */
  function backToList() {
    const next = new URLSearchParams(params.toString())
    next.delete("mail")
    const search = next.toString()
    router.push(search ? `${pathname}?${search}` : pathname, { scroll: false })
  }

  if (!mail) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1">
        <p className="text-sm font-medium">No message selected</p>
        <p className="text-sm text-muted-foreground">
          Choose one from the list to read it.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* ── What you can do about it ──────────────────────────────────────── */}
      <div className="flex h-14 shrink-0 items-center gap-1 border-b px-3">
        {/* Only when the list is hidden — see `InboxShell`. */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={backToList}
          aria-label="Back to messages"
          className="-ml-1 @min-[1070px]/inbox:hidden"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <ToolbarButton
          icon={Archive}
          label="Archive"
          allowed={can.archive}
          permission="INBOX:ARCHIVE"
        />
        <ToolbarButton
          icon={ArchiveX}
          label="Move to junk"
          allowed={can.archive}
          permission="INBOX:ARCHIVE"
        />
        <ToolbarButton
          icon={Trash2}
          label="Delete"
          allowed={can.delete}
          permission="INBOX:DELETE"
        />

        {/* ⚠️ The variant has to be matched, not just the property. Separator
            ships `data-vertical:self-stretch`, and a plain `self-center` does
            not replace it — tailwind-merge keys classes by variant, so the two
            are different keys, both survive, and the one carrying `data-vertical`
            wins wherever it applies. The rule stayed full height through an
            override that looked correct. Same-variant classes collapse properly. */}
        <Separator
          orientation="vertical"
          className="mx-1.5 data-vertical:h-5 data-vertical:self-center"
        />

        {/* Snooze needs a date picker, which needs `popover` and `calendar` and
            the day-picker library behind them. Drawn and disabled until the
            feature is worth those three. */}
        <ToolbarButton icon={Clock} label="Snooze" allowed />

        <div className="ml-auto flex items-center gap-1">
          <ToolbarButton
            icon={Reply}
            label="Reply"
            allowed={can.send}
            permission="INBOX:SEND"
          />
          <ToolbarButton
            icon={ReplyAll}
            label="Reply all"
            allowed={can.send}
            permission="INBOX:SEND"
          />
          <ToolbarButton
            icon={Forward}
            label="Forward"
            allowed={can.send}
            permission="INBOX:SEND"
          />

          <Separator
            orientation="vertical"
            className="mx-1.5 data-vertical:h-5 data-vertical:self-center"
          />

          <DropdownMenu>
            <DropdownMenuTrigger
              // Not wired yet, like the rest of the toolbar.
              disabled
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="More"
                  className={cn(whiteStyle.button, "p-0! text-muted-foreground")}
                />
              }
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              {/* Not `disabled`. A disabled menu item renders at half opacity,
                  and four of them in a row read as a menu that has been switched
                  off rather than one whose items are unwritten — which is how
                  the whole menu came to look greyed out.

                  Marking unread and labelling are also not permissions of their
                  own: neither sends, deletes, archives nor stars. Only Star
                  thread carries one, and it names it when the account lacks it. */}
              <DropdownMenuItem>Mark as unread</DropdownMenuItem>
              <DropdownMenuItem>
                Star thread
                {!can.star && (
                  <span className="ml-auto font-mono text-[0.65rem] text-muted-foreground">
                    INBOX:STAR
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem>Add label</DropdownMenuItem>
              <DropdownMenuItem>Mute thread</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Who sent it ───────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-start gap-4 border-b p-4">
        {/* The same black tile as the user's initials in the sidebar. */}
        <span
          aria-hidden
          className={cn(
            blackStyle.button,
            "relative flex size-10 shrink-0 items-center justify-center p-0! text-xs! font-semibold!"
          )}
        >
          {initialsOf(...splitName(mail.name))}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-sm font-semibold">{mail.name}</p>
          <p className="truncate text-xs font-medium">{mail.subject}</p>
          <p className="truncate text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Reply-To:</span>{" "}
            {mail.email}
          </p>
        </div>

        {/* The app's own stamp rather than the reference's "Oct 22, 2023,
            9:00:00 AM". Seconds on a message received last week are noise, and
            every other date in this application reads day-month-year in UTC. */}
        <p className="shrink-0 font-mono text-xs whitespace-nowrap text-muted-foreground">
          {utcStamp(mail.receivedAt)} UTC
        </p>
      </div>

      {/* ── What it says ──────────────────────────────────────────────────── */}
      {/* whitespace-pre-wrap, not a paragraph split. The body is plain text and
          its blank lines are the author's paragraphing — reflowing it would be
          this screen deciding it knows better than whoever wrote the message. */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="text-sm whitespace-pre-wrap">{mail.body}</p>
      </div>

      {/* ── How to answer ─────────────────────────────────────────────────── */}
      <Separator className="shrink-0" />

      <div className="shrink-0 p-4">
        <Textarea
          className="p-4"
          placeholder={`Reply ${mail.name}...`}
          disabled={!can.send}
          aria-label={`Reply to ${mail.name}`}
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-normal">
            <Switch
              size="sm"
              checked={muted}
              onCheckedChange={setMuted}
              aria-label="Mute this thread"
            />
            Mute this thread
          </label>

          {/* Always explained, never merely dead. With the permission this is
              disabled for being unwritten; without it, for not being theirs —
              and a button that is grey for two different reasons has to say
              which, or the two are indistinguishable. Every toolbar button
              above answers the same way. */}
          {/* Three controls at the end of the row, in the order they escalate:
              write it later, have something written for you, send it.

              Draft and Send both carry INBOX:SEND. Saving a draft writes nothing
              anybody else can see, so a separate permission for it would be one
              more box to tick that grants nothing — but it is still part of
              composing, and somebody who may not send has no use for a half-
              written reply either.

              Generate is deliberately worded and placed as a *drafting* tool,
              not a sending one: it puts words in the box and stops. ⚠️ When it
              is built it must never send on its own — the gap between "wrote
              something" and "sent something on your behalf" is the whole
              difference between a useful assistant and an incident. */}
          {/* Disabled until sending is wired, with the tooltip on a wrapper —
              the same reason as the toolbar buttons above. */}
          <Tooltip>
            <TooltipTrigger render={<span className="ml-auto inline-flex" />}>
              <Button
                size="sm"
                variant="outline"
                disabled
                className={cn(
                  whiteStyle.button,
                  "px-3! py-0! text-xs! font-medium!"
                )}
              >
                Draft
              </Button>
            </TooltipTrigger>
            <TooltipContent className="block max-w-[16rem] text-left leading-snug">
              <p className="font-medium">Save as draft</p>
              {!can.send && (
                <p className="mt-0.5 text-background/70">
                  {refusal("INBOX:SEND")}
                </p>
              )}
            </TooltipContent>
          </Tooltip>

          {/* Icon alone, between two words. Draft and Send are the two outcomes
              of writing a reply; this is a tool used on the way to one of them,
              and giving it the same weight as either made the row read as three
              equal choices. */}
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <Button
                size="icon-sm"
                variant="outline"
                disabled
                className={cn(whiteStyle.button, "p-0!")}
                aria-label="Generate with AI"
              >
                <Sparkles className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="block max-w-[16rem] text-left leading-snug">
              <p className="font-medium">Generate with AI</p>
              {!can.send && (
                <p className="mt-0.5 text-background/70">
                  {refusal("INBOX:SEND")}
                </p>
              )}
            </TooltipContent>
          </Tooltip>

          {/* An icon, not the word. The reply box directly above it is already
              labelled "Reply William Smith…", so the button repeating "Send"
              spends a corner of the screen saying what the field beside it has
              said — and a paper-plane at the end of a compose box is about as
              well-understood as an icon gets.

              aria-label carries the word for anybody who cannot see the shape. */}
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <Button
                size="icon-sm"
                disabled
                className={cn(blackStyle.button, "p-0!")}
                aria-label="Send"
              >
                <SendHorizontal className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="block max-w-[16rem] text-left leading-snug">
              <p className="font-medium">Send</p>
              {!can.send && (
                <p className="mt-0.5 text-background/70">
                  {refusal("INBOX:SEND")}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

/**
 * "William Smith" -> ["William", "Smith"].
 *
 * <p>`initialsOf` takes a first and last name because everywhere else in this
 * application has both as separate fields. A sender does not: mail carries one
 * display name, and it can be one word, three, or an address with no name at
 * all. Everything after the first word is treated as the surname so that
 * "Mary Anne Evans" gives ME rather than MA.
 */
function splitName(name: string): [string, string] {
  const [first = "", ...rest] = name.trim().split(/\s+/)
  return [first, rest.join(" ")]
}

export { MailDisplay }
