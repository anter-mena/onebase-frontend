"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { login, type LoginState } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * The sign-in form.
 *
 * <p>Posts to the `login` server action, so it works before any JavaScript has
 * loaded and the token never passes through the browser. The backend's answer
 * shows under the button; the email survives a failed attempt, the password
 * does not.
 *
 * <p>`notice` is a calm line above the form for the two ways people arrive
 * here after something happened: their session ended, or they just set a new
 * password. `next` is where to go afterwards, as `proxy.ts` recorded it.
 */
export function LoginForm({ notice, next }: { notice?: string; next?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction}>
      {next && <input type="hidden" name="next" value={next} />}
      <FieldGroup className="gap-3">
        {notice && !state.error && (
          <p role="status" className="rounded-lg border bg-muted/40 px-3 py-2 text-center text-xs text-muted-foreground">
            {notice}
          </p>
        )}
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="m@example.com"
            defaultValue={state.email}
            key={state.email}
            required
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/reset-password"
              className="ml-auto text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="pr-8"
              required
            />
            <Button
              type="button"
              variant="ghost"
              aria-controls="password"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute inset-y-0 right-0 h-full w-8 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
            >
              {showPassword ? (
                <EyeOffIcon className="size-4" aria-hidden />
              ) : (
                <EyeIcon className="size-4" aria-hidden />
              )}
              <span className="sr-only">
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </Button>
          </div>
        </Field>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Login"}
        </Button>
        {state.error && <FieldError className="text-center text-xs">{state.error}</FieldError>}
      </FieldGroup>
    </form>
  );
}
