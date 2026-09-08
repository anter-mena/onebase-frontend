import type { Metadata } from "next";

import { AuthFooter } from "@/components/auth/authFooter";
import { ResetPasswordFlow } from "@/components/reset-password/resetPasswordFlow";

export const metadata: Metadata = {
  title: "Reset password | One Base",
};

export default function ResetPasswordPage() {
  return (
    <div className="grid min-h-svh grid-rows-[1fr_auto_1fr] bg-background">
      <main className="row-start-2 flex items-center justify-center px-6 py-16 md:px-10">
        <ResetPasswordFlow />
      </main>
      <div className="row-start-3 self-end">
        <AuthFooter />
      </div>
    </div>
  );
}
