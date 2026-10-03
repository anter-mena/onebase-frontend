import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MailWarning, UserPlus } from "lucide-react";
import { cn } from "cn";

import { AcceptInviteForm } from "@/components/accept-invite/acceptInviteForm";
import { AuthFooter } from "@/components/auth/authFooter";
import { LinkExpiry } from "@/components/auth/linkExpiry";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Join One Base",
};

type InvitationInfo = { email: string; role: "ADMIN" | "COMMERCIAL"; expiresAt?: string };

/**
 * The page the invitation email opens (`/accept-invite?token=…`).
 *
 * <p>Public — the person has no account to sign in with yet; the link's token
 * is what lets them in, once. The token is checked before the form is drawn,
 * so an expired, used or cancelled link says so straight away instead of after
 * someone has typed a password.
 *
 * <p>Same frame as the password pages: icon tile, title, one-line help, form,
 * "Back to login", and how long the link still works.
 */
export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const invitation = token
    ? await apiFetch<InvitationInfo>("/api/invitations/check", { method: "POST", body: JSON.stringify({ token }) })
    : null;

  return (
    // The form area takes the free space and the footer sits under it — a 1fr / auto / 1fr
    // grid made the empty top row as tall as the footer, adding a scrollbar on short windows.
    <div className="flex min-h-svh flex-col bg-background">
      <main className="flex flex-1 items-center justify-center px-6 py-16 md:px-10">
        <div className="mx-auto flex w-full max-w-xs flex-col gap-4">
          {token && invitation?.ok ? (
            <>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className={cn(whiteStyle.button, "mb-1 flex size-9 items-center justify-center p-0! text-foreground")}>
                  <UserPlus className="size-4" aria-hidden />
                </div>
                <h1 className="font-heading text-lg font-bold tracking-tight text-balance">Join One Base</h1>
                <p className="text-xs text-muted-foreground">
                  You were invited as {invitation.data.role === "ADMIN" ? "an Admin" : "a Commercial"} with{" "}
                  <span className="font-medium whitespace-nowrap text-foreground">{invitation.data.email}</span>. Choose your
                  name and a password to finish.
                </p>
              </div>
              <AcceptInviteForm token={token} />
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <div className={cn(whiteStyle.button, "mb-1 flex size-9 items-center justify-center p-0! text-foreground")}>
                <MailWarning className="size-4" aria-hidden />
              </div>
              <h1 className="font-heading text-lg font-bold tracking-tight text-balance">This invitation can&apos;t be used</h1>
              <p role="alert" className="text-xs text-muted-foreground">
                {invitation && !invitation.ok
                  ? invitation.error.message
                  : "The link is incomplete. Open it again from the invitation email."}
              </p>
            </div>
          )}

          <Link href="/login" className="mx-auto inline-flex items-center gap-2 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            <ArrowLeft className="size-3" aria-hidden />
            Back to login
          </Link>
          {invitation?.ok && invitation.data.expiresAt && <LinkExpiry expiresAt={invitation.data.expiresAt} />}
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}
