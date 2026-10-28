import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "cn";

import { Line } from "@/components/loading/pageSkeleton";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The sign-in pages' pieces while they load, at the real sizes of the shared
 * form parts (components/ui): a Field is its label (`text-sm`, `leading-snug`),
 * an 8px gap and an `h-8` input; fields sit `gap-3` apart in their FieldGroup,
 * and the submit button is `h-8`, full width.
 */

/** One field. `strength`: the password strength line under it (passwordStrengthHint.tsx: `h-4`, pulled up 4px). */
export function AuthFieldSkeleton({ strength = false, labelWidth = "w-20" }: { strength?: boolean; labelWidth?: string }) {
  return (
    <div className={cn("flex w-full flex-col gap-2", strength && "-mb-1")}>
      <Line className="text-sm leading-snug" width={labelWidth} />
      <Skeleton className="h-8 w-full rounded-lg" />
      {strength ? (
        <div className="-mt-1 flex h-4 items-center">
          <Skeleton className="h-2 w-28" />
        </div>
      ) : null}
    </div>
  );
}

/** A form: its fields in a `gap-3` group, then the `h-8` button. */
export function AuthFormSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {children}
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  );
}

/** The login form's two fields (loginForm.tsx), kept for the login loader. */
export function AuthFieldsSkeleton({ fields }: { fields: number }) {
  return (
    <AuthFormSkeleton>
      {Array.from({ length: fields }, (_, index) => (
        <AuthFieldSkeleton key={index} />
      ))}
    </AuthFormSkeleton>
  );
}

/** The heading every sign-in page opens with: the icon tile, the title, the line under it. */
export function AuthHeading({ icon, title, children }: { icon: ReactNode; title: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className={cn(whiteStyle.button, "mb-1 flex size-9 items-center justify-center p-0! text-foreground")}>{icon}</div>
      <h1 className="font-heading text-lg font-bold tracking-tight text-balance">{title}</h1>
      <div className="text-xs text-muted-foreground">{children}</div>
    </div>
  );
}

/** "← Back to login", centred under the form, as on every sign-in page. */
export function BackToLogin() {
  return (
    <Link
      href="/login"
      className="mx-auto inline-flex items-center gap-2 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      <ArrowLeft className="size-3" aria-hidden />
      Back to login
    </Link>
  );
}

/** The link's expiry line (linkExpiry.tsx: `h-4`, pulled up 12px), its time grey. */
export function LinkExpirySkeleton() {
  return (
    <p className="-mt-3 flex h-4 items-center justify-center" aria-hidden>
      <Skeleton className="h-2.5 w-40" />
    </p>
  );
}
