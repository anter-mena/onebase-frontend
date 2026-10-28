"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CloudAlert, LoaderCircle } from "lucide-react";
import { cn } from "cn";

import whiteStyle from "@/components/ui/button-styles/white.module.css";

/** Seconds before the first automatic try, then between every one after it. */
const FIRST_WAIT = 5;
const NEXT_WAIT = 10;

/**
 * LoadError for data that comes from somewhere that can be briefly out of reach
 * — Google Analytics, Gmail (2026-10-28). It keeps the error on screen and says
 * it is trying again; each try asks the server for the page afresh
 * (`router.refresh()`), and once the data comes back the page replaces this.
 * The first try after 5 s, then one every 10 s for as long as the page is open
 * (decided 2026-10-28); "Try now" skips the wait and starts the 10 s again.
 *
 * <p>The backend already tries twice on a dropped connection before answering an
 * error, so what reaches this is a real failure, not a stale connection.
 */
export function RetryingLoadError({ title, reason }: { title: string; reason: string }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [secondsLeft, setSecondsLeft] = useState(FIRST_WAIT);

  function tryNow() {
    setSecondsLeft(NEXT_WAIT);
    startRefresh(() => router.refresh());
  }

  // One tick a second while waiting; at zero, a try, and the next 10 s start.
  useEffect(() => {
    if (refreshing) return;
    const timer = window.setTimeout(() => {
      if (secondsLeft > 1) setSecondsLeft(secondsLeft - 1);
      else tryNow();
    }, 1000);
    return () => window.clearTimeout(timer);
    // `tryNow` only wraps the router, which is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, refreshing]);

  return (
    <div role="alert" className="flex h-full min-h-48 flex-col items-center justify-center gap-2 px-6 text-center">
      <div className={cn(whiteStyle.button, "mb-1 flex size-9 items-center justify-center p-0! text-foreground")}>
        {refreshing ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <CloudAlert className="size-4" aria-hidden />}
      </div>
      <p className="text-xs font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{reason}</p>
      <p className="mt-1 flex items-center gap-2 text-[0.7rem] text-muted-foreground" aria-live="polite">
        {refreshing ? "Trying to reach it…" : <>Trying again in {secondsLeft} s</>}
        {!refreshing ? (
          <button
            type="button"
            onClick={tryNow}
            className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            Try now
          </button>
        ) : null}
      </p>
      {/* True: leaving the page unmounts this, which clears its timer — no call goes out after. */}
      <p className="text-[0.65rem] text-muted-foreground/70">To stop trying, go to another page.</p>
    </div>
  );
}
