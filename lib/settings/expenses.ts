/**
 * What a plan costs to deliver, and what the perks on top of it cost.
 *
 * <p>⚠️ A plain module for the reason `credit.ts` gives: two screens need the
 * same numbers. The Expenses tab edits them, and the client receipt subtracts
 * them from what each payment brought in. Held privately in the tab, the
 * receipt would need a second copy — and a receipt netting against figures
 * nobody can see or edit is a receipt that is quietly wrong.
 *
 * <p>The tab still keeps its own editable copy in state, seeded from here.
 * Until the API exists an edit there lasts as long as the page, and does not
 * reach the receipt; that is the interface phase, not a design.
 */

import { deviceCounts, durations } from "@/lib/settings/credit"

export const currencies = [
  { value: "USD", label: "USD", name: "US dollar", flag: "US" },
  { value: "CAD", label: "CAD", name: "Canadian dollar", flag: "CA" },
  { value: "EUR", label: "EUR", name: "Euro", flag: "EU" },
] as const

export type Currency = (typeof currencies)[number]["value"]

/** costs[currency][device row][duration column], in the order of `credit.ts`. */
export type Costs = Record<Currency, readonly (readonly number[])[]>

/**
 * What each plan costs to deliver — servers, licences and payment fees.
 *
 * <p>⚠️ Invented, but not independently: every figure sits below the price the
 * Subscriptions tab charges for the same plan, and the longer durations cost
 * proportionally more to carry because they are more months of hosting. A cost
 * sheet that quietly exceeds the price sheet is worse than no cost sheet.
 */
export const initialCosts: Costs = {
  USD: [
    [4.2, 9.6, 17.4, 30.0],
    [7.8, 18.0, 33.6, 57.6],
    [11.4, 26.4, 49.8, 85.2],
    [15.0, 34.8, 66.0, 112.8],
  ],
  CAD: [
    [5.7, 13.0, 23.5, 40.5],
    [10.5, 24.3, 45.4, 77.8],
    [15.4, 35.6, 67.2, 115.0],
    [20.3, 47.0, 89.1, 152.3],
  ],
  EUR: [
    [3.9, 8.8, 16.0, 27.6],
    [7.2, 16.6, 30.9, 53.0],
    [10.5, 24.3, 45.8, 78.4],
    [13.8, 32.0, 60.7, 103.8],
  ],
}

export type Perk = {
  id: string
  name: string
  description: string
  /** Cost per currency, in the same order as `currencies`. */
  cost: Record<Currency, number>
  cadence: "Monthly" | "One-off"
  active: boolean
}

export const initialPerks: Perk[] = [
  {
    id: "ibo-player",
    name: "IBO Player",
    description: "Player licence, activated once per device.",
    cost: { USD: 5.99, CAD: 8.1, EUR: 5.5 },
    cadence: "One-off",
    active: true,
  },
]

/**
 * What one term of a plan costs, or `null` when the sheet cannot say.
 *
 * <p>⚠️ <b>A term the grid has no column for is costed as the columns that add
 * up to it</b>, longest first: 24 months is two 12s, 18 is a 12 and a 6. The
 * grid stops at a year but clients buy longer, and the alternatives are both
 * worse — stretching the 12-month figure pro rata invents a discount the
 * panel never gave, and leaving the cost out makes the longest, most valuable
 * plans look like pure profit.
 *
 * <p>`null`, not 0, for a device count outside the grid or a term that is not
 * whole months ("14 days", "Expired"). Zero would read as "this cost nothing",
 * which is a claim; `null` is the honest "not on file", and the receipt says so.
 */
export function planCost(devices: number, months: number, currency: Currency = "USD"): number | null {
  const row = deviceCounts.indexOf(devices as (typeof deviceCounts)[number])
  if (row === -1 || !Number.isInteger(months) || months <= 0) return null

  const longestFirst = [...durations].sort((a, b) => b - a)
  let left = months
  let total = 0

  for (const term of longestFirst) {
    while (left >= term) {
      total += initialCosts[currency][row][durations.indexOf(term)]
      left -= term
    }
  }

  return total
}

/**
 * The active perks' cost for one payment.
 *
 * <p>One-off perks are paid once per device, on the payment that opened the
 * plan — the IBO licence is activated once and not bought again at renewal.
 * Monthly perks run for every month the payment covers, on every payment.
 */
export function perksCost(
  devices: number,
  months: number,
  opensPlan: boolean,
  currency: Currency = "USD",
): number {
  return initialPerks
    .filter((perk) => perk.active)
    .reduce((total, perk) => {
      if (perk.cadence === "One-off") return opensPlan ? total + perk.cost[currency] * devices : total
      return total + perk.cost[currency] * months
    }, 0)
}

/**
 * Everything one payment cost to deliver: the plan's term plus its perks.
 *
 * <p>The one place a payment is costed, used by the sample history and by the
 * "Add payment" form alike — so a row typed in today is netted by exactly the
 * rule that netted the ones already there.
 *
 * <p>⚠️ At least one device. An expired client shows 0 today, but every payment
 * they made bought a plan for someone; costing it at zero devices would call it
 * free. `null` passes straight through from {@link planCost}.
 */
export function paymentExpense(devices: number, months: number | null, opensPlan: boolean): number | null {
  const lines = Math.max(devices, 1)
  const plan = months ? planCost(lines, months) : null
  return plan === null ? null : plan + perksCost(lines, months!, opensPlan)
}
