"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { preload } from "react-dom";
import { Plus } from "lucide-react";
import { cn } from "cn";

import { topUpCredit } from "@/app/(private)/configuration/expenseActions";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import { CoinLoader } from "@/components/settings/coinLoader";
import { hatch } from "@/components/dashboard/hatch";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CreditSummary } from "@/lib/expenses/types";

/**
 * ⚠️ Loaded on demand, and never on the server.
 *
 * <p>`three` and its two React packages come to roughly 150KB over the wire.
 * Imported normally they would land in the Configuration bundle whether or not
 * anybody opens Expenses; behind `next/dynamic` they are a separate chunk
 * fetched when this panel actually renders.
 *
 * <p>`ssr: false` because WebGL does not exist on the server — the canvas has
 * nothing to draw into there, and the drawn coin is the better first paint
 * anyway. It is the `loading` state for the same reason: the reader sees a
 * coin immediately and it is quietly replaced by the mesh.
 */
const Coin3D = dynamic(() => import("@/components/settings/coin3d").then((m) => m.Coin3D), {
  ssr: false,
  loading: () => <CoinLoader className="mx-auto h-[9rem] w-full max-w-[11rem]" />,
});

/**
 * What is left of the panel credit.
 *
 * <p>Credit is what lines are created against upstream: a top-up buys a
 * balance, and every subscription sold spends some of it. It belongs on
 * Expenses because it is the one cost paid before any client pays anything.
 *
 * <p>⚠️ <b>The coin is drawn, not imported.</b> A real 3D mesh would mean
 * `three.js` and `react-three-fiber` — about 150KB over the wire, no server
 * render and a WebGL fallback to write — for an ornament that never moves.
 * Stacked ellipses with gradients give the same read for nothing, render on
 * the server like the rest of the page, and cannot fail to load. The same call
 * the credit-card artwork makes.
 *
 * <p>⚠️ Fixed golds rather than theme tokens. This is an object, not a
 * surface: a coin that turns grey under the Mono palette stops being a coin.
 * The card it sits on follows the theme, as everything else does.
 */

const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const perCreditFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4 });
// "4 Oct 2026", in UTC and a fixed locale, so the server and the browser agree.
const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const numberFormatter = new Intl.NumberFormat("en-GB");

/**
 * The panel credit card on the Expenses tab: credit left, and Top up.
 *
 * <p>Credit left = all top-ups − credits used (0 until Payments exists). A
 * top-up records the credits and what they cost; it is never edited or deleted.
 * `monthLineCredits` is the credit of 1 device · 1 month, from the cost grid,
 * so "lines left" follows the real rate.
 */
