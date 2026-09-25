/**
 * The clients the interface phase runs on.
 *
 * <p>⚠️ A plain module because two screens need them: the Clients table, and
 * the detail page a row links to. It used to live inside `clientsTable` as a
 * private array, which meant the page behind every row could not read the
 * record it was about.
 *
 * <p>Delete this file when the API is real. Nothing in `components/clients`
 * knows where these come from.
 */

import { paymentExpense } from "@/lib/settings/expenses"

/**
 * Where a client is, in the order they usually get there.
 *
 * <p>The order is the funnel, and it is the order the filter draws them in —
 * a list sorted by what happens next reads faster than an alphabetical one.
 * "Inactive" and "Drop" are both endings and are deliberately separate: one
 * was a client and lapsed, the other never became one.
 *
 * <p>Drop sits last because it is the worst outcome on the list, and the only
 * one marked destructive.
 */
export type ClientStatus =
  | "New"
  | "Callback"
  | "Trial"
  | "Pending"
  | "Active"
  | "Inactive"
  | "Drop"

/**
 * The states that come before there is a subscription to end.
 *
 * <p>Their end date shows "—" rather than a date: a client who has not paid
 * yet has no renewal date, and printing one would invent a commitment nobody
 * made. Drop and Inactive are not in the set — both may have had a
 * subscription that ran out, and that date is worth seeing.
 *
 * <p>⚠️ Here, not in the Clients table, so the table and the detail page apply
 * one rule. They used to keep a copy each and disagreed: Imane Berrada (New)
 * showed "—" in the table and "Dec 10, 2025" on her own page.
 */
export const preSubscriptionStatuses: ReadonlySet<ClientStatus> = new Set<ClientStatus>([
  "New",
  "Callback",
  "Trial",
  "Pending",
])

export type PaymentMethod = "Card" | "Bank transfer" | "PayPal" | "Not set"

export type Client = {
  id: number
  name: string
  initials: string
  email?: string
  phone: string
  brand: string
  brandLogo: string
  subscriptionEnd: string
  subscriptionEndAt: string
  devices: number
  duration: string
  orders: number
  orderTrend: number[]
  paymentMethod: PaymentMethod
  revenue: number
  status: ClientStatus
  color: string
  /** What the team should know before the next call. Free text, optional. */
  note?: string
}

