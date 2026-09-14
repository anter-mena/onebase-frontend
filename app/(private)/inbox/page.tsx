import type { Metadata } from "next"
import { cookies } from "next/headers"

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
 * Every action allowed while there is no login.
 *
 * <p>The components already disable and explain each control from this object,
 * so when permissions arrive this becomes a read of the signed-in user and
 * nothing below it changes.
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
  /** The open message, the filter and the search. All three write here. */
  searchParams: Promise<MailQuery>
}) {
  /**
   * Where this browser last left the divider.
   *
   * <p>Read on the server so the panes are rendered at the right widths in the
   * first HTML. The previous version kept this in `localStorage`, which the
   * server cannot see — so every reload painted the default split and then
   * corrected itself, visibly.
   */
  const layout = parsePaneLayout((await cookies()).get(PANES_COOKIE)?.value)

  const query = await searchParams
  const { mails, selected, accounts, account, folders, folderId, brands } =
    await getInbox(query)

  // Decided once, on the server, and passed down. Every row shows an age, and a
  // component that reads the clock itself renders one answer here and a
  // different one after hydration — which React reports as a mismatch.
  const now = new Date()

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <p className="text-xs font-medium text-muted-foreground">
          Communication
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Inbox</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          View and manage your client emails.
        </p>
      </header>

      <section
        // @container/inbox: the shell picks one pane or two from this box's
        // width, not the window's.
        className="@container/inbox mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background"
        aria-label="Inbox content"
      >
        <InboxShell
          defaultLayout={layout}
          // On narrow screens the message only opens once one was tapped.
          showReading={Boolean(selected) && selected?.id === query.mail}
          list={
            // Keyed on the query so the search box is re-seeded from the URL when
            // the Back button changes it — without this a stale word sits in a
            // field that is no longer filtering anything.
            <MailList
              key={`${query.filter ?? ""}|${query.q ?? ""}|${query.brand ?? ""}`}
              mails={mails}
              selectedId={selected?.id ?? null}
              query={query}
              brands={brands}
              accounts={accounts}
              accountId={account.id}
              folders={folders}
              folderId={folderId}
              canStar={can.star}
              now={now}
            />
          }
          reading={<MailDisplay mail={selected} can={can} />}
        />
      </section>
    </div>
  )
}
