/**
 * What the Brands tab works with. A plain module (no "use client" or
 * "server-only"), so the server loader, the actions and the table share it.
 */

export type SocialNetwork = "instagram" | "facebook" | "x" | "tiktok"

export type Socials = Partial<Record<SocialNetwork, string>>

export type BrandRow = {
  id: number
  name: string
  /** "nike.com": what makes two links the same brand. */
  domain: string
  /** "https://www.nike.com" */
  websiteUrl: string
  socials: Socials
  /**
   * The logo's address on the brand's own website (absolute https), or null.
   * Logos are not stored: every screen loads it from there.
   */
  logoUrl: string | null
  active: boolean
  /** Clients on this brand, deleted ones left out. */
  clients: number
  /** The Google Analytics 4 property number, for the SEO page; null = none. */
  ga4PropertyId: string | null
  /** ISO time. */
  createdAt: string
}

/** What reading a website found, for the Admin to check before saving. */
export type BrandLookup = {
  name: string
  domain: string
  websiteUrl: string
  socials: Socials
  /** The best logo on the site (a PNG/JPEG first), as its https address, or null when none was found. */
  logoUrl: string | null
  /** The brand that already has this website, if any. */
  existingBrand: string | null
  /** What could not be found, in a sentence; null when everything was. */
  warning: string | null
}
