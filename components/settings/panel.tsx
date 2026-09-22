// The Panel tab of the Configuration page.
// Empty for now; the content is designed next.
export function Panel() {
  return (
    <div className="flex min-h-full flex-col">
      <div>
        <h2 className="text-sm font-medium">Panel</h2>
        <p className="mt-1 text-xs text-muted-foreground">Manage the panels available in your workspace.</p>
      </div>
      <div className="mt-4 flex min-h-48 flex-1 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
        Nothing here yet.
      </div>
    </div>
  );
}
