"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useState, useTransition, type FormEvent } from "react";
import { PaymentIcon } from "react-svg-credit-card-payment-icons";
import { cn } from "cn";

import { savePaymentMethod } from "@/app/(private)/configuration/paymentMethodActions";
import { PaymentMethodCard } from "@/components/settings/paymentMethodCard";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  amountFormatter,
  networkLogos,
  providerToCard,
  type BackendCardNetwork,
  type BackendProvider,
} from "@/lib/paymentMethods/types";

// The only supported types. Each one decides how its card looks in the preview.
const methodTypes: readonly { value: BackendProvider; label: string }[] = [
  { value: "PAYPAL", label: "PayPal" },
  { value: "BINANCE", label: "Binance" },
  { value: "INTERAC", label: "Interac" },
  { value: "OTHER", label: "Other" },
];

// Which card logos are drawn on the card — decoration only. Both by default.
const networkOptions: readonly { value: BackendCardNetwork; label: string }[] = [
  { value: "BOTH", label: "Both" },
  { value: "VISA", label: "Visa" },
  { value: "MASTERCARD", label: "Mastercard" },
];

// Active by default. Active cards show the green contactless animation in the preview.
const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export type PaymentMethodFormValues = {
  provider: BackendProvider;
  name: string;
  holder: string;
  cardNetwork: BackendCardNetwork;
  active: boolean;
  instructions: string;
};

// What a new method starts with. No balance and no currency (decided 2026-10-04):
// a method starts at $0, its total comes from the payments recorded on it, and everything is USD.
const emptyValues: PaymentMethodFormValues = {
  provider: "PAYPAL",
  name: "",
  holder: "",
  cardNetwork: "BOTH",
  active: true,
  instructions: "",
};

