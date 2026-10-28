import { CloudAlert } from "lucide-react";
import { cn } from "cn";

import { RetryingLoadError } from "@/components/errors/retryingLoadError";
import whiteStyle from "@/components/ui/button-styles/white.module.css";

/**
 * The statuses worth trying again by themselves: a service that did not answer
 * (502), the server out of reach (503), or too slow (504). Anything else — a
 * refused key, a property that does not exist — will not fix itself by waiting.
 */
function isPassing(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

/**
 * For data from a service that can be briefly out of reach (Google Analytics,
 * Gmail): a passing failure keeps trying by itself (RetryingLoadError); a lasting
 * one is said once, plainly — waiting will not fix a refused key.
 */
export function ServiceLoadError({ title, reason, status }: { title: string; reason: string; status: number }) {
  return isPassing(status) ? <RetryingLoadError title={title} reason={reason} /> : <LoadError title={title} reason={reason} />;
}

/**
 * What a table area shows when its data did not load — not an empty table,
 * which would say "there is nothing" when the truth is "we could not ask".
 *
 * <p>Icon tile (the same white skin as the sign-in pages), then two lines: what
 * failed, and the backend's own reason.
 */
export function LoadError({ title, reason }: { title: string; reason: string }) {
  return (
    <div role="alert" className="flex h-full min-h-48 flex-col items-center justify-center gap-2 px-6 text-center">
      <div className={cn(whiteStyle.button, "mb-1 flex size-9 items-center justify-center p-0! text-foreground")}>
        <CloudAlert className="size-4" aria-hidden />
      </div>
      <p className="text-xs font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{reason}</p>
    </div>
  );
}
