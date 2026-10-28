import { cookies } from "next/headers";

import { InboxShell } from "@/components/inbox/inboxShell";
import { PageHeader } from "@/components/loading/pageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { PANES_COOKIE, parsePaneLayout } from "@/lib/inbox/inboxLayout";

/**
 * The Email Inbox while it loads: the same panes at the same sizes — read from
 * the same cookie as the page — so when the mail arrives nothing moves, only the
 * grey shapes are replaced. The list: the folder bar, then New, search and brand,
 * then the messages. The reading pane: its toolbar and an empty page.
 */
export default async function InboxLoading() {
  const layout = parsePaneLayout((await cookies()).get(PANES_COOKIE)?.value);

  return (
    <div className="flex h-full w-full min-h-0 flex-col" role="status" aria-label="Loading the inbox">
      <PageHeader
        eyebrow="Communication"
        title="Email Inbox"
        description={<Skeleton className="h-3 w-96 max-w-full" />}
      />

      <section
        className="@container/inbox mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background"
        aria-hidden
      >
        <InboxShell
          defaultLayout={layout}
          showReading={false}
          list={
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex min-h-14 shrink-0 items-center gap-2 border-b px-4 py-2">
                <Skeleton className="h-8 w-48" />
                <div className="flex flex-1 gap-1">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Skeleton key={index} className="size-7" />
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 p-4 pb-2">
                <Skeleton className="h-9 w-9 @min-[480px]/inbox:w-16" />
                <Skeleton className="h-9 min-w-0 flex-1" />
                <Skeleton className="h-9 w-32" />
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-4 pb-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="flex flex-col gap-2 rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-3.5 rounded-sm" />
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="ml-auto h-2.5 w-12" />
                    </div>
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-full" />
                  </div>
                ))}
              </div>
            </div>
          }
          reading={
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex h-14 shrink-0 items-center gap-1 border-b px-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="size-7" />
                ))}
                <Skeleton className="ml-auto size-7" />
              </div>
              <div className="flex flex-1 items-center justify-center">
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          }
        />
      </section>
    </div>
  );
}
