/**
 * Traffic by channel: always these rows, in this order (decided 2026-10-28), so
 * the card keeps one size and a channel keeps its place and colour whatever the
 * period. A channel with no sessions shows 0.
 *
 * <p>They are GA4's default channel groups that a brand's site gets in practice.
 * A rarer one (Display, Affiliates, Organic Video, SMS…) is counted in "Other".
 *
 * <p>The backend asks GA4 for every channel (SeoService, up to 25 since 2026-10-28;
 * it was the top eight), so Other counts all the rest and the shares add up to 100%.
 */
export const SEO_CHANNELS = [
  "Organic Search",
  "Direct",
  "Referral",
  "Organic Social",
  "Paid Search",
  "Email",
  "Paid Social",
  "Unassigned",
] as const

export const OTHER_CHANNEL = "Other"
