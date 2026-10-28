import type { CSSProperties } from "react";
import { cn } from "cn";

import { ReceiptMark } from "@/components/clients/earningsReceipt";
import { PrintReceiptBar } from "@/components/clients/printReceiptBar";
import receipt from "@/components/clients/receipt.module.css";
import { Line } from "@/components/loading/pageSkeleton";

/**
 * The page's paper (page.tsx): white, black ink, whatever the theme — plus
 * `--muted`, so the grey bars stay a light grey on the white slip in dark mode
 * too instead of taking the dark theme's grey.
 */
const paper = {
  "--card": "#ffffff",
  "--card-foreground": "#000000",
  "--muted-foreground": "#4b4b4b",
  "--border": "#000000",
  "--primary": "#ffffff",
  "--foreground": "#000000",
  "--muted": "#e8e8e8",
} as CSSProperties;

/** A detail line of the slip: the real label in the receipt's muted ink, the value grey. */
function Row({ label, width }: { label: string; width: string }) {
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
 * A receipt while it loads — the 80 mm slip of page.tsx, built from the same
 * receipt.module.css (the paper, its notches and shadow, the dashed rules) and
 * the real ReceiptMark, with the Print bar above it. The labels, the title and
 * "Total paid" are the real words; the figures are grey.
 */
export default function ReceiptLoading() {
  return (
    <main
      className="flex min-h-svh flex-col items-center gap-5 bg-muted/40 px-4 py-8 print:hidden"
      role="status"
      aria-label="Loading the receipt"
    >
      <PrintReceiptBar />

      <div style={paper} className={cn(receipt.shadow, "w-[80mm]")} aria-hidden>
        <article className={cn(receipt.ticket, "flex flex-col text-[11px]")}>
          <div className="flex h-(--notch-y) shrink-0 flex-col items-center justify-center px-5 text-center">
            <ReceiptMark />
            <h1 className="mt-3 text-sm font-semibold">Payment receipt</h1>
            <Line className="mt-0.5 text-[10px]" width="w-28" />
          </div>

          <div className={receipt.rule} />

          <dl className="flex flex-col gap-2 px-5 py-4">
            <Row label="Receipt no." width="w-24" />
            <Row label="Date" width="w-20" />
            <Row label="Type" width="w-14" />
            <Row label="Brand" width="w-16" />
            <Row label="Paid by" width="w-24" />
            <Row label="Phone" width="w-24" />
          </dl>

          <div className={receipt.rule} />

          <ul className="flex flex-col gap-2.5 px-5 py-4">
            <li className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <Line className="font-medium" width="w-28" />
                <Line className="mt-0.5 text-[10px]" width="w-32" />
              </span>
              <Line className="shrink-0" width="w-12" />
            </li>
          </ul>

          <div className={receipt.rule} />

          <div className="flex items-baseline justify-between gap-3 px-5 pt-4">
            <span className="text-xs font-semibold">Total paid</span>
            <Line className="text-lg" width="w-20" />
          </div>
          <div className="flex justify-center px-5 pt-3 pb-9">
            <Line className="text-[10px] leading-relaxed" width="w-36" />
          </div>
        </article>
      </div>
    </main>
  );
}
