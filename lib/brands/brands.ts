import "server-only"

import type { BrandRow } from "@/lib/brands/types"
import { apiFetch, type ApiResult } from "@/lib/api"

/**
 * The Brands tab's list: `GET /api/brands` (both roles; changing them is
 * Admin-only). Already in the shape the table draws.
 */
export function getBrands(): Promise<ApiResult<BrandRow[]>> {
  return apiFetch<BrandRow[]>("/api/brands", { authenticated: true })
}
