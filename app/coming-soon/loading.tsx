import { Skeleton } from "@/components/ui/skeleton";

/** Coming soon while it loads: its icon tile, title, two lines and the way back, centred as on the page. */
export default function ComingSoonLoading() {
  return (
    <div className="min-h-svh bg-background" role="status" aria-label="Loading">
      <main className="flex min-h-svh items-center justify-center px-6 py-16 md:px-10">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-2" aria-hidden>
          <Skeleton className="mb-1 size-11 rounded-lg" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-3 w-36" />
          <Skeleton className="mt-2 h-3 w-16" />
        </div>
      </main>
    </div>
  );
}
