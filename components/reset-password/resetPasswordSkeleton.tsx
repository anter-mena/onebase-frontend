"use client";

import { useSearchParams } from "next/navigation";
import { Fingerprint, KeyRound } from "lucide-react";

import {
  AuthFieldSkeleton,
  AuthFormSkeleton,
  AuthHeading,
  BackToLogin,
  LinkExpirySkeleton,
} from "@/components/auth/authFormSkeleton";

/**
 * Reset password while it loads — the page has two faces, and a server loading
 * screen cannot read the address to know which, so this part does, in the browser:
 *
 * <ul>
 *   <li>no `?token=` — "Forgot password?" (resetPasswordFlow.tsx): the email field,
 *       the button, "Back to login";</li>
 *   <li>with one — "Choose a new password" (newPasswordForm.tsx): the new password
 *       with its strength line, the confirmation, the button, "Back to login", and
 *       the link's expiry under it.</li>
 * </ul>
 *
 * <p>Icons, titles and descriptions are the real ones; the fields are grey.
 */
export function ResetPasswordSkeleton() {
  const hasToken = Boolean(useSearchParams().get("token"));

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-4">
      {hasToken ? (
        <>
          <AuthHeading icon={<KeyRound className="size-4" aria-hidden />} title="Choose a new password">
            Pick something you have not used here before. You will be signed out on every device.
          </AuthHeading>
          <AuthFormSkeleton>
            <AuthFieldSkeleton strength labelWidth="w-24" />
            <AuthFieldSkeleton labelWidth="w-36" />
          </AuthFormSkeleton>
          <BackToLogin />
          <LinkExpirySkeleton />
        </>
      ) : (
        <>
          <AuthHeading icon={<Fingerprint className="size-4" aria-hidden />} title="Forgot password?">
            Enter the email associated with your One Base account to request a password reset link.
          </AuthHeading>
          <AuthFormSkeleton>
            <AuthFieldSkeleton labelWidth="w-10" />
          </AuthFormSkeleton>
          <BackToLogin />
        </>
      )}
    </div>
  );
}
