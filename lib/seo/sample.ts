/**
 * What the SEO Overview draws, invented for the interface phase.
 *
 * <p><b>Shaped like a GA4 Data API response, on purpose.</b> Every field here
 * is named after the GA4 dimension or metric it will come from —
 * `sessionDefaultChannelGroup`, `landingPage`, `engagementRate`, `keyEvents` —
 * so wiring the real property is a mapping rather than a rewrite. Where a name
 * had to be shortened for the screen, the GA4 name is in the comment beside it.
 *
 * <p>⚠️ <b>GA4 cannot answer every question an "SEO overview" usually asks.</b>
 * There are no queries, impressions, click-through rates or average positions
 * in the Data API — those live in Search Console, which is a different property
 * and a different API. What GA4 knows is what happened *after* the click: how
 * much organic traffic arrived, which pages it landed on, which engine sent it
 * and what it did next. This page is built on that and only that, so nothing on
 * it is a field that can never be filled.
 *
 * <p>⚠️ The figures are invented but not independent, which is the rule the
 * dashboard sample sets and the fastest way to an untrustworthy screen is to
 * break it. Three things hold:
 *
 * <ul>
 *   <li>the headline sessions figure is the chart's own columns added up, not a
 *       number typed beside them;
 *   <li>the last column of the 4-week series equals the whole of the 7-day
 *       series, so switching range does not quietly restate the same week as
 *       two different numbers;
 *   <li>the channel split, the landing pages and the search engines are all
 *       computed from that same organic total, so no breakdown can add up to
 *       something the headline disagrees with.
 * </ul>
 *
 * <p>Changes are computed from a stored previous-period figure rather than
 * stored as a percentage, for the reason `retention` gives: a stored percentage
 * is a number nobody can check, and it goes stale in silence.
 *
 * <p>Fixed values rather than anything random or clock-derived — this renders on
 * the server as well as in the browser, and a figure that differs between the
 * two is a hydration mismatch.
 *
 * <p>Delete this file when the property is connected. Nothing in
 * `components/seo` knows where these come from.
 */

/** How far back the page is looking. One control, scoping everything on it. */
export type SeoRangeId = "7d" | "4w"

export const seoRanges = [
  { id: "7d", label: "7 days", note: "last 7 days" },
  { id: "4w", label: "4 weeks", note: "last 4 weeks" },
] as const satisfies readonly { id: SeoRangeId; label: string; note: string }[]

/**
 * Which brand's property is on screen.
 *
 * <p>One GA4 property per brand, because that is how the accounts are actually
 * set up — three sites, three properties. The page is single-property: GA4 has
 * no cross-property report, so "all brands at once" would mean three calls and
 * a sum this screen invented, with no way for anyone to reconcile it against
 * the GA4 UI. Better one property at a time and a control to switch.
 *
 * <p>`property` is the resource name the Data API takes verbatim.
 */
export type SeoBrandId = "nike" | "adidas" | "puma"

export const seoBrands = [
  { id: "nike", label: "Nike", logo: "nike", property: "properties/412305881" },
  { id: "adidas", label: "Adidas", logo: "adidas", property: "properties/412307204" },
  { id: "puma", label: "Puma", logo: "puma", property: "properties/412309663" },
] as const satisfies readonly {
  id: SeoBrandId
  label: string
  /** Simple Icons slug, the convention Brands and the Clients table already use. */
  logo: string
  property: string
}[]

/**
 * One column of the traffic chart: a GA4 row of date × organic search.
 *
 * <p>`sessions` and `users` are the metrics `sessions` and `totalUsers`,
 * filtered to `sessionDefaultChannelGroup = "Organic Search"`.
 */
export type TrafficPoint = {
  /** The x-axis tick. Short enough to sit under a column. */
  label: string
  /** Spelled out, for the tooltip. */
  fullLabel: string
  sessions: number
  users: number
}

