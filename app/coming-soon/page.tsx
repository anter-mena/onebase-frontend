import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "cn";
import { ArrowLeft, Hourglass } from "lucide-react";

import whiteStyle from "@/components/ui/button-styles/white.module.css";

export const metadata: Metadata = {
  title: "Coming soon | One Base",
};

/**
 * Where links to pages that do not exist yet (help center, terms, support…) lead.
 * Public on purpose (proxy.ts OPEN): some of those links sit on the login page.
 * Same look as the error screens.
 */
export default function ComingSoonPage() {
  return (
    <div className="min-h-svh bg-background">
      <main className="flex min-h-svh items-center justify-center px-6 py-16 md:px-10">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className={cn(whiteStyle.button, "mb-1 flex size-11 items-center justify-center p-0! text-foreground")}>
              <Hourglass className="size-5" aria-hidden />
            </div>
            <p className="text-sm font-bold text-foreground">Coming soon</p>
            <h1 className="text-xs font-normal leading-relaxed text-muted-foreground">
              <span className="block">This page is not ready yet.</span>
              <span className="block">We are working on it.</span>
            </h1>
          </div>
          <div className="flex items-center justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ArrowLeft className="size-3" aria-hidden />
              Go back
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
