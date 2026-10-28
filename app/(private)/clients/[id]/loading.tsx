import { cookies } from "next/headers";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { cn } from "cn";

import { ReceiptMark } from "@/components/clients/earningsReceipt";
import { CardLink, InfoCard } from "@/components/clients/infoCard";
import receipt from "@/components/clients/receipt.module.css";
import {
  ButtonSkeleton,
  Line,
  PageSkeleton,
  SearchSkeleton,
  TableSkeleton,
  type ColumnSkeleton,
} from "@/components/loading/pageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TRANSACTION_COLUMNS_COOKIE,
  TRANSACTION_FIXED_COLUMNS_WIDTH,
  parseHiddenTransactionColumns,
  transactionColumns,
  type TransactionColumnId,
} from "@/lib/clients/transactionColumns";

/** Each column's real width and alignment (transactionsTable.tsx), and what its cells hold. */
const COLUMN: Record<TransactionColumnId, Omit<ColumnSkeleton, "label">> = {
  brand: { className: "w-16", cell: "icon" },
  kind: { className: "w-28" },
  method: { className: "w-32" },
  amount: { className: "w-28 text-right" },
  expense: { className: "w-24 text-right" },
  net: { className: "w-28 text-right" },
};

const BEFORE_DESCRIPTION = new Set<TransactionColumnId>(["brand", "kind"]);

/** The profile's boxes (clientProfile.tsx `fieldBox`): the name, the phone, the email. */
const box = "flex w-full min-w-0 items-center justify-center gap-1.5 rounded-md border border-transparent px-2";

/** A line of the receipt: the label in the receipt's muted ink, the value grey. */
function ReceiptRow({ label, width = "w-20" }: { label: string; width?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={receipt.muted}>{label}</dt>
      <dd>
        <Line className="text-right" width={width} />
      </dd>
    </div>
  );
}

/**
 * One client while it loads — clientWorkspace.tsx and its three columns, each
 * built from the real component:
 *
 * <ul>
 *   <li>the profile (clientProfile.tsx): the `size-16` tile, the name, the number,
 *       phone | email, the WhatsApp line; then Current plan (six facts, two columns)
 *       and Note, in the real InfoCard frame;</li>
 *   <li>the transactions (transactionsTable.tsx): title and Export, search, columns
 *       and Add payment, then the table — Description takes the free width, and the
 *       money is right-aligned, as on the page;</li>
 *   <li>the receipt (earningsReceipt.tsx): the real paper — its notches, shadow and
 *       dashed rules come from receipt.module.css — with the mark, the labels and
 *       the footnote in place and the figures grey.</li>
 * </ul>
 */
