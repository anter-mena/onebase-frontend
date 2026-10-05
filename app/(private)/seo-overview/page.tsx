import type { Metadata } from "next";
import Link from "next/link";

import { LoadError } from "@/components/errors/loadError";
import { SeoWorkspace } from "@/components/seo/seoWorkspace";
import { getSeoBrands, getSeoOverview } from "@/lib/seo/seo";
import { isSeoRange, type SeoRangeId } from "@/lib/seo/types";

export const metadata: Metadata = {
  title: "SEO Overview | One Base",
};

/**
 * Live from each brand's Google Analytics 4 property. The brand and the range
 * are in the address bar, so a view can be linked to and Back works.
 */
export default async function SeoOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; range?: string; from?: string; to?: string }>;
}) {
  const query = await searchParams;
  const range: SeoRangeId = isSeoRange(query.range) ? query.range : "7d";

  const brands = await getSeoBrands();
  let body: React.ReactNode;
  if (!brands.ok) {
    body = (
      <div className="flex h-full items-center justify-center">
        <LoadError title="The SEO overview could not be loaded." reason={brands.error.message} />
      </div>
    );
  } else if (brands.data.length === 0) {
    body = (
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
  } else {
    const brand = brands.data.find((entry) => String(entry.id) === query.brand) ?? brands.data[0];
    const overview = await getSeoOverview(brand.id, range, query.from, query.to);
    body = overview.ok ? (
      <SeoWorkspace brands={brands.data} data={overview.data} />
    ) : (
      <div className="flex h-full items-center justify-center">
        <LoadError title={`${brand.name}: Google Analytics could not be read.`} reason={overview.error.message} />
      </div>
    );
  }

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
        <div className="h-full overflow-y-auto p-4 [scrollbar-gutter:stable]">{body}</div>
      </section>
    </div>
  );
}
