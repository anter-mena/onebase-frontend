"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm({
  defaultEmail,
  onContinue,
}: {
  defaultEmail: string;
  onContinue: (email: string) => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
        // Preview the confirmation screen without sending an email.
        onContinue(email);
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
        <Button type="submit" className="w-full">Send reset link</Button>
      </FieldGroup>
    </form>
  );
}
