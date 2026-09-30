"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * "Check again" — re-runs the server check without reloading the page.
 *
 * <p>`router.refresh()` asks the server to render the page again, which is
 * where the health call lives; the browser never calls the backend itself.
 * The icon spins while the answer is on its way, so a slow backend reads as
 * "checking", not as a button that did nothing.
 *
 * <p>Icon only, so the words move to the tooltip and the `aria-label` — the
 * same square white button the Renewals row actions use.
 */
export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const label = pending ? "Checking…" : "Check again";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={label}
            disabled={pending}
            onClick={() => startTransition(() => router.refresh())}
            className={cn(whiteStyle.button, "size-7 p-0! text-foreground")}
          />
        }
      >
        <RefreshCcw className={cn("size-3.5", pending && "animate-spin")} aria-hidden />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
