import {
  ButtonSkeleton,
  Line,
  PageSkeleton,
  RangePills,
  SearchSkeleton,
  TableSkeleton,
} from "@/components/loading/pageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The Ledger while it loads — ledgerTable.tsx: the period, then search,
 * the filter button and Export on the right; the columns; then the period's balance under
 * the rows (its labels real, its figures grey); then the footer with the Ledger's
 * icon-only paging.
 */
export default function LedgerLoading() {
  return (
    <PageSkeleton
      eyebrow="Workspace"
      title="Ledger"
      description="Every payment received: who paid, for what, to which account, and what it left."
    >
      <TableSkeleton
        rows={4}
        minWidth={980}
        toolbarClassName="flex-row flex-wrap items-center xl:flex-nowrap"
        toolbar={
          // One row, as ledgerTable.tsx: period; then search, the filter button and Export on the right.
          <>
            {/* This month: the page's default period. */}
            <RangePills active="month" />
            {/* On the right: search, the filter button (money, account, brand), Export. */}
            <SearchSkeleton className="ml-auto min-w-40 flex-1 xl:max-w-64" />
            <ButtonSkeleton className="w-7 shrink-0" />
            <ButtonSkeleton className="w-24 shrink-0" />
          </>
        }
        columns={[
          { label: "Date", className: "w-28" },
          { label: "Client", className: "w-44" },
          { label: "Plan" },
          { label: "Type", className: "w-24" },
          { label: "Paid to", className: "w-36" },
          { label: "Brand", className: "w-28" },
          { label: "Amount", className: "w-24 text-right" },
          { label: "Perks", className: "w-24 text-right" },
          { label: "Net", className: "w-24 text-right" },
          { label: "", className: "w-12 text-right", cell: "action" },
        ]}
        beforeFooter={
          <section className="mx-4 mb-3 flex shrink-0 flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <Line className="text-xs font-semibold" width="w-36" />
              <Line className="mt-0.5 text-[0.6rem] leading-relaxed" width="w-72" />
              <Line className="text-[0.6rem] leading-relaxed" width="w-40" />
            </div>
            <dl className="grid w-full grid-cols-[1fr_auto] gap-x-8 gap-y-1 text-xs sm:w-80">
              <dt className="text-muted-foreground">Money in</dt>
              <dd><Line className="text-right" width="w-16" /></dd>
              <dt className="text-muted-foreground">Panel credit top-ups</dt>
              <dd><Line className="text-right" width="w-14" /></dd>
              <dt className="text-muted-foreground">Perks paid</dt>
              <dd><Line className="text-right" width="w-12" /></dd>
              <div aria-hidden className="col-span-full my-1 h-[3px] border-y border-foreground/30" />
              <dt className="text-sm font-semibold">Net</dt>
              <dd><Line className="text-right text-sm" width="w-16" /></dd>
            </dl>
          </section>
        }
        footer={
          <div className="flex w-full items-center gap-2">
            <Skeleton className="h-3 w-24" />
            <ButtonSkeleton className="w-28" />
            <div className="ml-auto flex items-center gap-1">
              <ButtonSkeleton className="w-7" />
              <ButtonSkeleton className="w-7" />
              <Skeleton className="h-7 w-14" />
              <ButtonSkeleton className="w-7" />
              <ButtonSkeleton className="w-7" />
            </div>
          </div>
        }
      />
    </PageSkeleton>
  );
}
