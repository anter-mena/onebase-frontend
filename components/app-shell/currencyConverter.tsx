"use client";

import { useEffect, useRef, useState } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { ArrowLeftRight, ArrowRightLeft, Check, ChevronDown, LoaderCircle, Search } from "lucide-react";
import { cn } from "cn";

import whiteStyle from "@/components/ui/button-styles/white.module.css";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getExchangeRates, type Currency, type ExchangeRates } from "@/lib/exchange/rates";

/**
 * The converter button in the navbar, and the window it opens.
 *
 * <p>The app works in USD only, but clients pay and talk in their own money, so
 * the converter is one click away on every page. Rates are the daily market
 * rates from lib/exchange/rates.ts, loaded when the window opens.
 */
export function CurrencyConverter() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          whiteStyle.button,
          "relative flex size-7 items-center justify-center p-0! text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        )}
        aria-label="Currency converter"
        title="Currency converter"
      >
        <ArrowRightLeft className="size-3" aria-hidden />
      </button>
      {open ? <ConverterDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}

// Shown first in the list, in this order.
const POPULAR = ["USD", "EUR", "GBP", "CAD", "MAD", "AUD"];

/**
 * Round flags (circle-flags, MIT) and coin logos (cryptocurrency-icons, CC0), both from jsDelivr.
 * A currency's flag is its country: the first two letters of the code, except the euro.
 * Anything without a picture (XAF, XOF…) falls back to its first letter.
 */
