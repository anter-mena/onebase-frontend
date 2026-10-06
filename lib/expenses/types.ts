/** What the Expenses tab works with. A plain module shared by the loader, the actions and the screen. USD. */

/** An extra that costs you money, such as IBO Player. Only a cost: the plan price stays the same. */
export type PerkRow = {
  id: number
  name: string
  description: string | null
  cost: number
  active: boolean
  createdAt: string
}

/** The Panel credit card. */
export type CreditSummary = {
  totalCredits: number
  /** Credits spent by payments (deleted payments give theirs back). */
  usedCredits: number
  remainingCredits: number
  totalPaid: number
  /** Null before the first top-up. */
  averageCostPerCredit: number | null
  lastTopup: { credits: number; amount: number; note: string | null; at: string } | null
}
