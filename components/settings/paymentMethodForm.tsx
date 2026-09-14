"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { NumberField } from "@base-ui/react/number-field";
import { Minus, Plus } from "lucide-react";
import { PaymentIcon } from "react-svg-credit-card-payment-icons";
import { cn } from "cn";

import { CurrencyFlag } from "@/components/settings/currencyFlag";
import { PaymentMethodCard } from "@/components/settings/paymentMethodCard";
import { Button } from "@/components/ui/button";
import blackStyle from "@/components/ui/button-styles/black.module.css";
import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// The only supported types. Each one decides how its card looks in the preview.
const methodTypes = [
  { value: "paypal", label: "PayPal", provider: "paypal" },
  { value: "binance", label: "Binance", provider: "crypto" },
  { value: "interac", label: "Interac", provider: "interac" },
  { value: "other", label: "Other", provider: "other" },
] as const;

// The balance currency, each with its flag.
const currencyOptions = [
  { value: "CAD", name: "Canadian dollar", flag: "CA" },
  { value: "USD", name: "US dollar", flag: "US" },
  { value: "EUR", name: "Euro", flag: "EU" },
] as const;

type Currency = (typeof currencyOptions)[number]["value"];

type MethodType = (typeof methodTypes)[number]["value"];

// Which card networks the method supports. Both by default.
const networkOptions = [
  { value: "both", label: "Both", networks: ["Visa", "Mastercard"] },
  { value: "visa", label: "Visa", networks: ["Visa"] },
  { value: "mastercard", label: "Mastercard", networks: ["Mastercard"] },
] as const;

type NetworkChoice = (typeof networkOptions)[number]["value"];

// Active by default. Active cards show the green contactless animation in the preview.
const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

type Status = (typeof statusOptions)[number]["value"];

// 12480.5 → "12,480.50", the way amounts read on the cards. An empty field shows 0.00.
const amountFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// The − and + buttons beside the balance: white style, a little smaller than the input.
const stepButtonClassName = cn(whiteStyle.button, "flex size-7 shrink-0 items-center justify-center p-0! text-foreground data-disabled:opacity-40");

export type PaymentMethodFormValues = {
  type: MethodType;
  methodName: string;
  holder: string;
  balance: number | null;
  networkChoice: NetworkChoice;
  status: Status;
  currency: Currency;
  instructions: string;
};

// What a new method starts with.
const emptyValues: PaymentMethodFormValues = {
  type: "paypal",
  methodName: "",
  holder: "",
  balance: null,
  networkChoice: "both",
  status: "active",
  currency: "USD",
  instructions: "",
};

