import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ServiceLoadError } from "@/components/errors/loadError";
import { SeoSkeleton } from "@/components/seo/seoSkeleton";
import { SeoWorkspace } from "@/components/seo/seoWorkspace";
import { getSeoBrands, getSeoOverview } from "@/lib/seo/seo";
import { isSeoRange, type SeoRangeId } from "@/lib/seo/types";

export const metadata: Metadata = {
  title: "SEO Overview | One Base",
};

type SeoQuery = { brand?: string; range?: string; from?: string; to?: string };

/**
 * Live from each brand's Google Analytics 4 property. The brand and the range
 * are in the address bar, so a view can be linked to and Back works.
 *
 * <p>⚠️ The data waits inside a `<Suspense>` keyed by the brand and the period
 * (2026-10-28). Choosing another brand or period changes only the query, the route
 * stays the same, and Next kept the old view on screen until the new one was
 * ready — no loader. A boundary with a new key is a new boundary, and a new
 * boundary shows its fallback: the skeleton, at once.
 */
export default async function SeoOverviewPage({ searchParams }: { searchParams: Promise<SeoQuery> }) {
  const query = await searchParams;
  const range: SeoRangeId = isSeoRange(query.range) ? query.range : "month";
  const view = [query.brand ?? "", range, query.from ?? "", query.to ?? ""].join("|");

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <p className="text-xs font-medium text-muted-foreground">Workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">SEO Overview</h1>
        {/* Says what the page measures: GA4 has visits, not "search rankings". */}
        <p className="mt-1 text-xs text-muted-foreground">Each brand&apos;s website traffic from Google Analytics 4: every visitor, and what search engines bring.</p>
      </header>

      <section
        className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background"
        aria-label="SEO Overview content"
      >
        <div className="h-full overflow-y-auto p-4 [scrollbar-gutter:stable]">
          <Suspense key={view} fallback={<SeoSkeleton />}>
            <SeoContent query={query} range={range} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}

async function SeoContent({ query, range }: { query: SeoQuery; range: SeoRangeId }) {
  const brands = await getSeoBrands();
  if (!brands.ok) {
    return (
      <div className="flex h-full items-center justify-center">
        <ServiceLoadError title="The SEO overview could not be loaded." reason={brands.error.message} status={brands.error.status} />
      </div>
    );
  }
  if (brands.data.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-1 text-center">
        <p className="text-sm font-medium">No brand is connected to Google Analytics yet.</p>
        <p className="max-w-md text-xs text-muted-foreground">
          Add the brand&apos;s GA4 property ID in{" "}
          <Link href="/configuration?tab=brands" className="underline underline-offset-4">
            Configuration → Brands
          </Link>{" "}
          (Edit → GA4 property ID).
        </p>
      </div>
    );
  }
  const brand = brands.data.find((entry) => String(entry.id) === query.brand) ?? brands.data[0];
  const overview = await getSeoOverview(brand.id, range, query.from, query.to);
  return overview.ok ? (
    <SeoWorkspace brands={brands.data} data={overview.data} />
  ) : (
    <div className="flex h-full items-center justify-center">
      {/* Google can be out of reach for a moment: a passing failure keeps trying by itself. */}
      <ServiceLoadError title={`${brand.name}: Google Analytics could not be read.`} reason={overview.error.message} status={overview.error.status} />
    </div>
  );
}
