import { Plug, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";

/**
 * The Panel tab of the Configuration page.
 *
 * <p>Panels are the upstream providers a workspace resells from, and managing
 * them means talking to each provider's API — creating lines, checking credit,
 * reading expiry. None of that is in this version.
 *
 * <p>⚠️ <b>Says so plainly rather than showing a dashed box.</b> An empty
 * placeholder reads as "not built yet", which invites the question "when this
 * week?". This is a scope decision, not a gap in the sprint, and the tab is the
 * one place anybody will look for the answer.
 */
export function Panel() {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-medium">
            Panel
            <Badge variant="secondary" className="h-4 px-1.5 text-[0.6rem] font-normal">
              Coming soon
            </Badge>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage the panels available in your workspace.
          </p>
        </div>
      </div>

      <div className="mt-4 flex min-h-48 flex-1 items-center justify-center rounded-lg border border-dashed p-6">
        <div className="max-w-md text-center">
          <span
            aria-hidden
            className="mx-auto flex size-9 items-center justify-center rounded-xl border bg-muted/40"
          >
            <Plug className="size-4 text-muted-foreground" />
          </span>

          <h3 className="mt-3 text-sm font-medium">Panel API integration</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Connecting One Base to your panel providers — creating lines,
            reading credit and syncing expiry dates automatically — is planned
            for a later version. It is not part of this one.
          </p>

          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-[0.65rem] text-muted-foreground">
            <Sparkles className="size-3" aria-hidden />
            Until then, panels are managed with your provider directly
          </p>
        </div>
      </div>
    </div>
  );
}
