"use client";

import Link from "next/link";
import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={(event) => event.preventDefault()}>
      <FieldGroup className="gap-3">
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="m@example.com"
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
        <Button type="submit" className="w-full">Login</Button>
      </FieldGroup>
    </form>
  );
}
