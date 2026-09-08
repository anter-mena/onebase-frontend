"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Fingerprint } from "lucide-react";

import { CheckEmail } from "@/components/reset-password/checkEmail";
import { ResetPasswordForm } from "@/components/reset-password/resetPasswordForm";

export function ResetPasswordFlow() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");

  if (step === 2) {
    return <CheckEmail email={email} onChangeEmail={() => setStep(1)} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="mb-1 flex size-9 items-center justify-center rounded-lg border bg-card shadow-sm">
          <Fingerprint className="size-4" aria-hidden />
        </div>
        <h1 className="font-heading text-lg font-bold tracking-tight text-balance">Forgot password?</h1>
        <p className="text-xs text-muted-foreground">
          Enter the email associated with your One Base account to request a password reset link.
        </p>
      </div>
      <ResetPasswordForm
        defaultEmail={email}
        onContinue={(value) => {
          setEmail(value);
          setStep(2);
        }}
      />
      <Link href="/login" className="mx-auto inline-flex items-center gap-2 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        <ArrowLeft className="size-3" aria-hidden />
        Back to login
      </Link>
    </div>
  );
}