export default async function ClientDetailsLoading() {
  const hidden = new Set(parseHiddenTransactionColumns((await cookies()).get(TRANSACTION_COLUMNS_COOKIE)?.value));
  const shown = transactionColumns.filter((column) => !hidden.has(column.id));
  const toColumn = (column: (typeof transactionColumns)[number]) => ({ label: column.label, ...COLUMN[column.id] });

  return (
    <PageSkeleton
      back={{ href: "/clients", label: "Clients" }}
      title={<Skeleton className="my-1 h-6 w-48" />}
      description="Their details, what they have paid, and what it came to."
      actions={
        <>
          <ButtonSkeleton className="w-24" />
          <ButtonSkeleton className="w-24" />
        </>
      }
    >
      {/* The real page's layout (clientWorkspace.tsx): from `xl`, three cards
          exactly the section's height; below it, stacked, and the page scrolls. */}
      <div className="h-full overflow-y-auto p-4 [scrollbar-gutter:stable]">
        <div className="grid min-w-0 items-start gap-4 xl:h-full xl:grid-cols-[20rem_minmax(0,1fr)_23rem] xl:grid-rows-[minmax(0,1fr)] xl:items-stretch">
          <div className="flex min-w-0 flex-col gap-4 xl:min-h-0 xl:overflow-y-auto">
            <section className="relative rounded-xl border bg-card px-5 py-6 text-center">
              <Skeleton className="mx-auto size-16 rounded-xl" />
              <div className={cn(box, "mt-2 h-8")}>
                <Line className="text-base font-semibold" width="w-32" />
              </div>
              <Line className="mt-0.5 text-[0.65rem]" width="w-28" />
              <div className="mt-3 grid grid-cols-[9.5rem_1px_minmax(0,1fr)] items-center gap-1 text-xs text-muted-foreground">
                <div className={cn(box, "h-7 px-1.5")}>
                  <Phone className="size-3 shrink-0" aria-hidden />
                  <Line className="text-xs" width="w-24" />
                </div>
                <span className="h-4 w-px bg-border" aria-hidden />
                <div className={cn(box, "h-7 px-1.5")}>
                  <Mail className="size-3 shrink-0" aria-hidden />
                  <Line className="text-xs" width="w-24" />
                </div>
              </div>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <MessageCircle className="size-3" aria-hidden />
                <span className="inline-block h-[0.75em] w-36 animate-pulse rounded-[0.2em] bg-muted" />
              </p>
            </section>

            <InfoCard title="Current plan" className="shrink-0" action={<CardLink href="/configuration?tab=subscriptions">Plans</CardLink>}>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                {["Term", "Devices", "Brand", "Pays by", "Started", "Ends"].map((label) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-[0.65rem] text-muted-foreground">{label}</dt>
                    <dd className="mt-0.5">
                      <Line className="text-xs" width="w-20" />
                    </dd>
                  </div>
                ))}
              </dl>
            </InfoCard>

            <InfoCard
              title="Note"
              className="xl:min-h-40 xl:flex-[1_0_auto]"
              contentClassName="flex min-h-0 flex-1 flex-col"
              action={<Line className="text-[0.65rem]" width="w-8" />}
            >
              <Line className="text-xs leading-relaxed" width="w-full" />
              <Line className="text-xs leading-relaxed" width="w-5/6" />
              <Line className="text-xs leading-relaxed" width="w-1/2" />
            </InfoCard>
          </div>

          {/* Transactions: title and Export, then search, columns and Add payment, then the table. */}
          <section className="@container flex min-h-80 min-w-0 flex-col overflow-hidden rounded-xl border bg-card xl:min-h-0">
            <TableSkeleton
              rows={5}
              minWidth={TRANSACTION_FIXED_COLUMNS_WIDTH + shown.reduce((sum, column) => sum + column.width, 0)}
              toolbar={
                <div className="flex w-full flex-col gap-2.5">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0">
                      <h2 className="text-sm font-medium">Transactions</h2>
                      <Line className="mt-0.5 text-[0.65rem]" width="w-36" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <SearchSkeleton className="flex-1" />
                    <ButtonSkeleton className="w-7" />
                    <ButtonSkeleton className="w-28" />
                  </div>
                </div>
              }
              columns={[
                { label: "", className: "w-8", cell: "checkbox" },
                { label: "Date", className: "w-28" },
                // Brand and Type before Description, the rest after it — by id, so a hidden one shifts nothing.
                ...shown.filter((column) => BEFORE_DESCRIPTION.has(column.id)).map(toColumn),
                { label: "Description" },
                ...shown.filter((column) => !BEFORE_DESCRIPTION.has(column.id)).map(toColumn),
                { label: "", className: "w-24 text-right", cell: "action" },
              ]}
            />
          </section>

          {/* The earnings receipt: the real paper, with its figures grey. */}
          <section className="flex min-h-0 min-w-0 flex-col">
            <div className={cn(receipt.shadow, "flex min-h-0 flex-1 flex-col")}>
              <div className={cn(receipt.ticket, "flex min-h-0 flex-1 flex-col")}>
                <div className="flex h-(--notch-y) shrink-0 flex-col items-center justify-center px-6 text-center">
                  <ReceiptMark />
                  <Line className="mt-3 text-sm" width="w-28" />
                  <Line className="mt-0.5 text-[0.6rem]" width="w-24" />
                </div>

                <div className={receipt.rule} />

                <dl className="flex shrink-0 flex-col gap-3 px-6 py-5 text-[0.7rem]">
                  <ReceiptRow label="Reference number" width="w-24" />
                  <ReceiptRow label="Latest payment" />
                  <ReceiptRow label="Payment method" width="w-16" />
                </dl>

                <div className={receipt.rule} />

                <ul className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-hidden px-6 py-5">
                  {[0, 1, 2].map((index) => (
                    <li key={index} className="flex items-start justify-between gap-3 text-[0.7rem]">
                      <span className="min-w-0">
                        <Line width={index === 1 ? "w-24" : "w-32"} />
                        <Line className="mt-0.5 text-[0.6rem]" width="w-24" />
                      </span>
                      <span className="flex shrink-0 flex-col items-end">
                        <Line width="w-14" />
                        <Line className="mt-0.5 text-[0.6rem]" width="w-20" />
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto shrink-0">
                  <div className={receipt.rule} />
                  <dl className="flex flex-col gap-2 px-6 pt-5 text-[0.7rem]">
                    <ReceiptRow label="Earned" />
                    <ReceiptRow label="Expenses" width="w-14" />
                  </dl>
                  <div className="flex items-baseline justify-between gap-3 px-6 pt-4">
                    <span className="text-xs font-medium">Net earnings</span>
                    <Line className="text-lg" width="w-24" />
                  </div>
                  <p className={cn(receipt.muted, "px-6 pt-3 pb-9 text-center text-[0.6rem] leading-relaxed")}>
                    All time, after plan and perk costs. Before panel credit.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageSkeleton>
  );
}
