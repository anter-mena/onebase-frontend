import { PageSkeleton } from "@/components/loading/pageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The WhatsApp Inbox while it loads — whatsappInboxWorkspace.tsx: Conversations
 * on the left at their default 22%, the chat on the right (its header, the
 * bubbles, the composer). On a phone only the list, as on the real page.
 */
export default function WhatsAppInboxLoading() {
  return (
    <PageSkeleton
      eyebrow="Communication"
      title="WhatsApp Inbox"
      description="View and answer your client conversations."
    >
      <div className="flex h-full min-h-0">
        <aside className="flex h-full min-h-0 w-full flex-col bg-muted/15 md:w-[22%] md:min-w-[230px] md:border-r">
          <div className="shrink-0 border-b p-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Conversations</h2>
                <Skeleton className="mt-1.5 h-2.5 w-28" />
              </div>
              <Skeleton className="size-7" />
            </div>
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden p-2">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center gap-2.5 rounded-lg p-2">
                <Skeleton className="size-9 shrink-0 rounded-xl" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="ml-auto h-2 w-8" />
                  </div>
                  <Skeleton className={index % 2 ? "h-2.5 w-3/4" : "h-2.5 w-1/2"} />
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="hidden min-w-0 flex-1 flex-col md:flex">
          <div className="flex h-14 shrink-0 items-center gap-2.5 border-b px-4">
            <Skeleton className="size-8 rounded-xl" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <Skeleton className="ml-auto size-7" />
          </div>
          {/* A plain background: the bubbles are the only grey here. */}
          <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 overflow-hidden p-4">
            {[
              "w-56 self-start",
              "w-72 self-start",
              "w-48 self-end",
              "w-64 self-start",
              "w-40 self-end",
              "w-80 self-end",
            ].map((bubble, index) => (
              <Skeleton key={index} className={`h-10 max-w-[70%] shrink-0 rounded-xl ${bubble}`} />
            ))}
          </div>
          <div className="shrink-0 border-t bg-background p-3">
            <Skeleton className="mx-auto h-10 w-full max-w-3xl rounded-xl" />
          </div>
        </div>
      </div>
    </PageSkeleton>
  );
}
