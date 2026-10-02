import type { Metadata } from "next";
import { AuthFooter } from "@/components/auth/authFooter";
import { NewPasswordForm } from "@/components/reset-password/newPasswordForm";
import { ResetPasswordFlow } from "@/components/reset-password/resetPasswordFlow";

export const metadata: Metadata = {
  title: "Reset password | One Base",
};

/**
 * One address, two screens: without a token it asks for the email and sends
 * the link; opened from that link (`?token=…`) it asks for the new password.
 * One address keeps the emailed link short and the flow in one place.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="grid min-h-svh grid-rows-[1fr_auto_1fr] bg-background">
      <main className="row-start-2 flex items-center justify-center px-6 py-16 md:px-10">
        {token ? <NewPasswordForm token={token} /> : <ResetPasswordFlow />}
      </main>
      <div className="row-start-3 self-end">
        <AuthFooter />
      </div>
    </div>
  );
}
