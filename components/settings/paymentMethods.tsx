"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowDownLeft, ArrowUpRight, Bitcoin, Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import styles from "./paymentMethods.module.css";

const methods = [
  { id: "paypal", name: "PayPal", type: "Digital wallet", region: "ONLINE", detail: "PayPal email", placeholder: "payments@example.com" },
  { id: "interac", name: "Interac", type: "e-Transfer", region: "CANADA", detail: "Recipient email", placeholder: "payments@example.com" },
  { id: "crypto", name: "Crypto", type: "Cryptocurrency", region: "ON-CHAIN", detail: "Wallet address", placeholder: "Enter your receiving address" },
] as const;
type Method = typeof methods[number];
type Details = { recipient: string; asset: string; network: string };
const emptyDetails: Details = { recipient: "", asset: "", network: "" };
const storageKey = "onebase:payment-methods";
const storageEvent = "onebase:payment-methods-change";

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === storageKey || event.key === null) callback(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(storageEvent, callback);
  return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(storageEvent, callback); };
}

function getSnapshot() {
  try { return localStorage.getItem(storageKey) ?? "{}"; } catch { return "{}"; }
}

function parseDetails(raw: string): Partial<Record<Method["id"], Details>> {
  try {
    const parsed = JSON.parse(raw);
    const result: Partial<Record<Method["id"], Details>> = {};
    for (const { id } of methods) {
      const entry = parsed?.[id];
      if (entry && typeof entry.recipient === "string" && typeof entry.asset === "string" && typeof entry.network === "string") result[id] = entry;
    }
    return result;
  } catch { return {}; }
}

export function PaymentMethods() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "{}");
  const saved = parseDetails(raw);
  const [editing, setEditing] = useState<Method | null>(null);
  const [draft, setDraft] = useState<Details>(emptyDetails);
  const [error, setError] = useState("");

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const details = { recipient: draft.recipient.trim(), asset: draft.asset.trim(), network: draft.network.trim() };
    if (!details.recipient || (editing.id === "crypto" && (!details.asset || !details.network))) {
      setError("Complete all receiving details before saving.");
      return;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify({ ...parseDetails(getSnapshot()), [editing.id]: details }));
      window.dispatchEvent(new Event(storageEvent));
      setEditing(null);
      toast.success(`${editing.name} details saved`);
    } catch { setError("Could not save your details in this browser. Please try again."); }
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Payment methods</h2>
          <p className="mt-1 text-xs text-muted-foreground">Choose how your clients can pay you.</p>
        </div>
        <span className="rounded-full border bg-muted/40 px-2.5 py-1 text-[0.65rem] text-muted-foreground">3 methods</span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {methods.map((method) => {
          const details = saved[method.id];
          const configured = Boolean(details?.recipient);
          return (
            <button key={method.id} type="button" onClick={() => { setEditing(method); setDraft(details ?? emptyDetails); setError(""); }} aria-label={`${configured ? "Edit" : "Configure"} ${method.name}`} className={cn(styles.card, styles[method.id], "group relative flex min-h-48 flex-col justify-between overflow-hidden rounded-2xl p-4 text-left text-neutral-900 outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none")}>
              <div className="relative flex items-start justify-between gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl border border-white/45 bg-white/25 shadow-sm backdrop-blur-md">
                  {method.id === "paypal" ? <span aria-hidden className="size-4 bg-current" style={{ mask: "url(/brands/paypal.svg) center / contain no-repeat", WebkitMask: "url(/brands/paypal.svg) center / contain no-repeat" }} /> : method.id === "interac" ? <ArrowDownLeft className="size-5" aria-hidden /> : <Bitcoin className="size-5" aria-hidden />}
                </span>
                <span className="flex items-center gap-1.5 pt-1 text-[0.55rem] font-semibold tracking-[0.12em]"><span className="size-1 rounded-full bg-current opacity-60" />{method.region}</span>
              </div>
              <div className="relative mt-7 rounded-xl border border-white/30 bg-white/40 p-3 backdrop-blur-md">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold tracking-tight">{method.name}</h3>
                    <p className="mt-0.5 text-[0.65rem] text-neutral-800">{method.type}</p>
                  </div>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/25 transition-colors group-hover:bg-white/60">{configured ? <Pencil className="size-3.5" aria-hidden /> : <ArrowUpRight className="size-4" aria-hidden />}</span>
                </div>
                <div className="mt-3 flex min-w-0 items-center gap-1.5 border-t border-white/40 pt-2 text-[0.6rem] text-neutral-800">
                  {configured ? <Check className="size-3 shrink-0" aria-hidden /> : <span className="size-1.5 shrink-0 rounded-full border border-current opacity-60" />}
                  <span className="truncate">{configured ? details?.recipient : "Add receiving details"}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog.Root open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-background p-5 shadow-xl">
            <Dialog.Title className="pr-8 text-base font-semibold">{editing?.name} details</Dialog.Title>
            <Dialog.Description className="mt-1 text-xs text-muted-foreground">Set the receiving details your clients will use.</Dialog.Description>
            <Dialog.Close render={<Button variant="ghost" size="icon-xs" className="absolute top-4 right-4" aria-label="Close" />}><X className="size-4" /></Dialog.Close>
            <form onSubmit={save} className="mt-5 space-y-4">
              <label className="block space-y-1.5 text-xs font-medium">{editing?.detail}<Input required type={editing?.id === "crypto" ? "text" : "email"} value={draft.recipient} placeholder={editing?.placeholder} onChange={(event) => setDraft({ ...draft, recipient: event.target.value })} /></label>
              {editing?.id === "crypto" ? <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5 text-xs font-medium">Asset<Input required value={draft.asset} placeholder="e.g. USDT" onChange={(event) => setDraft({ ...draft, asset: event.target.value })} /></label>
                <label className="block space-y-1.5 text-xs font-medium">Network<Input required value={draft.network} placeholder="e.g. Ethereum" onChange={(event) => setDraft({ ...draft, network: event.target.value })} /></label>
              </div> : null}
              <p className="text-[0.65rem] text-muted-foreground">Saved in this browser only.</p>
              {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
              <div className="flex justify-end gap-2 pt-1">
                <Dialog.Close render={<Button type="button" variant="outline" size="sm" className={whiteStyle.button} />}>Cancel</Dialog.Close>
                <Button type="submit" size="sm" className={blackStyle.button}>Save details</Button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
