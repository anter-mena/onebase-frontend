"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";

import { requestResetLink } from "@/app/(auth)/reset-password/actions";
import { showTopBanner } from "@/components/ui/topBanner";
import { cn } from "cn";
import whiteStyle from "@/components/ui/button-styles/white.module.css";

/**
 * Matches the backend: a second request within 60 s sends nothing, so the
 * button must not come back sooner or it would look like it worked and did not.
 */
const RESEND_AFTER_SECONDS = 60;

function formatCountdown(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function CheckEmail({ email, onChangeEmail }: { email: string; onChangeEmail: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(RESEND_AFTER_SECONDS);
  const [sending, startSending] = useTransition();

  useEffect(() => {
    if (secondsLeft === 0) return;

    const timeout = window.setTimeout(() => {
      setSecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [secondsLeft]);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <div className={cn(whiteStyle.button, "mb-1 flex size-9 items-center justify-center p-0! text-foreground")}>
          <MailCheck className="size-4" aria-hidden />
        </div>
        <h1 className="font-heading text-lg font-bold tracking-tight">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          If an account exists for <span className="break-all font-medium text-foreground">{email}</span>,
          a reset link is on its way. It expires in 30 minutes.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-1 text-sm text-muted-foreground">
        <span>Didn&apos;t get the email?</span>
        {secondsLeft > 0 ? (
          <span>
            Resend in <span className="tabular-nums text-foreground">{formatCountdown(secondsLeft)}</span>
          </span>
        ) : (
          <button
            type="button"
            className="text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            disabled={sending}
            onClick={() => {
              startSending(async () => {
                const result = await requestResetLink(email);
                if (result.ok) {
                  setSecondsLeft(RESEND_AFTER_SECONDS);
                  showTopBanner("If an account exists for this email, another reset link is on its way.");
                } else {
                  showTopBanner(result.error);
                }
              });
            }}
          >
            Resend email
          </button>
        )}
      </div>
      <button type="button" onClick={onChangeEmail} className="text-sm underline underline-offset-4 hover:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        Use a different email
      </button>
      <Link href="/login" className="inline-flex items-center gap-2 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        <ArrowLeft className="size-3" aria-hidden />
        Back to sign in
      </Link>
    </div>
  );
}
