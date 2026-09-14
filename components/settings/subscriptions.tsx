// The Subscriptions tab of the Configuration page. Same header as the Payment methods tab; the content comes next.
export function Subscriptions() {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Subscriptions</h2>
          <p className="mt-1 text-xs text-muted-foreground">Configure the subscription plans your clients can choose.</p>
        </div>
      </div>

      {/* Empty for now: the subscription plans go here. */}
      <div className="@container mt-5" />
    </>
  );
}
