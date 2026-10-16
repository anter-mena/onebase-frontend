import type { Metadata } from "next";

import { LoadError } from "@/components/errors/loadError";
import { TemplatesTable } from "@/components/templates/templatesTable";
import { getTemplates } from "@/lib/templates/templates";

export const metadata: Metadata = {
  title: "Templates | One Base",
};

/**
 * The saved WhatsApp messages, Admins only (lib/access). Every Admin and
 * Commercial can send the active ones from the WhatsApp Inbox.
 */
export default async function TemplatesPage() {
  const templates = await getTemplates();

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <p className="text-xs font-medium text-muted-foreground">Communication</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Templates</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Ready-made WhatsApp messages the team sends from the inbox, within 24 hours of the client&apos;s last message.
        </p>
      </header>

      <section
        className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background"
        aria-label="Templates content"
      >
        {templates.ok ? (
          <TemplatesTable templates={templates.data} />
        ) : (
          // Not an empty table: "no templates" would be a lie when the list simply did not load.
          <LoadError title="The templates could not be loaded." reason={templates.error.message} />
        )}
      </section>
    </div>
  );
}