// Weekly buckets for the longer range rather than 28 columns. The honest fix
// for a longer range is a coarser bucket, not thinner bars — the same call the
// revenue chart makes.
//
// ⚠️ The last bucket of each 4-week series is the 7-day series added up. They
// describe the same week and must agree.
const TRAFFIC: Record<SeoBrandId, Record<SeoRangeId, TrafficPoint[]>> = {
  nike: {
    "7d": [
      { label: "Mon", fullLabel: "Monday 1 Sep", sessions: 1240, users: 1010 },
      { label: "Tue", fullLabel: "Tuesday 2 Sep", sessions: 1380, users: 1120 },
      { label: "Wed", fullLabel: "Wednesday 3 Sep", sessions: 1520, users: 1235 },
      { label: "Thu", fullLabel: "Thursday 4 Sep", sessions: 1410, users: 1150 },
      { label: "Fri", fullLabel: "Friday 5 Sep", sessions: 1330, users: 1080 },
      { label: "Sat", fullLabel: "Saturday 6 Sep", sessions: 890, users: 730 },
      { label: "Sun", fullLabel: "Sunday 7 Sep", sessions: 810, users: 665 },
    ],
    "4w": [
      { label: "11 Aug", fullLabel: "Week of 11 August", sessions: 7420, users: 6050 },
      { label: "18 Aug", fullLabel: "Week of 18 August", sessions: 7980, users: 6510 },
      { label: "25 Aug", fullLabel: "Week of 25 August", sessions: 8240, users: 6720 },
      { label: "1 Sep", fullLabel: "Week of 1 September", sessions: 8580, users: 6990 },
    ],
  },
  adidas: {
    "7d": [
      { label: "Mon", fullLabel: "Monday 1 Sep", sessions: 720, users: 590 },
      { label: "Tue", fullLabel: "Tuesday 2 Sep", sessions: 810, users: 660 },
      { label: "Wed", fullLabel: "Wednesday 3 Sep", sessions: 880, users: 715 },
      { label: "Thu", fullLabel: "Thursday 4 Sep", sessions: 845, users: 690 },
      { label: "Fri", fullLabel: "Friday 5 Sep", sessions: 790, users: 645 },
      { label: "Sat", fullLabel: "Saturday 6 Sep", sessions: 520, users: 430 },
      { label: "Sun", fullLabel: "Sunday 7 Sep", sessions: 470, users: 390 },
    ],
    "4w": [
      { label: "11 Aug", fullLabel: "Week of 11 August", sessions: 4380, users: 3590 },
      { label: "18 Aug", fullLabel: "Week of 18 August", sessions: 4610, users: 3780 },
      { label: "25 Aug", fullLabel: "Week of 25 August", sessions: 4820, users: 3950 },
      { label: "1 Sep", fullLabel: "Week of 1 September", sessions: 5035, users: 4120 },
    ],
  },
  puma: {
    "7d": [
      { label: "Mon", fullLabel: "Monday 1 Sep", sessions: 95, users: 82 },
      { label: "Tue", fullLabel: "Tuesday 2 Sep", sessions: 110, users: 94 },
      { label: "Wed", fullLabel: "Wednesday 3 Sep", sessions: 128, users: 108 },
      { label: "Thu", fullLabel: "Thursday 4 Sep", sessions: 121, users: 103 },
      { label: "Fri", fullLabel: "Friday 5 Sep", sessions: 104, users: 89 },
      { label: "Sat", fullLabel: "Saturday 6 Sep", sessions: 68, users: 58 },
      { label: "Sun", fullLabel: "Sunday 7 Sep", sessions: 61, users: 52 },
    ],
    "4w": [
      { label: "11 Aug", fullLabel: "Week of 11 August", sessions: 480, users: 410 },
      { label: "18 Aug", fullLabel: "Week of 18 August", sessions: 545, users: 465 },
      { label: "25 Aug", fullLabel: "Week of 25 August", sessions: 620, users: 528 },
      { label: "1 Sep", fullLabel: "Week of 1 September", sessions: 687, users: 586 },
    ],
  },
}

