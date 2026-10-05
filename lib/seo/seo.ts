import "server-only"

import { apiFetch } from "@/lib/api"
import type { SeoBrand, SeoOverview, SeoRangeId } from "@/lib/seo/types"

/** Active brands that have a GA4 property — the brand switch on the page. */
export function getSeoBrands() {
  return apiFetch<SeoBrand[]>("/api/seo/brands", { authenticated: true })
}

/** One brand's organic search, live from GA4 (the backend keeps it ten minutes). */
export function getSeoOverview(brandId: number, range: SeoRangeId, from?: string, to?: string) {
  const params = new URLSearchParams({ brandId: String(brandId), range })
  if (range === "custom" && from && to) {
    params.set("from", from)
    params.set("to", to)
  }
  return apiFetch<SeoOverview>(`/api/seo/overview?${params}`, { authenticated: true })
}