function CurrencyIcon({ currency, className }: { currency: Currency; className?: string }) {
  const [failed, setFailed] = useState(false);
  const src = currency.crypto
    ? `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/${currency.code.toLowerCase()}.svg`
    : `https://cdn.jsdelivr.net/gh/HatScripts/circle-flags@2.7.0/flags/${currency.code === "EUR" ? "european_union" : currency.code.slice(0, 2).toLowerCase()}.svg`;

  if (failed) {
    return (
      <span aria-hidden className={cn("flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[0.6rem] font-semibold", className)}>
        {currency.code[0]}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- tiny remote SVGs; the image optimiser adds nothing.
  return <img src={src} alt="" width={20} height={20} onError={() => setFailed(true)} className={cn("size-5 shrink-0 rounded-full", className)} />;
}

// Crypto codes like USDT are not ISO codes, so Intl has no symbol for them.
function symbolFor(currency: Currency) {
  if (currency.crypto) return "";
  return new Intl.NumberFormat("en", { style: "currency", currency: currency.code, currencyDisplay: "narrowSymbol" })
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value ?? "";
}

const isAmount = (value: string) => /^\d*\.?\d*$/.test(value);
// Stablecoins and money to the cent; other coins are worth too much per unit for two decimals.
const decimalsFor = (currency: Currency) => (currency.crypto && !["USDT", "USDC", "DAI"].includes(currency.code) ? 8 : 2);
// Money keeps its cents ("1.00"); coin amounts drop trailing zeros ("0.0000119").
const round = (value: number, decimals: number) =>
  !Number.isFinite(value) ? "" : decimals === 2 ? value.toFixed(2) : String(Number(value.toFixed(decimals)));

const fallback = (code: string): Currency => ({ code, name: code, crypto: false });

function ConverterDialog({ onClose }: { onClose: () => void }) {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  // The side last typed in keeps its text; the other side is worked out from it.
  const [typed, setTyped] = useState<{ side: "from" | "to"; value: string }>({ side: "from", value: "1.00" });
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Loaded once, when the window opens.
  useEffect(() => {
    let live = true;
    void getExchangeRates().then((result) => {
      if (!live) return;
      if (result.ok) setRates(result.data);
      else setError(result.error);
    });
    return () => {
      live = false;
    };
  }, []);

  const find = (code: string) => rates?.currencies.find((currency) => currency.code === code) ?? fallback(code);
  const fromCurrency = find(from);
  const toCurrency = find(to);
  const rate = rates ? rates.rates[to] / rates.rates[from] : null;
  const typedNumber = Number(typed.value || "0");
  const fromValue = typed.side === "from" ? typed.value : rate ? round(typedNumber / rate, decimalsFor(fromCurrency)) : "";
  const toValue = typed.side === "to" ? typed.value : rate ? round(typedNumber * rate, decimalsFor(toCurrency)) : "";

  // "0.88819774": the first two decimals strong, the rest quieter, as a bank shows it.
  const rateText = rate ? String(Number(rate.toPrecision(8))) : "";
  const strongEnd = rateText.includes(".") ? rateText.indexOf(".") + 3 : rateText.length;

  return (
    <Dialog open onOpenChange={(next) => { if (!next) onClose(); }}>
      {/* Focus goes to the title, not the first amount: opening the window
          should not land the cursor in a box with its text highlighted. */}
      <DialogContent initialFocus={titleRef} className="w-[calc(100%-2rem)] max-w-3xl! p-5">
        <DialogHeader>
          <DialogTitle ref={titleRef} tabIndex={-1} className="outline-none">Currency converter</DialogTitle>
          <DialogDescription>Convert any amount at today&apos;s exchange rate.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center md:gap-0">
          <AmountBox
            legend="From"
            currency={fromCurrency}
            currencies={rates?.currencies}
            value={fromValue}
            onValue={(value) => setTyped({ side: "from", value })}
            onCode={setFrom}
          />
          <button
            type="button"
            onClick={() => { setFrom(to); setTo(from); }}
            aria-label="Swap the two currencies"
            title="Swap"
            className="z-10 mx-auto flex size-10 shrink-0 items-center justify-center rounded-full border bg-background text-foreground shadow-xs hover:bg-muted md:-mx-2 md:mt-2"
          >
            <ArrowLeftRight className="size-4" aria-hidden />
          </button>
          <AmountBox
            legend="To"
            currency={toCurrency}
            currencies={rates?.currencies}
            value={toValue}
            onValue={(value) => setTyped({ side: "to", value })}
            onCode={setTo}
          />
        </div>

        <div className="min-h-14" aria-live="polite">
          {error ? (
            <p role="alert" className="text-xs text-destructive">{error}</p>
          ) : !rates ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> Loading today&apos;s rates…
            </p>
          ) : (
            <>
              <p className="text-xl font-semibold tracking-tight tabular-nums">
                1 {from} = {rateText.slice(0, strongEnd)}
                <span className="text-muted-foreground">{rateText.slice(strongEnd)}</span> {to}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Market rate of {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(rates.date))} · updated daily
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type CurrencyGroup = { value: string; items: Currency[] };

function AmountBox({
  legend,
  currency,
  currencies,
  value,
  onValue,
  onCode,
}: {
  legend: string;
  currency: Currency;
  currencies: Currency[] | undefined;
  value: string;
  onValue: (value: string) => void;
  onCode: (code: string) => void;
}) {
  const inputId = `converter-${legend.toLowerCase()}`;
  const list = currencies ?? [currency];
  // Popular first; the rest are not repeated, so a search never shows a currency twice.
  const groups: CurrencyGroup[] = [
    { value: "Popular", items: POPULAR.map((code) => list.find((entry) => entry.code === code)).filter((entry): entry is Currency => !!entry) },
    { value: "All currencies", items: list.filter((entry) => !entry.crypto && !POPULAR.includes(entry.code)) },
    { value: "Crypto", items: list.filter((entry) => entry.crypto) },
  ].filter((group) => group.items.length > 0);

  return (
    <fieldset className="min-w-0 flex-1 rounded-xl border px-4 pt-1 pb-3">
      <legend className="px-1.5 text-xs text-muted-foreground">
        <label htmlFor={inputId}>{legend}</label>
      </legend>
      <div className="flex items-center gap-2">
        <span className="flex min-w-[7.5rem] flex-1 items-baseline text-2xl font-semibold tabular-nums">
          <span aria-hidden>{symbolFor(currency)}</span>
          <input
            id={inputId}
            inputMode="decimal"
            value={value}
            onChange={(event) => { if (isAmount(event.target.value)) onValue(event.target.value); }}
            className="w-full min-w-0 bg-transparent outline-none"
          />
        </span>

        <Combobox.Root<Currency>
          items={groups}
          value={currency}
          onValueChange={(next) => { if (next) onCode(next.code); }}
          itemToStringLabel={(item) => `${item.code} ${item.name}`}
          isItemEqualToValue={(item, selected) => item.code === selected.code}
          autoHighlight
        >
          <Combobox.Trigger
            aria-label={`${legend} currency: ${currency.code}`}
            className="flex h-9 min-w-0 shrink-0 items-center gap-2 rounded-md px-2 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          >
            <CurrencyIcon currency={currency} />
            <span>{currency.code}</span>
            <span className="hidden max-w-[8rem] truncate font-normal text-muted-foreground lg:inline">- {currency.name}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner align="end" sideOffset={6} className="z-[60]">
              <Combobox.Popup className="w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95">
                <div className="flex items-center gap-2 border-b px-3">
                  <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <Combobox.Input placeholder="Search currencies…" aria-label="Search currencies" className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                </div>
                <Combobox.Empty className="px-3 py-6 text-center text-xs text-muted-foreground empty:hidden">No currency found.</Combobox.Empty>
                <Combobox.List className="max-h-72 overflow-y-auto overscroll-contain p-1 empty:p-0">
                  {(group: CurrencyGroup) => (
                    <Combobox.Group key={group.value} items={group.items}>
                      <Combobox.GroupLabel className="px-2 pt-2 pb-1 text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
                        {group.value}
                      </Combobox.GroupLabel>
                      <Combobox.Collection>
                        {(item: Currency) => (
                          <Combobox.Item
                            key={item.code}
                            value={item}
                            className="flex cursor-default items-center gap-2.5 rounded-md px-2 py-1.5 text-sm outline-none select-none data-highlighted:bg-muted"
                          >
                            <CurrencyIcon currency={item} />
                            <span className="font-medium">{item.code}</span>
                            <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.name}</span>
                            <Combobox.ItemIndicator>
                              <Check className="size-4" aria-hidden />
                            </Combobox.ItemIndicator>
                          </Combobox.Item>
                        )}
                      </Combobox.Collection>
                    </Combobox.Group>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      </div>
    </fieldset>
  );
}
