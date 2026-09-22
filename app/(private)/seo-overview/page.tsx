import type { Metadata } from "next";

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
        <p className="mt-1 text-xs text-muted-foreground">
          Track how your brands perform in search.
        </p>
      </header>

      <section
        className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background"
        aria-label="SEO Overview content"
      >
        <div className="h-full overflow-y-auto p-4 [scrollbar-gutter:stable]">
          <div className="space-y-4">
            <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed p-6 text-center">
              <div className="max-w-sm">
                <h2 className="text-sm font-medium">Content area</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Search rankings, traffic and keyword data will be added here
                  as we build each feature.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
