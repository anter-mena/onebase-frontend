/**
 * What the Clients API sends, and how it becomes the `Client` the screens draw.
 *
 * <p>A plain module (no "use client" or "server-only"), so the loaders, the
 * actions and the components share it.
 *
 * <p>⚠️ The plan, devices, end date, orders, payment method and revenue are not in
 * the API's client: they will be worked out from the payments (next module). Until
 * then they are empty here — $0, no orders, "Not set" — and the screens show "—".
 */

import type { ClientStatus } from "@/lib/clients/sample"

export type BackendClientStatus = "NEW" | "CALLBACK" | "TRIAL" | "PENDING" | "ACTIVE" | "INACTIVE" | "DROP"

export type ApiClient = {
  id: number
  /** The full name, else the WhatsApp name, else the phone. */
  name: string
  fullName: string | null
  /** The WhatsApp profile name; follows the profile by itself. */
  username: string | null
  email: string | null
  /** E.164: "+212612345678". */
  phone: string | null
  /** ISO code read from the phone ("MA"), or null when the number doesn't say. */
  country: string | null
  brandId: number | null
  brandName: string | null
  brandLogoUrl: string | null
  status: BackendClientStatus
  source: "MANUAL" | "WHATSAPP"
  note: string | null
  /** Their WhatsApp conversation, or null when they never wrote. */
  conversationId: number | null
  createdAt: string
  updatedAt: string
  // ── From their payments (deleted ones left out) ──
  orders: number
  /** USD. */
  revenue: number
  /** The latest payment's plan; null before the first payment. */
  devices: number | null
  months: number | null
  /** ISO dates: the latest payment's start, and when their paid time runs out. */
  subscriptionStart: string | null
  subscriptionEnd: string | null
  paymentProvider: BackendProvider | null
  paymentMethodName: string | null
  /** Payments in each of the last four quarters, oldest first. */
  orderTrend: number[]
}

export type BackendProvider = "PAYPAL" | "BINANCE" | "INTERAC" | "DEBIT_CARD"

/** The method types as the ledger names them. */
export const providerLabels: Record<BackendProvider, "PayPal" | "Binance" | "Interac" | "Debit card"> = {
  PAYPAL: "PayPal",
  BINANCE: "Binance",
  INTERAC: "Interac",
  DEBIT_CARD: "Debit card",
}

/** One payment, as `GET /api/clients/{id}/payments` sends it. USD. */
export type ApiPayment = {
  id: number
  kind: "NEW_PLAN" | "RENEWAL"
  devices: number
  months: number
  planPrice: number
  amount: number
  planCost: number | null
  perksCost: number
  /** Plan cost + perks; null when the plan had no cost on file. */
  expense: number | null
  creditsUsed: number
  /** ISO dates. */
  paidOn: string
  startsOn: string
  endsOn: string
  brandId: number
  brandName: string | null
  brandLogoUrl: string | null
  paymentMethodId: number
  paymentProvider: BackendProvider | null
  paymentMethodName: string | null
  perks: { perkId: number; name: string; quantity: number; unitCost: number }[]
  createdAt: string
}

/** What the Add payment window sends. Prices and costs are read from Configuration by the backend. */
export type NewPayment = {
  kind: "NEW_PLAN" | "RENEWAL"
  devices: number
  months: number
  amount: number
  brandId: number
  paymentMethodId: number
  perks: { perkId: number; quantity: number }[]
}

/** What Edit sends: the left card of the client page. */
export type ClientDraft = {
  fullName: string
  phone: string
  email: string
  brandId: number | null
  status: BackendClientStatus
}

export const statusFromBackend: Record<BackendClientStatus, ClientStatus> = {
  NEW: "New",
  CALLBACK: "Callback",
  TRIAL: "Trial",
  PENDING: "Pending",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  DROP: "Drop",
}

export const statusToBackend = Object.fromEntries(
  Object.entries(statusFromBackend).map(([backend, label]) => [label, backend]),
) as Record<ClientStatus, BackendClientStatus>

/**
 * What the Add payment window prices a payment from: Configuration's plan grid
 * (price, cost, panel credits), the perks switched on, and the active brands. USD.
 */
export type PaymentOptions = {
  plans: { devices: number; months: number; price: number; cost: number | null; credits: number | null }[]
  perks: { id: number; name: string; cost: number }[]
  brands: { id: number; name: string; logoUrl: string | null }[]
  /** The accounts money is received on (switched-on ones), e.g. two PayPals. */
  methods: { id: number; provider: BackendProvider; name: string }[]
}
