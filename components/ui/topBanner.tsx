"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { toast } from "sonner";

const BANNER_ID = "top-banner";
let bannerVersion = 0;

function TopBanner({ message, id }: { message: string; id: string | number }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <div
      className="flex w-full items-center justify-center gap-2 border-b bg-background px-4 py-1.5 font-sans text-xs text-foreground shadow-sm md:px-6"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <Info className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <p className="min-w-0 text-center" role="status">{message}</p>
      <button
        type="button"
        onClick={() => toast.dismiss(id)}
        aria-label="Dismiss notification"
        className="relative flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <svg className="pointer-events-none absolute inset-1 size-4 -rotate-90" viewBox="0 0 32 32" fill="none" aria-hidden>
          <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" className="opacity-20" />
          <circle
            cx="16"
            cy="16"
            r="14"
            pathLength="100"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="100"
            className="animate-[banner-countdown_5s_linear_forwards]"
            style={{ animationPlayState: hovered || focused ? "paused" : "running" }}
            onAnimationEnd={() => toast.dismiss(id)}
          />
        </svg>
        <X className="size-2.5" aria-hidden />
      </button>
    </div>
  );
}

export function showTopBanner(message: string) {
  const version = ++bannerVersion;

  // The ring owns dismissal so its countdown and pause state stay in sync.
  return toast.custom(
    (id) => <TopBanner key={version} id={id} message={message} />,
    { id: BANNER_ID, duration: Infinity, dismissible: false },
  );
}
