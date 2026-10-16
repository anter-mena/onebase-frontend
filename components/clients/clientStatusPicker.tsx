"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";

import { saveClient } from "@/app/(private)/clients/actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MANUAL_STATUSES, statusFromBackend, statusToBackend, type BackendClientStatus, type ClientDraft } from "@/lib/clients/types";
import type { Client, ClientStatus } from "@/lib/clients/sample";

/** The status dots — the same values the Clients table uses. */
const statusDots: Record<ClientStatus, string> = {
  New: "bg-cyan-500",
  Callback: "bg-amber-500",
  Trial: "bg-blue-500",
  Pending: "bg-orange-500",
  Active: "bg-emerald-500",
  Inactive: "bg-muted-foreground/50",
  Drop: "bg-destructive",
};

const STATUS_ORDER: readonly BackendClientStatus[] = ["NEW", "CALLBACK", "TRIAL", "PENDING", "ACTIVE", "INACTIVE", "DROP"];

/**
 * The client's status, in the page header next to Edit client, and changed in
 * one step: picking a status saves it.
 *
 * <p>Decided 2026-10-15: it used to be a pill in the card's corner, changeable only
 * in edit mode (Edit, pick, Save). The status is what the team changes most.
 *
 * <p>⚠️ Leaving Active asks first: only a new payment makes a client Active again,
 * so a slip on a paying client could not be undone by hand.
 *
 * <p>Off while the card is being edited: Save sends the status too, and would put
 * back the one the draft started with.
 */
export function ClientStatusPicker({
  client,
  saved,
  disabled,
  onError,
}: {
  client: Client;
  /** The client as saved: a status change sends it unchanged, with the new status. */
  saved: ClientDraft;
  disabled: boolean;
  /** Shown in the header, where Edit client shows its own errors. */
  onError: (message: string | null) => void;
}) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const [target, setTarget] = useState<BackendClientStatus | null>(null);
  const [confirming, setConfirming] = useState<BackendClientStatus | null>(null);
  const current = statusToBackend[client.status];
  const shown = saving && target ? statusFromBackend[target] : client.status;

  function apply(status: BackendClientStatus) {
    onError(null);
    setTarget(status);
    startSaving(async () => {
      const result = await saveClient(client.id, { ...saved, status });
      if (!result.ok) {
        onError(result.error);
        setConfirming(null);
        return;
      }
      setConfirming(null);
      router.refresh();
    });
  }

  function choose(status: BackendClientStatus) {
    if (status === current || saving) return;
    if (current === "ACTIVE") setConfirming(status);
    else apply(status);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled || saving}
          aria-label={`Status: ${shown}. Change it`}
          render={
            <Button
              type="button"
              size="sm"
              variant="outline"
              className={cn(whiteStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!", shown === "Drop" && "text-destructive")}
            />
          }
        >
          <span aria-hidden className={cn("size-1.5 rounded-full", statusDots[shown])} />
          {saving ? "Saving…" : shown}
          <ChevronDown className="size-3 text-muted-foreground" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuRadioGroup value={current} onValueChange={(value) => choose(value as BackendClientStatus)}>
            {/* Only Trial, Pending and Drop are chosen by hand; the status the
                client has now stays in the list, marked when One Base sets it. */}
            {STATUS_ORDER.filter((status) => MANUAL_STATUSES.includes(status) || status === current).map((status) => (
              <DropdownMenuRadioItem key={status} value={status} closeOnClick className="text-xs whitespace-nowrap">
                <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", statusDots[statusFromBackend[status]])} />
                {statusFromBackend[status]}
                {MANUAL_STATUSES.includes(status) ? null : <span className="text-muted-foreground">· automatic</span>}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirming !== null} onOpenChange={(open) => { if (!open && !saving) setConfirming(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Change {client.name} to {confirming ? statusFromBackend[confirming] : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They are Active: they have paid. Only a new payment makes a client Active again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm" disabled={saving}>Cancel</AlertDialogCancel>
            {/* ⚠️ Kept open while it runs, so an error has somewhere to show. */}
            <Button
              size="sm"
              disabled={saving}
              onClick={() => confirming && apply(confirming)}
              className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}
            >
              {saving ? "Saving…" : `Change to ${confirming ? statusFromBackend[confirming] : ""}`}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
