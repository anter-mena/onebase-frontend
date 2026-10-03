"use client";

import { useActionState, useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { acceptInvitation, type AcceptState } from "@/app/(auth)/accept-invite/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CapsLockBadge, useCapsLock } from "@/components/auth/capsLock";
import { PasswordStrengthHint } from "@/components/auth/passwordStrengthHint";

/**
 * The form on the invitation page: the person's name and password.
 *
 * <p>The email is not asked: it is the address the invitation went to (the
 * page names it above), and the account is already made for it. The two passwords are compared on
 * the server as well, in the action — the one place it cannot be skipped.
 */
export function AcceptInviteForm({ token }: { token: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const caps = useCapsLock();
  const confirmCaps = useCapsLock();
  const [password, setPassword] = useState("");
  const [state, formAction, pending] = useActionState<AcceptState, FormData>(acceptInvitation, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      <FieldGroup className="gap-3">
        {/* Two inputs on one row; the action joins them into the one full name the backend stores. */}
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="firstName">First name</FieldLabel>
            <Input id="firstName" name="firstName" autoComplete="given-name" maxLength={60} placeholder="First name" autoFocus required />
          </Field>
          <Field>
            <FieldLabel htmlFor="lastName">Last name</FieldLabel>
            <Input id="lastName" name="lastName" autoComplete="family-name" maxLength={60} placeholder="Last name" required />
          </Field>
        </div>
        {/* -mb-1: the hint under the input belongs to this field, so the next field sits a little closer. */}
        <Field className="-mb-1">
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              {...caps.fieldProps}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Choose a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              maxLength={72}
              className={caps.on ? "pr-24" : "pr-8"}
              required
            />
            <CapsLockBadge on={caps.on} withToggle />
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
          <PasswordStrengthHint password={password} />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <div className="relative">
            <Input
              id="confirmPassword"
              {...confirmCaps.fieldProps}
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat the password"
              minLength={8}
              maxLength={72}
              required
              className={confirmCaps.on ? "pr-20" : undefined}
            />
            <CapsLockBadge on={confirmCaps.on} />
          </div>
        </Field>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating your account…" : "Join One Base"}
        </Button>
        {state.error && <FieldError className="text-center text-xs">{state.error}</FieldError>}
      </FieldGroup>
    </form>
  );
}
