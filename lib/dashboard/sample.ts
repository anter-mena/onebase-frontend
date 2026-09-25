/**
 * The numbers the dashboard draws, invented for the interface phase.
 *
 * <p>⚠️ Every figure here is made up — but not independently. The revenue split
 * by brand and the client counts are the same twelve clients the Clients table
 * lists, added up. Nike's six come to $65,550 and Adidas' six to $40,580, which
 * is the $106,130 in the Clients table, and Puma has no clients so it has no
 * revenue. A dashboard that disagrees with the screen it summarises is worse
 * than one with no numbers at all, and the fastest way to get there is to write
 * two sets of samples that were never reconciled.
 *
 * <p>Fixed values rather than anything random or clock-derived, for the same
 * reason `mailSample` is: this renders on the server as well as in the browser,
 * and a figure that differs between the two is a hydration mismatch. It also
 * means two screenshots taken a week apart can be compared.
 *
 * <p>Delete this file when the API is real. Nothing in `components/dashboard`
 * knows where these come from.
 */

/** How far back the whole page is looking. One control, scoping everything. */
export type RangeId = "7d" | "4w"

export const ranges = [
  { id: "7d", label: "7 days", note: "last 7 days" },
  { id: "4w", label: "4 weeks", note: "last 4 weeks" },
] as const satisfies readonly { id: RangeId; label: string; note: string }[]

/**
 * One column of the revenue chart.
 *
 * <p>`newRevenue` and `renewals` are the two halves of what came in; `expenses`
 * is what went out. Three numbers per column rather than a single net, because
 * the whole point of the chart is that a flat week can hide a collapse in new
 * business propped up by renewals.
 */
export type RevenuePoint = {
  /** The x-axis tick. Short enough to sit under a column without turning. */
  label: string
  /** Spelled out for the tooltip and the table view. */
  fullLabel: string
  newRevenue: number
  renewals: number
  expenses: number
}

const SERIES_7D: RevenuePoint[] = [
  { label: "Mon", fullLabel: "Monday 1 Sep", newRevenue: 1200, renewals: 800, expenses: 420 },
  { label: "Tue", fullLabel: "Tuesday 2 Sep", newRevenue: 900, renewals: 1500, expenses: 380 },
  { label: "Wed", fullLabel: "Wednesday 3 Sep", newRevenue: 2100, renewals: 1100, expenses: 460 },
  { label: "Thu", fullLabel: "Thursday 4 Sep", newRevenue: 700, renewals: 1900, expenses: 510 },
  { label: "Fri", fullLabel: "Friday 5 Sep", newRevenue: 1600, renewals: 1300, expenses: 390 },
  { label: "Sat", fullLabel: "Saturday 6 Sep", newRevenue: 400, renewals: 600, expenses: 210 },
  { label: "Sun", fullLabel: "Sunday 7 Sep", newRevenue: 300, renewals: 450, expenses: 180 },
]

// Four weeks rather than thirty days. Thirty columns of three series is a
// picket fence nobody reads, and the honest fix for a longer range is a coarser
// bucket, not thinner bars.
const SERIES_4W: RevenuePoint[] = [
  { label: "W1", fullLabel: "Week of 11 Aug", newRevenue: 5200, renewals: 6100, expenses: 2300 },
  { label: "W2", fullLabel: "Week of 18 Aug", newRevenue: 6100, renewals: 5800, expenses: 2450 },
  { label: "W3", fullLabel: "Week of 25 Aug", newRevenue: 4800, renewals: 7200, expenses: 2100 },
  { label: "W4", fullLabel: "Week of 1 Sep", newRevenue: 7200, renewals: 7650, expenses: 2550 },
]

/** What the previous, equally long period came to — the deltas compare to this. */
const PREVIOUS_REVENUE: Record<RangeId, number> = { "7d": 13700, "4w": 42100 }
const PREVIOUS_EXPENSES: Record<RangeId, number> = { "7d": 2474, "4w": 9610 }

export function seriesFor(range: RangeId): RevenuePoint[] {
  return range === "4w" ? SERIES_4W : SERIES_7D
}

/**
 * The headline figures, added up from the columns rather than typed twice.
 *
 * <p>Which is the point: the hero figure and the chart under it cannot drift
 * apart, because one is the sum of the other.
 */
export function totalsFor(range: RangeId) {
  const series = seriesFor(range)
  const sum = (pick: (point: RevenuePoint) => number) =>
    series.reduce((total, point) => total + pick(point), 0)

  const revenue = sum((point) => point.newRevenue) + sum((point) => point.renewals)
  const expenses = sum((point) => point.expenses)

  return {
    newRevenue: sum((point) => point.newRevenue),
    renewals: sum((point) => point.renewals),
    revenue,
    expenses,
    net: revenue - expenses,
    /** Signed share, for the delta cue. */
    revenueChange: percentChange(revenue, PREVIOUS_REVENUE[range]),
    expensesChange: percentChange(expenses, PREVIOUS_EXPENSES[range]),
  }
}