// One form for both pages: "create" starts empty, "edit" starts from the method's saved values.
export function PaymentMethodForm({ mode, initialValues = emptyValues }: { mode: "create" | "edit"; initialValues?: PaymentMethodFormValues }) {
  const [type, setType] = useState<MethodType>(initialValues.type);
  const [methodName, setMethodName] = useState(initialValues.methodName);
  const [holder, setHolder] = useState(initialValues.holder);
  const [balance, setBalance] = useState<number | null>(initialValues.balance);
  const [networkChoice, setNetworkChoice] = useState<NetworkChoice>(initialValues.networkChoice);
  const [status, setStatus] = useState<Status>(initialValues.status);
  const [currency, setCurrency] = useState<Currency>(initialValues.currency);
  const selectedType = methodTypes.find((option) => option.value === type) ?? methodTypes[0];
  const selectedNetworks = networkOptions.find((option) => option.value === networkChoice) ?? networkOptions[0];
  // Binance only holds USDT: the currency choice is locked and USDT is used everywhere.
  const currencyLocked = type === "binance";
  const effectiveCurrency = currencyLocked ? "USDT" : currency;

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
    {/* Interface only: saving is wired in the logic phase. */}
    <form onSubmit={(event) => event.preventDefault()} className="w-full max-w-xl min-w-0 self-center justify-self-center rounded-2xl border bg-card p-5 shadow-sm">
      <FieldGroup className="gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="method-name">Method name</FieldLabel>
            <Input id="method-name" name="name" placeholder="e.g. Main PayPal" required value={methodName} onChange={(event) => setMethodName(event.target.value)} />
          </Field>

          <Field>
            <FieldLabel htmlFor="method-holder">Holder name</FieldLabel>
            <Input id="method-holder" name="holder" placeholder="e.g. Admin User" autoComplete="name" required value={holder} onChange={(event) => setHolder(event.target.value)} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="method-type">Type</FieldLabel>
            <Select
              name="type"
              value={type}
              onValueChange={(value) => { if (value) setType(value as MethodType); }}
            >
              <SelectTrigger id="method-type" className="h-8 w-full">
                {/* A formatter, so the trigger shows "PayPal" rather than the raw value "paypal". */}
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

          <Field>
            <FieldLabel htmlFor="method-balance">Current balance</FieldLabel>
            {/* Base UI NumberField: − and + outside the input (hold to repeat, arrow keys work too), never below 0,
                shown with 2 decimals. locale is fixed so the server and the browser format the same way. */}
            <NumberField.Root
              id="method-balance"
              name="balance"
              value={balance}
              onValueChange={(value) => setBalance(value)}
              min={0}
              step={1}
              locale="en-US"
              format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
            >
              <NumberField.Group className="flex items-center gap-2">
                <NumberField.Decrement aria-label="Decrease balance" className={stepButtonClassName}>
                  <Minus className="size-3" aria-hidden />
                </NumberField.Decrement>
                <div className="relative min-w-0 flex-1">
                  {/* inputMode decimal: phones show a keyboard with a decimal point, for cents. */}
                  <NumberField.Input render={<Input className="pr-14 tabular-nums" />} placeholder="0.00" inputMode="decimal" />
                  {/* The currency chosen below, next to Status. */}
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                    {effectiveCurrency}
                  </span>
                </div>
                <NumberField.Increment aria-label="Increase balance" className={stepButtonClassName}>
                  <Plus className="size-3" aria-hidden />
                </NumberField.Increment>
              </NumberField.Group>
            </NumberField.Root>
          </Field>
        </div>

        {/* Option cards: options share the full width with a divider between them, centered.
            On phones they stack vertically, one per line. The label stretch from Field is turned off (flex-none) so each option centers as one group. */}
        <FieldSet>
          <FieldLegend variant="label">Card network</FieldLegend>
          <div className="rounded-xl border bg-background sm:py-2.5">
            <RadioGroup
              name="networks"
              value={networkChoice}
              onValueChange={(value) => setNetworkChoice(value as NetworkChoice)}
              className="flex flex-col divide-y divide-border sm:flex-row sm:divide-x sm:divide-y-0"
            >
              {networkOptions.map((option) => (
                <Field key={option.value} orientation="horizontal" className="min-w-0 flex-1 justify-start px-3 py-2.5 *:data-[slot=field-label]:flex-none sm:justify-center sm:py-0">
                  <RadioGroupItem id={`network-${option.value}`} value={option.value} />
                  <FieldLabel htmlFor={`network-${option.value}`} className="font-normal">
                    {/* The network logos in their brand colors, then the name. */}
                    <span className="flex items-center gap-1.5" aria-hidden>
                      {option.networks.map((network, index) => (
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

        {/* Status and currency on one row. Status only takes what it needs, so the three currencies fit on one line. */}
        <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
          <FieldSet>
            <FieldLegend variant="label">Status</FieldLegend>
            <div className="rounded-xl border bg-background sm:py-2.5">
              <RadioGroup
                name="status"
                value={status}
                onValueChange={(value) => setStatus(value as Status)}
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

          <FieldSet>
            <FieldLegend variant="label">
              Currency
              {currencyLocked ? <span className="ml-1.5 text-xs font-normal text-muted-foreground">· USDT only on Binance</span> : null}
            </FieldLegend>
            <div className="rounded-xl border bg-background sm:py-2.5">
              <RadioGroup
                name="currency"
                value={currency}
                onValueChange={(value) => setCurrency(value as Currency)}
                disabled={currencyLocked}
                className="flex flex-col divide-y divide-border sm:flex-row sm:divide-x sm:divide-y-0"
              >
                {currencyOptions.map((option) => (
                  <Field key={option.value} orientation="horizontal" data-disabled={currencyLocked ? "true" : undefined} className="min-w-0 flex-1 justify-start gap-1.5 px-3 py-2.5 *:data-[slot=field-label]:flex-none sm:justify-center sm:py-0">
                    <RadioGroupItem id={`currency-${option.value}`} value={option.value} />
                    <FieldLabel htmlFor={`currency-${option.value}`} className="gap-1.5 text-xs font-normal" title={option.name}>
                      <CurrencyFlag flag={option.flag} />
                      {option.value}
                    </FieldLabel>
                  </Field>
                ))}
              </RadioGroup>
            </div>
          </FieldSet>
        </div>

        <Field>
          <FieldLabel htmlFor="method-instructions">Instructions for clients (optional)</FieldLabel>
          <Textarea id="method-instructions" name="instructions" defaultValue={initialValues.instructions} placeholder="e.g. Add your client number as the payment reference." className="min-h-14" />
        </Field>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            className={cn(whiteStyle.button, "px-3! py-0! text-xs! font-medium!")}
            render={<Link href="/settings?tab=payment-methods" />}
            nativeButton={false}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled className={cn(blackStyle.button, "px-3! py-0! text-xs! font-medium!")}>
            {mode === "edit" ? "Save changes" : "Save method"}
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
          provider={selectedType.provider}
          active={status === "active"}
          methodName={methodName.trim() || "Method name"}
          amount={amountFormatter.format(balance ?? 0)}
          currency={effectiveCurrency}
          holder={holder.trim() || "Holder name"}
          networks={selectedNetworks.networks}
        />
      </div>
      <p className="mt-3 w-full max-w-96 text-xs text-muted-foreground">Updates as you fill in the form.</p>
    </aside>
    </div>
    </div>
    </>
  );
}
