import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { InviteUserForm } from "@/components/users/inviteUserForm";

export const metadata: Metadata = {
  title: "Invite users | One Base",
};

export default function InviteUsersPage() {
  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        {/* The way back, the same shape the Edit payment method page uses. */}
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" aria-hidden />
          Users
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Invite users</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Send people an invitation to join this workspace.
        </p>
      </header>

      <section
        className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-xl border bg-background p-4 [scrollbar-gutter:stable] md:p-6"
        aria-label="Invite users form"
      >
        <InviteUserForm />
      </section>
    </div>
  );
}
