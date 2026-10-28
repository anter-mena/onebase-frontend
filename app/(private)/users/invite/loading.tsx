import type { ReactNode } from "react";

import { PageSkeleton } from "@/components/loading/pageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

/** A section of the form: its real heading and description, then its controls under `mt-3`. */
function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * Invite users while it loads — inviteUserForm.tsx at its real sizes: Who (the
 * label, the `h-8` field and its `h-7` Add, "Nobody added yet."), What they can
 * do (the two role cards), Message (the textarea at its `min-h-16`), and the
 * footer. Headings and descriptions are the real words; the controls are grey.
 */
export default function InviteUsersLoading() {
  return (
    <PageSkeleton
      back={{ href: "/users", label: "Users" }}
      title="Invite users"
      description="Send people an invitation to join this workspace."
      scroll
      sectionClassName="p-4 [scrollbar-gutter:stable] md:p-6"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <Section title="Who" description="Add one address at a time. Enter, Tab or a comma commits each one.">
          <div className="flex flex-col gap-2">
            <span className="text-sm leading-snug font-medium">Email addresses</span>
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1 rounded-lg" />
              <Skeleton className="h-7 w-14 shrink-0 self-center" />
            </div>
          </div>
          <p className="mt-3 text-[0.65rem] text-muted-foreground">Nobody added yet.</p>
        </Section>

        <Section
          title="What they can do"
          description="Everyone in this invitation gets the same role. Each role has fixed access, set for the whole workspace."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {["w-20", "w-14"].map((width, index) => (
              <div key={index} className="flex items-start gap-2.5 rounded-lg border p-3">
                <span className="mt-0.5 size-3.5 shrink-0 rounded-full border border-input" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex h-4 items-center">
                    <Skeleton className={`h-3 ${width}`} />
                  </span>
                  <span className="mt-0.5 flex h-[1.1375rem] items-center">
                    <Skeleton className="h-2.5 w-full" />
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Message" description="Added to the invitation email. Optional.">
          <Skeleton className="h-16 w-full rounded-lg" />
        </Section>

        <footer className="flex flex-wrap items-center justify-end gap-3 border-t pt-4">
          <p className="mr-auto text-[0.65rem] text-muted-foreground">Add at least one address.</p>
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-32" />
        </footer>
      </div>
    </PageSkeleton>
  );
}
