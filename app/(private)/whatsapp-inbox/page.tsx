import type { Metadata } from "next";

import { WhatsAppInboxWorkspace } from "@/components/whatsapp-inbox/whatsappInboxWorkspace";

export const metadata: Metadata = {
  title: "WhatsApp Inbox | One Base",
};

export default function WhatsAppInboxPage() {
  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <p className="text-xs font-medium text-muted-foreground">
          Communication
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          WhatsApp Inbox
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          View and manage your client conversations.
        </p>
      </header>

      <section
        className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background"
        aria-label="WhatsApp Inbox content"
      >
        <WhatsAppInboxWorkspace />
      </section>
    </div>
  );
}
