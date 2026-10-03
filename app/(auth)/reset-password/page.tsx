import type { Metadata } from "next";
import { AuthFooter } from "@/components/auth/authFooter";
import { NewPasswordForm } from "@/components/reset-password/newPasswordForm";
import { ResetPasswordFlow } from "@/components/reset-password/resetPasswordFlow";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Reset password | One Base",
};

/**
 * One address, two screens: without a token it asks for the email and sends
 * the link; opened from that link (`?token=…`) it asks for the new password.
 * One address keeps the emailed link short and the flow in one place.
 *
 * <p>With a token, the link is checked first: a dead one (400) says so at once,
 * a good one brings its expiry for the countdown. Any other answer (backend
 * down, an older backend without the check) just draws the form — saving
 * checks the link again anyway.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const link = token
    ? await apiFetch<{ expiresAt: string }>("/api/auth/password/reset/check", {
        method: "POST",
        body: JSON.stringify({ token }),
      })
    : null;

  return (
    // The form area takes the free space and the footer sits under it — a 1fr / auto / 1fr
    // grid made the empty top row as tall as the footer, adding a scrollbar on short windows.
    <div className="flex min-h-svh flex-col bg-background">
      <main className="flex flex-1 items-center justify-center px-6 py-16 md:px-10">
        {token ? (
          <NewPasswordForm
            token={token}
            expiresAt={link?.ok ? link.data.expiresAt : undefined}
            linkError={link && !link.ok && link.error.status === 400 ? link.error.message : undefined}
          />
        ) : (
          <ResetPasswordFlow />
        )}
      </main>
      <AuthFooter />
    </div>
  );
}
