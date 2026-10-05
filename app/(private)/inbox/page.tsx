import type { Metadata } from "next"
import { cookies } from "next/headers"

import { AutoRefresh } from "@/components/app-shell/autoRefresh"
import { LoadError } from "@/components/errors/loadError"
import { InboxShell } from "@/components/inbox/inboxShell"
import { MailDisplay } from "@/components/inbox/mailDisplay"
import { MailList } from "@/components/inbox/mailList"
import { PANES_COOKIE, parsePaneLayout } from "@/lib/inbox/inboxLayout"
import { getInbox } from "@/lib/inbox/mail"
import type { MailAbilities, MailQuery } from "@/lib/inbox/mailTypes"

export const metadata: Metadata = {
  title: "Inbox | One Base",
}

/**
 * Admins and Commercials may both read, answer, star, archive and delete (decided
 * 2026-10-05). The backend is the real gate; this only shapes the buttons.
 */
const can: MailAbilities = {
  send: true,
  delete: true,
  archive: true,
  star: true,
}

export default async function InboxPage({
  searchParams,
}: {
  /** The open message, the folder, the filter, the search, the brand. */
  searchParams: Promise<MailQuery>
}) {
  // Where this browser last left the divider, read on the server so the first
  // paint is already at the right widths.
  const layout = parsePaneLayout((await cookies()).get(PANES_COOKIE)?.value)

  const query = await searchParams
  const result = await getInbox(query)

  // Decided once, on the server: every row shows an age, and a clock read during
  // render would differ between the server and the browser.
  const now = new Date()

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <p className="text-xs font-medium text-muted-foreground">Communication</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Inbox</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {result.ok
            ? `Every brand address, in ${result.data.account.email}. What you do here happens in Gmail too.`
            : "View and manage your client emails."}
        </p>
      </header>

      {!result.ok ? (
        <div className="mt-4">
          <LoadError title="The inbox could not be loaded." reason={result.error} />
        </div>
      ) : (
        <section
          // @container/inbox: the shell picks one pane or two from this box's width.
          className="@container/inbox mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background"
          aria-label="Inbox content"
        >
          {/* New mail every 30 seconds. A draft being written keeps its words: React
              only swaps the server data, the composer's own state stays. */}
          <AutoRefresh everyMs={30_000} />
          <InboxShell
            defaultLayout={layout}
            // On narrow screens the reading pane only opens once something was chosen.
            showReading={query.compose === "new" || (Boolean(result.data.selected) && result.data.selected?.id === query.mail)}
            list={
              <MailList
                key={`${query.filter ?? ""}|${query.q ?? ""}|${query.brand ?? ""}|${result.data.folderId}`}
                mails={result.data.mails}
                selectedId={query.compose === "new" ? null : (result.data.selected?.id ?? null)}
                query={query}
                brands={result.data.brands}
                accounts={result.data.accounts}
                accountId={result.data.account.id}
                folders={result.data.folders}
                folderId={result.data.folderId}
                canStar={can.star}
                canSend={can.send}
                limit={result.data.limit}
                now={now}
              />
            }
            reading={
              <MailDisplay
                mail={result.data.selected}
                folderId={result.data.folderId}
                can={can}
                senders={result.data.senders}
                brandSender={result.data.brands.find((brand) => brand.name === query.brand)?.sender ?? null}
                composingNew={query.compose === "new"}
              />
            }
          />
        </section>
      )}
    </div>
  )
}
