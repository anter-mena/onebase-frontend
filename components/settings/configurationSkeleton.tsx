"use client";

import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { CirclePlus, LayoutGrid, Link2, MonitorSmartphone, Rows3, WalletCards } from "lucide-react";
import { cn } from "cn";

import { getConfigurationTab, settingsNavigation } from "@/components/app-shell/navigation";
import {
  ButtonSkeleton,
  Line,
  PageHeader,
  PagerSkeleton,
  Pills,
  TableRowsSkeleton,
  type ColumnSkeleton,
} from "@/components/loading/pageSkeleton";
import { Badge } from "@/components/ui/badge";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaymentMethodsView } from "@/lib/settings/paymentMethodsView";

/**
 * Configuration while it loads, tab by tab.
 *
 * <p>All five tabs are one address (`/configuration?tab=…`) and so one
 * `loading.tsx` — which, being on the server, cannot read the query. This part
 * runs in the browser, where it can: it lights the tab being opened and draws
 * that tab's own layout, read from its component (brands.tsx, subscriptions.tsx,
 * expenses.tsx, paymentMethods.tsx, panel.tsx). No `?tab=` means Brands, as on
 * the page (getConfigurationTab).
 */
export function ConfigurationSkeleton({
  paymentMethodsView,
  tabValue,
}: {
  paymentMethodsView: PaymentMethodsView;
  /**
   * The tab being opened, when the caller knows it: the page's own fallback does
   * (configuration/page.tsx). While a tab change is on its way the address bar
   * may still show the old tab, so the page says which one rather than this
   * reading it. loading.tsx cannot know, and leaves it to the address bar.
   */
  tabValue?: string;
}) {
  const fromAddress = useSearchParams().get("tab");
  const tab = getConfigurationTab(tabValue ?? fromAddress);

  return (
    <div className="flex h-full w-full min-h-0 flex-col" role="status" aria-label="Loading">
      <PageHeader
        eyebrow="Administration"
        title="Configuration"
        description={
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="min-w-0">Manage your brands, subscription plans, and payment methods.</p>
            <div aria-hidden>
              <Pills
                active={settingsNavigation.findIndex((item) => item.value === tab.value)}
                options={settingsNavigation.map((item) => item.label)}
              />
            </div>
          </div>
        }
      />

      {/* The real tab panel's frame: it scrolls, as on the page. */}
      <section className="mt-4 min-h-0 flex-1 overflow-auto rounded-xl border bg-background p-4" aria-hidden>
        {tab.value === "panel" ? (
          <PanelSkeleton />
        ) : tab.value === "subscriptions" ? (
          <SubscriptionsSkeleton />
        ) : tab.value === "expenses" ? (
          <ExpensesSkeleton />
        ) : tab.value === "payment-methods" ? (
          <PaymentMethodsSkeleton view={paymentMethodsView} />
        ) : (
          <BrandsSkeleton />
        )}
      </section>
    </div>
  );
}

// ── Shared pieces ─────────────────────────────────────────────────────────────

