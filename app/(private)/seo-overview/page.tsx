import type { Metadata } from "next";

import { SeoWorkspace } from "@/components/seo/seoWorkspace";

export const metadata: Metadata = {
  title: "SEO Overview | One Base",
};

export default function SeoOverviewPage() {
  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <p className="text-xs font-medium text-muted-foreground">Workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          SEO Overview
        </h1>
        {/* Says what the page measures rather than what it is called. The old
            line promised "search rankings", which GA4 does not have — see the
            note at the top of SeoWorkspace. */}
        <p className="mt-1 text-xs text-muted-foreground">
          What organic search brings each brand, from Google Analytics 4.
        </p>
      </header>

      <section
        className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background"
        aria-label="SEO Overview content"
      >
        <div className="h-full overflow-y-auto p-4 [scrollbar-gutter:stable]">
          <SeoWorkspace />
        </div>
      </section>
    </div>
  );
}