export const clients: Client[] = [
  { id: 1, name: "Amine El Idrissi", initials: "AE", email: "amine@example.com", phone: "+212 6 12 34 56 78", brand: "Nike", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/nike.svg", subscriptionEnd: "Sep 29, 2026", subscriptionEndAt: "2026-09-29", devices: 3, duration: "12 months", orders: 8, orderTrend: [1, 2, 2, 3], paymentMethod: "Card", revenue: 12400, status: "Active", color: "bg-emerald-100 text-emerald-800", note: "Prefers WhatsApp over calls. Renews on time — send the reminder a week before the end date, not earlier." },
  { id: 2, name: "Sarah Benali", initials: "SB", email: "sarah@example.com", phone: "+212 6 23 45 67 89", brand: "Adidas", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/adidas.svg", subscriptionEnd: "Sep 28, 2026", subscriptionEndAt: "2026-09-28", devices: 4, duration: "24 months", orders: 10, orderTrend: [2, 2, 3, 3], paymentMethod: "Bank transfer", revenue: 18950, status: "Active", color: "bg-violet-100 text-violet-800", note: "Runs two households on one account. Asked about a fifth device; waiting on pricing for that." },
  { id: 3, name: "Youssef Alaoui", initials: "YA", phone: "+212 6 34 56 78 90", brand: "Nike", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/nike.svg", subscriptionEnd: "Sep 24, 2026", subscriptionEndAt: "2026-09-24", devices: 1, duration: "3 months", orders: 6, orderTrend: [1, 1, 2, 2], paymentMethod: "PayPal", revenue: 4200, status: "Callback", color: "bg-amber-100 text-amber-800", note: "Asked to be called back after 6 pm. Unsure between Nike and Adidas — follow up on the trial they mentioned." },
  { id: 4, name: "Lina Zahra", initials: "LZ", email: "lina@example.com", phone: "+212 6 45 67 89 01", brand: "Adidas", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/adidas.svg", subscriptionEnd: "Sep 22, 2026", subscriptionEndAt: "2026-09-22", devices: 2, duration: "12 months", orders: 7, orderTrend: [1, 2, 2, 2], paymentMethod: "Card", revenue: 9600, status: "Active", color: "bg-sky-100 text-sky-800" },
  { id: 5, name: "Omar Naciri", initials: "ON", phone: "+212 6 56 78 90 12", brand: "Nike", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/nike.svg", subscriptionEnd: "Sep 18, 2026", subscriptionEndAt: "2026-09-18", devices: 0, duration: "Expired", orders: 6, orderTrend: [3, 2, 1, 0], paymentMethod: "Not set", revenue: 1350, status: "Inactive", color: "bg-rose-100 text-rose-800", note: "Plan lapsed after the move abroad. Said they would come back in the new year." },
  { id: 6, name: "Meryem Idrissi", initials: "MI", email: "meryem@example.com", phone: "+212 6 67 89 01 23", brand: "Adidas", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/adidas.svg", subscriptionEnd: "Sep 15, 2026", subscriptionEndAt: "2026-09-15", devices: 4, duration: "6 months", orders: 7, orderTrend: [1, 2, 2, 2], paymentMethod: "PayPal", revenue: 7850, status: "Pending", color: "bg-fuchsia-100 text-fuchsia-800" },
  { id: 7, name: "Adam Mansouri", initials: "AM", email: "adam@example.com", phone: "+212 6 78 90 12 34", brand: "Nike", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/nike.svg", subscriptionEnd: "Aug 30, 2026", subscriptionEndAt: "2026-08-30", devices: 3, duration: "18 months", orders: 9, orderTrend: [2, 2, 2, 3], paymentMethod: "Bank transfer", revenue: 14200, status: "Active", color: "bg-cyan-100 text-cyan-800" },
  { id: 8, name: "Salma Chraibi", initials: "SC", phone: "+212 6 89 01 23 45", brand: "Adidas", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/adidas.svg", subscriptionEnd: "Aug 12, 2026", subscriptionEndAt: "2026-08-12", devices: 1, duration: "14 days", orders: 0, orderTrend: [0, 0, 0, 0], paymentMethod: "Not set", revenue: 0, status: "Trial", color: "bg-orange-100 text-orange-800" },
  { id: 9, name: "Mehdi Tazi", initials: "MT", email: "mehdi@example.com", phone: "+212 6 90 12 34 56", brand: "Nike", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/nike.svg", subscriptionEnd: "Jul 08, 2026", subscriptionEndAt: "2026-07-08", devices: 4, duration: "24 months", orders: 12, orderTrend: [2, 3, 3, 4], paymentMethod: "Card", revenue: 22100, status: "Active", color: "bg-indigo-100 text-indigo-800", note: "Longest-standing client. Pays yearly by card; do not offer the monthly plan." },
  { id: 10, name: "Nadia Bennani", initials: "NB", phone: "+212 6 01 23 45 67", brand: "Adidas", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/adidas.svg", subscriptionEnd: "Jun 21, 2026", subscriptionEndAt: "2026-06-21", devices: 0, duration: "Expired", orders: 6, orderTrend: [3, 2, 1, 0], paymentMethod: "Not set", revenue: 980, status: "Drop", color: "bg-pink-100 text-pink-800", note: "Dropped over a streaming issue in June. Fixed since — worth one courtesy message, no more." },
  { id: 11, name: "Ayoub Filali", initials: "AF", email: "ayoub@example.com", phone: "+212 6 11 22 33 44", brand: "Nike", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/nike.svg", subscriptionEnd: "May 17, 2026", subscriptionEndAt: "2026-05-17", devices: 2, duration: "12 months", orders: 8, orderTrend: [2, 2, 2, 2], paymentMethod: "Bank transfer", revenue: 11300, status: "Active", color: "bg-lime-100 text-lime-800" },
  { id: 12, name: "Imane Berrada", initials: "IB", phone: "+212 6 22 33 44 55", brand: "Adidas", brandLogo: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/adidas.svg", subscriptionEnd: "Dec 10, 2025", subscriptionEndAt: "2025-12-10", devices: 1, duration: "6 months", orders: 6, orderTrend: [0, 1, 2, 3], paymentMethod: "PayPal", revenue: 3200, status: "New", color: "bg-teal-100 text-teal-800" },
];

/** One client by id, or `undefined` when the URL names one that is not here. */
export function findClient(id: string): Client | undefined {
  const numeric = Number(id)
  return Number.isFinite(numeric) ? clients.find((client) => client.id === numeric) : undefined
}

/** One payment a client has made. */
/**
 * Whether a payment started a plan or extended one.
 *
 * <p>Its own field rather than a word inside the description, because it is a
 * column people sort and filter by — and because it decides a cost: one-off
 * perks are bought when a plan opens and not again at renewal.
 */
export type PaymentKind = "New plan" | "Renewal"

export type ClientTransaction = {
  id: string
  /** UTC ISO date, oldest last — the list is rendered newest first. */
  at: string
  kind: PaymentKind
  /** What was bought — "12 months · 3 devices". The kind is its own column. */
  description: string
  /**
   * The term this payment bought, in months — `null` when it is not on file.
   * Stored as a number beside the description rather than parsed back out of
   * it, because the current plan is read from the latest payment and a sum
   * should not depend on the wording of a label.
   */
  months: number | null
  /** How many devices the plan covers. */
  devices: number
  method: PaymentMethod
  /** The brand the plan was sold under. Per payment, not per client — a client can move brands. */
  brand: string
  brandLogo: string
  amount: number
  /**
   * What delivering this payment's plan cost — the plan's line on the
   * Expenses sheet plus any active perks. `null` when the sheet cannot say:
   * a term that is not whole months, or a device count off the grid.
   */
  expense: number | null
}

/**
 * A plan, in the words the ledger uses — "12 months · 3 devices".
 *
 * <p>One function for the sample rows and the "Add payment" form, so a payment
 * typed in today reads exactly like the ones already there. A term that is not
 * whole months has no plan to describe, and says so rather than guessing.
 */
export function planDescription(months: number | null, devices: number): string {
  if (!months) return "Plan not on file"
  const lines = Math.max(devices, 1)
  return `${months} ${months === 1 ? "month" : "months"} · ${lines} ${lines === 1 ? "device" : "devices"}`
}

/** "12 months" → 12. "14 days" and "Expired" have no month count. */
function monthsIn(duration: string): number | null {
  const match = /^(\d+)\s+months?$/.exec(duration)
  return match ? Number(match[1]) : null
}

/**
 * The brands a payment can be sold under, with their logos.
 *
 * <p>Drawn from the clients rather than typed out, so the list offered when a
 * payment is added is exactly the brands this sample already uses. The
 * Configuration › Brands list is that tab’s own state; when both come from the
 * API this becomes a request for the active brands.
 */
export const clientBrands: readonly { name: string; logo: string }[] = [
  ...new Map(clients.map((client) => [client.brand, { name: client.brand, logo: client.brandLogo }])).values(),
]

/** The methods a real payment can arrive by — "Not set" is not one of them. */
const paidMethods: readonly Exclude<PaymentMethod, "Not set">[] = ["Card", "Bank transfer", "PayPal"]

/**
 * Renewal terms, in the order a history cycles through them.
 *
 * <p>Mostly short, with the odd longer one — how people actually renew when
 * they are paying as they go. Every term is a column on the Expenses sheet, so
 * every renewal can be costed.
 */
const renewalTerms = [1, 3, 1, 6, 1, 3, 12, 1, 3, 1, 6] as const

/**
 * A spread of 0.7–1.3 for payment `index` of client `id`, the same every time.
 *
 * <p>⚠️ Not `Math.random()`. This runs on the server and again in the browser,
 * and anything random would differ between the two — a hydration mismatch, and
 * a ledger that reshuffles on every reload.
 */
function spread(id: number, index: number): number {
  return 0.7 + (((id * 7 + index * 13) % 7) / 10)
}

/**
 * A client's payment history, newest first.
 *
 * <p>⚠️ <b>Derived, and it adds up.</b> There are exactly `orders` payments —
 * the count the Clients table prints — and their amounts are shares of the
 * client's `revenue`, the last taking the remainder, so the history always
 * totals exactly the figure the table shows. The receipt is built from these
 * rows without a second set of numbers to reconcile. Hand-written rows for
 * twelve clients would have drifted the first time any figure was edited.
 *
 * <p><b>Read oldest to newest</b>, which is the order it is built in:
 *
 * <ul>
 *   <li>The first payment opens the plan, on the client's own term, and
 *       carries the one-off perks.</li>
 *   <li>Each later one is a renewal on a term from {@link renewalTerms}, dated
 *       the day the term before it ran out — so the dates are what the terms
 *       say they should be, rather than an even two-month tick.</li>
 *   <li>The newest renewal lands on the subscription's end date.</li>
 *   <li>Mostly the client's own brand and method, with the odd payment on
 *       another — a client moves between brands and cards, and a ledger where
 *       every row is identical cannot show it.</li>
 * </ul>
 *
 * <p>Deterministic throughout, because this renders on the server as well as
 * the browser and anything clock- or random-derived would differ between them.
 */
export function transactionsFor(client: Client): ClientTransaction[] {
  if (client.orders === 0 || client.revenue === 0) return []

  const count = client.orders
  const planMonths = monthsIn(client.duration)

  // Oldest first: the opening term, then the renewals.
  const terms = Array.from({ length: count }, (_, step) =>
    step === 0 ? planMonths : renewalTerms[(client.id + step) % renewalTerms.length],
  )

  // Amounts: the opening payment weighs more — it is the full plan — and the
  // rest spread around the average. Whole dollars, last one takes the rest.
  const weights = terms.map((_, step) => spread(client.id, step) * (step === 0 ? 1.6 : 1))
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0)
  let assigned = 0
  const amounts = weights.map((weight, step) => {
    const amount = step === count - 1 ? client.revenue - assigned : Math.round((client.revenue * weight) / weightTotal)
    assigned += amount
    return amount
  })

  // Dates: walk back from the subscription end (or a fixed date, never
  // `new Date()`), stepping by the term of each earlier payment.
  //
  // ⚠️ The newest payment is dated one term BEFORE the end, not on it. The end
  // date is when the latest term runs out, so that is where the latest payment
  // plus its term has to land — which is exactly what the Plan card computes
  // as "Ends". Dated on the end itself, every current plan would claim to run
  // a full term past the date the Clients table shows.
  const dates: string[] = new Array(count)
  const cursor = new Date(`${client.subscriptionEndAt || "2026-09-01"}T00:00:00Z`)
  cursor.setUTCMonth(cursor.getUTCMonth() - (terms[count - 1] ?? 0))
  for (let step = count - 1; step >= 0; step -= 1) {
    dates[step] = cursor.toISOString().slice(0, 10)
    const before = terms[step - 1]
    cursor.setUTCMonth(cursor.getUTCMonth() - (before ?? 0))
  }

  const otherBrand = clientBrands.find((brand) => brand.name !== client.brand)

  const history = terms.map((months, step): ClientTransaction => {
    const opensPlan = step === 0
    const switchesBrand = otherBrand && !opensPlan && (client.id + step) % 5 === 3
    const primaryMethod = client.paymentMethod === "Not set" ? null : client.paymentMethod
    const method =
      primaryMethod && (client.id + step) % 4 !== 2
        ? primaryMethod
        : paidMethods[(client.id + step) % paidMethods.length]

    return {
      id: `${client.id}-${step + 1}`,
      at: dates[step],
      kind: opensPlan ? "New plan" : "Renewal",
      description: planDescription(months, client.devices),
      months,
      devices: Math.max(client.devices, 1),
      method,
      brand: switchesBrand ? otherBrand.name : client.brand,
      brandLogo: switchesBrand ? otherBrand.logo : client.brandLogo,
      amount: amounts[step],
      expense: paymentExpense(client.devices, months, opensPlan),
    }
  })

  return history.reverse()
}
