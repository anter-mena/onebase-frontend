import type { Metadata } from "next";
import Link from "next/link";
import { Command, GalleryVerticalEnd } from "lucide-react";

import { LoginForm } from "@/components/login/loginForm";
import { AuthFooter } from "@/components/auth/authFooter";
import { RotatingTips } from "@/components/login/rotatingTips";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[64.5fr_35.5fr]">
      <div className="flex min-h-svh flex-col">
        <main className="flex flex-1 items-center justify-center px-6 py-16 md:px-10 lg:pt-32">
          <div className="mx-auto flex w-full max-w-xs flex-col gap-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="mb-1 flex size-9 items-center justify-center rounded-lg border bg-card shadow-sm">
                <GalleryVerticalEnd className="size-4" aria-hidden />
              </div>
              <h1 className="font-heading text-lg font-bold tracking-tight text-balance">
                Welcome to One Base
              </h1>
              <p className="text-xs text-muted-foreground">
                Can&apos;t access your account?
                <br />
                <Link href="#" className="underline underline-offset-4 hover:text-foreground">
                  Contact IT support
                </Link>
              </p>
            </div>
            <LoginForm />
          </div>
        </main>
        <AuthFooter />
      </div>
      <aside
        className="hidden flex-col justify-between bg-muted bg-cover bg-center pb-2 text-white lg:flex"
        style={{ backgroundImage: "url('/glass-preview.jpg')" }}
        aria-label="One Base"
      >
        <div className="flex items-center justify-end gap-2 p-10 text-lg font-semibold">
          <Command className="size-5" aria-hidden />
          <span>One Base</span>
        </div>
        <RotatingTips />
      </aside>
    </div>
  );
}