/**
 * The figures that are not sums of the chart.
 *
 * <p>`engagementRate` is GA4's metric of the same name, as a percentage.
 * `keyEvents` is what GA4 renamed conversions to. `averageEngagementSeconds`
 * is `userEngagementDuration / sessions`, which GA4 shows as "average
 * engagement time per session".
 *
 * <p>Each carries the previous period's value beside it, so every delta on the
 * page is arithmetic rather than assertion.
 */
type Engagement = {
  engagementRate: number
  previousEngagementRate: number
  keyEvents: number
  previousKeyEvents: number
  averageEngagementSeconds: number
  previousAverageEngagementSeconds: number
  /** Organic sessions and users in the period before this one. */
  previousSessions: number
  previousUsers: number
}

const ENGAGEMENT: Record<SeoBrandId, Record<SeoRangeId, Engagement>> = {
  nike: {
    "7d": { engagementRate: 58.4, previousEngagementRate: 56.1, keyEvents: 214, previousKeyEvents: 198, averageEngagementSeconds: 96, previousAverageEngagementSeconds: 91, previousSessions: 7980, previousUsers: 6510 },
    "4w": { engagementRate: 57.2, previousEngagementRate: 55.8, keyEvents: 812, previousKeyEvents: 744, averageEngagementSeconds: 94, previousAverageEngagementSeconds: 90, previousSessions: 29850, previousUsers: 24300 },
  },
  adidas: {
    "7d": { engagementRate: 61.2, previousEngagementRate: 62.4, keyEvents: 132, previousKeyEvents: 140, averageEngagementSeconds: 112, previousAverageEngagementSeconds: 118, previousSessions: 4820, previousUsers: 3950 },
    "4w": { engagementRate: 60.5, previousEngagementRate: 61.0, keyEvents: 498, previousKeyEvents: 470, averageEngagementSeconds: 109, previousAverageEngagementSeconds: 112, previousSessions: 17600, previousUsers: 14400 },
  },
  puma: {
    "7d": { engagementRate: 44.8, previousEngagementRate: 41.2, keyEvents: 9, previousKeyEvents: 6, averageEngagementSeconds: 47, previousAverageEngagementSeconds: 39, previousSessions: 620, previousUsers: 528 },
    "4w": { engagementRate: 43.1, previousEngagementRate: 40.5, keyEvents: 31, previousKeyEvents: 22, averageEngagementSeconds: 45, previousAverageEngagementSeconds: 38, previousSessions: 1840, previousUsers: 1570 },
  },
}

/**
 * The other channels, as a ratio of organic.
 *
 * <p>GA4 dimension `sessionDefaultChannelGroup`, and these are its own channel
 * names rather than invented ones — a reader comparing this screen to the GA4
 * UI should see the same words.
 *
 * <p>⚠️ Ratios rather than counts, so Organic Search is always exactly the
 * chart's total and the split can never contradict the headline. It also means
 * the mix holds its shape across both ranges instead of needing a second set.
 */
const CHANNEL_MIX: Record<SeoBrandId, readonly { channel: string; ratio: number }[]> = {
  nike: [
    { channel: "Organic Search", ratio: 1 },
    { channel: "Direct", ratio: 0.62 },
    { channel: "Organic Social", ratio: 0.34 },
    { channel: "Referral", ratio: 0.21 },
    { channel: "Paid Search", ratio: 0.18 },
    { channel: "Email", ratio: 0.09 },
  ],
  adidas: [
    { channel: "Organic Search", ratio: 1 },
    { channel: "Direct", ratio: 0.71 },
    { channel: "Organic Social", ratio: 0.42 },
    { channel: "Referral", ratio: 0.28 },
    { channel: "Email", ratio: 0.14 },
    { channel: "Paid Search", ratio: 0.11 },
  ],
  puma: [
    { channel: "Organic Search", ratio: 1 },
    { channel: "Direct", ratio: 1.34 },
    { channel: "Organic Social", ratio: 0.88 },
    { channel: "Referral", ratio: 0.15 },
    { channel: "Email", ratio: 0.05 },
    { channel: "Paid Search", ratio: 0 },
  ],
}

