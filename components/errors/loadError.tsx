import { CloudAlert } from "lucide-react";
import { cn } from "cn";

import whiteStyle from "@/components/ui/button-styles/white.module.css";

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