// One form for both pages: "create" starts empty, "edit" starts from the method's saved values.
export function PaymentMethodForm({
  mode,
  methodId = null,
  balance = 0,
  initialValues = emptyValues,
}: {
  mode: "create" | "edit";
  /** The method being edited; null when adding. */
  methodId?: number | null;
  /** Total received on it, in USD (shown on the card preview). */
  balance?: number;
  initialValues?: PaymentMethodFormValues;
}) {
  const router = useRouter();
  const [provider, setProvider] = useState<BackendProvider>(initialValues.provider);
  const [name, setName] = useState(initialValues.name);
  const [holder, setHolder] = useState(initialValues.holder);
  const [cardNetwork, setCardNetwork] = useState<BackendCardNetwork>(initialValues.cardNetwork);
  const [active, setActive] = useState(initialValues.active);
  const [instructions, setInstructions] = useState(initialValues.instructions);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startSaving(async () => {
      const result = await savePaymentMethod(methodId, { provider, name, holder, cardNetwork, instructions, active });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/configuration?tab=payment-methods");
      // The list was kept by the browser from before: ask the server for it again, so the change shows at once.
      router.refresh();
    });
  }

  return (
    // Two equal halves once the section is wide enough (64rem): the form centered in the left half,
    // the preview centered in the right half, both vertically centered. On narrow screens the preview comes first.
    <>
    {/* Same heading style as the payment methods list. */}
    <div className="shrink-0">
      <h2 className="text-sm font-medium">Method details</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {mode === "edit" ? "Change the details. The card preview updates as you go." : "Fill in the details. The card preview updates as you go."}
      </p>
    </div>

    <div className="@container mt-4 flex-1">
    <div className="grid h-full gap-8 @5xl:grid-cols-2">
    <form onSubmit={submit} className="w-full max-w-xl min-w-0 self-center justify-self-center rounded-2xl border bg-card p-5 shadow-sm">
      <FieldGroup className="gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="method-name">Method name</FieldLabel>
            <Input id="method-name" name="name" placeholder="e.g. Main PayPal" maxLength={100} required value={name} onChange={(event) => setName(event.target.value)} />
          </Field>

          <Field>
            <FieldLabel htmlFor="method-holder">Holder name</FieldLabel>
            <Input id="method-holder" name="holder" placeholder="e.g. Admin User" autoComplete="name" maxLength={120} required value={holder} onChange={(event) => setHolder(event.target.value)} />
          </Field>
        </div>

        {/* Type and Status on one row: the balance and the currency are gone (a method starts at $0, everything is USD). */}
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Field>
            <FieldLabel htmlFor="method-type">Type</FieldLabel>
            <Select name="type" value={provider} onValueChange={(value) => { if (value) setProvider(value as BackendProvider); }}>
              <SelectTrigger id="method-type" className="h-8 w-full">
                {/* A formatter, so the trigger shows "PayPal" rather than the raw value. */}
                <SelectValue>
                  {(value: string | null) => methodTypes.find((option) => option.value === value)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {methodTypes.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <FieldSet>
            <FieldLegend variant="label">Status</FieldLegend>
            <div className="rounded-xl border bg-background sm:py-1.5">
              <RadioGroup
                name="status"
                value={active ? "active" : "inactive"}
                onValueChange={(value) => setActive(value === "active")}
                className="flex flex-col divide-y divide-border sm:flex-row sm:divide-x sm:divide-y-0"
              >
                {statusOptions.map((option) => (
                  <Field key={option.value} orientation="horizontal" className="min-w-0 flex-1 justify-start gap-1.5 px-3 py-2.5 *:data-[slot=field-label]:flex-none sm:justify-center sm:py-0">
                    <RadioGroupItem id={`status-${option.value}`} value={option.value} />
                    <FieldLabel htmlFor={`status-${option.value}`} className="text-xs font-normal">{option.label}</FieldLabel>
                  </Field>
                ))}
              </RadioGroup>
            </div>
          </FieldSet>
        </div>

        {/* Option cards: options share the full width with a divider between them, centered.
            On phones they stack vertically, one per line. The label stretch from Field is turned off (flex-none) so each option centers as one group. */}
        <FieldSet>
          <FieldLegend variant="label">Card network <span className="ml-1 text-xs font-normal text-muted-foreground">· the logos on the card</span></FieldLegend>
          <div className="rounded-xl border bg-background sm:py-2.5">
            <RadioGroup
              name="networks"
              value={cardNetwork}
              onValueChange={(value) => setCardNetwork(value as BackendCardNetwork)}
              className="flex flex-col divide-y divide-border sm:flex-row sm:divide-x sm:divide-y-0"
            >
              {networkOptions.map((option) => (
                <Field key={option.value} orientation="horizontal" className="min-w-0 flex-1 justify-start px-3 py-2.5 *:data-[slot=field-label]:flex-none sm:justify-center sm:py-0">
                  <RadioGroupItem id={`network-${option.value}`} value={option.value} />
                  <FieldLabel htmlFor={`network-${option.value}`} className="font-normal">
                    {/* The network logos in their brand colors, then the name. */}
                    <span className="flex items-center gap-1.5" aria-hidden>
                      {networkLogos[option.value].map((network, index) => (
                        <Fragment key={network}>
                          {/* A thin line between the two logos on "Both", like on the cards. */}
                          {index > 0 ? <span className="h-3.5 w-px bg-border" /> : null}
                          <PaymentIcon type={network} format="logo" className="h-auto w-6" />
                        </Fragment>
                      ))}
                    </span>
                    {option.label}
                  </FieldLabel>
                </Field>
              ))}
            </RadioGroup>
          </div>
        </FieldSet>

        <Field>
          <FieldLabel htmlFor="method-instructions">Instructions for clients (optional)</FieldLabel>
          <Textarea
            id="method-instructions"
            name="instructions"
            maxLength={1000}
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            placeholder="e.g. Add your client number as the payment reference."
            className="min-h-14"
          />
        </Field>

        {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            className={cn(whiteStyle.button, "px-3! py-0! text-xs! font-medium!")}
            render={<Link href="/configuration?tab=payment-methods" />}
            nativeButton={false}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={saving || !name.trim() || !holder.trim()} className={cn(blackStyle.button, "px-3! py-0! text-xs! font-medium! disabled:opacity-50")}>
            {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Save method"}
          </Button>
        </div>
      </FieldGroup>
    </form>

    {/* Live preview: follows the form as it changes. */}
    {/* Centered horizontally and vertically in the right half. */}
    <aside aria-label="Card preview" className="order-first flex flex-col items-center self-center @5xl:order-none">
      <p className="mb-3 w-full max-w-96 text-xs font-medium text-muted-foreground">Preview</p>
      <div className="flex w-full max-w-96">
        <PaymentMethodCard
          provider={providerToCard[provider]}
          active={active}
          methodName={name.trim() || "Method name"}
          amount={amountFormatter.format(balance)}
          currency="USD"
          holder={holder.trim() || "Holder name"}
          networks={networkLogos[cardNetwork]}
        />
      </div>
      <p className="mt-3 w-full max-w-96 text-xs text-muted-foreground">
        {mode === "create" ? "A new method starts at $0.00: payments recorded on it add up here." : "Updates as you fill in the form."}
      </p>
    </aside>
    </div>
    </div>
    </>
  );
}
