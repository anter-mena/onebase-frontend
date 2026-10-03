"use client";

import { useActionState, useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { acceptInvitation, type AcceptState } from "@/app/(auth)/accept-invite/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * The form on the invitation page: the person's name and password.
 *
 * <p>The email is shown, not asked: it is the address the invitation went to,
 * and the account is already made for it. The two passwords are compared on
 * the server as well, in the action — the one place it cannot be skipped.
 */
export function AcceptInviteForm({ token, email }: { token: string; email: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState<AcceptState, FormData>(acceptInvitation, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      <FieldGroup className="gap-3">
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" value={email} readOnly disabled />
        </Field>
        <Field>
          <FieldLabel htmlFor="fullName">Your name</FieldLabel>
          <Input id="fullName" name="fullName" autoComplete="name" maxLength={120} placeholder="First and last name" autoFocus required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              className="pr-8"
              required
            />
            <Button
              type="button"
              variant="ghost"
              aria-controls="password confirmPassword"
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
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
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
          {pending ? "Creating your account…" : "Join One Base"}
        </Button>
        {state.error && <FieldError className="text-center text-xs">{state.error}</FieldError>}
      </FieldGroup>
    </form>
  );
}
