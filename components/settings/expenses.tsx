// The Expenses tab of the Configuration page: what each subscription costs the business, and the price of extra perks.
// Empty for now; the content is designed next.
export function Expenses() {
  return (
    <div className="flex min-h-full flex-col">
      <div>
        <h2 className="text-sm font-medium">Expenses</h2>
        <p className="mt-1 text-xs text-muted-foreground">What each subscription costs you, and the price of additional perks.</p>
      </div>
      <div className="mt-4 flex min-h-48 flex-1 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
        Nothing here yet.
      </div>
    </div>
  );
}
