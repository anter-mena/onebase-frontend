import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | One Base",
};

export default function DashboardPage() {
  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <p className="text-xs font-medium text-muted-foreground">Overview</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Your One Base workspace at a glance.
        </p>
      </header>

      <section
        className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background"
        aria-label="Dashboard content"
      >
        <div className="h-full overflow-y-auto p-4 [scrollbar-gutter:stable]">
          <div className="space-y-4">
            <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed p-6 text-center">
              <div className="max-w-sm">
                <h2 className="text-sm font-medium">Content area</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Dashboard widgets and business data will be added here as we
                  build each feature.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