/**
 * Where the organic traffic lands.
 *
 * <p>GA4 dimension `landingPage`, which is a path rather than a full URL —
 * the property already knows its own host.
 *
 * <p>`share` is that page's slice of organic sessions. They deliberately do not
 * add to 1: the remainder is the long tail, and `landingPagesFor` returns it as
 * a figure rather than letting five rows imply they are the whole site.
 */
const LANDING_PAGES: Record<
  SeoBrandId,
  readonly { path: string; share: number; engagementRate: number; keyEvents: number }[]
> = {
  nike: [
    { path: "/", share: 0.24, engagementRate: 51.2, keyEvents: 38 },
    { path: "/running", share: 0.18, engagementRate: 64.8, keyEvents: 61 },
    { path: "/air-max", share: 0.15, engagementRate: 69.1, keyEvents: 54 },
    { path: "/sale", share: 0.11, engagementRate: 58.4, keyEvents: 33 },
    { path: "/football/boots", share: 0.08, engagementRate: 62.7, keyEvents: 19 },
  ],
  adidas: [
    { path: "/", share: 0.26, engagementRate: 54.9, keyEvents: 29 },
    { path: "/originals", share: 0.21, engagementRate: 68.3, keyEvents: 44 },
    { path: "/ultraboost", share: 0.14, engagementRate: 71.5, keyEvents: 31 },
    { path: "/outlet", share: 0.09, engagementRate: 55.1, keyEvents: 14 },
    { path: "/training", share: 0.07, engagementRate: 60.2, keyEvents: 8 },
  ],
  puma: [
    { path: "/", share: 0.38, engagementRate: 39.4, keyEvents: 3 },
    { path: "/suede", share: 0.16, engagementRate: 52.8, keyEvents: 2 },
    { path: "/motorsport", share: 0.11, engagementRate: 47.1, keyEvents: 2 },
    { path: "/sale", share: 0.09, engagementRate: 41.6, keyEvents: 1 },
    { path: "/kids", share: 0.05, engagementRate: 44.0, keyEvents: 0 },
  ],
}

/**
 * Which engine sent it.
 *
 * <p>GA4 dimension `sessionSource` with `sessionMedium = "organic"`. The shares
 * add to 1 — between them these are all of organic search.
 */
const ENGINES: Record<SeoBrandId, readonly { source: string; share: number }[]> = {
  nike: [
    { source: "google", share: 0.887 },
    { source: "bing", share: 0.058 },
    { source: "duckduckgo", share: 0.031 },
    { source: "yahoo", share: 0.014 },
    { source: "ecosia", share: 0.01 },
  ],
  adidas: [
    { source: "google", share: 0.861 },
    { source: "bing", share: 0.071 },
    { source: "duckduckgo", share: 0.037 },
    { source: "yahoo", share: 0.019 },
    { source: "ecosia", share: 0.012 },
  ],
  puma: [
    { source: "google", share: 0.912 },
    { source: "bing", share: 0.049 },
    { source: "duckduckgo", share: 0.024 },
    { source: "yahoo", share: 0.011 },
    { source: "ecosia", share: 0.004 },
  ],
}

/**
 * Where in the world the organic sessions came from.
 *
 * <p>GA4 dimensions `country` and `countryId` — the name and its ISO 3166-1
 * alpha-2 code, which is exactly what the Data API returns.
 *
 * <p>⚠️ `atlasId` is the same country's ISO 3166-1 <b>numeric</b> code, which is
 * what the world topology keys its shapes on. Two codes for one country is
 * ugly, and the alternative is worse: matching on the English name means
 * "United States" quietly failing to find "United States of America" and a
 * country silently rendering as no-data. The pairing sits here, beside the
 * data, so when the API is wired it becomes one lookup table rather than a bug
 * nobody sees.
 *
 * <p>Shares add to 1 — between them these are all of organic search.
 */
