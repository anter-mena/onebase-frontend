import type { Metadata } from "next";
import Link from "next/link";
import { Command, GalleryVerticalEnd, LifeBuoy } from "lucide-react";

import { LoginForm } from "@/components/login/loginForm";
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
        <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-6 py-8 text-xs text-muted-foreground md:px-10 lg:py-10">
          <div className="flex flex-wrap items-center gap-4">
            <p>© 2026 One Base</p>
            <Link href="#" className="inline-flex items-center gap-1 hover:text-foreground">
              <LifeBuoy className="size-3" aria-hidden />
              Help Center
            </Link>
          </div>
          <nav aria-label="Legal" className="flex items-center gap-4">
            <Link href="#" className="underline-offset-4 hover:text-foreground hover:underline">Privacy Policy</Link>
            <Link href="#" className="underline-offset-4 hover:text-foreground hover:underline">Terms of Use</Link>
          </nav>
        </footer>
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
