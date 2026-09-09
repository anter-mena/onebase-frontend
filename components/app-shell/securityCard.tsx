"use client";

import { useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import purpleStyle from "@/components/ui/button-styles/purple.module.css";

export function SecurityCard() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <section
      className="relative rounded-lg border bg-card p-3 shadow-sm"
      aria-labelledby="security-card-title"
    >
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label="Dismiss security suggestion"
      >
        <X className="size-3" aria-hidden />
      </button>
      <div
        className={cn(
          purpleStyle.button,
          "flex size-8 cursor-default items-center justify-center p-0! text-white",
        )}
      >
        <ShieldCheck className="size-4" aria-hidden />
      </div>
      <h2
        id="security-card-title"
        className="mt-3 pr-5 text-xs font-semibold leading-tight"
      >
        Two-step verification
      </h2>
      <p className="mt-1 text-[0.65rem] leading-relaxed text-muted-foreground">
        Add an extra layer of security during login. This feature is coming
        soon.
      </p>
      <div className="mt-2 grid gap-1">
        <Button type="button" size="sm" className="h-7 text-[0.65rem]" disabled>
          Coming soon
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-[0.65rem]"
        >
          Learn more
        </Button>
      </div>
    </section>
  );
}
