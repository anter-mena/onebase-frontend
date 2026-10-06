"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { cn } from "cn";

import { saveClient } from "@/app/(private)/clients/actions";
import { ClientLedger } from "@/components/clients/clientLedger";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import type { ClientCountry } from "@/lib/clients/country";
import type { Client, ClientTransaction } from "@/lib/clients/sample";
import { statusToBackend, type ClientDraft, type PaymentOptions } from "@/lib/clients/types";
import type { TransactionColumnId } from "@/lib/clients/transactionColumns";

/**
 * A client's page, with the left card editable in place.
 *
 * <p>Decided 2026-10-06: there is no Add client. A client is only ever made by
 * their first WhatsApp message; the team completes them here.
 *
 * <p>Decided 2026-10-05: no edit window. "Edit client" opens this page with its
 * left card in edit mode; each line keeps its exact size and place (see
 * `ClientProfile`), and Save sits in the page header, where it is seen whatever
 * the card scrolls to. Save stays off until something changed.
 *
 * <p>The note keeps its own Save: it is written between calls, often while nothing
 * else about the client changes.
 */

function draftOf(client: Client): ClientDraft {
  return {
    fullName: client.fullName ?? "",
    // Grouped for reading, as the card shows it; the backend stores it as +212612345678.
    phone: client.phone,
    email: client.email ?? "",
    brandId: client.brandId ?? null,
    status: statusToBackend[client.status],
  };
}

function sameDraft(a: ClientDraft, b: ClientDraft) {
  return (
    a.fullName.trim() === b.fullName.trim() &&
    a.phone.trim() === b.phone.trim() &&
    a.email.trim() === b.email.trim() &&
    a.brandId === b.brandId &&
    a.status === b.status
  );
}

export function ClientWorkspace({
  client,
  country,
  paymentOptions,
  transactions,
  canDeletePayments,
  startEditing,
  hiddenColumns,
}: {
  client: Client;
  country: ClientCountry | null;
  /** Configuration's plans, perks and brands, for Add payment. */
  paymentOptions: PaymentOptions;
  /** Their payments, newest first. */
  transactions: readonly ClientTransaction[];
  /** Admins: the Delete payment button. */
  canDeletePayments: boolean;
  /** Opened from "Edit client" (?edit=1). */
  startEditing: boolean;
  /** The Transactions table's hidden columns, read from the cookie by the page. */
  hiddenColumns: readonly TransactionColumnId[];
}) {
  const router = useRouter();
  const saved = draftOf(client);
  const [editing, setEditing] = useState(startEditing);
  const [draft, setDraft] = useState<ClientDraft>(saved);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const dirty = !sameDraft(draft, saved);

  // Leaving with unsaved changes asks first, like the Subscriptions grid.
  useEffect(() => {
    if (!editing || !dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [editing, dirty]);

  function edit() {
    setDraft(draftOf(client));
    setError(null);
    setEditing(true);
  }

  function cancel() {
    if (saving) return;
    setDraft(saved);
    setError(null);
    setEditing(false);
    if (startEditing) router.replace(`/clients/${client.id}`, { scroll: false });
  }

  function save() {
    if (!dirty || saving) return;
    setError(null);
    startSaving(async () => {
      const result = await saveClient(client.id, {
        ...draft,
        fullName: draft.fullName.trim(),
        phone: draft.phone.trim(),
        email: draft.email.trim(),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.replace(`/clients/${client.id}`, { scroll: false });
      router.refresh();
    });
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <Link
            href="/clients"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" aria-hidden />
            Clients
          </Link>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">{client.name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Their details, what they have paid, and what it came to.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:ml-auto">
          {error ? (
            <p role="alert" className="max-w-72 text-right text-[0.65rem] text-destructive">
              {error}
            </p>
          ) : null}
          {editing ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={cancel}
                disabled={saving}
                className={cn(whiteStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={save}
                disabled={!dirty || saving}
                className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}
              >
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={edit}
              className={cn(whiteStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}
            >
              <Pencil className="size-3" />
              Edit client
            </Button>
          )}
        </div>
      </header>

      <section
        className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background"
        aria-label="Client details content"
      >
        <div className="h-full overflow-y-auto p-4 [scrollbar-gutter:stable]">
          {/* Side by side, the three cards are exactly the height of the page's
              section: `xl:h-full` fixes the grid to it, and the row is
              `minmax(0,1fr)` — not `1fr`, whose minimum is its content — so the
              page never scrolls and each card scrolls inside itself. Stacked
              below `xl`, where each card is as tall as its content. */}
          <div className="grid min-w-0 items-start gap-4 xl:h-full xl:grid-cols-[20rem_minmax(0,1fr)_23rem] xl:grid-rows-[minmax(0,1fr)] xl:items-stretch">
            <ClientLedger
              client={client}
              country={country}
              transactions={transactions}
              canDeletePayments={canDeletePayments}
              defaultHiddenColumns={hiddenColumns}
              paymentOptions={paymentOptions}
              edit={
                editing
                  ? {
                      draft,
                      onChange: (patch) => setDraft((current) => ({ ...current, ...patch })),
                      disabled: saving,
                    }
                  : null
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}