function percentChange(now: number, before: number): number {
  if (before === 0) return 0
  return ((now - before) / before) * 100
}

/**
 * Revenue by brand — the same six-and-six split the Clients table holds.
 *
 * <p>Puma stays in the list at zero. A brand with no revenue is a fact worth
 * seeing, and dropping empty rows is how a breakdown quietly starts lying about
 * what it covers.
 */
/**
 * ⚠️ `logo` is a Simple Icons slug, the same convention the Brands tab and the
 * Clients table already use — not a URL. The component builds the URL, so the
 * CDN and its version live in one place.
 */
export const revenueByBrand = [
  { brand: "Nike", domain: "nike.com", logo: "nike", revenue: 65550, clients: 6 },
  { brand: "Adidas", domain: "adidas.com", logo: "adidas", revenue: 40580, clients: 6 },
  { brand: "Puma", domain: "puma.com", logo: "puma", revenue: 0, clients: 0 },
] as const

/** The all-time figure the Clients table adds up to. */
export const lifetimeRevenue = revenueByBrand.reduce((total, row) => total + row.revenue, 0)

/**
 * How many of the twelve are paying, as a share.
 *
 * <p>Six Active out of twelve. A single ratio against a limit, which is a meter
 * rather than a chart.
 *
 * <p>`lastMonthActive` is the same count a month ago, so the trend under the
 * gauge is worked out from two counts rather than stated as a percentage on its
 * own. A stored "+8.3%" is a figure nobody can check against anything, and it
 * goes stale silently the first time the counts move.
 */
export const retention = { active: 6, total: 12, lastMonthActive: 5 }

/** What this month is being measured against. */
export const monthlyTarget = { earned: 14850, target: 20000 }

/** The clients whose subscription ends inside the renewal window. */
export const renewalsDue = [
  { name: "Adam Mansouri", initials: "AM", color: "bg-cyan-100 text-cyan-800", endsIn: "ended 10 days ago", amount: 14200, overdue: true },
  { name: "Mehdi Tazi", initials: "MT", color: "bg-indigo-100 text-indigo-800", endsIn: "ended 63 days ago", amount: 22100, overdue: true },
  { name: "Ayoub Filali", initials: "AF", color: "bg-lime-100 text-lime-800", endsIn: "ended 115 days ago", amount: 11300, overdue: true },
  { name: "Salma Chraibi", initials: "SC", color: "bg-orange-100 text-orange-800", endsIn: "trial ended", amount: 0, overdue: false },
] as const

/** Who was in touch most recently — the row of faces. */
export const recentClients = [
  { name: "Imane Berrada", initials: "IB", color: "bg-teal-100 text-teal-800" },
  { name: "Youssef Alaoui", initials: "YA", color: "bg-amber-100 text-amber-800" },
  { name: "Meryem Idrissi", initials: "MI", color: "bg-fuchsia-100 text-fuchsia-800" },
  { name: "Lina Zahra", initials: "LZ", color: "bg-sky-100 text-sky-800" },
  { name: "Sarah Benali", initials: "SB", color: "bg-violet-100 text-violet-800" },
  { name: "Amine El Idrissi", initials: "AE", color: "bg-emerald-100 text-emerald-800" },
] as const

/** What happened lately, newest first. */
export type ActivityKind = "payment" | "renewal" | "signup" | "refund" | "failed"

export const recentActivity = [
  { id: "a1", kind: "payment", client: "Mehdi Tazi", detail: "24-month plan · Card", amount: 22100, at: "15 Feb 2026" },
  { id: "a2", kind: "renewal", client: "Sarah Benali", detail: "24-month plan · Bank transfer", amount: 18950, at: "15 Feb 2026" },
  { id: "a3", kind: "failed", client: "Meryem Idrissi", detail: "6-month plan · PayPal", amount: 7850, at: "14 Feb 2026" },
  { id: "a4", kind: "signup", client: "Imane Berrada", detail: "Started a 6-month plan", amount: 3200, at: "14 Feb 2026" },
  { id: "a5", kind: "refund", client: "Nadia Bennani", detail: "Subscription dropped", amount: -980, at: "13 Feb 2026" },
  { id: "a6", kind: "payment", client: "Adam Mansouri", detail: "18-month plan · Bank transfer", amount: 14200, at: "12 Feb 2026" },
] as const satisfies readonly {
  id: string
  kind: ActivityKind
  client: string
  detail: string
  amount: number
  at: string
}[]
