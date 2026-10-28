import { LinesSkeleton } from "@/components/loading/pageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

/** The Privacy Policy while it loads: its title, then its five sections, in the same column. */
export default function PrivacyPolicyLoading() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12" role="status" aria-label="Loading">
      <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy</h1>
      <Skeleton className="mt-2 h-3 w-36" aria-hidden />
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className={index === 0 ? "mt-8" : "mt-6"} aria-hidden>
          <Skeleton className="h-4 w-32" />
          <LinesSkeleton count={3} className="mt-3" />
        </div>
      ))}
    </main>
  );
}