export function PanelCredit({ credit, monthLineCredits }: { credit: CreditSummary; monthLineCredits: number }) {
  const [toppingUp, setToppingUp] = useState(false);
  const used = credit.usedCredits;
  const linesLeft = monthLineCredits > 0 ? Math.floor(credit.remainingCredits / monthLineCredits) : null;

  /**
   * ⚠️ Starts the model downloading now, not after the 3D chunk lands.
   *
   * <p>`useGLTF.preload` lives at `coin3d`'s module scope, so it cannot run
   * until that ~150KB chunk has itself arrived — the two downloads were
   * happening one after the other and the spinner was showing for both. This
   * component is in the main bundle, so asking for the file here overlaps them.
   *
   * <p>Called during render, which is where React expects it: it is a hint to
   * the browser, not an effect.
   *
   * <p>⚠️ <b>`crossOrigin` is what makes the hint count.</b> three's loader
   * fetches in CORS mode, and the browser only hands a preloaded response to a
   * request made with the same mode and credentials. Without it the tag went
   * out as a plain no-CORS preload, did not match, and was thrown away — so
   * the 133KB model downloaded twice on every visit to this tab, and Chrome
   * logged "preloaded but not used". "anonymous" is the pair to the loader's
   * default `same-origin` credentials.
   */
  preload("/models/pirate-coin.glb", { as: "fetch", crossOrigin: "anonymous" });

  return (
    // `h-full`, so the column fills the row beside the grid rather than
    // stopping wherever its own content happens to end.
    <div className="flex h-full min-w-0 flex-col rounded-lg border p-4">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold">Panel credit</h3>
          <p className="mt-0.5 text-[0.7rem] leading-relaxed text-muted-foreground">
            The credit your panel spends to create lines.
          </p>
        </div>

        {/* Here rather than at the foot of the card, and only here: topping up is
            the one action this panel offers, so it sits beside what it changes. */}
        <Button
          type="button"
          size="sm"
          onClick={() => setToppingUp(true)}
          aria-label="Top up credit"
          title="Top up credit"
          className={cn(blackStyle.button, "size-7 shrink-0 justify-center px-0! py-0!")}
        >
          <Plus className="size-3.5" aria-hidden />
        </Button>
      </div>

      {/* Takes the slack the full height creates, so the coin and the figure
          sit in the middle of the card rather than bunched under the heading. */}
      <div className="flex min-h-0 flex-1 flex-col justify-center py-5">
        <Coin3D className="mx-auto h-[9rem] w-full max-w-[11rem]" />

        <div className="mt-5 text-center">
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            {numberFormatter.format(credit.remainingCredits)}
          </p>
          <p className="mt-0.5 text-[0.7rem] text-muted-foreground">credits remaining</p>
        </div>

        {/* What the number buys, in the unit the business sells: one-month lines at the grid's own rate. */}
        {linesLeft !== null ? (
          <p className="mt-3 text-center text-[0.7rem] leading-relaxed text-muted-foreground">
            About <span className="font-medium text-foreground">{numberFormatter.format(linesLeft)} one-month lines</span> left,
            at {monthLineCredits} {monthLineCredits === 1 ? "credit" : "credits"} each.
          </p>
        ) : null}
      </div>

      <div className="mt-4 shrink-0">
        {/* Remaining, not used — the filled part is what you still have. */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[0.65rem] text-muted-foreground">Remaining</span>
          <span className="text-[0.65rem] font-medium tabular-nums">
            {numberFormatter.format(credit.remainingCredits)} of {numberFormatter.format(credit.totalCredits)}
          </span>
        </div>

        <div className="mt-1.5 flex h-7 w-full gap-1">
          {credit.totalCredits === 0 ? (
            // Nothing bought yet: an empty track, not a full bar of nothing.
            <span className="h-full flex-1 rounded-[6px]" style={{ background: "var(--viz-ramp-rest)" }} />
          ) : (
            <>
              {credit.remainingCredits > 0 ? (
                <span
                  className="h-full min-w-1.5 rounded-[6px]"
                  style={{ flex: "1 1 0", flexGrow: credit.remainingCredits, backgroundImage: hatch("var(--viz-ramp-2)", { line: 2.5, pitch: 9 }) }}
                />
              ) : null}
              {used > 0 ? (
                // Flat, not hatched: the texture marks what is there, and this is what has been spent.
                <span className="h-full min-w-1.5 rounded-[6px]" style={{ flex: "1 1 0", flexGrow: used, background: "var(--viz-ramp-rest)" }} />
              ) : null}
            </>
          )}
        </div>

        <p className="mt-2 text-[0.65rem] text-muted-foreground">
          {credit.lastTopup
            ? `Last top-up ${dateFormatter.format(new Date(credit.lastTopup.at))} · ${numberFormatter.format(credit.lastTopup.credits)} credits for ${moneyFormatter.format(credit.lastTopup.amount)}`
            : "No credit bought yet."}
        </p>
        {credit.averageCostPerCredit !== null ? (
          <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
            On average {perCreditFormatter.format(credit.averageCostPerCredit)} per credit · {moneyFormatter.format(credit.totalPaid)} paid in total
          </p>
        ) : null}
      </div>

      <p className="mt-3 text-[0.65rem] leading-relaxed text-muted-foreground">
        Top-ups are recorded here with what they cost. Credits used by payments will be taken off once Payments is connected.
      </p>

      {toppingUp ? <TopUpDialog onClose={() => setToppingUp(false)} /> : null}
    </div>
  );
}

/** Credits are whole units; the amount is USD with up to two decimals. */
const isValidCredits = (value: string) => /^\d+$/.test(value.trim()) && Number(value) > 0 && Number(value) <= 1_000_000;
const isValidAmount = (value: string) => /^\d+(\.\d{1,2})?$/.test(value.trim()) && Number(value) <= 999_999.99;

/** Top up: how many credits, what they cost, an optional note. Save stays grey until both numbers are valid. */
function TopUpDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [credits, setCredits] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const valid = isValidCredits(credits) && isValidAmount(amount);

  function save() {
    if (!valid) return;
    setError(null);
    startSaving(async () => {
      const result = await topUpCredit(Number(credits), Number(amount), note);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Top up panel credit</DialogTitle>
          <DialogDescription>Record the credits you bought and what they cost. A top-up can&apos;t be edited or deleted later.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={(event) => { event.preventDefault(); save(); }}>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="topup-credits">Credits</FieldLabel>
              <Input
                id="topup-credits"
                inputMode="numeric"
                value={credits}
                onChange={(event) => setCredits(event.target.value)}
                placeholder="120"
                aria-invalid={(credits !== "" && !isValidCredits(credits)) || undefined}
                className="h-8 text-xs tabular-nums"
                autoFocus
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="topup-amount">Paid (USD)</FieldLabel>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-muted-foreground" aria-hidden>$</span>
                <Input
                  id="topup-amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="100.00"
                  aria-invalid={(amount !== "" && !isValidAmount(amount)) || undefined}
                  className="h-8 pl-6 text-xs tabular-nums"
                  required
                />
              </div>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="topup-note">Note (optional)</FieldLabel>
            <Input id="topup-note" value={note} maxLength={255} onChange={(event) => setNote(event.target.value)} placeholder="e.g. Bought from the reseller" className="h-8 text-xs" />
          </Field>
          {valid && Number(amount) > 0 ? (
            <p className="text-[0.65rem] text-muted-foreground">{perCreditFormatter.format(Number(amount) / Number(credits))} per credit.</p>
          ) : null}
          {error ? <p role="alert" className="text-[0.65rem] text-destructive">{error}</p> : null}
          <DialogFooter>
            <DialogClose render={<Button size="sm" variant="outline" className="h-7 px-3 text-[0.65rem] font-normal" />}>Cancel</DialogClose>
            <Button type="submit" size="sm" disabled={!valid || saving} className={cn(blackStyle.button, "h-7 px-3! py-0! text-[0.65rem]! font-normal! disabled:opacity-50")}>
              {saving ? "Saving…" : "Top up"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
