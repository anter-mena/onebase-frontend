import Link from "next/link";
import { Command, GalleryVerticalEnd } from "lucide-react";
import { cn } from "cn";

import { AuthFooter } from "@/components/auth/authFooter";
import { AuthFieldsSkeleton } from "@/components/auth/authFormSkeleton";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Sign in while it loads: the page itself — the welcome, the tips panel — with
 * only the form and the tip greyed out, so the page does not jump when it arrives.
 */
export default function LoginLoading() {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[64.5fr_35.5fr]" role="status" aria-label="Loading">
      <div className="flex min-h-svh flex-col">
        <main className="flex flex-1 items-center justify-center px-6 py-16 md:px-10 lg:pt-32">
          <div className="mx-auto flex w-full max-w-xs flex-col gap-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className={cn(whiteStyle.button, "mb-1 flex size-9 items-center justify-center p-0! text-foreground")}>
                <GalleryVerticalEnd className="size-4" aria-hidden />
              </div>
              <h1 className="font-heading text-lg font-bold tracking-tight text-balance">Welcome to One Base</h1>
              <p className="text-xs text-muted-foreground">
                Can&apos;t access your account?
                <br />
                <Link href="/coming-soon" className="underline underline-offset-4 hover:text-foreground">
                  Contact IT support
                </Link>
              </p>
            </div>
            <AuthFieldsSkeleton fields={2} />
          </div>
        </main>
        <AuthFooter />
      </div>
      <aside className="hidden flex-col justify-between border-l bg-muted pb-2 text-foreground lg:flex" aria-label="One Base">
        <div className="flex items-center justify-end gap-2 p-10 text-lg font-semibold">
          <Command className="size-5" aria-hidden />
          <span>One Base</span>
        </div>
        <div className="w-full px-4" aria-hidden>
          <div className="flex flex-col gap-2 rounded-lg border bg-background px-4 py-6 shadow-sm">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </aside>
    </div>
  );
}