/** Every tab opens with its title and description on the left, its count and buttons on the right. */
function TabHeader({ title, description, actions }: { title: ReactNode; description: string; actions: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}

/** The count pill ("6 brands"): the frame and the word are real, the number is data. */
function CountPill({ unit }: { unit: string }) {
  return (
    <span className="rounded-full border bg-muted/40 px-2.5 py-1 text-[0.65rem] text-muted-foreground">
      <span className="inline-block h-[0.75em] w-3 animate-pulse rounded-[0.2em] bg-muted align-middle" /> {unit}
    </span>
  );
}

const DEVICES = [1, 2, 3, 4];
const MONTHS = [1, 3, 6, 12];
const deviceLabel = (devices: number) => `${devices} ${devices === 1 ? "device" : "devices"}`;
const monthLabel = (months: number) => `${months} ${months === 1 ? "month" : "months"}`;

// ── Panel ─────────────────────────────────────────────────────────────────────

/**
 * Panel (panel.tsx): the heading, its "Coming soon" badge and the description are
 * real; inside the dashed box, the icon tile, the title, the paragraph and the
 * pill are grey. Drawn whole, the tab looked exactly like its loader — which read
 * as having none.
 */
function PanelSkeleton() {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-medium">
            Panel
            <Badge variant="secondary" className="h-4 px-1.5 text-[0.6rem] font-normal">
              Coming soon
            </Badge>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Manage the panels available in your workspace.</p>
        </div>
      </div>

      <div className="mt-4 flex min-h-48 flex-1 items-center justify-center rounded-lg border border-dashed p-6">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <Skeleton className="size-9 rounded-xl" />
          <Line className="mt-3 text-sm" width="w-40" />
          <div className="mt-1.5 flex w-full flex-col items-center">
            <Line className="text-xs leading-relaxed" width="w-full" />
            <Line className="text-xs leading-relaxed" width="w-11/12" />
            <Line className="text-xs leading-relaxed" width="w-2/3" />
          </div>
          <Skeleton className="mt-3 h-6 w-64 max-w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ── Brands ────────────────────────────────────────────────────────────────────

function BrandsSkeleton() {
  return (
    <>
      <TabHeader
        title="Brands"
        description="Paste a brand's website: its name, logo and social links are found for you."
        actions={
          <>
            <CountPill unit="brands" />
            <ButtonSkeleton className="w-24" />
          </>
        }
      />

      {/* "Add brand": the link field and its button, then the line where the preview appears. */}
      <div className="mt-5 rounded-2xl border bg-card p-3 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Link2 className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <div className="flex h-8 items-center rounded-lg border border-foreground/15 bg-background pl-8 text-xs text-muted-foreground">
              Paste a brand link, e.g. https://www.reebok.com
            </div>
          </div>
          <ButtonSkeleton className="w-24" />
        </div>
        <div className="mt-2 min-h-11">
          <p className="px-1 py-3 text-xs text-muted-foreground">The brand&apos;s name, logo and social links will appear here.</p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto [&>[data-slot=table-container]]:overflow-visible">
        <TableRowsSkeleton
          dense={false}
          minWidth={940}
          rows={6}
          columns={[
            { label: "", className: "w-10", cell: "checkbox" },
            { label: "Brand", className: "w-48", cell: "person" },
            { label: "Website", className: "w-52" },
            { label: "Social", className: "w-36" },
            { label: "Clients", className: "w-32" },
            { label: "Status", className: "w-28", cell: "pill" },
            { label: "Added", className: "w-28" },
            { label: "Actions", className: "w-20 pr-4 text-right", cell: "action" },
          ]}
        />
      </div>
    </>
  );
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

/** The price grid's first column: the device count, with its icon — real words. */
const deviceCells = DEVICES.map((devices) => (
  <span key={devices} className="inline-flex items-center gap-2 font-medium text-foreground">
    <MonitorSmartphone className="size-3.5 text-muted-foreground" aria-hidden />
    {deviceLabel(devices)}
  </span>
));

function SubscriptionsSkeleton() {
  const columns: ColumnSkeleton[] = [
    { label: "", className: "w-10", cell: "checkbox" },
    { label: "Devices", className: "w-40", rowLabels: deviceCells },
    ...MONTHS.map((months) => ({ label: monthLabel(months), className: "text-right last:pr-4" })),
  ];

  return (
    <div className="flex min-h-full flex-col">
      <TabHeader
        title="Subscriptions"
        description="Prices in US dollars, by number of devices and duration. Double-click a price to change it, then Save. A new price applies to new payments only."
        actions={
          <>
            <CountPill unit="plans" />
            <ButtonSkeleton className="w-24" />
            <ButtonSkeleton className="w-16" />
          </>
        }
      />

      <div className="mt-5 flex-1 overflow-x-auto [&>[data-slot=table-container]]:overflow-visible">
        <TableRowsSkeleton dense={false} minWidth={600} rows={DEVICES.length} columns={columns} />
      </div>

      <footer className="-mx-4 -mb-4 mt-4 flex min-h-12 shrink-0 flex-col gap-2 border-t px-4 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <PagerSkeleton />
      </footer>
    </div>
  );
}

// ── Expenses ──────────────────────────────────────────────────────────────────

function ExpensesSkeleton() {
  return (
    <div className="grid min-h-full gap-4 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col lg:order-2 lg:col-span-2">
        <TabHeader
          title="Expenses"
          description="What each plan costs you, in US dollars and panel credit, and the cost of the perks. Double-click a figure to change it, then Save."
          actions={
            <>
              <span className="rounded-full border bg-muted/40 px-2.5 py-1 text-[0.65rem] text-muted-foreground">
                <span className="inline-block h-[0.75em] w-16 animate-pulse rounded-[0.2em] bg-muted align-middle" /> perks offered
              </span>
              <ButtonSkeleton className="w-24" />
              <ButtonSkeleton className="w-16" />
            </>
          }
        />

        <section className="mt-5">
          <h3 className="text-xs font-semibold">Cost per plan</h3>
          <p className="mt-0.5 text-[0.7rem] leading-relaxed text-muted-foreground">
            Two costs for every plan: the money it takes out of the account, and the panel credit it spends. Same grid as the Subscriptions prices.
          </p>
          <div className="mt-3 overflow-x-auto">
            <TableRowsSkeleton
              plain
              minWidth={576}
              rows={DEVICES.length}
              className="[&_td:last-child]:pr-4 [&_th:last-child]:pr-4"
              columns={[
                {
                  label: "Devices",
                  className: "w-28",
                  rowLabels: DEVICES.map((devices) => <span key={devices} className="font-medium">{deviceLabel(devices)}</span>),
                },
                ...MONTHS.map((months) => ({ label: monthLabel(months), className: "text-right" })),
              ]}
            />
          </div>
        </section>

        <section className="mt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold">Perks</h3>
              <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
                Extras that cost you money. Switch one off to stop offering it — nothing is deleted.
              </p>
            </div>
            <ButtonSkeleton className="w-24" />
          </div>
          <div className="mt-3 overflow-x-auto">
            <TableRowsSkeleton
              plain
              minWidth={576}
              rows={2}
              columns={[
                { label: "Perk" },
                { label: "Cost", className: "w-28 text-right" },
                { label: "Offered", className: "w-32 text-right" },
                { label: "", className: "w-14 text-right", cell: "action" },
              ]}
            />
          </div>
        </section>
      </div>

      {/* Panel credit (panelCredit.tsx): the coin, what is left, the bar, the last top-up. */}
      <div className="h-full lg:order-1 lg:col-span-1">
        <div className="flex h-full min-w-0 flex-col rounded-lg border p-4">
          <div className="flex shrink-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xs font-semibold">Panel credit</h3>
              <p className="mt-0.5 text-[0.7rem] leading-relaxed text-muted-foreground">The credit your panel spends to create lines.</p>
            </div>
            <Skeleton className="size-7 shrink-0" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-center py-5">
            <div className="mx-auto flex h-[9rem] w-full max-w-[11rem] items-center justify-center">
              <Skeleton className="size-32 rounded-full" />
            </div>
            <div className="mt-5 text-center">
              <Line className="text-3xl" width="w-24" />
              <p className="mt-0.5 text-[0.7rem] text-muted-foreground">credits remaining</p>
            </div>
            <Line className="mt-3 text-center text-[0.7rem]" width="w-48" />
          </div>
          <div className="mt-4 shrink-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[0.65rem] text-muted-foreground">Remaining</span>
              <Line className="text-[0.65rem]" width="w-16" />
            </div>
            <Skeleton className="mt-1.5 h-7 w-full rounded-[6px]" />
            <Line className="mt-2 text-[0.65rem]" width="w-56" />
          </div>
          <p className="mt-3 text-[0.65rem] leading-relaxed text-muted-foreground">
            Top-ups are recorded here with what they cost. Credits used by payments will be taken off once Payments is connected.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Payment methods ───────────────────────────────────────────────────────────

function PaymentMethodsSkeleton({ view }: { view: PaymentMethodsView }) {
  return (
    <>
      <TabHeader
        title="Payment methods"
        description="The accounts you receive money on. Amounts are in US dollars."
        actions={
          <>
            <CountPill unit="methods" />
            {/* Cards or Table — lit as this browser last left it (the same cookie as the page). */}
            <div className="inline-flex rounded-lg border border-border/60 bg-muted p-0.5">
              {[
                { value: "cards", Icon: LayoutGrid },
                { value: "table", Icon: Rows3 },
              ].map(({ value, Icon }) => (
                <span
                  key={value}
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-md border border-transparent",
                    view === value ? "border-border bg-background text-foreground shadow-sm" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                </span>
              ))}
            </div>
          </>
        }
      />

      {view === "table" ? (
        <div className="mt-5">
          <div className="overflow-x-auto [&>[data-slot=table-container]]:overflow-visible">
            <TableRowsSkeleton
              dense={false}
              minWidth={860}
              rows={4}
              columns={[
                { label: "Method", className: "w-48", cell: "person" },
                { label: "Status", className: "w-28", cell: "pill" },
                { label: "Balance", className: "w-36" },
                { label: "Holder", className: "w-36" },
                { label: "Networks", className: "w-36" },
                { label: "Region", className: "w-28" },
                { label: "Actions", className: "w-20 pr-4 text-right", cell: "action" },
              ]}
            />
          </div>
          <span className="mt-3 inline-flex items-center gap-1.5 px-2 text-xs font-medium text-teal-600">
            <CirclePlus className="size-4" aria-hidden />
            Add new method
          </span>
        </div>
      ) : (
        <div className="@container mt-5">
          <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @3xl:grid-cols-3 @6xl:grid-cols-4">
            {/* The cards (paymentMethodCard.tsx: full width, at least min-h-48). */}
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="min-h-48 rounded-2xl" />
            ))}
            {/* "New payment method" never changes: drawn as it is. */}
            <div className="flex min-h-48 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-muted-foreground/40 bg-card p-6 text-center shadow-sm">
              <span className={cn(whiteStyle.button, "mb-3 flex size-12 items-center justify-center p-0! text-foreground")}>
                <WalletCards className="size-5" strokeWidth={1.75} />
              </span>
              <span className="text-sm font-semibold">New payment method</span>
              <span className="max-w-56 text-xs leading-relaxed text-muted-foreground">
                Add another way for your clients to pay you, like a card or a bank transfer
              </span>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-teal-600">
                <CirclePlus className="size-4" aria-hidden />
                Add new method
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
