/**
 * What the Payment methods tab works with. A plain module, so the server
 * loader, the actions and the screens share it.
 */

import type { CardNetwork, ProviderId } from "@/components/settings/paymentMethodCard"

export type BackendProvider = "PAYPAL" | "BINANCE" | "INTERAC" | "DEBIT_CARD"
export type BackendCardNetwork = "VISA" | "MASTERCARD" | "BOTH"

export type PaymentMethodRow = {
  id: number
  provider: BackendProvider
  name: string
  holder: string
  cardNetwork: BackendCardNetwork
  instructions: string | null
  active: boolean
  /** Total received, in USD: 0 until Payments is built. */
  balance: number
  createdAt: string
}

/** The card's look for each provider (the card component calls Binance "crypto"). */
export const providerToCard: Record<BackendProvider, ProviderId> = {
  PAYPAL: "paypal",
  BINANCE: "crypto",
  INTERAC: "interac",
  DEBIT_CARD: "debit",
}

/** The small line under a method's name in the table. */
export const providerDetails: Record<BackendProvider, { type: string; region: string }> = {
  PAYPAL: { type: "Digital wallet", region: "ONLINE" },
  BINANCE: { type: "Cryptocurrency", region: "ON-CHAIN" },
  INTERAC: { type: "e-Transfer", region: "CANADA" },
  DEBIT_CARD: { type: "Debit card", region: "WORLDWIDE" },
}

/** The logos drawn on the card — decoration only. */
export const networkLogos: Record<BackendCardNetwork, readonly CardNetwork[]> = {
  BOTH: ["Visa", "Mastercard"],
  VISA: ["Visa"],
  MASTERCARD: ["Mastercard"],
}

/** 12480.5 → "12,480.50", the way amounts read on the cards. */
export const amountFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
