"use client"

import { useState } from "react"
import { MoreHorizontal } from "lucide-react"

/**
 * The text of an email, with the quoted original of a reply folded away.
 *
 * <p>Plain-text mail quotes with "> " at the start of each line. Shown raw, a
 * short "thank you" sits above forty lines of chevrons. Like Gmail, the quote
 * (and its "On … wrote:" line) hides behind a "•••" button, and when opened it
 * is drawn as a quote block — a line on the left, no chevrons.
 */

/** "On … wrote:" in English, "Le … a écrit :" from a French Gmail. */
const QUOTE_HEADER = /^\s*(on|le)\s.+(wrote|a écrit)\s*:\s*$/i

function splitQuote(text: string): { main: string; quoted: string[] | null } {
  const lines = text.split("\n")
  for (let i = 0; i < lines.length; i++) {
    const startsQuote =
      lines[i].startsWith(">") ||
      (QUOTE_HEADER.test(lines[i]) && lines.slice(i + 1).some((line) => line.startsWith(">")))
    if (!startsQuote) continue
    // Only a quote that runs to the end is folded; words written after it stay visible.
    const rest = lines.slice(i)
    const tail = rest.slice(rest.findLastIndex((line) => line.startsWith(">")) + 1)
    if (tail.some((line) => line.trim() !== "")) return { main: text, quoted: null }
    return { main: lines.slice(0, i).join("\n").trimEnd(), quoted: rest }
  }
  return { main: text, quoted: null }
}

export function MailBody({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const { main, quoted } = splitQuote(text)

  return (
    <div className="text-sm break-words">
      {main && <p className="whitespace-pre-wrap">{main}</p>}
      {quoted && (
        <>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? "Hide the quoted email" : "Show the quoted email"}
            title={open ? "Hide the quoted email" : "Show the quoted email"}
            className="mt-3 flex h-4 items-center rounded-sm bg-muted px-1.5 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
          >
            <MoreHorizontal className="size-4" />
          </button>
          {open && <Quote lines={quoted} />}
        </>
      )}
    </div>
  )
}

/** Lines with their chevrons turned into nested quote blocks. */
function Quote({ lines }: { lines: string[] }) {
  type Block = { level: number; lines: string[] }
  const blocks: Block[] = []
  for (const raw of lines) {
    let level = 0
    let rest = raw
    while (rest.startsWith(">")) {
      level++
      rest = rest.slice(1)
      if (rest.startsWith(" ")) rest = rest.slice(1)
    }
    const last = blocks.at(-1)
    if (last && last.level === level) last.lines.push(rest)
    else blocks.push({ level, lines: [rest] })
  }

  return (
    <div className="mt-3 text-muted-foreground">
      {blocks.map((block, index) => (
        <div
          key={index}
          className="whitespace-pre-wrap"
          style={{
            marginLeft: `${Math.max(0, block.level - 1) * 0.75}rem`,
            paddingLeft: block.level > 0 ? "0.75rem" : undefined,
            borderLeft: block.level > 0 ? "2px solid var(--border)" : undefined,
          }}
        >
          {block.lines.join("\n")}
        </div>
      ))}
    </div>
  )
}