const COUNTRIES: Record<
  SeoBrandId,
  readonly { country: string; countryId: string; atlasId: string; share: number }[]
> = {
  nike: [
    { country: "Morocco", countryId: "MA", atlasId: "504", share: 0.34 },
    { country: "France", countryId: "FR", atlasId: "250", share: 0.21 },
    { country: "Spain", countryId: "ES", atlasId: "724", share: 0.12 },
    { country: "United States", countryId: "US", atlasId: "840", share: 0.11 },
    { country: "United Kingdom", countryId: "GB", atlasId: "826", share: 0.08 },
    { country: "Germany", countryId: "DE", atlasId: "276", share: 0.06 },
    { country: "Italy", countryId: "IT", atlasId: "380", share: 0.05 },
    { country: "Netherlands", countryId: "NL", atlasId: "528", share: 0.03 },
  ],
  adidas: [
    { country: "Morocco", countryId: "MA", atlasId: "504", share: 0.29 },
    { country: "France", countryId: "FR", atlasId: "250", share: 0.24 },
    { country: "Spain", countryId: "ES", atlasId: "724", share: 0.15 },
    { country: "United States", countryId: "US", atlasId: "840", share: 0.09 },
    { country: "Germany", countryId: "DE", atlasId: "276", share: 0.08 },
    { country: "United Kingdom", countryId: "GB", atlasId: "826", share: 0.07 },
    { country: "Italy", countryId: "IT", atlasId: "380", share: 0.05 },
    { country: "Netherlands", countryId: "NL", atlasId: "528", share: 0.03 },
  ],
  puma: [
    { country: "Morocco", countryId: "MA", atlasId: "504", share: 0.52 },
    { country: "France", countryId: "FR", atlasId: "250", share: 0.18 },
    { country: "Spain", countryId: "ES", atlasId: "724", share: 0.11 },
    { country: "United States", countryId: "US", atlasId: "840", share: 0.06 },
    { country: "United Kingdom", countryId: "GB", atlasId: "826", share: 0.05 },
    { country: "Germany", countryId: "DE", atlasId: "276", share: 0.04 },
    { country: "Italy", countryId: "IT", atlasId: "380", share: 0.03 },
    { country: "Netherlands", countryId: "NL", atlasId: "528", share: 0.01 },
  ],
}

/**
 * What they were reading it on.
 *
 * <p>GA4 dimension `deviceCategory`, whose values are exactly these three —
 * there is no fourth, and "phone" is not one of them: GA4 calls it `mobile`.
 *
 * <p>Listed in GA4's own order rather than by size, so the three always appear
 * in the same places and a reader comparing two brands is comparing positions
 * rather than re-reading labels.
 */
const DEVICES: Record<SeoBrandId, readonly { device: string; share: number }[]> = {
  nike: [
    { device: "desktop", share: 0.34 },
    { device: "mobile", share: 0.61 },
    { device: "tablet", share: 0.05 },
  ],
  adidas: [
    { device: "desktop", share: 0.37 },
    { device: "mobile", share: 0.58 },
    { device: "tablet", share: 0.05 },
  ],
  puma: [
    { device: "desktop", share: 0.25 },
    { device: "mobile", share: 0.72 },
    { device: "tablet", share: 0.03 },
  ],
}

/** The columns the chart draws. */
export function trafficFor(brand: SeoBrandId, range: SeoRangeId): TrafficPoint[] {
  return TRAFFIC[brand][range]
}

/** Percentage change, or `undefined` when there is nothing to divide by. */
function changeFrom(current: number, previous: number): number | undefined {
  if (previous === 0) return undefined
  return ((current - previous) / previous) * 100
}

