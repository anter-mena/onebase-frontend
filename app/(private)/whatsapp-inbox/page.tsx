import type { Metadata } from "next";

import { AutoRefresh } from "@/components/app-shell/autoRefresh";
import { LoadError } from "@/components/errors/loadError";
import { WhatsAppInboxWorkspace } from "@/components/whatsapp-inbox/whatsappInboxWorkspace";
import { getConversations, getMessages, getWhatsAppStatus } from "@/lib/whatsapp/whatsapp";
import type { WaMessage } from "@/lib/whatsapp/types";

export const metadata: Metadata = {
  title: "WhatsApp Inbox | One Base",
};

/**
 * The conversations One Base saved from the WhatsApp number, and the open one
 * (?c=… in the address bar). Asked again every 5 seconds, so new messages and the
 * ticks appear without reloading.
 */
export default async function WhatsAppInboxPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const query = await searchParams;
  const [status, conversations] = await Promise.all([getWhatsAppStatus(), getConversations()]);

  let body: React.ReactNode;
  if (!conversations.ok) {
    body = (
      <div className="flex h-full items-center justify-center p-4">
        <LoadError title="The WhatsApp inbox could not be loaded." reason={conversations.error.message} />
      </div>
    );
  } else {
    // The open conversation: the one in the address bar, otherwise the newest.
    const chosen = conversations.data.find((conversation) => String(conversation.id) === query.c);
    const active = chosen ?? conversations.data[0] ?? null;
    let messages: WaMessage[] = [];
    if (active) {
      const result = await getMessages(active.id);
      if (result.ok) messages = result.data;
      // It was just marked read: show the list as it now is.
      active.unread = 0;
    }
    body = (
      <>
        <AutoRefresh everyMs={5_000} />
        <WhatsAppInboxWorkspace
          conversations={conversations.data}
          activeId={active?.id ?? null}
          messages={messages}
          connected={status.ok && status.data.connected}
          now={new Date().toISOString()}
        />
      </>
    );
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <p className="text-xs font-medium text-muted-foreground">Communication</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">WhatsApp Inbox</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {status.ok && !status.data.connected
            ? "WhatsApp is not connected yet: the number and its key are set on the server."
            : "View and answer your client conversations."}
        </p>
      </header>

      <section className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background" aria-label="WhatsApp Inbox content">
        {body}
      </section>
    </div>
  );
}
