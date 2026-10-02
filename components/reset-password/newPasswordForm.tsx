"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, EyeIcon, EyeOffIcon, KeyRound } from "lucide-react";

import { setNewPassword, type NewPasswordState } from "@/app/(auth)/reset-password/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * Step 3 of "forgot password": the page the emailed link opens.
 *
 * <p>Same frame as the request screen — icon tile, title, one-line help, form,
 * "Back to login" — so the two read as one flow. The token rides along in a
 * hidden field; the backend decides whether it is still good (one use, 30
 * minutes) and its answer is shown as is, with the way to ask for a new link.
 *
 * <p>Both fields are checked against each other on the server, not just here:
 * the action is the only place a mismatch could not be skipped.
 */
export function NewPasswordForm({ token }: { token: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState<NewPasswordState, FormData>(setNewPassword, {});

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="mb-1 flex size-9 items-center justify-center rounded-lg border bg-card shadow-sm">
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
          <Field>
            <FieldLabel htmlFor="newPassword">New password</FieldLabel>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                className="pr-8"
                autoFocus
                required
              />
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
            <FieldDescription className="text-xs">At least 8 characters.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
          </Field>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Save new password"}
          </Button>
          {state.error && (
            <FieldError className="text-center text-xs">
              {state.error}{" "}
              <Link href="/reset-password" className="underline underline-offset-4">Request a new link</Link>
            </FieldError>
          )}
        </FieldGroup>
      </form>

      <Link href="/login" className="mx-auto inline-flex items-center gap-2 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        <ArrowLeft className="size-3" aria-hidden />
        Back to login
      </Link>
    </div>
  );
}
