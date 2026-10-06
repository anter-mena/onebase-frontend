/**
 * What `GET /api/dashboard` and `GET /api/ledger` send (Admins only), and the
 * chart's point. A plain module: the server pages fetch, the client components
 * draw. USD; dates are the business's calendar.
 */

import type { SeoRangeId, SeoStep } from "@/lib/seo/types"
import type { ApiClient, ApiPayment, BackendProvider, RenewalGroup } from "@/lib/clients/types"

/** One column of the revenue chart. */
export type RevenuePoint = {
  /** The x-axis tick. */
  label: string
  /** Spelled out for the tooltip and the table view. */
  fullLabel: string
  newRevenue: number
  renewals: number
  expenses: number
}

export type DashboardOverview = {
  range: SeoRangeId
  start: string
  end: string
  step: SeoStep
  points: { start: string; newRevenue: number; renewals: number; expenses: number }[]
  totals: {
    revenue: number
    newRevenue: number
    renewals: number
    expenses: number
    net: number
    payments: number
    /** Payments whose plan had no cost on file (counted as $0 cost). */
    uncosted: number
    previousRevenue: number
    previousExpenses: number
  }
  /** All time. */
  lifetimeRevenue: number
  clientCount: number
  /** The period's revenue per brand; clients = on that brand now. */
  brands: { id: number; name: string; logoUrl: string | null; revenue: number; clients: number }[]
  active: { active: number; total: number; activeMonthAgo: number }
  /** This month's; `target` null until an Admin sets it. */
  target: { month: string; target: number | null; earned: number }
  credit: {
    totalCredits: number
    usedCredits: number
    remainingCredits: number
    totalPaid: number
    averageCostPerCredit: number | null
    lastTopup: { credits: number; amount: number; note: string | null; at: string } | null
  }
  /** Accounts switched on: all-time balance, and the period's figures. */
  methods: {
    id: number
    provider: BackendProvider
    name: string
    holder: string
    cardNetwork: "VISA" | "MASTERCARD" | "BOTH"
    balance: number
    received: number
    payments: number
    lastPaidOn: string | null
  }[]
  /** Renewals' most urgent. */
  chase: { client: ApiClient; group: RenewalGroup; daysLeft: number | null }[]
}

export type LedgerData = {
  range: SeoRangeId
  start: string
  end: string
  methodId: number | null
  rows: { payment: ApiPayment; clientId: number; clientName: string }[]
}

/** "+12.5": the change from the period before, or null when there was nothing before. */
export function changeFrom(now: number, before: number): number | null {
  if (before === 0) return now === 0 ? 0 : null
  return ((now - before) / before) * 100
}