/**
 * The headline figures.
 *
 * <p>⚠️ Sessions and users are the chart's columns added up, never a stored
 * total. A headline that can disagree with the plot underneath it eventually
 * will.
 */
export function totalsFor(brand: SeoBrandId, range: SeoRangeId) {
  const points = TRAFFIC[brand][range]
  const engagement = ENGAGEMENT[brand][range]

  const sessions = points.reduce((total, point) => total + point.sessions, 0)
  const users = points.reduce((total, point) => total + point.users, 0)

  return {
    sessions,
    sessionsChange: changeFrom(sessions, engagement.previousSessions),
    users,
    usersChange: changeFrom(users, engagement.previousUsers),
    engagementRate: engagement.engagementRate,
    engagementRateChange: changeFrom(engagement.engagementRate, engagement.previousEngagementRate),
    keyEvents: engagement.keyEvents,
    keyEventsChange: changeFrom(engagement.keyEvents, engagement.previousKeyEvents),
    averageEngagementSeconds: engagement.averageEngagementSeconds,
    averageEngagementSecondsChange: changeFrom(
      engagement.averageEngagementSeconds,
      engagement.previousAverageEngagementSeconds
    ),
  }
}

/** Every channel's sessions, organic first and largest-first after it. */
export function channelsFor(brand: SeoBrandId, range: SeoRangeId) {
  const organic = totalsFor(brand, range).sessions

  return CHANNEL_MIX[brand].map(({ channel, ratio }) => ({
    channel,
    sessions: Math.round(organic * ratio),
  }))
}

/**
 * The top landing pages, and what the rest come to.
 *
 * <p>The tail is returned rather than dropped, so five rows are never mistaken
 * for the whole site.
 */
export function landingPagesFor(brand: SeoBrandId, range: SeoRangeId) {
  const organic = totalsFor(brand, range).sessions
  const rows = LANDING_PAGES[brand].map((row) => ({
    ...row,
    sessions: Math.round(organic * row.share),
  }))

  return {
    rows,
    tailSessions: organic - rows.reduce((total, row) => total + row.sessions, 0),
  }
}

/**
 * Organic sessions per device category.
 *
 * <p>The last row takes the remainder, so the three add up to the headline
 * exactly rather than landing a session or two short of it.
 */
export function devicesFor(brand: SeoBrandId, range: SeoRangeId) {
  const organic = totalsFor(brand, range).sessions
  const rows = DEVICES[brand]

  let assigned = 0
  return rows.map(({ device, share }, index) => {
    const last = index === rows.length - 1
    const sessions = last ? organic - assigned : Math.round(organic * share)
    assigned += sessions
    return { device, sessions }
  })
}

/**
 * Sessions per country, largest first.
 *
 * <p>The last row takes the remainder for the reason {@link enginesFor} gives:
 * eight separately rounded shares land a few sessions short of the total, and
 * a map whose parts do not add up to the headline is a map nobody can check.
 */
export function countriesFor(brand: SeoBrandId, range: SeoRangeId) {
  const organic = totalsFor(brand, range).sessions
  const rows = COUNTRIES[brand]

  let assigned = 0
  return rows.map((row, index) => {
    const last = index === rows.length - 1
    const sessions = last ? organic - assigned : Math.round(organic * row.share)
    assigned += sessions
    return { country: row.country, countryId: row.countryId, atlasId: row.atlasId, sessions }
  })
}

/**
 * Sessions per search engine.
 *
 * <p>The last row takes the remainder rather than its own rounded share, so the
 * engines add up to the organic total exactly — five separately rounded numbers
 * land a session or two short of it.
 */
export function enginesFor(brand: SeoBrandId, range: SeoRangeId) {
  const organic = totalsFor(brand, range).sessions
  const rows = ENGINES[brand]

  let assigned = 0
  return rows.map(({ source, share }, index) => {
    const last = index === rows.length - 1
    const sessions = last ? organic - assigned : Math.round(organic * share)
    assigned += sessions
    return { source, sessions }
  })
}
