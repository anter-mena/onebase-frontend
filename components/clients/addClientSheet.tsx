"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

import { createClient } from "@/app/(private)/clients/actions";
import { BrandGlyph } from "@/components/clients/brandGlyph";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { NewClient } from "@/lib/clients/types";
import { useLockedTransition } from "@/components/app-shell/actionLock";

export type AddClientBrand = { id: number; name: string; logoUrl: string | null };

const STATUSES: { value: NewClient["status"]; label: string; hint: string }[] = [
  { value: "NEW", label: "New", hint: "Nothing given yet" },
  { value: "TRIAL", label: "Trial", hint: "Given a trial today" },
  { value: "PENDING", label: "Pending", hint: "Will pay, waiting" },
];

const EMPTY: NewClient = { fullName: "", phone: "", email: "", brandId: null, status: "NEW", note: "" };

/**
 * Add client (2026-10-28): the Clients page's button and its sheet — who the
 * client is and how to reach them, never a plan or a payment (those come with
 * the first payment, from the client's page).
 *
 * <p><b>Fails safe.</b> The obvious is checked here before anything is sent (a
 * phone, the one field required); everything else by the backend, which saves nothing
 * when it refuses — a number another client has, deleted ones included; a number
 * without its country code; a brand switched off. Its sentence shows in the sheet,
 * which stays open with what was typed. A double click sends once.
 */
export function AddClientSheet({ brands }: { brands: readonly AddClientBrand[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<NewClient>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useLockedTransition("Adding the client…");
  const set = (patch: Partial<NewClient>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setError(null);
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    // The phone is the one thing required: it is who the client is, and how WhatsApp finds them.
    if (!draft.phone.trim()) return setError("Enter the client's phone number, with the country code.");
    startSaving(async () => {
      const result = await createClient(draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const { id, name } = result.data;
      setOpen(false);
      setDraft(EMPTY);
      router.refresh();
      toast.success(`${name} added`, { action: { label: "Open", onClick: () => router.push(`/clients/${id}`) } });
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        // Closing keeps nothing half-typed for next time — except while it saves.
        if (saving) return;
        setOpen(next);
        if (!next) {
          setDraft(EMPTY);
          setError(null);
        }
      }}
    >
      <SheetTrigger
        render={<Button type="button" size="sm" className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")} />}
      >
        <UserPlus className="size-3" />
        Add client
      </SheetTrigger>

      <SheetContent floating className="gap-0 overflow-hidden p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>Add a client</SheetTitle>
          <SheetDescription className="text-xs">
            Who they are and how to reach them. Their plan starts with their first payment.
          </SheetDescription>
        </SheetHeader>

        <form id="add-client" onSubmit={submit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4" noValidate>
          {/* The phone first: the one field required (2026-10-28). */}
          <Field label="Phone" htmlFor="client-phone" required hint="With the country code, as on WhatsApp.">
            <Input
              id="client-phone"
              type="tel"
              inputMode="tel"
              value={draft.phone}
              onChange={(event) => set({ phone: event.target.value })}
              maxLength={30}
              autoComplete="off"
              autoFocus
              placeholder="+212 6 12 34 56 78"
              className="h-8 text-xs tabular-nums"
            />
          </Field>

          <Field label="Full name" htmlFor="client-name" hint="Optional. Until then they are called by their number.">
            <Input
              id="client-name"
              value={draft.fullName}
              onChange={(event) => set({ fullName: event.target.value })}
              maxLength={120}
              autoComplete="off"
              placeholder="e.g. Sara Amrani"
              className="h-8 text-xs"
            />
          </Field>

          <Field label="Email" htmlFor="client-email" hint="Optional.">
            <Input
              id="client-email"
              type="email"
              value={draft.email}
              onChange={(event) => set({ email: event.target.value })}
              maxLength={255}
              autoComplete="off"
              placeholder="name@example.com"
              className="h-8 text-xs"
            />
          </Field>

          <Field label="Brand" htmlFor="client-brand">
            <Select
              value={draft.brandId === null ? "none" : String(draft.brandId)}
              onValueChange={(value) => set({ brandId: value === "none" || value === null ? null : Number(value) })}
            >
              <SelectTrigger id="client-brand" className="h-8 w-full text-xs">
                <SelectValue>
                  {(value: string | null) => {
                    const brand = brands.find((entry) => String(entry.id) === value);
                    return brand ? (
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        {brand.logoUrl ? <BrandGlyph src={brand.logoUrl} className="size-3" /> : null}
                        <span className="truncate">{brand.name}</span>
                      </span>
                    ) : (
                      "No brand yet"
                    );
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="none" className="text-xs">No brand yet</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={String(brand.id)} className="text-xs">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      {brand.logoUrl ? <BrandGlyph src={brand.logoUrl} className="size-3" /> : null}
                      <span className="truncate">{brand.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium">Status</span>
            {/* The three a person may start them on; the rest follow from trials and payments. */}
            <div role="radiogroup" aria-label="Status" className="grid grid-cols-3 gap-1 rounded-lg border border-border/60 bg-muted p-0.5">
              {STATUSES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={draft.status === option.value}
                  onClick={() => set({ status: option.value })}
                  className={cn(
                    "flex flex-col items-center rounded-md border border-transparent px-2 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
                    draft.status === option.value ? "border-border bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="text-[0.7rem] font-medium">{option.label}</span>
                  <span className="text-[0.6rem] text-muted-foreground">{option.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <Field label="Note" htmlFor="client-note" hint="Optional. Preferences, promises, context for the next call.">
            <Textarea
              id="client-note"
              value={draft.note}
              onChange={(event) => set({ note: event.target.value })}
              maxLength={5000}
              rows={3}
              placeholder="e.g. Prefers calls after 6pm, wants 2 devices"
              className="min-h-20 resize-none text-xs md:text-xs"
            />
          </Field>
        </form>

        <SheetFooter className="mt-0 gap-3 border-t px-5 py-4">
          {error ? (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={saving}
              onClick={() => setOpen(false)}
              className={cn(whiteStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-client"
              size="sm"
              disabled={saving}
              className={cn(blackStyle.button, "px-3! py-0! text-[0.65rem]! font-normal!")}
            >
              {saving ? "Adding…" : "Add client"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  required = false,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-xs font-medium">
        {label}
        {required ? <span className="ml-0.5 text-destructive" aria-hidden>*</span> : null}
      </label>
      {children}
      {hint ? <p className="-mt-1 text-[0.65rem] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
