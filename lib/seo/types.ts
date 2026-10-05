import { ATLAS_ID_BY_COUNTRY } from "@/lib/seo/countryCodes"

/**
 * The SEO Overview's data: what `GET /api/seo/*` returns (live GA4, kept ten
 * minutes by the backend), and the shapes the page draws from it.
 *
 * <p>Client-safe: the page fetches on the server and hands this to the client
 * component as props.
 */

/** The period the page looks at (decided 2026-10-05). "custom" carries its own dates. */
export type SeoRangeId = "today" | "yesterday" | "7d" | "month" | "year" | "custom"

export const seoRanges = [
  { id: "today", label: "Today", note: "today" },
  { id: "yesterday", label: "Yesterday", note: "yesterday" },
  { id: "7d", label: "7 days", note: "last 7 days" },
  { id: "month", label: "This month", note: "this month" },
  { id: "year", label: "This year", note: "this year" },
] as const satisfies readonly { id: Exclude<SeoRangeId, "custom">; label: string; note: string }[]

export function isSeoRange(value: string | undefined): value is SeoRangeId {
  return value === "custom" || seoRanges.some((range) => range.id === value)
}

/** The chart's step, chosen by the backend from the length of the period. */
export type SeoStep = "HOUR" | "DAY" | "WEEK" | "MONTH"

/** A brand with a GA4 property (Configuration → Brands). */
export type SeoBrand = {
  id: number
  name: string
  logoUrl: string | null
  propertyId: string
}

/** Exactly what the backend sends. */
export type SeoOverview = {
  brand: SeoBrand
  range: SeoRangeId
  /** The dates the period covers, ISO. */
  start: string
  end: string
  step: SeoStep
  fetchedAt: string
  /** One point per step; `start` is when it begins (ISO date, or date and hour). Every visitor, plus organic and direct. */
  traffic: {
    start: string
    sessions: number
    users: number
    organicSessions: number
    organicUsers: number
    directSessions: number
    directUsers: number
  }[]
  totals: {
    sessions: number
    previousSessions: number
    users: number
    previousUsers: number
    engagementRate: number
    previousEngagementRate: number
    keyEvents: number
    previousKeyEvents: number
    averageEngagementSeconds: number
    previousAverageEngagementSeconds: number
    organic: ChannelTotals
    direct: ChannelTotals
  }
  channels: { channel: string; sessions: number }[]
  landingPages: { path: string; sessions: number; engagementRate: number; keyEvents: number }[]
  landingTailSessions: number
  engines: { source: string; sessions: number }[]
  /** sessions = every visitor; organicSessions = the ones from search. */
  countries: { country: string; countryId: string; sessions: number; organicSessions: number }[]
  devices: { device: string; sessions: number }[]
}

export type ChannelTotals = { sessions: number; previousSessions: number; users: number; previousUsers: number }

/** The chart's tabs. */
export type TrafficSeries = "all" | "organic" | "direct"

/** One column of the traffic chart, for one tab. */
export type TrafficPoint = {
  /** On the axis: "Mon", or "11 Aug" for a week. */
  label: string
  /** In the tooltip: "Monday 1 Sep", or "Week of 11 August". */
  fullLabel: string
  sessions: number
  users: number
}

/** Percentage change, or undefined when there is no previous figure to divide by. */
function changeFrom(current: number, previous: number): number | undefined {
  if (!previous) return undefined
  return ((current - previous) / previous) * 100
}

const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" })
const DAY_FULL = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" })
const SHORT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
const LONG = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" })
const MONTH_FULL = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })
const RANGE_DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })

/** "1 Jun – 31 Aug 2026": what a custom period says about itself. */
export function rangeNote(data: Pick<SeoOverview, "range" | "start" | "end">): string {
  const preset = seoRanges.find((range) => range.id === data.range)
  if (preset) return preset.note
  const start = new Date(`${data.start}T00:00:00Z`)
  const end = new Date(`${data.end}T00:00:00Z`)
  return data.start === data.end ? RANGE_DAY.format(start) : `${SHORT.format(start)} – ${RANGE_DAY.format(end)}`
}

/** The order the device bar keeps, so each device keeps its colour. */
const DEVICE_ORDER = ["desktop", "mobile", "tablet"]

/** Everything the page draws, worked out once from the backend's answer. */
export function seoView(data: SeoOverview) {
  const fewDays = data.traffic.length <= 7
  const series = data.traffic.map((point) => {
    const date = new Date(point.start.includes("T") ? `${point.start}:00Z` : `${point.start}T00:00:00Z`)
    let label: string
    let fullLabel: string
    switch (data.step) {
      case "HOUR":
        label = point.start.slice(11, 16)
        fullLabel = `${DAY_FULL.format(date)}, ${label}`
        break
      case "WEEK":
        label = SHORT.format(date)
        fullLabel = `Week of ${LONG.format(date)}`
        break
      case "MONTH":
        label = MONTH.format(date)
        fullLabel = MONTH_FULL.format(date)
        break
      default:
        label = fewDays ? WEEKDAY.format(date) : SHORT.format(date)
        fullLabel = DAY_FULL.format(date)
    }
    return {
      label,
      fullLabel,
      all: { label, fullLabel, sessions: point.sessions, users: point.users },
      organic: { label, fullLabel, sessions: point.organicSessions, users: point.organicUsers },
      direct: { label, fullLabel, sessions: point.directSessions, users: point.directUsers },
    }
  })

  const t = data.totals
  const totals = {
    sessions: t.sessions,
    sessionsChange: changeFrom(t.sessions, t.previousSessions),
    users: t.users,
    usersChange: changeFrom(t.users, t.previousUsers),
    engagementRate: t.engagementRate,
    engagementRateChange: changeFrom(t.engagementRate, t.previousEngagementRate),
    keyEvents: t.keyEvents,
    keyEventsChange: changeFrom(t.keyEvents, t.previousKeyEvents),
    averageEngagementSeconds: t.averageEngagementSeconds,
    averageEngagementSecondsChange: changeFrom(t.averageEngagementSeconds, t.previousAverageEngagementSeconds),
  }

  const devices = [...data.devices].sort((a, b) => {
    const ai = DEVICE_ORDER.indexOf(a.device)
    const bi = DEVICE_ORDER.indexOf(b.device)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  const ofTab = (tab: TrafficSeries): TrafficPoint[] => series.map((point) => point[tab])
  const channel = (c: ChannelTotals) => ({
    sessions: c.sessions,
    sessionsChange: changeFrom(c.sessions, c.previousSessions),
    users: c.users,
  })

  return {
    points: { all: ofTab("all"), organic: ofTab("organic"), direct: ofTab("direct") } as Record<TrafficSeries, TrafficPoint[]>,
    tabTotals: {
      all: { sessions: totals.sessions, sessionsChange: totals.sessionsChange, users: totals.users },
      organic: channel(t.organic),
      direct: channel(t.direct),
    } as Record<TrafficSeries, { sessions: number; sessionsChange?: number; users: number }>,
    totals,
    channels: data.channels,
    engines: data.engines,
    countries: data.countries.map((row) => ({ ...row, atlasId: ATLAS_ID_BY_COUNTRY[row.countryId] ?? "" })),
    devices,
    landingPages: data.landingPages,
    tailSessions: data.landingTailSessions,
  }
}
