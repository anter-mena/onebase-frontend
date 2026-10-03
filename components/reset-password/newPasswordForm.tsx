"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, EyeIcon, EyeOffIcon, KeyRound } from "lucide-react";
import { cn } from "cn";

import { setNewPassword, type NewPasswordState } from "@/app/(auth)/reset-password/actions";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CapsLockBadge, useCapsLock } from "@/components/auth/capsLock";
import { LinkExpiry } from "@/components/auth/linkExpiry";
import { PasswordStrengthHint } from "@/components/auth/passwordStrengthHint";

/**
 * Step 3 of "forgot password": the page the emailed link opens.
 *
 * <p>Same frame as the request screen — icon tile, title, one-line help, form,
 * "Back to login" — so the two read as one flow. The page checks the link
 * before drawing this: a dead link arrives as `linkError` and shows at once;
 * a good one brings `expiresAt` for the countdown. The backend still decides
 * again on save (one use, 30 minutes) and its answer is shown as is, with the
 * way to ask for a new link.
 *
 * <p>Both fields are checked against each other on the server, not just here:
 * the action is the only place a mismatch could not be skipped.
 */
export function NewPasswordForm({
  token,
  expiresAt,
  linkError,
}: {
  token: string;
  expiresAt?: string;
  linkError?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const caps = useCapsLock();
  const confirmCaps = useCapsLock();
  const [password, setPassword] = useState("");
  const [state, formAction, pending] = useActionState<NewPasswordState, FormData>(setNewPassword, {});
  const error = state.error ?? linkError;

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className={cn(whiteStyle.button, "mb-1 flex size-9 items-center justify-center p-0! text-foreground")}>
          <KeyRound className="size-4" aria-hidden />
        </div>
        <h1 className="font-heading text-lg font-bold tracking-tight text-balance">Choose a new password</h1>
        <p className="text-xs text-muted-foreground">
          Pick something you have not used here before. You will be signed out on every device.
        </p>
      </div>

      <form action={formAction}>
        <input type="hidden" name="token" value={token} />
        <FieldGroup className="gap-3">
          {/* -mb-1: the hint under the input belongs to this field, so the next field sits a little closer. */}
          <Field className="-mb-1">
            <FieldLabel htmlFor="newPassword">New password</FieldLabel>
            <div className="relative">
              <Input
                id="newPassword"
                {...caps.fieldProps}
                name="newPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Enter a new password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                maxLength={72}
                className={caps.on ? "pr-24" : "pr-8"}
                autoFocus
                required
              />
              <CapsLockBadge on={caps.on} withToggle />
              <Button
                type="button"
                variant="ghost"
                aria-controls="newPassword confirmPassword"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-0 h-full w-8 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
              >
                {showPassword ? <EyeOffIcon className="size-4" aria-hidden /> : <EyeIcon className="size-4" aria-hidden />}
                <span className="sr-only">{showPassword ? "Hide passwords" : "Show passwords"}</span>
              </Button>
            </div>
            <PasswordStrengthHint password={password} />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
            <div className="relative">
              <Input
                id="confirmPassword"
                {...confirmCaps.fieldProps}
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat the new password"
                minLength={8}
                maxLength={72}
                required
                className={confirmCaps.on ? "pr-20" : undefined}
              />
              <CapsLockBadge on={confirmCaps.on} />
            </div>
          </Field>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Save new password"}
          </Button>
        </FieldGroup>
      </form>

      <Link href="/login" className="mx-auto inline-flex items-center gap-2 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        <ArrowLeft className="size-3" aria-hidden />
        Back to login
      </Link>

      {/* How long the link still works — hidden once there is an error to read instead. */}
      {!error && expiresAt && <LinkExpiry expiresAt={expiresAt} />}

      {/* Under "Back to login": the form stays as it was, and the problem reads last. */}
      {error && (
        <FieldError className="text-center text-xs">
          {error}{" "}
          <Link href="/reset-password" className="underline underline-offset-4">Request a new link</Link>
        </FieldError>
      )}
    </div>
  );
}
