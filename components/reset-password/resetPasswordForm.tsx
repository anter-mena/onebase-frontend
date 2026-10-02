"use client";

import { useState, useTransition } from "react";

import { requestResetLink } from "@/app/(auth)/reset-password/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * Step 1 of "forgot password": ask for the email, then request the link.
 *
 * <p>Moves on to "Check your email" as soon as the backend has the request —
 * which it answers the same way whether or not the account exists. Only a
 * request that never got through (bad email format, backend unreachable)
 * stays here with a message.
 */
export function ResetPasswordForm({
  defaultEmail,
  onContinue,
}: {
  defaultEmail: string;
  onContinue: (email: string) => void;
}) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
        setError(undefined);
        startTransition(async () => {
          const result = await requestResetLink(email);
          if (result.ok) onContinue(email);
          else setError(result.error);
        });
      }}
    >
      <FieldGroup className="gap-3">
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="m@example.com"
            defaultValue={defaultEmail}
            autoFocus
            required
          />
        </Field>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </Button>
        {error && <FieldError className="text-center text-xs">{error}</FieldError>}
      </FieldGroup>
    </form>
  );
}
