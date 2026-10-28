"use client";

import { Paperclip } from "lucide-react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ClientTransaction } from "@/lib/clients/sample";
import { fileSize } from "@/lib/clients/proofUpload";

const ICON_BUTTON =
  "inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

/**
 * "See proof" on a payment's row (2026-10-28). One file opens in a new tab (a
 * picture or a PDF is shown, anything else downloads); several open a short list
 * to pick from. A payment from before proofs keeps the place, greyed, so the row's
 * icons stay lined up.
 */
export function ProofAction({ clientId, payment, dateLabel }: { clientId: number; payment: ClientTransaction; dateLabel: string }) {
  const proofs = payment.proofs ?? [];
  const href = (proofId: number) => `/clients/${clientId}/payments/${payment.id}/proofs/${proofId}`;

  if (proofs.length === 0) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={<span role="img" aria-label={`No proof for the payment of ${dateLabel}`} className="inline-flex size-6 items-center justify-center text-muted-foreground/35" />}
        >
          <Paperclip className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>No proof on file</TooltipContent>
      </Tooltip>
    );
  }

  if (proofs.length === 1) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <a href={href(proofs[0].id)} target="_blank" rel="noreferrer" aria-label={`See the proof of ${dateLabel}: ${proofs[0].name}`} className={ICON_BUTTON} />
          }
        >
          <Paperclip className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>See proof</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={<DropdownMenuTrigger render={<button type="button" aria-label={`See the ${proofs.length} proofs of ${dateLabel}`} className={ICON_BUTTON} />} />}
        >
          <Paperclip className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>See proof ({proofs.length})</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-60">
        {/* The label sits inside a Group: Base UI's Menu.GroupLabel throws without one. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[0.65rem]">Proof of payment</DropdownMenuLabel>
          {proofs.map((proof) => (
            <DropdownMenuItem key={proof.id} render={<a href={href(proof.id)} target="_blank" rel="noreferrer" />} className="text-xs">
              <span className="min-w-0 flex-1 truncate">{proof.name}</span>
              <span className="shrink-0 text-[0.65rem] text-muted-foreground tabular-nums">{fileSize(proof.size)}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
