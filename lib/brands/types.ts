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
  /** Our own address for the logo (it changes when the logo does), or null. */
  logoUrl: string | null
  active: boolean
  /** 0 until the Clients module exists. */
  clients: number
  /** ISO time. */
  createdAt: string
}

/** What reading a website found, for the Admin to check before saving. */
export type BrandLookup = {
  name: string
  domain: string
  websiteUrl: string
  socials: Socials
  /** The logo we made, as a data: address, or null when none was found. */
  logo: string | null
  /** The brand that already has this website, if any. */
  existingBrand: string | null
  /** What could not be found, in a sentence; null when everything was. */
  warning: string | null
}
